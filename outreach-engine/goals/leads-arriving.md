predicate: sqlite3 data/outreach.db "SELECT COUNT(*) FROM leads WHERE created_at > datetime('now','-1 day')" | grep -qv '^0$'
born: 2026-07-08
source: outreach engine day-1 checkpoint
status: satisfied
last-pass: 2026-07-08
on-violation: wake me. Pipeline may be broken.
retire-when: system decommissioned
