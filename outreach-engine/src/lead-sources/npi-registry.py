"""NPI Registry lead source.

Searches the free CMS NPI Registry API (v2.1, no key required) by
taxonomy/specialty + state and writes structured lead records into the
database. Organizations (entity type 2) are preferred — they are
practices, which is what we sell to — but individual providers are kept
too, tagged with their practice address.

Usage:
    python src/lead-sources/npi-registry.py                       # config-driven sweep
    python src/lead-sources/npi-registry.py --specialty "Internal Medicine" --state TX --limit 100
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any, Optional

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.pipeline.common import http_json, jlog, load_config, load_product_profile  # noqa: E402
from src.pipeline.database import get_db, insert_lead  # noqa: E402

PAGE_SIZE = 200  # NPI API max per request


def search_npi(specialty: str, state: str, city: Optional[str] = None,
               limit: int = 200) -> list[dict[str, Any]]:
    """Page through NPI API results for one specialty+state."""
    cfg = load_config()
    base = cfg["apis"]["npi_registry"]["base_url"]
    results: list[dict[str, Any]] = []
    skip = 0
    while len(results) < limit:
        page = min(PAGE_SIZE, limit - len(results))
        params: dict[str, Any] = {
            "version": cfg["apis"]["npi_registry"]["version"],
            "taxonomy_description": specialty,
            "state": state,
            "limit": page,
            "skip": skip,
        }
        if city:
            params["city"] = city
        try:
            status, data = http_json(base, params=params, what="npi_search")
        except Exception as exc:  # noqa: BLE001 — API down: log and stop this sweep
            jlog("npi_search_failed", level="error", specialty=specialty,
                 state=state, skip=skip, error=str(exc))
            break
        if status != 200 or "results" not in data:
            jlog("npi_bad_response", level="warn", status=status,
                 keys=list(data.keys()) if isinstance(data, dict) else None)
            break
        batch = data.get("results", [])
        results.extend(batch)
        jlog("npi_page", specialty=specialty, state=state, skip=skip,
             got=len(batch), total=len(results))
        if len(batch) < page:
            break  # last page
        skip += page
    return results[:limit]


def to_lead(record: dict[str, Any], product_id: str, specialty: str) -> dict[str, Any]:
    """Map one NPI API record to our lead shape."""
    basic = record.get("basic", {})
    entity_type = record.get("enumeration_type", "")
    if entity_type == "NPI-2":  # organization
        company = basic.get("organization_name", "") or basic.get("name", "")
        contact_name = " ".join(
            p for p in (basic.get("authorized_official_first_name", ""),
                        basic.get("authorized_official_last_name", "")) if p)
        title = basic.get("authorized_official_title_or_position", "")
    else:  # NPI-1 individual provider
        person = " ".join(p for p in (basic.get("first_name", ""),
                                      basic.get("last_name", "")) if p)
        credential = basic.get("credential", "")
        company = f"{person} {credential}".strip() or person
        contact_name = person
        title = "Provider"

    # Prefer the practice LOCATION address over the MAILING address.
    addr: dict[str, Any] = {}
    for a in record.get("addresses", []):
        if a.get("address_purpose") == "LOCATION":
            addr = a
            break
    if not addr and record.get("addresses"):
        addr = record["addresses"][0]

    return {
        "product_id": product_id,
        "source": "npi",
        "company_name": company,
        "contact_name": contact_name,
        "title": title,
        "specialty": specialty,
        "npi_number": str(record.get("number", "")),
        "phone": addr.get("telephone_number", ""),
        "address": " ".join(p for p in (addr.get("address_1", ""),
                                        addr.get("address_2", "")) if p),
        "city": addr.get("city", ""),
        "state": addr.get("state", ""),
        "pain_signal": "",  # NPI is a targeting source, not an intent source
        "raw": record,
    }


def run(specialties: list[str], states: list[str], city: Optional[str],
        per_run_limit: int) -> dict[str, int]:
    profile = load_product_profile()
    product_id = profile["product_id"]
    conn = get_db()
    inserted = merged = 0
    for specialty in specialties:
        for state in states:
            for record in search_npi(specialty, state, city, per_run_limit):
                lead = to_lead(record, product_id, specialty)
                if not lead["company_name"]:
                    continue
                _, is_new = insert_lead(conn, lead)
                inserted += 1 if is_new else 0
                merged += 0 if is_new else 1
    conn.close()
    summary = {"inserted": inserted, "merged_duplicates": merged}
    jlog("npi_run_complete", **summary)
    return summary


def main() -> None:
    cfg = load_config()["lead_sources"]["npi"]
    ap = argparse.ArgumentParser(description="NPI Registry lead source")
    ap.add_argument("--specialty", action="append",
                    help="Taxonomy description, e.g. 'Internal Medicine'. Repeatable.")
    ap.add_argument("--state", action="append", help="Two-letter state. Repeatable.")
    ap.add_argument("--city", default=None)
    ap.add_argument("--limit", type=int, default=cfg["per_run_limit"],
                    help="Max records per specialty+state pair")
    args = ap.parse_args()
    run(
        specialties=args.specialty or cfg["specialties"],
        states=args.state or cfg["states"],
        city=args.city,
        per_run_limit=args.limit,
    )


if __name__ == "__main__":
    main()
