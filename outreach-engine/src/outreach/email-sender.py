"""Email outreach via the Resend API.

Two subcommands enforce the human-in-the-loop boundary:

  --queue   Draft personalized emails for scored leads (score >= warm)
            and write them to outreach as status='queued'. NOTHING is
            sent. A human approves via the dashboard / API.
  --send    Send status='approved' emails, respecting the domain
            warming schedule (5/day, +5/day, cap 50/day/domain) and
            the CAN-SPAM footer (physical address + unsubscribe link).

Template format (src/outreach/templates/<id>.txt):
    Subject: <subject line with {{vars}}>
    <blank line>
    <body with {{vars}}>

Variables: {{first_name}} {{company_name}} {{pain_point}} {{specialty}}
           {{city}} {{value_proposition}} {{calendar_link}} {{signature}}

Usage:
    python src/outreach/email-sender.py --queue --step 1
    python src/outreach/email-sender.py --send
"""
from __future__ import annotations

import argparse
import re
import sys
import time
import urllib.parse
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.pipeline.common import (  # noqa: E402
    ENGINE_ROOT, get_secret, http_json, jlog, load_config, load_product_profile,
)
from src.pipeline.database import (  # noqa: E402
    domain_daily_allowance, emails_sent_today, get_db, is_unsubscribed,
    mark_outreach_failed, mark_outreach_sent, queue_outreach,
)

TEMPLATE_DIR = ENGINE_ROOT / "src" / "outreach" / "templates"


def load_template(template_id: str) -> tuple[str, str]:
    """Returns (subject, body) from a template file."""
    text = (TEMPLATE_DIR / f"{template_id}.txt").read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or not lines[0].lower().startswith("subject:"):
        raise ValueError(f"template {template_id} must start with 'Subject:'")
    subject = lines[0].split(":", 1)[1].strip()
    body = "\n".join(lines[1:]).lstrip("\n")
    return subject, body


def render(text: str, variables: dict[str, str]) -> str:
    """Substitute {{var}} placeholders; unknown vars render as ''. """
    def repl(m: re.Match[str]) -> str:
        return variables.get(m.group(1).strip(), "")
    return re.sub(r"\{\{([^}]+)\}\}", repl, text)


def build_variables(lead: Any, profile: dict[str, Any]) -> dict[str, str]:
    cfg = load_config()
    contact = str(lead["contact_name"] or "").strip()
    first_name = contact.split()[0] if contact else "there"
    pain = str(lead["pain_signal"] or "").strip()
    if not pain:
        pain = profile["pain_points"][0]
    calendar = profile.get("calendar_link", profile["website"])
    utm = dict(cfg["email"]["utm"])
    utm["utm_campaign"] = profile["product_id"]
    calendar_utm = calendar + ("&" if "?" in calendar else "?") + urllib.parse.urlencode(utm)
    return {
        "first_name": first_name,
        "company_name": str(lead["company_name"]),
        "pain_point": pain,
        "specialty": str(lead["specialty"] or "your practice"),
        "city": str(lead["city"] or ""),
        "value_proposition": profile["value_proposition"],
        "calendar_link": calendar_utm,
        "signature": profile["signature"],
    }


def canspam_footer(email: str) -> str:
    cfg = load_config()
    base = cfg["api"]["public_base_url"].rstrip("/")
    unsub = f"{base}{cfg['email']['unsubscribe_path']}?email={urllib.parse.quote(email)}"
    return (
        f"\n\n--\n{cfg['email']['physical_address']}\n"
        f"Don't want these emails? Unsubscribe: {unsub}\n"
    )


# ------------------------------------------------------------------
# --queue: draft emails for approval
# ------------------------------------------------------------------

def queue_step(step: int, limit: int) -> dict[str, int]:
    cfg = load_config()
    profile = load_product_profile()
    templates = profile["email_templates"]
    if step < 1 or step > len(templates):
        raise ValueError(f"step {step} out of range 1..{len(templates)}")
    template_id = templates[step - 1]
    subject_t, body_t = load_template(template_id)
    conn = get_db()

    if step == 1:
        # First touch: scored leads with an email that never got outreach.
        rows = conn.execute(
            """SELECT l.* FROM leads l
               WHERE l.status = 'scored' AND l.email != '' AND l.score >= ?
                 AND l.product_id = ?
                 AND NOT EXISTS (SELECT 1 FROM outreach o
                                 WHERE o.lead_id = l.id AND o.channel = 'email')
               ORDER BY l.score DESC LIMIT ?""",
            (cfg["scoring"]["warm_min"], profile["product_id"], limit),
        ).fetchall()
    else:
        # Follow-up: previous step sent >= gap days ago, no reply, no later step queued/sent.
        gap = cfg["email"]["sequence_gap_days"]
        rows = conn.execute(
            """SELECT l.* FROM leads l
               JOIN outreach o ON o.lead_id = l.id AND o.channel = 'email'
                AND o.sequence_step = ? AND o.status = 'sent'
                AND o.sent_at <= datetime('now', ?)
               WHERE l.status = 'outreach_sent' AND l.product_id = ?
                 AND NOT EXISTS (SELECT 1 FROM replies r WHERE r.lead_id = l.id)
                 AND NOT EXISTS (SELECT 1 FROM outreach o2 WHERE o2.lead_id = l.id
                                 AND o2.channel = 'email' AND o2.sequence_step >= ?)
               ORDER BY l.score DESC LIMIT ?""",
            (step - 1, f"-{gap} day", profile["product_id"], step, limit),
        ).fetchall()

    queued = 0
    for lead in rows:
        email = str(lead["email"]).lower()
        if is_unsubscribed(conn, email):
            jlog("skip_unsubscribed", lead_id=lead["id"], email=email)
            continue
        variables = build_variables(lead, profile)
        queue_outreach(
            conn, lead["id"], channel="email",
            subject=render(subject_t, variables),
            body=render(body_t, variables) + canspam_footer(email),
            from_email=profile["from_email"],
            from_domain=profile["from_domain"],
            template_id=template_id, sequence_step=step,
        )
        queued += 1
    conn.close()
    summary = {"queued": queued, "step": step, "template": template_id}
    jlog("email_queue_complete", **summary)
    return summary


# ------------------------------------------------------------------
# --send: deliver approved emails within rate limits
# ------------------------------------------------------------------

def send_approved() -> dict[str, int]:
    cfg = load_config()
    api_key = get_secret(cfg["apis"]["resend"]["api_key_env"])
    if not api_key:
        jlog("resend_skipped", level="warn",
             reason="RESEND_API_KEY not set — nothing sent")
        return {"sent": 0, "failed": 0, "deferred": 0}

    warm = cfg["email"]["warming"]
    conn = get_db()
    rows = conn.execute(
        """SELECT o.*, l.email AS lead_email, l.id AS lid FROM outreach o
           JOIN leads l ON l.id = o.lead_id
           WHERE o.channel = 'email' AND o.status = 'approved'
           ORDER BY o.created_at ASC"""
    ).fetchall()

    sent = failed = deferred = 0
    for row in rows:
        domain = row["from_domain"]
        allowance = domain_daily_allowance(
            conn, domain, warm["start_per_day"], warm["increase_per_day"],
            min(warm["ceiling_per_day"], cfg["email"]["daily_limit_per_domain"]))
        used = emails_sent_today(conn, domain)
        if used >= allowance:
            deferred += 1
            jlog("send_deferred_rate_limit", outreach_id=row["id"],
                 domain=domain, used_today=used, allowance=allowance)
            continue
        to_email = str(row["lead_email"]).lower()
        if not to_email:
            mark_outreach_failed(conn, row["id"], "lead has no email")
            failed += 1
            continue
        if is_unsubscribed(conn, to_email):
            mark_outreach_failed(conn, row["id"], "recipient unsubscribed")
            failed += 1
            continue
        try:
            status, data = http_json(
                f"{cfg['apis']['resend']['base_url']}/emails",
                method="POST",
                json_body={
                    "from": f"Rajesh K <{row['from_email']}>",
                    "to": [to_email],
                    "subject": row["subject"],
                    "text": row["body"],
                },
                headers={"Authorization": f"Bearer {api_key}"},
                what="resend_send",
            )
        except Exception as exc:  # noqa: BLE001 — Resend down: fail row, continue
            mark_outreach_failed(conn, row["id"], str(exc))
            failed += 1
            continue
        if status in (200, 201) and data.get("id"):
            mark_outreach_sent(conn, row["id"], external_id=str(data["id"]))
            conn.execute(
                "UPDATE leads SET status = 'outreach_sent', updated_at = datetime('now') "
                "WHERE id = ? AND status = 'scored'", (row["lid"],))
            conn.commit()
            sent += 1
            jlog("email_sent", outreach_id=row["id"], to=to_email,
                 resend_id=data["id"], domain=domain)
        else:
            mark_outreach_failed(conn, row["id"],
                                 f"HTTP {status}: {str(data)[:300]}")
            failed += 1
        time.sleep(1.0)  # Resend free tier: stay under burst limits
    conn.close()
    summary = {"sent": sent, "failed": failed, "deferred": deferred}
    jlog("email_send_complete", **summary)
    return summary


def main() -> None:
    ap = argparse.ArgumentParser(description="Email outreach via Resend")
    mode = ap.add_mutually_exclusive_group(required=True)
    mode.add_argument("--queue", action="store_true",
                      help="Draft emails for human approval (sends nothing)")
    mode.add_argument("--send", action="store_true",
                      help="Send approved emails within rate limits")
    ap.add_argument("--step", type=int, default=1, help="Sequence step to queue (1-4)")
    ap.add_argument("--limit", type=int, default=50, help="Max drafts to queue")
    args = ap.parse_args()
    if args.queue:
        queue_step(args.step, args.limit)
    else:
        send_approved()


if __name__ == "__main__":
    main()
