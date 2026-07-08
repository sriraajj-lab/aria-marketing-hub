#!/usr/bin/env bash
# usage: cost-check.sh --budget <usd> | --report
set -euo pipefail
F="$(dirname "$0")/../memory/usage.log"; touch "$F"
TODAY=$(date +%F)

case "${1:-}" in
  --budget)
    spent=$(awk -F'\t' -v d="$TODAY" '$1 ~ d {s+=$3} END{printf "%.2f",s}' "$F" 2>/dev/null || echo "0")
    awk -v s="$spent" -v b="${2:-5}" 'BEGIN{exit (s>=b)?1:0}' || {
      echo "BUDGET: spent \$$spent of \$${2:-5}" >&2; exit 1; }
    ;;
  --report)
    awk -F'\t' -v since="$(date -d '7 days ago' +%F 2>/dev/null || date +%F)" \
      '$1>=since{s[$2]+=$3;t+=$3} END{for(k in s) printf "  %-15s $%.2f\n",k,s[k]; printf "  TOTAL          $%.2f\n",t}' "$F"
    ;;
  *)
    echo "usage: cost-check.sh --budget <usd> | --report" >&2; exit 2
    ;;
esac
