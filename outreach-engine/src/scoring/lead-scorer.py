"""Lead scoring + deduplication.

Scoring bands (from the spec):
  8-10 Hot   — active pain signal (job posting / review / post)
               + verified email
  5-7  Warm  — good targeting fit (NPI specialty etc.) + email,
               no active pain signal
  1-4  Cold  — listing only; no verified email, no pain signal

Deduplication is enforced at insert time (dedupe_key), but sources can
still slip near-duplicates past normalization; this pass re-checks the
whole table, keeps the oldest row, moves the newer rows' sightings into
lead_sources, and marks them status='duplicate'.

Usage:
    python src/scoring/lead-scorer.py
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.pipeline.common import dedupe_key, jlog, load_config  # noqa: E402
from src.pipeline.database import get_db, set_lead_score  # noqa: E402

INTENT_SOURCES = {"indeed", "ziprecruiter", "linkedin-jobs", "intent-x", "intent-reddit"}


def score_lead(conn: Any, lead: Any) -> int:
    """Compute a 1-10 score from pain signal, contactability, and fit."""
    has_pain = bool(str(lead["pain_signal"]).strip())
    is_intent_source = lead["source"] in INTENT_SOURCES
    email = str(lead["email"]).strip()
    verified = conn.execute(
        "SELECT 1 FROM contacts WHERE lead_id = ? AND email_verified = 1 AND email != ''",
        (lead["id"],),
    ).fetchone() is not None
    has_phone = bool(str(lead["phone"]).strip())
    n_sources = conn.execute(
        "SELECT COUNT(DISTINCT source) AS n FROM lead_sources WHERE lead_id = ?",
        (lead["id"],),
    ).fetchone()["n"]

    score = 1
    if has_pain or is_intent_source:
        score += 3            # active pain signal is the biggest factor
    if verified:
        score += 3            # verified email = reachable decision-maker
    elif email:
        score += 2            # unverified email still beats nothing
    if has_phone:
        score += 1
    if lead["specialty"]:
        score += 1            # NPI targeting fit
    if n_sources >= 2:
        score += 1            # seen in multiple sources = stronger signal
    return max(1, min(score, 10))


def dedupe_pass(conn: Any) -> int:
    """Catch near-duplicates that insert-time normalization missed."""
    rows = conn.execute(
        """SELECT id, company_name, domain, website, source, raw_json
           FROM leads WHERE status != 'duplicate' ORDER BY id ASC"""
    ).fetchall()
    seen: dict[str, int] = {}
    duplicates = 0
    for r in rows:
        key = dedupe_key(r["company_name"], r["domain"] or r["website"])
        if key in seen:
            survivor = seen[key]
            conn.execute(
                "INSERT INTO lead_sources (lead_id, source, raw_json) VALUES (?, ?, ?)",
                (survivor, r["source"], r["raw_json"]),
            )
            conn.execute(
                "UPDATE leads SET status = 'duplicate', updated_at = datetime('now') WHERE id = ?",
                (r["id"],),
            )
            duplicates += 1
            jlog("lead_deduped", duplicate_id=r["id"], survivor_id=survivor, key=key)
        else:
            seen[key] = r["id"]
    conn.commit()
    return duplicates


def run() -> dict[str, int]:
    cfg = load_config()["scoring"]
    conn = get_db()
    duplicates = dedupe_pass(conn)

    rows = conn.execute(
        "SELECT * FROM leads WHERE status IN ('new','enriched') ORDER BY id ASC"
    ).fetchall()
    hot = warm = cold = 0
    for lead in rows:
        s = score_lead(conn, lead)
        set_lead_score(conn, lead["id"], s)
        if s >= cfg["hot_min"]:
            hot += 1
        elif s >= cfg["warm_min"]:
            warm += 1
        else:
            cold += 1
    conn.close()
    summary = {"scored": len(rows), "hot": hot, "warm": warm,
               "cold": cold, "deduplicated": duplicates}
    jlog("scoring_run_complete", **summary)
    return summary


def main() -> None:
    ap = argparse.ArgumentParser(description="Score and deduplicate leads")
    ap.parse_args()
    run()


if __name__ == "__main__":
    main()
