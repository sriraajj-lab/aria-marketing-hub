"""Google Maps lead source — negative reviews as pain signals.

Medical practices whose reviews complain about billing, insurance, or
front-desk chaos have operational problems — an RCM opportunity.

Two modes, per the dual API/scrape rule:
  1. API mode (preferred): Google Places Text Search + Place Details
     (reviews included) when GOOGLE_MAPS_API_KEY is set.
  2. Scrape mode (fallback): parse the embedded APP_INITIALIZATION_STATE
     blob from a google.com/maps/search page. Best-effort — Google
     changes this format; failures log and continue, never crash.

Usage:
    python src/lead-sources/maps-scraper.py                                 # config-driven sweep
    python src/lead-sources/maps-scraper.py --query "family medicine clinic" --city "Dallas, TX"
"""
from __future__ import annotations

import argparse
import json
import random
import re
import sys
import time
import urllib.parse
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.pipeline.common import (  # noqa: E402
    get_secret, http_json, http_request, jlog, load_config,
    load_product_profile, normalize_domain, with_retries,
)
from src.pipeline.database import get_db, insert_lead  # noqa: E402


def pain_snippets(reviews: list[dict[str, Any]], keywords: list[str]) -> list[str]:
    """Return review sentences that mention billing/admin pain keywords."""
    hits: list[str] = []
    for r in reviews:
        text = (r.get("text") or "")
        if isinstance(text, dict):  # Places API v1 shape
            text = text.get("text", "")
        rating = r.get("rating", 3)
        if rating and rating > 3:
            continue  # only mine negative/neutral reviews for pain
        lowered = text.lower()
        for kw in keywords:
            if kw in lowered:
                # capture the sentence around the keyword
                for sentence in re.split(r"(?<=[.!?])\s+", text):
                    if kw in sentence.lower():
                        hits.append(sentence.strip()[:200])
                        break
                break
    return hits[:3]


# ------------------------------------------------------------------
# Mode 1: Places API
# ------------------------------------------------------------------

def places_api_search(api_key: str, query: str, city: str,
                      limit: int) -> list[dict[str, Any]]:
    cfg = load_config()["apis"]["google_maps"]
    base = cfg["base_url"]
    status, data = http_json(
        f"{base}/textsearch/json",
        params={"query": f"{query} in {city}", "key": api_key},
        what="places_textsearch",
    )
    if status != 200 or data.get("status") not in ("OK", "ZERO_RESULTS"):
        jlog("places_search_failed", level="warn", http=status,
             api_status=data.get("status"), error=data.get("error_message"))
        return []
    out: list[dict[str, Any]] = []
    for place in data.get("results", [])[:limit]:
        place_id = place.get("place_id", "")
        details: dict[str, Any] = {}
        if place_id:
            try:
                _, d = http_json(
                    f"{base}/details/json",
                    params={
                        "place_id": place_id,
                        "fields": "name,formatted_address,formatted_phone_number,"
                                  "website,rating,user_ratings_total,reviews",
                        "key": api_key,
                    },
                    what="places_details",
                )
                details = d.get("result", {})
            except Exception as exc:  # noqa: BLE001
                jlog("places_details_failed", level="warn",
                     place_id=place_id, error=str(exc))
        out.append({**place, "details": details})
        time.sleep(0.2)  # stay well under Places QPS limits
    return out


# ------------------------------------------------------------------
# Mode 2: HTML scrape fallback
# ------------------------------------------------------------------

# Business entries inside APP_INITIALIZATION_STATE look like
# [null,null,lat,lng],"Name" sequences; we mine name/phone/site heuristically.
SCRAPE_NAME_RE = re.compile(r'\\"([^\\"]{4,80})\\",\\"[^\\"]*\\",\[\\"(?:doctor|clinic|medical|health)', re.I)
PHONE_RE = re.compile(r'\(\d{3}\)\s?\d{3}-\d{4}')


def scrape_maps_search(query: str, city: str, limit: int) -> list[dict[str, Any]]:
    url = ("https://www.google.com/maps/search/"
           + urllib.parse.quote(f"{query} {city}"))
    try:
        status, page = with_retries(
            lambda: http_request(url, rotate_ua=True, headers={
                "Accept-Language": "en-US,en;q=0.9"}),
            what="maps_scrape",
        )
    except Exception as exc:  # noqa: BLE001
        jlog("maps_scrape_failed", level="warn", query=query, city=city, error=str(exc))
        return []
    if status != 200:
        jlog("maps_scrape_blocked", level="warn", http=status, query=query, city=city)
        return []
    m = re.search(r'window\.APP_INITIALIZATION_STATE\s*=\s*(\[.*?\]);window', page, re.DOTALL)
    blob = m.group(1) if m else page
    names = list(dict.fromkeys(SCRAPE_NAME_RE.findall(blob)))[:limit]
    phones = PHONE_RE.findall(blob)
    results: list[dict[str, Any]] = []
    for i, name in enumerate(names):
        results.append({
            "name": name.encode().decode("unicode_escape", errors="ignore"),
            "details": {"formatted_phone_number": phones[i] if i < len(phones) else "",
                        "reviews": []},
        })
    jlog("maps_scrape_parsed", query=query, city=city, found=len(results),
         note="scrape mode has no reviews; leads score as cold targeting data")
    return results


# ------------------------------------------------------------------

def run(queries: list[str], cities: list[str], per_run_limit: int) -> dict[str, int]:
    cfg = load_config()
    src_cfg = cfg["lead_sources"]["maps"]
    pain_keywords = [k.lower() for k in src_cfg["review_pain_keywords"]]
    api_key = get_secret(cfg["apis"]["google_maps"]["api_key_env"])
    profile = load_product_profile()
    product_id = profile["product_id"]
    conn = get_db()
    inserted = merged = 0

    for query in queries:
        for city in cities:
            if api_key:
                places = places_api_search(api_key, query, city, per_run_limit)
            else:
                places = scrape_maps_search(query, city, per_run_limit)
                time.sleep(random.uniform(3, 7))
            city_name = city.split(",")[0].strip()
            state = city.split(",")[1].strip() if "," in city else ""
            for place in places:
                details = place.get("details", {})
                name = details.get("name") or place.get("name", "")
                if not name:
                    continue
                snippets = pain_snippets(details.get("reviews", []) or [], pain_keywords)
                lead = {
                    "product_id": product_id,
                    "source": "maps",
                    "company_name": name,
                    "phone": details.get("formatted_phone_number", ""),
                    "website": details.get("website", ""),
                    "domain": normalize_domain(details.get("website", "")),
                    "address": details.get("formatted_address", "")
                               or place.get("formatted_address", ""),
                    "city": city_name,
                    "state": state,
                    "pain_signal": " | ".join(f"Review: \"{s}\"" for s in snippets),
                    "raw": place,
                }
                _, is_new = insert_lead(conn, lead)
                inserted += 1 if is_new else 0
                merged += 0 if is_new else 1
    conn.close()
    summary = {"inserted": inserted, "merged_duplicates": merged,
               "mode": "api" if api_key else "scrape"}
    jlog("maps_run_complete", **summary)
    return summary


def main() -> None:
    cfg = load_config()["lead_sources"]["maps"]
    ap = argparse.ArgumentParser(description="Google Maps lead source")
    ap.add_argument("--query", action="append", help="Business query. Repeatable.")
    ap.add_argument("--city", action="append", help='"City, ST". Repeatable.')
    ap.add_argument("--limit", type=int, default=cfg["per_run_limit"])
    args = ap.parse_args()
    run(
        queries=args.query or cfg["queries"],
        cities=args.city or cfg["cities"],
        per_run_limit=args.limit,
    )


if __name__ == "__main__":
    main()
