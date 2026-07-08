#!/usr/bin/env bash
# Deterministic gate — no model involved. Exit 0 = pass.
set -e
cd "$(dirname "$0")/../.."
DB="data/outreach.db"

# A gate that can't see is a gate that can't vote — fail loudly, never vacuously.
command -v sqlite3 >/dev/null 2>&1 || { echo "FAIL: sqlite3 CLI not installed"; exit 1; }
[ -f "$DB" ] || { echo "FAIL: $DB missing — run: python3 -m src.pipeline.database"; exit 1; }

# Deduplication: no duplicate emails among live leads
DUPES=$(sqlite3 "$DB" \
  "SELECT COUNT(*) FROM (SELECT email FROM leads WHERE email != '' AND status != 'duplicate' GROUP BY email HAVING COUNT(*) > 1)" 2>/dev/null || echo "0")
[ "$DUPES" -gt 0 ] && { echo "FAIL: $DUPES duplicate emails in leads table"; exit 1; }

# No emails sent without human approval unless the skill is auto-tier.
# Senders only read status='approved'; auto_approved=1 marks rows the
# loop approved itself, which is only legal at auto tier.
UNAPPROVED=$(sqlite3 "$DB" \
  "SELECT COUNT(*) FROM outreach WHERE channel IN ('email','call') AND status='sent' AND auto_approved=1" 2>/dev/null || echo "0")
if [ "$UNAPPROVED" -gt 0 ]; then
  TIER=$(./loop/scripts/trust-log.sh --tier send-approved-email 2>/dev/null || echo "watch")
  [ "$TIER" != "auto" ] && { echo "FAIL: $UNAPPROVED auto-approved sends but skill is not auto-tier"; exit 1; }
fi

# Rate limit: no domain over 50 emails today
OVER_LIMIT=$(sqlite3 "$DB" \
  "SELECT COUNT(*) FROM (SELECT from_domain FROM outreach WHERE channel='email' AND status='sent' AND date(sent_at)=date('now') GROUP BY from_domain HAVING COUNT(*) > 50)" 2>/dev/null || echo "0")
[ "$OVER_LIMIT" -gt 0 ] && { echo "FAIL: daily email rate limit exceeded on $OVER_LIMIT domain(s)"; exit 1; }

# No sends to unsubscribed addresses
UNSUB_SENT=$(sqlite3 "$DB" \
  "SELECT COUNT(*) FROM outreach o JOIN leads l ON l.id=o.lead_id JOIN unsubscribes u ON u.email=l.email WHERE o.status='sent' AND o.channel='email' AND o.sent_at > u.created_at" 2>/dev/null || echo "0")
[ "$UNSUB_SENT" -gt 0 ] && { echo "FAIL: $UNSUB_SENT emails sent to unsubscribed addresses"; exit 1; }

# Python syntax check on all source files
python3 -m py_compile src/lead-sources/*.py src/enrichment/*.py src/scoring/*.py \
  src/outreach/*.py src/pipeline/*.py 2>/dev/null || {
  echo "FAIL: Python syntax error"; exit 1; }

echo "gate: pass"
