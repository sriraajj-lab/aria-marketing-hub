"""SQLite access layer for the outreach engine.

Every query is parameterized. Every writer goes through insert_lead so
deduplication is enforced at the single entry point, and every raw
sighting — duplicate or not — is preserved in lead_sources.
"""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Optional

from src.pipeline.common import ENGINE_ROOT, dedupe_key, jlog, load_config


def db_path() -> Path:
    cfg = load_config()
    return ENGINE_ROOT / cfg["database"]["path"]


def get_db() -> sqlite3.Connection:
    """Open the database, applying the schema if the file is new."""
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    fresh = not path.exists()
    conn = sqlite3.connect(path, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    if fresh:
        init_schema(conn)
    return conn


def init_schema(conn: sqlite3.Connection) -> None:
    cfg = load_config()
    schema = (ENGINE_ROOT / cfg["database"]["schema"]).read_text(encoding="utf-8")
    conn.executescript(schema)
    conn.commit()
    jlog("db_schema_applied", path=str(db_path()))


# ------------------------------------------------------------------
# Leads
# ------------------------------------------------------------------

def insert_lead(conn: sqlite3.Connection, lead: dict[str, Any]) -> tuple[int, bool]:
    """Insert a lead with cross-source deduplication.

    Returns (lead_id, is_new). When a lead with the same dedupe_key
    exists, the sighting is appended to lead_sources, empty fields on
    the surviving lead are backfilled, and (existing_id, False) is
    returned.
    """
    key = dedupe_key(lead.get("company_name", ""), lead.get("domain", "") or lead.get("website", ""))
    raw = json.dumps(lead.get("raw", {}), ensure_ascii=False, default=str)
    source = lead["source"]

    row = conn.execute(
        "SELECT id FROM leads WHERE dedupe_key = ? AND status != 'duplicate' LIMIT 1",
        (key,),
    ).fetchone()

    if row:
        lead_id = int(row["id"])
        conn.execute(
            "INSERT INTO lead_sources (lead_id, source, raw_json) VALUES (?, ?, ?)",
            (lead_id, source, raw),
        )
        # Backfill blanks on the surviving lead — never overwrite non-empty data.
        for col in ("email", "phone", "website", "pain_signal", "contact_name",
                    "title", "specialty", "npi_number", "address", "city", "state"):
            val = str(lead.get(col, "") or "").strip()
            if val:
                conn.execute(
                    f"UPDATE leads SET {col} = ?, updated_at = datetime('now') "
                    f"WHERE id = ? AND ({col} IS NULL OR {col} = '')",
                    (val, lead_id),
                )
        conn.commit()
        jlog("lead_duplicate_merged", lead_id=lead_id, source=source, dedupe_key=key)
        return lead_id, False

    cur = conn.execute(
        """INSERT INTO leads
           (product_id, source, company_name, domain, contact_name, title,
            specialty, npi_number, email, phone, address, city, state,
            website, pain_signal, raw_json, dedupe_key)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            lead["product_id"], source,
            str(lead.get("company_name", "")).strip(),
            (lead.get("domain") or ""),
            str(lead.get("contact_name", "") or ""),
            str(lead.get("title", "") or ""),
            str(lead.get("specialty", "") or ""),
            str(lead.get("npi_number", "") or ""),
            str(lead.get("email", "") or "").lower(),
            str(lead.get("phone", "") or ""),
            str(lead.get("address", "") or ""),
            str(lead.get("city", "") or ""),
            str(lead.get("state", "") or ""),
            str(lead.get("website", "") or ""),
            str(lead.get("pain_signal", "") or ""),
            raw, key,
        ),
    )
    lead_id = int(cur.lastrowid or 0)
    conn.execute(
        "INSERT INTO lead_sources (lead_id, source, raw_json) VALUES (?, ?, ?)",
        (lead_id, source, raw),
    )
    conn.commit()
    jlog("lead_inserted", lead_id=lead_id, source=source,
         company=lead.get("company_name", ""), dedupe_key=key)
    return lead_id, True


def update_lead_status(conn: sqlite3.Connection, lead_id: int, status: str) -> None:
    conn.execute(
        "UPDATE leads SET status = ?, updated_at = datetime('now') WHERE id = ?",
        (status, lead_id),
    )
    conn.commit()


def set_lead_score(conn: sqlite3.Connection, lead_id: int, score: int) -> None:
    conn.execute(
        "UPDATE leads SET score = ?, status = 'scored', updated_at = datetime('now') WHERE id = ?",
        (score, lead_id),
    )
    conn.commit()


def leads_by_status(conn: sqlite3.Connection, statuses: list[str],
                    product_id: Optional[str] = None,
                    limit: int = 500) -> list[sqlite3.Row]:
    marks = ",".join("?" for _ in statuses)
    sql = f"SELECT * FROM leads WHERE status IN ({marks})"
    args: list[Any] = list(statuses)
    if product_id:
        sql += " AND product_id = ?"
        args.append(product_id)
    sql += " ORDER BY score DESC, created_at ASC LIMIT ?"
    args.append(limit)
    return conn.execute(sql, args).fetchall()


# ------------------------------------------------------------------
# Contacts
# ------------------------------------------------------------------

def insert_contact(conn: sqlite3.Connection, lead_id: int, name: str, title: str,
                   email: str, email_verified: bool, phone: str = "",
                   linkedin_url: str = "", source: str = "apollo") -> int:
    cur = conn.execute(
        """INSERT INTO contacts (lead_id, name, title, email, email_verified,
                                 phone, linkedin_url, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (lead_id, name, title, email.lower(), 1 if email_verified else 0,
         phone, linkedin_url, source),
    )
    contact_id = int(cur.lastrowid or 0)
    # Promote verified email/phone/name onto the lead if blank there.
    if email:
        conn.execute(
            "UPDATE leads SET email = ?, updated_at = datetime('now') "
            "WHERE id = ? AND email = ''", (email.lower(), lead_id))
    if phone:
        conn.execute(
            "UPDATE leads SET phone = ?, updated_at = datetime('now') "
            "WHERE id = ? AND phone = ''", (phone, lead_id))
    if name:
        conn.execute(
            "UPDATE leads SET contact_name = ?, title = ?, updated_at = datetime('now') "
            "WHERE id = ? AND contact_name = ''", (name, title, lead_id))
    conn.commit()
    jlog("contact_inserted", contact_id=contact_id, lead_id=lead_id,
         email_verified=email_verified)
    return contact_id


# ------------------------------------------------------------------
# Outreach
# ------------------------------------------------------------------

def queue_outreach(conn: sqlite3.Connection, lead_id: int, channel: str,
                   subject: str, body: str, from_email: str, from_domain: str,
                   template_id: str = "", sequence_step: int = 1,
                   campaign_id: Optional[int] = None,
                   contact_id: Optional[int] = None) -> int:
    cur = conn.execute(
        """INSERT INTO outreach (lead_id, contact_id, campaign_id, channel,
                                 sequence_step, template_id, subject, body,
                                 from_email, from_domain, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued')""",
        (lead_id, contact_id, campaign_id, channel, sequence_step,
         template_id, subject, body, from_email, from_domain),
    )
    conn.commit()
    outreach_id = int(cur.lastrowid or 0)
    jlog("outreach_queued", outreach_id=outreach_id, lead_id=lead_id,
         channel=channel, template=template_id)
    return outreach_id


def mark_outreach_sent(conn: sqlite3.Connection, outreach_id: int,
                       external_id: str = "") -> None:
    conn.execute(
        """UPDATE outreach SET status = 'sent', sent_at = datetime('now'),
                               external_id = ? WHERE id = ?""",
        (external_id, outreach_id),
    )
    conn.commit()


def mark_outreach_failed(conn: sqlite3.Connection, outreach_id: int, error: str) -> None:
    conn.execute(
        "UPDATE outreach SET status = 'failed', error = ? WHERE id = ?",
        (error[:1000], outreach_id),
    )
    conn.commit()


def emails_sent_today(conn: sqlite3.Connection, from_domain: str) -> int:
    row = conn.execute(
        """SELECT COUNT(*) AS n FROM outreach
           WHERE channel = 'email' AND status = 'sent'
             AND from_domain = ? AND date(sent_at) = date('now')""",
        (from_domain,),
    ).fetchone()
    return int(row["n"])


def domain_daily_allowance(conn: sqlite3.Connection, from_domain: str,
                           start: int, step: int, ceiling: int) -> int:
    """Warming schedule: start emails/day on day 1, +step per day, capped."""
    row = conn.execute(
        "SELECT started_on, daily_ceiling FROM domain_warming WHERE domain = ?",
        (from_domain,),
    ).fetchone()
    if row is None:
        conn.execute(
            "INSERT INTO domain_warming (domain) VALUES (?)", (from_domain,))
        conn.commit()
        days = 0
        ceiling_db = ceiling
    else:
        days_row = conn.execute(
            "SELECT CAST(julianday('now') - julianday(?) AS INTEGER) AS d",
            (row["started_on"],),
        ).fetchone()
        days = max(0, int(days_row["d"]))
        ceiling_db = int(row["daily_ceiling"])
    return min(start + step * days, min(ceiling, ceiling_db))


def is_unsubscribed(conn: sqlite3.Connection, email: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM unsubscribes WHERE email = ?", (email.lower(),)
    ).fetchone()
    return row is not None


# ------------------------------------------------------------------
# Replies & meetings
# ------------------------------------------------------------------

def insert_reply(conn: sqlite3.Connection, lead_id: int, body: str,
                 sentiment: str, channel: str = "email",
                 outreach_id: Optional[int] = None) -> int:
    cur = conn.execute(
        """INSERT INTO replies (outreach_id, lead_id, channel, body, sentiment)
           VALUES (?, ?, ?, ?, ?)""",
        (outreach_id, lead_id, channel, body, sentiment),
    )
    conn.execute(
        "UPDATE leads SET status = 'replied', updated_at = datetime('now') "
        "WHERE id = ? AND status NOT IN ('meeting_booked','won','lost')",
        (lead_id,),
    )
    conn.commit()
    return int(cur.lastrowid or 0)


def insert_meeting(conn: sqlite3.Connection, lead_id: int, scheduled_at: str,
                   calendar_link: str = "", source_channel: str = "email",
                   notes: str = "") -> int:
    cur = conn.execute(
        """INSERT INTO meetings (lead_id, scheduled_at, calendar_link,
                                 source_channel, notes)
           VALUES (?, ?, ?, ?, ?)""",
        (lead_id, scheduled_at, calendar_link, source_channel, notes),
    )
    conn.execute(
        "UPDATE leads SET status = 'meeting_booked', updated_at = datetime('now') WHERE id = ?",
        (lead_id,),
    )
    conn.commit()
    return int(cur.lastrowid or 0)


# ------------------------------------------------------------------
# Dashboard stats
# ------------------------------------------------------------------

def dashboard_stats(conn: sqlite3.Connection,
                    product_id: Optional[str] = None) -> dict[str, Any]:
    """Everything the single-page dashboard needs, in one call."""
    pfilter = " AND product_id = ?" if product_id else ""
    pargs: list[Any] = [product_id] if product_id else []

    leads_by_source = [dict(r) for r in conn.execute(
        f"""SELECT source, COUNT(*) AS n FROM leads
            WHERE created_at > datetime('now','-7 day') AND status != 'duplicate'{pfilter}
            GROUP BY source ORDER BY n DESC""", pargs)]

    funnel = [dict(r) for r in conn.execute(
        f"""SELECT status, COUNT(*) AS n FROM leads
            WHERE status != 'duplicate'{pfilter} GROUP BY status""", pargs)]

    outreach_daily = [dict(r) for r in conn.execute(
        f"""SELECT date(o.sent_at) AS day, COUNT(*) AS sent
            FROM outreach o JOIN leads l ON l.id = o.lead_id
            WHERE o.status = 'sent' AND o.sent_at > datetime('now','-14 day'){pfilter.replace('product_id','l.product_id')}
            GROUP BY day ORDER BY day""", pargs)]

    replies_daily = [dict(r) for r in conn.execute(
        f"""SELECT date(r.created_at) AS day, COUNT(*) AS replied
            FROM replies r JOIN leads l ON l.id = r.lead_id
            WHERE r.created_at > datetime('now','-14 day'){pfilter.replace('product_id','l.product_id')}
            GROUP BY day ORDER BY day""", pargs)]

    conversion = [dict(r) for r in conn.execute(
        f"""SELECT l.source,
                   COUNT(DISTINCT l.id) AS leads,
                   COUNT(DISTINCT m.lead_id) AS meetings
            FROM leads l LEFT JOIN meetings m ON m.lead_id = l.id
            WHERE l.status != 'duplicate'{pfilter.replace('product_id','l.product_id')}
            GROUP BY l.source""", pargs)]

    hot_leads = [dict(r) for r in conn.execute(
        f"""SELECT id, company_name, contact_name, title, email, phone, city,
                   state, source, score, pain_signal, status
            FROM leads WHERE score >= 8 AND status = 'scored'{pfilter}
            ORDER BY score DESC, created_at ASC LIMIT 50""", pargs)]

    pending_approval = [dict(r) for r in conn.execute(
        f"""SELECT o.id, o.channel, o.subject, o.template_id, o.sequence_step,
                   o.created_at, l.company_name, l.contact_name, l.email, l.score
            FROM outreach o JOIN leads l ON l.id = o.lead_id
            WHERE o.status = 'queued'{pfilter.replace('product_id','l.product_id')}
            ORDER BY l.score DESC LIMIT 100""", pargs)]

    totals = dict(conn.execute(
        f"""SELECT
              (SELECT COUNT(*) FROM leads WHERE status != 'duplicate'{pfilter}) AS leads,
              (SELECT COUNT(*) FROM outreach o JOIN leads l ON l.id=o.lead_id
                WHERE o.status='sent'{pfilter.replace('product_id','l.product_id')}) AS sent,
              (SELECT COUNT(*) FROM replies r JOIN leads l ON l.id=r.lead_id
                WHERE 1=1{pfilter.replace('product_id','l.product_id')}) AS replies,
              (SELECT COUNT(*) FROM meetings m JOIN leads l ON l.id=m.lead_id
                WHERE 1=1{pfilter.replace('product_id','l.product_id')}) AS meetings""",
        pargs * 4).fetchone())

    return {
        "totals": totals,
        "leads_by_source_7d": leads_by_source,
        "funnel": funnel,
        "outreach_daily": outreach_daily,
        "replies_daily": replies_daily,
        "conversion_by_source": conversion,
        "hot_leads": hot_leads,
        "pending_approval": pending_approval,
    }


if __name__ == "__main__":
    # `python -m src.pipeline.database` initializes the DB from schema.sql
    conn = get_db()
    init_schema(conn)
    jlog("db_ready", path=str(db_path()))
