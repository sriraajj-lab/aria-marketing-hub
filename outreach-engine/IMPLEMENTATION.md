# IMPLEMENTATION.md — decision & dependency log

Per CLAUDE.md law: every dependency and every deviation gets logged here.

## Dependencies

| date       | dependency | why |
|------------|------------|-----|
| 2026-07-08 | fastapi    | pipeline API + dashboard serving (spec: FastAPI backend) |
| 2026-07-08 | uvicorn    | ASGI server for FastAPI |
| 2026-07-08 | pydantic   | request validation in api.py (ships with FastAPI) |

Scrapers and API clients use only the Python standard library
(urllib, sqlite3, re, json) — fewer deps, fewer breakages on a $6 droplet.

## Decisions

- 2026-07-08 — Human-approval boundary implemented as outreach.status
  ('queued' → 'approved' → 'sent'); senders only read 'approved'. The
  deterministic gate cross-checks auto_approved against the trust ledger.
- 2026-07-08 — Dedupe enforced twice: at insert (dedupe_key on
  normalized company+domain) and by a scorer re-pass for near-misses.
  All duplicate sightings preserved in lead_sources.
- 2026-07-08 — Maps source: Places API when GOOGLE_MAPS_API_KEY set,
  best-effort HTML fallback otherwise (scrape mode yields no reviews,
  so those leads score cold by design).
- 2026-07-08 — X search requires X_BEARER_TOKEN; no keyless scraping of
  X (account-ban risk not worth it). Reddit uses public JSON endpoints.
