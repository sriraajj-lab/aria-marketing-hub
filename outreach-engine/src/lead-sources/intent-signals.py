"""Real-time intent signals from X and Reddit.

Someone publicly complaining about medical billing is a warm lead.
  - Reddit: public search JSON endpoints (no key needed, just a UA)
    across r/medicine, r/healthcare, r/MedicalCoding.
  - X: recent-search API when X_BEARER_TOKEN is set; skipped with a
    log line otherwise (X has no keyless fallback worth the ban risk).

These leads rarely have a company name; they're stored with the
author handle as the "company" so a human can investigate, and score
low until enriched.

Usage:
    python src/lead-sources/intent-signals.py            # config-driven sweep
    python src/lead-sources/intent-signals.py --reddit-only
"""
from __future__ import annotations

import argparse
import random
import sys
import time
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.pipeline.common import (  # noqa: E402
    get_secret, http_json, jlog, load_config, load_product_profile,
)
from src.pipeline.database import get_db, insert_lead  # noqa: E402


def search_reddit(subreddit: str, query: str, limit: int) -> list[dict[str, Any]]:
    url = f"https://www.reddit.com/r/{subreddit}/search.json"
    try:
        status, data = http_json(
            url,
            params={"q": query, "restrict_sr": 1, "sort": "new",
                    "t": "month", "limit": limit},
            headers={"User-Agent": "outreach-engine/1.0 (research script)"},
            what="reddit_search",
        )
    except Exception as exc:  # noqa: BLE001
        jlog("reddit_search_failed", level="warn", subreddit=subreddit,
             query=query, error=str(exc))
        return []
    if status != 200:
        jlog("reddit_blocked", level="warn", http=status, subreddit=subreddit)
        return []
    posts = []
    for child in data.get("data", {}).get("children", []):
        d = child.get("data", {})
        posts.append({
            "author": d.get("author", ""),
            "title": d.get("title", ""),
            "text": (d.get("selftext", "") or "")[:500],
            "url": "https://www.reddit.com" + d.get("permalink", ""),
            "subreddit": subreddit,
            "created_utc": d.get("created_utc"),
        })
    return posts


def search_x(bearer: str, query: str, limit: int) -> list[dict[str, Any]]:
    cfg = load_config()["apis"]["x_twitter"]
    try:
        status, data = http_json(
            f"{cfg['base_url']}/tweets/search/recent",
            params={"query": f'"{query}" -is:retweet lang:en',
                    "max_results": min(max(limit, 10), 100),
                    "tweet.fields": "author_id,created_at",
                    "expansions": "author_id",
                    "user.fields": "username,name,description"},
            headers={"Authorization": f"Bearer {bearer}"},
            what="x_search",
        )
    except Exception as exc:  # noqa: BLE001
        jlog("x_search_failed", level="warn", query=query, error=str(exc))
        return []
    if status != 200:
        jlog("x_bad_response", level="warn", http=status,
             detail=data.get("detail") or data.get("title"))
        return []
    users = {u["id"]: u for u in data.get("includes", {}).get("users", [])}
    out = []
    for t in data.get("data", []):
        u = users.get(t.get("author_id", ""), {})
        out.append({
            "author": u.get("username", ""),
            "author_name": u.get("name", ""),
            "author_bio": u.get("description", ""),
            "text": t.get("text", ""),
            "url": f"https://x.com/{u.get('username','i')}/status/{t.get('id','')}",
            "created_at": t.get("created_at"),
        })
    return out


def run(reddit_only: bool, per_run_limit: int) -> dict[str, int]:
    cfg = load_config()
    src_cfg = cfg["lead_sources"]["intent"]
    profile = load_product_profile()
    product_id = profile["product_id"]
    conn = get_db()
    inserted = merged = 0

    # Reddit sweep
    for subreddit in src_cfg["reddit_subreddits"]:
        for query in src_cfg["reddit_queries"]:
            for post in search_reddit(subreddit, query, per_run_limit):
                if not post["author"] or post["author"] in ("[deleted]", "AutoModerator"):
                    continue
                lead = {
                    "product_id": product_id,
                    "source": "intent-reddit",
                    "company_name": f"reddit:{post['author']}",
                    "contact_name": post["author"],
                    "website": post["url"],
                    "pain_signal": f"r/{subreddit}: \"{post['title'][:150]}\" — {post['text'][:250]}",
                    "raw": post,
                }
                _, is_new = insert_lead(conn, lead)
                inserted += 1 if is_new else 0
                merged += 0 if is_new else 1
            time.sleep(random.uniform(2, 4))  # reddit rate limit courtesy

    # X sweep (only with a token)
    bearer = get_secret(cfg["apis"]["x_twitter"]["bearer_token_env"])
    if reddit_only or not bearer:
        jlog("x_skipped", reason="reddit_only flag" if reddit_only else "X_BEARER_TOKEN not set")
    else:
        for query in src_cfg["x_queries"]:
            for post in search_x(bearer, query, per_run_limit):
                if not post["author"]:
                    continue
                lead = {
                    "product_id": product_id,
                    "source": "intent-x",
                    "company_name": f"x:{post['author']}",
                    "contact_name": post.get("author_name") or post["author"],
                    "website": post["url"],
                    "pain_signal": f"X post: \"{post['text'][:300]}\"",
                    "raw": post,
                }
                _, is_new = insert_lead(conn, lead)
                inserted += 1 if is_new else 0
                merged += 0 if is_new else 1
            time.sleep(1)

    conn.close()
    summary = {"inserted": inserted, "merged_duplicates": merged}
    jlog("intent_run_complete", **summary)
    return summary


def main() -> None:
    cfg = load_config()["lead_sources"]["intent"]
    ap = argparse.ArgumentParser(description="X/Reddit intent-signal lead source")
    ap.add_argument("--reddit-only", action="store_true")
    ap.add_argument("--limit", type=int, default=cfg["per_run_limit"])
    args = ap.parse_args()
    run(reddit_only=args.reddit_only, per_run_limit=args.limit)


if __name__ == "__main__":
    main()
