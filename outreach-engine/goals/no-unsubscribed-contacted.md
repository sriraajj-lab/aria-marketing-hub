predicate: test $(sqlite3 data/outreach.db "SELECT COUNT(*) FROM outreach o JOIN leads l ON l.id=o.lead_id JOIN unsubscribes u ON u.email=l.email WHERE o.status='sent' AND o.channel='email' AND o.sent_at > u.created_at") -eq 0
born: 2026-07-08
source: CAN-SPAM compliance requirement
status: satisfied
last-pass: 2026-07-08
on-violation: wake me immediately. Compliance breach — pause all sending.
retire-when: system decommissioned
