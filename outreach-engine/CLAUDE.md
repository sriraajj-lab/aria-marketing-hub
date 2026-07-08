# CLAUDE.md — Outreach Engine

## NEVER (laws; exceptions require asking first)
- Never send a real email or make a real call without human approval
  unless the skill is at "auto" tier in the trust ledger.
- Never skip lead deduplication. Duplicate outreach = burned lead.
- Never exceed 50 emails/day/domain. Rate limits are immutable.
- Never edit or delete a test to make it pass. That is a fail.
- Never add a dependency without logging it in IMPLEMENTATION.md.
- Never report work as done from your own assessment.
  Done = the check passed.
- Never invent a secret, API key, or endpoint. Stop and ask.
- Never exceed effort high inside any loop. xhigh is for one-shot reviews.

## DISPATCH
| model            | uses                                  |
|------------------|---------------------------------------|
| claude-fable-5   | conductor, verifier, weekly compost   |
| claude-sonnet-5  | lead enrichment, email drafting       |
| claude-haiku-4-5 | triage (quiet ticks), log parsing     |

1. Decision (route/review/standoff) → fable-5, effort high, read-only.
2. Reads >50k tokens (logs, lead batches) → haiku-4-5.
3. Ships to humans → taste check by fable-5.
4. Spec complete → sonnet-5, effort medium.
5. Else sonnet-5; escalate one rung on a miss.

## DONE
- Every task has a machine-checkable done_when before work starts.
- A fresh-context agent that saw neither plan nor draft verifies.
- guardrails/verify.sh has the final vote.
- Deviations: conservative option, log to IMPLEMENTATION.md, continue.
- Maker and checker disagree twice → stop, queue for human.
