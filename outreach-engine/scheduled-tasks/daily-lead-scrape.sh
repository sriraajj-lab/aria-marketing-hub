#!/usr/bin/env bash
# Daily lead sweep: run every source, then dedupe + score.
# Cron-ready; each source failure is logged and the run continues.
set -uo pipefail
cd "$(dirname "$0")/.."
PY="${PYTHON:-python3}"

echo "{\"event\":\"daily_lead_scrape_start\",\"ts\":\"$(date -Is)\"}"

"$PY" -m src.pipeline.database || { echo '{"event":"db_init_failed","level":"error"}'; exit 1; }

for script in \
  "src/lead-sources/npi-registry.py" \
  "src/lead-sources/indeed-scraper.py" \
  "src/lead-sources/maps-scraper.py" \
  "src/lead-sources/intent-signals.py"
do
  "$PY" "$script" || echo "{\"event\":\"source_failed\",\"level\":\"error\",\"script\":\"$script\"}"
done

"$PY" src/scoring/lead-scorer.py || echo '{"event":"scoring_failed","level":"error"}'

echo "{\"event\":\"daily_lead_scrape_done\",\"ts\":\"$(date -Is)\"}"
