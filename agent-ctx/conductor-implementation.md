# Task: Implement Conductor Agent System (Garry Tan GStack/Conductor Pattern)

## Summary

Implemented a complete conductor-based agent system for the Denials Doctor platform that replaces direct API calls with a structured, level-gated, schema-validated workflow pipeline.

## Files Created

### 1. `src/lib/agents/schemas.ts` - Output Schema Validation
- **DenialAnalysisOutputSchema**: Validates denial analysis output with strict enums for root_cause_category and denial_category
- **CorrectionOutputSchema**: Validates correction suggestions with risk levels and proposed changes
- **QualityCheckOutputSchema**: Validates quality check results with blocking issues and warnings
- **AppealStrategyOutputSchema**: Validates appeal strategies with letter templates
- **TriageOutputSchema**: Validates triage routing output with priority and deadline urgency
- **validateAgentOutput()** generic helper for schema validation with error reporting
- **AGENT_OUTPUT_SCHEMAS** registry mapping agent names to their schemas for validation gates

### 2. `src/lib/agents/workflows.ts` - Level-Gated Workflow Definitions
- **L1_SCAN_WORKFLOW**: Scan only (1 step - triage), min level 1
- **L2_FIX_WORKFLOW**: Full pipeline (6 steps - triage→analyze→correct→quality_check→appeal→prevention), min level 2
- **L3_AUTO_WORKFLOW**: Autonomous pipeline (6 steps + EHR auto-submit), min level 3
- **SINGLE_AGENT_WORKFLOWS**: Map of all 15 agents with their required access levels
- **getWorkflowForLevel()**: Returns the appropriate workflow based on user's access level
- **isAgentAllowedAtLevel()**: Checks if a specific agent/task is permitted at a given level

### 3. `src/lib/agents/conductor.ts` - Enhanced Conductor
- **Conductor.processDenial()**: Runs the full workflow for a denial, gated by access level
- **Conductor.runSingleAgent()**: Runs a single agent with level gating enforcement
- **Conductor.getSystemStatus()**: Returns all 15 agents with level/category info, task counts, and workflow definitions
- **Conductor.getAgentTaskHistory()**: Returns task history for a specific agent
- **Validation gates**: Each workflow step can have a validation gate that checks output against schemas
- **Dependency tracking**: Steps only execute when their dependencies are met
- **Pipeline stop on validation failure**: If a validation-gated step fails, the pipeline stops

### 4. `src/app/api/conductor/route.ts` - Conductor API Route
- **POST /api/conductor**: Supports `process_denial`, `run_agent`, `system_status` actions
- **GET /api/conductor**: Returns system status (all agents, workflows, task counts)
- Input validation for required parameters

### 5. Updated `src/components/agents-view.tsx` - Real 15-Agent View
- Fetches from `/api/conductor` instead of hardcoded data
- Shows all 15 agents grouped by category (Routing, Core Pipeline, Specialist, Watchdog, Learning, Compliance, EHR Integration)
- Displays level badges (L1/L2/L3) and locked indicators
- Shows capability badges and tool usage per agent
- Workflow architecture diagrams for each level (L1/L2/L3)
- Conductor configuration panel showing pattern and validation mode
- Loading and error states

### 6. Updated `src/components/denial-detail-view.tsx` - Conductor Integration
- **runAnalysis()** now routes through `/api/conductor` with `run_agent` action
- **runCorrection()** now routes through `/api/conductor` with `run_agent` action  
- **runQualityCheck()** now routes through `/api/conductor` with `run_agent` action
- **runFullPipeline()** NEW: Calls `/api/conductor` with `process_denial` action
- Pipeline step progress display showing agent, validation status, and confidence
- "Run Full Pipeline" gradient button at the top of the actions panel
- Validation errors shown in badges on failed pipeline steps
- Backward compatible: existing standalone routes still work

## Key Design Decisions

1. **Schema validation is the anti-hallucination measure**: If AI output doesn't match the Zod schema, the step fails. This prevents garbage output from one agent flowing into the next.

2. **Level gating is enforced on both frontend and backend**: The conductor checks access level before routing to any agent. L1 users get blocked if they try to run L2+ agents.

3. **Validation gates between steps**: Each workflow step has a `validationGate` flag. When true, the output must pass schema validation before the next step can run.

4. **Backward compatibility preserved**: The existing standalone API routes (`/api/denials/[id]/analyze`, etc.) still work. The conductor wraps them through the orchestrator.

5. **Zod v4 compatibility**: Used `z.ZodType` instead of `z.ZodSchema` which doesn't exist in v4.

## Testing

- Conductor GET endpoint confirmed returning all 15 agents with proper levels/categories
- Workflows confirmed: L1 (1 step), L2 (6 steps), L3 (6 steps)
- Lint passes (errors only in pre-existing files, not new code)
- Database schema pushed successfully
