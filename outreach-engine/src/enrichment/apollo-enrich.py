"""Apollo.io contact enrichment.

Given a lead's company name + the product profile's target roles, find
decision-maker names and verified emails via Apollo's REST API.

Credits are scarce (free tier: 100 emails/month), so enrichment runs
highest-score-first and stops at --max-credits per run. Leads move
new -> enriched whether or not a contact was found, so the scorer can
see "enrichment attempted, nothing found" as a real signal.

Usage:
    python src/enrichment/apollo-enrich.py --max-credits 20
    python src/enrichment/apollo-enrich.py --lead-id 42
"""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path
from typing import Any, Optional

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.pipeline.common import (  # noqa: E402
    get_secret, http_json, jlog, load_config, load_product_profile,
    normalize_domain,
)
from src.pipeline.database import (  # noqa: E402
    get_db, insert_contact, leads_by_status, update_lead_status,
)


def apollo_headers(api_key: str) -> dict[str, str]:
    return {"X-Api-Key": api_key, "Cache-Control": "no-cache"}


def find_person(api_key: str, company_name: str, domain: str,
                titles: list[str]) -> Optional[dict[str, Any]]:
    """Search Apollo for a decision-maker at the company. Returns the
    top person hit or None."""
    cfg = load_config()["apis"]["apollo"]
    body: dict[str, Any] = {
        "q_organization_name": company_name,
        "person_titles": titles,
        "page": 1,
        "per_page": 3,
    }
    if domain:
        body["q_organization_domains"] = domain
    status, data = http_json(
        f"{cfg['base_url']}/mixed_people/search",
        method="POST", json_body=body,
        headers=apollo_headers(api_key), what="apollo_search",
    )
    if status == 401 or status == 403:
        raise PermissionError(f"apollo auth error HTTP {status} — check APOLLO_API_KEY")
    if status == 422:
        jlog("apollo_search_rejected", level="warn", company=company_name,
             detail=str(data)[:300])
        return None
    if status != 200:
        jlog("apollo_search_failed", level="warn", http=status, company=company_name)
        return None
    people = data.get("people", []) or data.get("contacts", [])
    return people[0] if people else None


def reveal_email(api_key: str, person: dict[str, Any]) -> tuple[str, bool]:
    """Use people/match to reveal + verify the email (this consumes a
    credit). Returns (email, verified)."""
    cfg = load_config()["apis"]["apollo"]
    body = {
        "first_name": person.get("first_name", ""),
        "last_name": person.get("last_name", ""),
        "organization_name": (person.get("organization") or {}).get("name", ""),
        "reveal_personal_emails": False,
    }
    if person.get("id"):
        body["id"] = person["id"]
    status, data = http_json(
        f"{cfg['base_url']}/people/match",
        method="POST", json_body=body,
        headers=apollo_headers(api_key), what="apollo_match",
    )
    if status != 200:
        jlog("apollo_match_failed", level="warn", http=status,
             person=person.get("name", ""))
        return "", False
    p = data.get("person", {}) or {}
    email = (p.get("email") or "").strip()
    verified = p.get("email_status") == "verified"
    if email and "email_not_unlocked" in email:
        email = ""
    return email, verified


def enrich_lead(conn: Any, api_key: str, lead: Any, titles: list[str]) -> bool:
    """Enrich one lead. Returns True when a credit was consumed."""
    company = lead["company_name"]
    if company.startswith(("reddit:", "x:")):
        # Social intent leads have no company to enrich yet — a human
        # identifies the org first. Mark enriched so they flow to scoring.
        update_lead_status(conn, lead["id"], "enriched")
        return False
    domain = normalize_domain(lead["domain"] or lead["website"])
    try:
        person = find_person(api_key, company, domain, titles)
    except PermissionError as exc:
        jlog("apollo_auth_error", level="error", error=str(exc))
        raise
    except Exception as exc:  # noqa: BLE001 — API down: log, leave lead as 'new'
        jlog("apollo_enrich_error", level="warn", lead_id=lead["id"], error=str(exc))
        return False

    if person is None:
        jlog("apollo_no_person", lead_id=lead["id"], company=company)
        update_lead_status(conn, lead["id"], "enriched")
        return False

    email, verified = reveal_email(api_key, person)
    name = person.get("name") or " ".join(
        p for p in (person.get("first_name", ""), person.get("last_name", "")) if p)
    insert_contact(
        conn, lead["id"],
        name=name,
        title=person.get("title", ""),
        email=email,
        email_verified=verified,
        phone=(person.get("phone_numbers") or [{}])[0].get("sanitized_number", "")
              if person.get("phone_numbers") else "",
        linkedin_url=person.get("linkedin_url", "") or "",
        source="apollo",
    )
    update_lead_status(conn, lead["id"], "enriched")
    jlog("lead_enriched", lead_id=lead["id"], company=company,
         found_email=bool(email), verified=verified)
    return True  # match call consumed a credit


def run(max_credits: int, lead_id: Optional[int]) -> dict[str, int]:
    cfg = load_config()
    api_key = get_secret(cfg["apis"]["apollo"]["api_key_env"])
    if not api_key:
        jlog("apollo_skipped", level="warn",
             reason="APOLLO_API_KEY not set — enrichment cannot run")
        return {"enriched": 0, "credits_used": 0}

    profile = load_product_profile()
    titles = profile["target_roles"]
    conn = get_db()

    if lead_id is not None:
        row = conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
        leads = [row] if row else []
    else:
        leads = list(leads_by_status(conn, ["new"], profile["product_id"]))
        # Highest-value first: leads with a pain signal get credits before cold ones.
        leads.sort(key=lambda r: (bool(r["pain_signal"]), r["score"]), reverse=True)

    credits = enriched = 0
    for lead in leads:
        if credits >= max_credits:
            jlog("apollo_credit_cap_reached", cap=max_credits)
            break
        try:
            used = enrich_lead(conn, api_key, lead, titles)
        except PermissionError:
            break  # auth is broken; stop burning the run
        credits += 1 if used else 0
        enriched += 1
        time.sleep(0.6)  # Apollo rate-limit courtesy
    conn.close()
    summary = {"enriched": enriched, "credits_used": credits}
    jlog("apollo_run_complete", **summary)
    return summary


def main() -> None:
    ap = argparse.ArgumentParser(description="Apollo contact enrichment")
    ap.add_argument("--max-credits", type=int, default=20,
                    help="Max email-reveal credits to spend this run")
    ap.add_argument("--lead-id", type=int, default=None,
                    help="Enrich a single lead by id")
    args = ap.parse_args()
    run(max_credits=args.max_credits, lead_id=args.lead_id)


if __name__ == "__main__":
    main()
