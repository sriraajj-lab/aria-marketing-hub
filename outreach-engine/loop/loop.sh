#!/usr/bin/env bash
# The heartbeat: triage -> conduct -> execute -> verify -> gate.
# Exit codes: 0 quiet/done, 1 iteration cap, 2 rerouted model, 3 budget exceeded.
set -euo pipefail
cd "$(dirname "$0")/.."
MAX_ITERS="${MAX_ITERS:-10}"
DAILY_BUDGET_USD="${DAILY_BUDGET_USD:-5}"
LOOP_DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$LOOP_DIR/memory"

# Budget check before anything burns tokens
"$LOOP_DIR/scripts/cost-check.sh" --budget "$DAILY_BUDGET_USD" || exit 3

for ((i=1; i<=MAX_ITERS; i++)); do
  echo "=== TICK $i ==="

  # 1 TRIAGE: read the quiet state, ~$0.01
  {
    echo "--- leads ---"
    sqlite3 data/outreach.db "SELECT source, COUNT(*), MAX(created_at) FROM leads WHERE status != 'duplicate' GROUP BY source" 2>/dev/null || true
    echo "--- unscored leads (actionable if > 0) ---"
    UNSCORED=$(sqlite3 data/outreach.db "SELECT COUNT(*) FROM leads WHERE status IN ('new','enriched')" 2>/dev/null || echo 0)
    [ "${UNSCORED:-0}" -gt 0 ] && echo "actionable: $UNSCORED leads need scoring/enrichment" || echo "0"
    echo "--- approved outreach waiting to send (actionable if > 0) ---"
    APPROVED=$(sqlite3 data/outreach.db "SELECT COUNT(*) FROM outreach WHERE status='approved'" 2>/dev/null || echo 0)
    [ "${APPROVED:-0}" -gt 0 ] && echo "actionable: $APPROVED approved outreach ready" || echo "0"
    echo "--- recent replies ---"
    sqlite3 data/outreach.db "SELECT sentiment, COUNT(*) FROM replies WHERE created_at > datetime('now','-1 day') GROUP BY sentiment" 2>/dev/null || true
    echo "--- hot leads needing review ---"
    HOT=$(sqlite3 data/outreach.db "SELECT COUNT(*) FROM leads WHERE score >= 8 AND status='scored'" 2>/dev/null || echo 0)
    [ "${HOT:-0}" -gt 0 ] && echo "needing review: $HOT hot leads" || echo "0"
    echo "--- standing goals ---"
    "$LOOP_DIR/verify-goals.sh" 2>&1 || true
  } > "$LOOP_DIR/memory/STATE.md"

  grep -q "actionable\|VIOLATED\|needing review" "$LOOP_DIR/memory/STATE.md" || {
    echo "quiet: nothing actionable"; exit 0; }

  # 2 CONDUCT: Fable 5 decides the ONE next action
  claude -p "$(cat "$LOOP_DIR/conductor.md")
STATE: $(cat "$LOOP_DIR/memory/STATE.md")
TRUST: $("$LOOP_DIR/scripts/trust-log.sh" --render)
CONTRACT: $(cat "$LOOP_DIR/contract.md")" \
    --model claude-fable-5 --effort high --allowedTools "Read" \
    --output-format json > /tmp/conductor-outreach.json 2>/dev/null || {
      echo "conductor call failed"; continue; }
  "$LOOP_DIR/scripts/log-cost.sh" conductor 0.05

  jq -r '.result' /tmp/conductor-outreach.json > "$LOOP_DIR/memory/work-order.json" 2>/dev/null || {
    echo "conductor output malformed"; continue; }

  SKILL=$(jq -r '.skill // "unknown"' "$LOOP_DIR/memory/work-order.json" 2>/dev/null || echo unknown)
  ACTION=$(jq -r '.action // "stop"' "$LOOP_DIR/memory/work-order.json" 2>/dev/null || echo stop)

  [[ "$ACTION" == "stop" ]] && { echo "conductor: stop"; exit 0; }
  [[ "$ACTION" == "queue" ]] && {
    echo "queued for human: $SKILL" >> "$LOOP_DIR/memory/STATE.md"
    echo "queued for human: $SKILL"; continue; }

  # 3 EXECUTE: worker runs the spec
  echo "executing: $SKILL"
  python3 -m src.pipeline.run --work-order "$LOOP_DIR/memory/work-order.json" \
    >> "$LOOP_DIR/memory/dispatch.tsv" 2>&1 || true

  # 4 VERIFY: fresh Fable 5, no tools, sees only spec + result
  V=$(claude -p "$(cat "$LOOP_DIR/workers/verify.md")
SPEC: $(jq -r '.spec' "$LOOP_DIR/memory/work-order.json")
DONE_WHEN: $(jq -r '.done_when | join("; ")' "$LOOP_DIR/memory/work-order.json")
RESULT: $(tail -20 "$LOOP_DIR/memory/dispatch.tsv")" \
    --model claude-fable-5 --effort high --allowedTools "" \
    --output-format json 2>/dev/null | jq -r '.result' || echo "VERIFY-ERROR")
  "$LOOP_DIR/scripts/log-cost.sh" verifier 0.05

  # 5 GATE: deterministic, then trust ledger
  if [[ "$V" == PASS* ]] && "$LOOP_DIR/guardrails/verify.sh"; then
    "$LOOP_DIR/scripts/trust-log.sh" "$SKILL" pass
    echo "PASS: $SKILL" >> "$LOOP_DIR/memory/STATE.md"

    if [[ "$("$LOOP_DIR/scripts/trust-log.sh" --tier "$SKILL")" == "auto" ]]; then
      echo "auto-shipped: $SKILL"
    else
      echo "review: $SKILL — human sign-off needed"
    fi
  else
    "$LOOP_DIR/scripts/trust-log.sh" "$SKILL" fail
    echo "FAIL: $SKILL — $V" >> "$LOOP_DIR/memory/STATE.md"
    echo "FAIL: $SKILL"
  fi

  "$LOOP_DIR/scripts/cost-check.sh" --budget "$DAILY_BUDGET_USD" || exit 3
done

exit 1  # iteration cap reached without stop
