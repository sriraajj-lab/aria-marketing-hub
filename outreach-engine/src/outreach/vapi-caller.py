"""Outbound voice calls via Vapi.ai — hot leads (score 8-10) only.

Same human-in-the-loop boundary as email:
  --queue   Create outreach rows (channel='call', status='queued') for
            hot leads with a verified phone number.
  --call    Place calls for status='approved' rows via the Vapi REST
            API using the active product profile's assistant prompt.

Call outcomes (interested / not interested / voicemail / wrong number)
arrive on the /api/webhooks/vapi endpoint in src/pipeline/api.py.

Usage:
    python src/outreach/vapi-caller.py --queue
    python src/outreach/vapi-caller.py --call
"""
from __future__ import annotations

import argparse
import re
import sys
import time
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.pipeline.common import (  # noqa: E402
    get_secret, http_json, jlog, load_config, load_product_profile,
)
from src.pipeline.database import (  # noqa: E402
    get_db, mark_outreach_failed, mark_outreach_sent, queue_outreach,
)


def e164(phone: str) -> str:
    """Normalize a US phone to E.164; returns '' when not normalizable."""
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 10:
        return "+1" + digits
    if len(digits) == 11 and digits.startswith("1"):
        return "+" + digits
    return ""


def queue_calls(limit: int) -> dict[str, int]:
    cfg = load_config()
    profile = load_product_profile()
    min_score = cfg["outreach_rules"]["vapi_min_score"]
    conn = get_db()
    rows = conn.execute(
        """SELECT * FROM leads
           WHERE score >= ? AND phone != '' AND product_id = ?
             AND status IN ('scored','outreach_sent')
             AND NOT EXISTS (SELECT 1 FROM outreach o
                             WHERE o.lead_id = leads.id AND o.channel = 'call')
           ORDER BY score DESC LIMIT ?""",
        (min_score, profile["product_id"], limit),
    ).fetchall()
    queued = 0
    for lead in rows:
        phone = e164(str(lead["phone"]))
        if not phone:
            jlog("call_skip_bad_phone", lead_id=lead["id"], phone=lead["phone"])
            continue
        queue_outreach(
            conn, lead["id"], channel="call",
            subject=f"Vapi call to {lead['company_name']} ({phone})",
            body=profile["vapi_assistant"]["system_prompt"],
            from_email=profile["from_email"],
            from_domain=profile["from_domain"],
            template_id=f"{profile['product_id']}-vapi", sequence_step=1,
        )
        queued += 1
    conn.close()
    summary = {"queued": queued, "min_score": min_score}
    jlog("call_queue_complete", **summary)
    return summary


def place_calls() -> dict[str, int]:
    cfg = load_config()
    vapi_cfg = cfg["apis"]["vapi"]
    api_key = get_secret(vapi_cfg["api_key_env"])
    phone_number_id = get_secret(vapi_cfg["phone_number_id_env"])
    if not api_key or not phone_number_id:
        jlog("vapi_skipped", level="warn",
             reason="VAPI_API_KEY / VAPI_PHONE_NUMBER_ID not set")
        return {"called": 0, "failed": 0}

    profile = load_product_profile()
    assistant = profile["vapi_assistant"]
    conn = get_db()
    rows = conn.execute(
        """SELECT o.*, l.phone AS lead_phone, l.company_name AS company
           FROM outreach o JOIN leads l ON l.id = o.lead_id
           WHERE o.channel = 'call' AND o.status = 'approved'
           ORDER BY o.created_at ASC"""
    ).fetchall()

    called = failed = 0
    for row in rows:
        phone = e164(str(row["lead_phone"]))
        if not phone:
            mark_outreach_failed(conn, row["id"], "phone not E.164-normalizable")
            failed += 1
            continue
        body: dict[str, Any] = {
            "phoneNumberId": phone_number_id,
            "customer": {"number": phone, "name": row["company"]},
            "assistant": {
                "firstMessage": assistant["first_message"],
                "model": {
                    "provider": "anthropic",
                    "model": "claude-haiku-4-5-20251001",
                    "messages": [{"role": "system",
                                  "content": assistant["system_prompt"]}],
                },
                "voicemailMessage": assistant["voicemail_message"],
                "endCallFunctionEnabled": True,
                "server": {"url": vapi_cfg["webhook_url"]},
                "metadata": {"outreach_id": row["id"], "lead_id": row["lead_id"],
                             "product_id": profile["product_id"]},
            },
        }
        try:
            status, data = http_json(
                f"{vapi_cfg['base_url']}/call",
                method="POST", json_body=body,
                headers={"Authorization": f"Bearer {api_key}"},
                what="vapi_call",
            )
        except Exception as exc:  # noqa: BLE001 — Vapi down: fail row, continue
            mark_outreach_failed(conn, row["id"], str(exc))
            failed += 1
            continue
        if status in (200, 201) and data.get("id"):
            mark_outreach_sent(conn, row["id"], external_id=str(data["id"]))
            called += 1
            jlog("call_placed", outreach_id=row["id"], vapi_call_id=data["id"],
                 to=phone, company=row["company"])
        else:
            mark_outreach_failed(conn, row["id"],
                                 f"HTTP {status}: {str(data)[:300]}")
            failed += 1
        time.sleep(2.0)  # do not machine-gun outbound calls
    conn.close()
    summary = {"called": called, "failed": failed}
    jlog("call_run_complete", **summary)
    return summary


def main() -> None:
    ap = argparse.ArgumentParser(description="Vapi outbound calls for hot leads")
    mode = ap.add_mutually_exclusive_group(required=True)
    mode.add_argument("--queue", action="store_true",
                      help="Queue calls for approval (calls nothing)")
    mode.add_argument("--call", action="store_true",
                      help="Place approved calls")
    ap.add_argument("--limit", type=int, default=10)
    args = ap.parse_args()
    if args.queue:
        queue_calls(args.limit)
    else:
        place_calls()


if __name__ == "__main__":
    main()
