predicate: test $(sqlite3 data/outreach.db "SELECT COUNT(*) FROM (SELECT from_domain FROM outreach WHERE channel='email' AND status='sent' AND date(sent_at)=date('now') GROUP BY from_domain HAVING COUNT(*) > 50)") -eq 0
born: 2026-07-08
source: outreach engine day-2 checkpoint
status: satisfied
last-pass: 2026-07-08
on-violation: wake me. Email sending must pause.
retire-when: system decommissioned
