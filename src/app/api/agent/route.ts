import { NextRequest, NextResponse } from 'next/server';
import { initializeAgents, orchestrator } from '@/lib/agents';
import { db } from '@/lib/db';

// Initialize agents on first request
let agentsInitialized = false;

function ensureAgents() {
  if (!agentsInitialized) {
    initializeAgents();
    agentsInitialized = true;
  }
}

/**
 * GET /api/agent — Get agent system status, tasks, and agent inventory
 */
export async function GET(request: NextRequest) {
  ensureAgents();

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'status';

  try {
    switch (view) {
      case 'status': {
        const status = await orchestrator.getSystemStatus();
        return NextResponse.json(status);
      }

      case 'tasks': {
        const status = searchParams.get('status') || 'pending';
        const tasks = await db.agentTask.findMany({
          where: { status },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
          take: 50,
        });
        return NextResponse.json({ tasks });
      }

      case 'messages': {
        const agentName = searchParams.get('agent');
        const messages = await db.agentMessage.findMany({
          where: agentName ? { toAgent: agentName } : {},
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
        return NextResponse.json({ messages });
      }

      case 'memory': {
        const agentName = searchParams.get('agent');
        const memories = await db.agentMemory.findMany({
          where: agentName ? { agentName } : {},
          orderBy: { confidence: 'desc' },
          take: 100,
        });
        return NextResponse.json({ memories });
      }

      case 'approvals': {
        const approvals = await db.humanApproval.findMany({
          where: { status: 'pending' },
          orderBy: [
            { urgency: 'desc' },
            { createdAt: 'asc' },
          ],
          take: 50,
        });
        return NextResponse.json({ approvals });
      }

      case 'specialties': {
        const { getSpecialtyStats, SPECIALTY_DEFINITIONS } = require('@/lib/specialties');
        const stats = getSpecialtyStats();
        const specialties = Object.entries(SPECIALTY_DEFINITIONS).map(([name, def]: [string, any]) => ({
          name,
          displayName: def.displayName,
          riskLevel: def.denialRiskLevel,
          hasJCodes: def.hasJCodes,
          hasTimeBasedCoding: def.hasTimeBasedCoding,
          hasGlobalPeriods: def.hasGlobalPeriods,
          commonDenialCategories: def.commonDenialCategories,
          preferredAgents: def.preferredAgents,
        }));
        return NextResponse.json({ stats, specialties });
      }

      case 'detect_specialty': {
        const { detectSpecialty, getSpecialtyDefinition } = require('@/lib/specialties');
        const cptCode = searchParams.get('cptCode') || '';
        const diagnosisCode = searchParams.get('diagnosisCode') || '';
        if (!cptCode && !diagnosisCode) {
          return NextResponse.json({ error: 'Provide cptCode or diagnosisCode parameter' }, { status: 400 });
        }
        const detected = detectSpecialty(cptCode, diagnosisCode);
        const def = getSpecialtyDefinition(detected);
        return NextResponse.json({ detected, definition: def });
      }

      default:
        return NextResponse.json({ error: 'Unknown view' }, { status: 400 });
    }
  } catch (error) {
    console.error('[AgentAPI] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch agent data' }, { status: 500 });
  }
}

/**
 * POST /api/agent — Submit tasks and trigger agent actions
 * Uses the 6-agent architecture: Orchestrator, Demographics, Eligibility, Coding, Scrubber, Appeal
 */
export async function POST(request: NextRequest) {
  ensureAgents();

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      // Submit a new task to the orchestrator
      case 'submit_task': {
        const { taskType, input, targetAgent, denialId, priority } = body;
        const taskId = await orchestrator.submitTask(
          taskType,
          input || {},
          { targetAgent, denialId, priority }
        );
        return NextResponse.json({ taskId, status: 'submitted' });
      }

      // Process a specific task
      case 'process_task': {
        const { taskId } = body;
        const result = await orchestrator.processTask(taskId);
        return NextResponse.json({ result });
      }

      // Run the full denial workflow through the 6-agent pipeline
      case 'process_denial': {
        const { denialId } = body;
        const result = await orchestrator.processDenial(denialId);
        return NextResponse.json({ result });
      }

      // Approve a human approval request
      case 'approve': {
        const { approvalId, reviewedBy, reviewNotes } = body;
        const approval = await db.humanApproval.update({
          where: { id: approvalId },
          data: {
            status: 'approved',
            reviewedBy,
            reviewNotes,
            reviewedAt: new Date(),
          }
        });
        return NextResponse.json({ approval });
      }

      // Reject a human approval request
      case 'reject': {
        const { approvalId, reviewedBy, reviewNotes } = body;
        const approval = await db.humanApproval.update({
          where: { id: approvalId },
          data: {
            status: 'denied',
            reviewedBy,
            reviewNotes,
            reviewedAt: new Date(),
          }
        });
        return NextResponse.json({ approval });
      }

      // Run targeted agent actions (6-agent system)
      case 'demographics_check': {
        const taskId = await orchestrator.submitTask('demographics_check', body.input || {}, { targetAgent: 'demographics-agent' });
        const result = await orchestrator.processTask(taskId);
        return NextResponse.json({ result });
      }

      case 'eligibility_check': {
        const taskId = await orchestrator.submitTask('eligibility_check', body.input || {}, { targetAgent: 'eligibility-agent' });
        const result = await orchestrator.processTask(taskId);
        return NextResponse.json({ result });
      }

      case 'coding_check': {
        const taskId = await orchestrator.submitTask('coding_correction', body.input || {}, { targetAgent: 'coding-agent' });
        const result = await orchestrator.processTask(taskId);
        return NextResponse.json({ result });
      }

      case 'scrub_claim': {
        const taskId = await orchestrator.submitTask('claim_scrub', body.input || {}, { targetAgent: 'scrubber-agent' });
        const result = await orchestrator.processTask(taskId);
        return NextResponse.json({ result });
      }

      case 'generate_appeal': {
        const taskId = await orchestrator.submitTask('appeal_generation', body.input || {}, { targetAgent: 'appeal-agent' });
        const result = await orchestrator.processTask(taskId);
        return NextResponse.json({ result });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[AgentAPI] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process agent action' },
      { status: 500 }
    );
  }
}
