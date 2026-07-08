#!/usr/bin/env bash
# Re-verify every standing goal. Exit 1 when any is VIOLATED.
set -uo pipefail
cd "$(dirname "$0")/.."   # predicates run from the engine root
LOOP_DIR="$(cd "$(dirname "$0")" && pwd)"
LEDGER="$LOOP_DIR/memory/goal-ledger.tsv"
GOALS_DIR="goals"
mkdir -p "$LOOP_DIR/memory"
VIOLATIONS=0

# Most predicates shell out to sqlite3; a missing CLI would mark every
# goal VIOLATED and cry wolf. Fail the run itself instead.
command -v sqlite3 >/dev/null 2>&1 || { echo "ERROR: sqlite3 CLI not installed"; exit 2; }

for g in "$GOALS_DIR"/*.md; do
  [ -e "$g" ] || continue
  grep -q '^status: retired' "$g" && continue
  pred=$(grep '^predicate:' "$g" | cut -d' ' -f2-)
  name=$(basename "$g" .md)
  start=$(date +%s%3N 2>/dev/null || echo 0)

  if timeout 30 bash -c "$pred" >/dev/null 2>&1; then
    r=pass
    sed -i "s/^status:.*/status: satisfied/; s/^last-pass:.*/last-pass: $(date +%F)/" "$g"
  else
    r=FAIL; VIOLATIONS=$((VIOLATIONS + 1))
    sed -i "s/^status:.*/status: VIOLATED/" "$g"
  fi

  elapsed=$(( $(date +%s%3N 2>/dev/null || echo 0) - start ))
  echo -e "$(date -Is 2>/dev/null || date)\t$name\t$r\t${elapsed#-}" >> "$LEDGER"
done

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "VIOLATED:"
  grep -l '^status: VIOLATED' "$GOALS_DIR"/*.md
  exit 1
fi
echo "all standing goals hold"
