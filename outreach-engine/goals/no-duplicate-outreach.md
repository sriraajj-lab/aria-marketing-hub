predicate: test $(sqlite3 data/outreach.db "SELECT COUNT(*) FROM (SELECT email FROM leads WHERE email != '' AND status != 'duplicate' GROUP BY email HAVING COUNT(*) > 1)") -eq 0
born: 2026-07-08
source: outreach engine day-1 checkpoint
status: satisfied
last-pass: 2026-07-08
on-violation: queue for human. Deduplication failed.
retire-when: system decommissioned
