"""Indeed job-posting lead source — hiring is an intent signal.

A practice hiring a "medical billing specialist" or "denials manager"
is signaling RCM pain; they might prefer outsourcing the function to
staffing it. This scraper hits Indeed's organic search URL with
rotating user agents and parses BOTH the embedded mosaic JSON
(window.mosaic.providerData — present on most responses) AND, as a
fallback, the visible HTML job cards. No headless browser.

Indeed rate-limits aggressively: this script sleeps 4-9s between
pages, logs and continues on any block, and never crashes the run.

Usage:
    python src/lead-sources/indeed-scraper.py                    # config-driven sweep
    python src/lead-sources/indeed-scraper.py --keyword "denials manager" --location "Texas"
"""
from __future__ import annotations

import argparse
import html
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
    http_request, jlog, load_config, load_product_profile, with_retries,
)
from src.pipeline.database import get_db, insert_lead  # noqa: E402

SEARCH_URL = "https://www.indeed.com/jobs"
MOSAIC_RE = re.compile(
    r'window\.mosaic\.providerData\["mosaic-provider-jobcards"\]\s*=\s*(\{.*?\});',
    re.DOTALL,
)
# Fallback: job title + company from visible HTML cards
CARD_TITLE_RE = re.compile(r'<h2[^>]*jobTitle[^>]*>.*?<span[^>]*title="([^"]+)"', re.DOTALL)
CARD_COMPANY_RE = re.compile(r'data-testid="company-name"[^>]*>([^<]+)<')
CARD_LOCATION_RE = re.compile(r'data-testid="text-location"[^>]*>([^<]+)<')


def fetch_page(keyword: str, location: str, start: int) -> str:
    """Fetch one Indeed results page as HTML text."""
    params = {"q": keyword, "l": location, "start": start, "sort": "date"}
    url = SEARCH_URL + "?" + urllib.parse.urlencode(params)
    status, body = with_retries(
        lambda: http_request(url, rotate_ua=True, headers={
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        }),
        what="indeed_fetch",
    )
    if status != 200:
        raise RuntimeError(f"indeed returned HTTP {status} (likely blocked)")
    return body


def parse_mosaic(page: str) -> list[dict[str, Any]]:
    """Primary parser: Indeed embeds job cards as JSON in the page."""
    m = MOSAIC_RE.search(page)
    if not m:
        return []
    try:
        data = json.loads(m.group(1))
    except json.JSONDecodeError:
        return []
    jobs = (
        data.get("metaData", {})
        .get("mosaicProviderJobCardsModel", {})
        .get("results", [])
    )
    out: list[dict[str, Any]] = []
    for j in jobs:
        out.append({
            "title": j.get("title", ""),
            "company": j.get("company", ""),
            "location": j.get("formattedLocation", "") or j.get("jobLocationCity", ""),
            "snippet": html.unescape(re.sub(r"<[^>]+>", " ", j.get("snippet", ""))).strip(),
            "job_key": j.get("jobkey", ""),
            "raw": j,
        })
    return out


def parse_html_cards(page: str) -> list[dict[str, Any]]:
    """Fallback parser when the mosaic JSON is absent."""
    titles = CARD_TITLE_RE.findall(page)
    companies = CARD_COMPANY_RE.findall(page)
    locations = CARD_LOCATION_RE.findall(page)
    out: list[dict[str, Any]] = []
    for i, company in enumerate(companies):
        out.append({
            "title": html.unescape(titles[i]) if i < len(titles) else "",
            "company": html.unescape(company).strip(),
            "location": html.unescape(locations[i]).strip() if i < len(locations) else "",
            "snippet": "",
            "job_key": "",
            "raw": {},
        })
    return out


def split_location(loc: str) -> tuple[str, str]:
    """'Dallas, TX 75201' -> ('Dallas', 'TX')."""
    parts = [p.strip() for p in loc.split(",")]
    city = parts[0] if parts else ""
    state = ""
    if len(parts) > 1:
        state = parts[1].split()[0] if parts[1].split() else ""
    return city, state


def run(keywords: list[str], locations: list[str], per_run_limit: int) -> dict[str, int]:
    profile = load_product_profile()
    product_id = profile["product_id"]
    conn = get_db()
    inserted = merged = 0
    for keyword in keywords:
        for location in locations:
            collected = 0
            for start in (0, 10, 20):  # first 3 pages max per pair
                if collected >= per_run_limit:
                    break
                try:
                    page = fetch_page(keyword, location, start)
                except Exception as exc:  # noqa: BLE001 — blocked/down: log, move on
                    jlog("indeed_fetch_failed", level="warn", keyword=keyword,
                         location=location, start=start, error=str(exc))
                    break
                jobs = parse_mosaic(page) or parse_html_cards(page)
                if not jobs:
                    jlog("indeed_no_jobs_parsed", level="warn",
                         keyword=keyword, location=location, start=start)
                    break
                for j in jobs:
                    if not j["company"]:
                        continue
                    city, state = split_location(j["location"])
                    lead = {
                        "product_id": product_id,
                        "source": "indeed",
                        "company_name": j["company"],
                        "title": "",  # hiring company; decision-maker found in enrichment
                        "city": city,
                        "state": state,
                        "pain_signal": (
                            f"Hiring: {j['title']}"
                            + (f" — \"{j['snippet'][:300]}\"" if j["snippet"] else "")
                        ),
                        "raw": {"keyword": keyword, "job": j["raw"] or j},
                    }
                    _, is_new = insert_lead(conn, lead)
                    inserted += 1 if is_new else 0
                    merged += 0 if is_new else 1
                    collected += 1
                    if collected >= per_run_limit:
                        break
                time.sleep(random.uniform(4, 9))  # be a polite scraper
    conn.close()
    summary = {"inserted": inserted, "merged_duplicates": merged}
    jlog("indeed_run_complete", **summary)
    return summary


def main() -> None:
    cfg = load_config()["lead_sources"]["indeed"]
    ap = argparse.ArgumentParser(description="Indeed job-posting lead source")
    ap.add_argument("--keyword", action="append", help="Search keyword. Repeatable.")
    ap.add_argument("--location", action="append", help="Location. Repeatable.")
    ap.add_argument("--limit", type=int, default=cfg["per_run_limit"])
    args = ap.parse_args()
    run(
        keywords=args.keyword or cfg["keywords"],
        locations=args.location or cfg["locations"],
        per_run_limit=args.limit,
    )


if __name__ == "__main__":
    main()
