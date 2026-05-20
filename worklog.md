# Denials Doctor Agent System V2 — Worklog

---
Task ID: 3
Agent: Main Agent
Task: Restructure agent system from 15 agents to 6 functional agents with anti-hallucination guardrails

Work Log:
- Audited all 15 existing agents (triage-router, denial-analyzer, correction-engine, quality-checker, appeal-strategist, evidence-retrieval, eligibility-cob, prior-authorization, medical-necessity, timely-filing-watchdog, underpayment-detector, payer-behavior-learner, root-cause-prevention, compliance-audit, human-in-the-loop)
- Identified overlapping scopes: medical-necessity overlaps coding, prior-auth overlaps eligibility, timely-filing/underpayment/duplicates should be in scrubber, evidence-retrieval should be a tool, payer-behavior/root-cause/compliance should be modules not agents
- Created BaseAgentV2 with strict scope enforcement, output schema validation, confidence thresholds, and forbidden action guards
- Created 6 new functional agents:
  1. eligibility-agent: CO-27/109/PR-1/2/OA-23/CO-50/197, coverage/COB/authorization
  2. demographics-agent: All codes, field validation only, never invents data
  3. coding-agent: CO-4/11/22/27/97, NCCI edits, modifier, coverage validation
  4. scrubber-agent: All codes, payer ID, timely filing, duplicates, fee schedules
  5. appeal-agent: All codes, template-based letters, verified citations DB
  6. orchestrator-agent: Routing, cross-validation, level gating, contradiction detection
- Created supporting files: schemas-v2.ts, workflows-v2.ts, index-v2.ts
- Referenced Palantir AIP Agentic Runtime patterns: ontology as substrate, insulated orchestration, granular policy enforcement, 4 memory types, provenance-based tools
- Kept all legacy agents intact for backward compatibility with existing API routes

Stage Summary:
- 12 new files created in /src/lib/agents/
- All V2 agents implement: strict scope, no-invention rule, confidence scoring, schema validation, human review flags
- Appeal agent has verified citation database (42 CFR, SSA, NCCI Manual, LCDs) — never invents citations
- Orchestrator cross-validates agent outputs for contradictions
- Legacy agents preserved — no breaking changes to existing API routes
