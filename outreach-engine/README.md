# Outreach Engine

A Claude Code-managed outreach and sales pipeline: multi-source lead
generation → enrichment → scoring → multi-channel outreach → lightweight
CRM → self-running verified loop. Built for a solo founder — Claude Code
does the daily grind; a human reviews leads, approves messaging, and
handles replies.

## What it does

1. **Finds leads** from 4+ sources: NPI Registry (targeting), Indeed job
   postings (intent), Google Maps reviews (pain signals), X/Reddit posts
   (real-time intent).
2. **Enriches** decision-maker names + verified emails via Apollo.io.
3. **Scores 1-10** and deduplicates across sources (hot 8-10 / warm 5-7 / cold 1-4).
4. **Drafts outreach** — 4-email sequences per product + Vapi voice calls
   for hot leads. **Nothing sends without human approval** (dashboard
   Approve button), until a skill earns "auto" tier in the trust ledger.
5. **Tracks the pipeline** in SQLite with a single-page dashboard.
6. **Runs itself** via `loop/loop.sh` — conductor decides, worker executes,
   fresh verifier judges, a deterministic gate has the final vote.

## Quick start (Day 1 — first 100 leads)

```bash
cd outreach-engine
pip install -r requirements.txt

# 1. Create the database (schema + seed products)
python3 -m src.pipeline.database

# 2. Pull leads from the free NPI registry (no API key needed)
python3 src/lead-sources/npi-registry.py --specialty "Internal Medicine" --state TX --limit 100

# 3. Score + dedupe
python3 src/scoring/lead-scorer.py

# 4. See them
uvicorn src.pipeline.api:app --host 0.0.0.0 --port 8080
# open http://localhost:8080/dashboard
```

## Day 2 — first outreach

```bash
export APOLLO_API_KEY=...     # apollo.io settings -> API
export RESEND_API_KEY=...     # resend.com -> API keys

python3 src/enrichment/apollo-enrich.py --max-credits 20
python3 src/scoring/lead-scorer.py                       # re-score with emails
python3 src/outreach/email-sender.py --queue --step 1    # drafts only
# -> open the dashboard, read each draft, click Approve
python3 src/outreach/email-sender.py --send              # sends approved, warming-limited
```

Domain warming is automatic: 5 emails/day on day 1, +5/day, hard cap
50/day/domain. Every email carries a physical address + unsubscribe link
(CAN-SPAM).

## Day 3 — calls + closed loop

```bash
export VAPI_API_KEY=... VAPI_PHONE_NUMBER_ID=...
python3 src/outreach/vapi-caller.py --queue    # hot leads (score>=8) with phones
# approve in dashboard
python3 src/outreach/vapi-caller.py --call
bash scheduled-tasks/weekly-report.sh          # reports/weekly-<date>.md
```

Call outcomes arrive on `POST /api/webhooks/vapi` and become replies with
sentiment. Record email replies manually via `POST /api/replies` (or let
Claude Code parse your inbox export and post them).

## Switching products

Everything adapts to the active product profile:

```bash
# permanent: edit "active_product" in config.json
# one run:   OUTREACH_PRODUCT=aria-agent-agency python3 src/outreach/email-sender.py --queue --step 1
```

Profiles live in `product-profiles/*.json` — roles, pain points, tone,
templates, Vapi assistant prompt, from-address.

## The self-running loop (Build 9)

```bash
./loop/loop.sh            # one supervised run (Week 1: run by hand, read everything)
./loop/verify-goals.sh    # re-check standing invariants
./loop/scripts/trust-log.sh --render   # skill pass rates and tiers
./loop/scripts/cost-check.sh --report  # 7-day spend by stage
```

- `CLAUDE.md` — the constitution (laws, dispatch table, definition of done)
- `loop/contract.md` — what the loop may do alone vs. queue vs. wake you
- `loop/guardrails/verify.sh` — deterministic gate: dedupe, approval,
  rate-limit, unsubscribe, syntax checks. No model involved.
- `goals/*.md` — standing invariants re-verified every run
- Trust tiers: a skill ships unattended only after 20 runs at ≥95% pass.

Cron (Week 2+), from `scheduled-tasks/crontab.example`:

```
17 7 * * 1-5  cd /path/to/outreach-engine && ./loop/loop.sh >> loop/memory/cron.log 2>&1
47 7 * * *    cd /path/to/outreach-engine && ./loop/verify-goals.sh >> loop/memory/cron.log 2>&1
37 8 * * 1    cd /path/to/outreach-engine && claude -p "$(cat loop/compost.md)" --model claude-fable-5 --effort high >> loop/memory/compost-log.md 2>&1
```

## Deploy (single $6 DigitalOcean droplet)

```bash
apt install -y python3-pip sqlite3 jq
pip install -r requirements.txt
python3 -m src.pipeline.database
# run the API as a service
cat >/etc/systemd/system/outreach.service <<'EOF'
[Unit]
Description=outreach-engine API
[Service]
WorkingDirectory=/opt/outreach-engine
ExecStart=/usr/bin/python3 -m uvicorn src.pipeline.api:app --host 0.0.0.0 --port 8080
Restart=always
EnvironmentFile=/opt/outreach-engine/.env
[Install]
WantedBy=multi-user.target
EOF
systemctl enable --now outreach
```

Point Cloudflare at the droplet (proxy `/*` on denialsdoctor.com or a
subdomain) — the dashboard is served by the API at `/dashboard`, so no
separate static hosting is required. Back up `data/outreach.db` daily
(it's one file).

## Secrets

All keys come from environment variables (see `config.json` → `*_env`):
`APOLLO_API_KEY`, `RESEND_API_KEY`, `VAPI_API_KEY`,
`VAPI_PHONE_NUMBER_ID`, optional `GOOGLE_MAPS_API_KEY`, `X_BEARER_TOKEN`.
NPI Registry needs no key. Never commit a real key.

## Layout

```
outreach-engine/
├── CLAUDE.md                 constitution
├── config.json               global config (endpoints, limits, env-var names)
├── schema.sql                SQLite schema + seeds
├── product-profiles/         one JSON per product
├── src/
│   ├── lead-sources/         npi-registry, indeed-scraper, maps-scraper, intent-signals
│   ├── enrichment/           apollo-enrich
│   ├── scoring/              lead-scorer (score + dedupe)
│   ├── outreach/             email-sender, vapi-caller, templates/
│   ├── pipeline/             common, database, api (FastAPI), run (work orders)
│   └── dashboard/            index.html (vanilla JS + Chart.js)
├── scheduled-tasks/          daily-lead-scrape, daily-enrichment, weekly-report, crontab.example
├── loop/                     loop.sh, conductor, verifier, gate, trust ledger, cost tracking
├── goals/                    standing invariants
└── data/                     outreach.db (gitignored)
```
