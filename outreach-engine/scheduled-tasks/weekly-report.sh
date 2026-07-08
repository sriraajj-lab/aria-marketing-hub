#!/usr/bin/env bash
# Weekly performance report: SQL facts first, Claude analysis second.
# Output: reports/weekly-YYYY-MM-DD.md (also echoed to stdout).
set -uo pipefail
cd "$(dirname "$0")/.."
DB="data/outreach.db"
OUT_DIR="reports"
OUT="$OUT_DIR/weekly-$(date +%F).md"
mkdir -p "$OUT_DIR"

sql() { sqlite3 -header -column "$DB" "$1" 2>/dev/null || echo "(query failed)"; }

{
  echo "# Weekly Outreach Report — $(date +%F)"
  echo
  echo "## Leads by source (7 days)"
  sql "SELECT source, COUNT(*) AS leads FROM leads
       WHERE created_at > datetime('now','-7 day') AND status != 'duplicate'
       GROUP BY source ORDER BY leads DESC;"
  echo
  echo "## Outreach sent vs replies (7 days)"
  sql "SELECT
        (SELECT COUNT(*) FROM outreach WHERE status='sent'
          AND sent_at > datetime('now','-7 day')) AS sent,
        (SELECT COUNT(*) FROM replies
          WHERE created_at > datetime('now','-7 day')) AS replies;"
  echo
  echo "## Template performance (all time)"
  sql "SELECT o.template_id,
        COUNT(*) AS sent,
        SUM(CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END) AS replies
       FROM outreach o LEFT JOIN replies r ON r.outreach_id = o.id
       WHERE o.status='sent' AND o.channel='email'
       GROUP BY o.template_id ORDER BY sent DESC;"
  echo
  echo "## Reply sentiment (7 days)"
  sql "SELECT sentiment, COUNT(*) AS n FROM replies
       WHERE created_at > datetime('now','-7 day')
       GROUP BY sentiment ORDER BY n DESC;"
  echo
  echo "## Meetings booked (7 days)"
  sql "SELECT m.scheduled_at, l.company_name, m.source_channel FROM meetings m
       JOIN leads l ON l.id = m.lead_id
       WHERE m.created_at > datetime('now','-7 day');"
  echo
  echo "## Conversion by source (all time)"
  sql "SELECT l.source, COUNT(DISTINCT l.id) AS leads,
        COUNT(DISTINCT m.lead_id) AS meetings
       FROM leads l LEFT JOIN meetings m ON m.lead_id = l.id
       WHERE l.status != 'duplicate' GROUP BY l.source;"
  echo
  echo "## Scored-but-never-contacted leads (waste check)"
  sql "SELECT COUNT(*) AS stuck FROM leads WHERE status='scored'
       AND created_at < datetime('now','-7 day');"
} | tee "$OUT"

# Optional: Claude analysis appended when the CLI is available.
if command -v claude >/dev/null 2>&1; then
  claude -p "You are analyzing a weekly outreach report for a solo founder.
Below is the data. In under 250 words: (1) what worked, (2) what didn't,
(3) the ONE change to make next week. Be specific, cite numbers.

$(cat "$OUT")" --model claude-fable-5 >> "$OUT" 2>/dev/null \
    || echo '{"event":"claude_analysis_failed","level":"warn"}'
fi

echo "{\"event\":\"weekly_report_done\",\"path\":\"$OUT\"}"
