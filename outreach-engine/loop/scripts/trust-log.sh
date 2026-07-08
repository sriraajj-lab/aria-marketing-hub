#!/usr/bin/env bash
# usage: trust-log.sh <skill> <pass|fail> | --render | --tier <skill>
set -euo pipefail
F="$(dirname "$0")/../memory/trust.tsv"; touch "$F"

tier_of() {
  awk -v r="$1" -v p="$2" 'BEGIN{
    rate=(r>0)?p/r:0
    if (r>=20 && rate>=0.95) print "auto"
    else if (r<10 || rate<0.90) print "watch"
    else print "queue"
  }'
}

case "${1:-}" in
  --render)
    printf "%-25s %5s %5s %6s %s\n" skill runs pass rate tier
    while IFS=$'\t' read -r s r p; do
      [ -z "$s" ] && continue
      rate=$(awk -v r="$r" -v p="$p" 'BEGIN{printf "%.0f",(r>0)?p/r*100:0}')
      printf "%-25s %5s %5s %5s%% %s\n" "$s" "$r" "$p" "$rate" "$(tier_of "$r" "$p")"
    done < "$F"
    ;;
  --tier)
    line=$(grep -P "^${2}\t" "$F" 2>/dev/null || echo -e "${2}\t0\t0")
    runs=$(echo "$line" | cut -f2)
    pass=$(echo "$line" | cut -f3)
    tier_of "$runs" "$pass"
    ;;
  *)
    skill="${1:-}"; result="${2:-}"
    [ -z "$skill" ] && { echo "usage: trust-log.sh <skill> <pass|fail>" >&2; exit 2; }
    awk -v s="$skill" -v r="$result" -F'\t' 'BEGIN{OFS="\t"; f=0}
      $1==s {f=1; print s,$2+1,$3+(r=="pass"); next} {print}
      END{if(!f) print s,1,(r=="pass")?1:0}' "$F" > "$F.t" && mv "$F.t" "$F"
    if [ "$result" = "fail" ]; then
      runs=$(grep -P "^${skill}\t" "$F" | cut -f2)
      tier=$("$0" --tier "$skill")
      [ "$tier" = "watch" ] && [ "$runs" -ge 10 ] && \
        echo "ALERT: $skill demoted to watch after $runs runs" >&2 || true
    fi
    ;;
esac
