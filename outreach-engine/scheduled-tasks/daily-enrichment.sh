#!/usr/bin/env bash
# Daily enrichment + outreach queueing + sending of approved rows.
# Order matters: enrich -> re-score -> queue drafts -> send approved.
set -uo pipefail
cd "$(dirname "$0")/.."
PY="${PYTHON:-python3}"
MAX_CREDITS="${APOLLO_MAX_CREDITS:-20}"

echo "{\"event\":\"daily_enrichment_start\",\"ts\":\"$(date -Is)\"}"

"$PY" src/enrichment/apollo-enrich.py --max-credits "$MAX_CREDITS" \
  || echo '{"event":"enrichment_failed","level":"error"}'

"$PY" src/scoring/lead-scorer.py || echo '{"event":"scoring_failed","level":"error"}'

# Queue drafts for every sequence step (drafts only — humans approve).
for step in 1 2 3 4; do
  "$PY" src/outreach/email-sender.py --queue --step "$step" \
    || echo "{\"event\":\"queue_failed\",\"level\":\"error\",\"step\":$step}"
done

"$PY" src/outreach/vapi-caller.py --queue \
  || echo '{"event":"call_queue_failed","level":"error"}'

# Send whatever a human has already approved, within warming limits.
"$PY" src/outreach/email-sender.py --send \
  || echo '{"event":"send_failed","level":"error"}'

echo "{\"event\":\"daily_enrichment_done\",\"ts\":\"$(date -Is)\"}"
