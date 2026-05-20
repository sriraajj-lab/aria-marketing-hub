/**
 * Conductor API Route
 *
 * This replaces the direct agent calls from the UI.
 * The frontend should call this instead of /api/denials/[id]/analyze etc.
 * The conductor handles level gating, validation, and orchestration.
 */
import { NextRequest, NextResponse } from 'next/server';
import { conductor } from '@/lib/agents/conductor';
import { AccessLevel } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, denialId, level, agentName, taskType, input } = body;

    switch (action) {
      case 'process_denial': {
        if (!denialId || !level) {
          return NextResponse.json(
            { error: 'denialId and level are required for process_denial' },
            { status: 400 }
          );
        }
        const result = await conductor.processDenial(
          denialId,
          level as AccessLevel
        );
        return NextResponse.json(result);
      }

      case 'run_agent': {
        if (!agentName || !taskType || level === undefined) {
          return NextResponse.json(
            { error: 'agentName, taskType, and level are required for run_agent' },
            { status: 400 }
          );
        }
        const result = await conductor.runSingleAgent(
          agentName,
          taskType,
          input || { denialId },
          level as AccessLevel
        );
        return NextResponse.json(result);
      }

      case 'system_status': {
        const status = await conductor.getSystemStatus();
        return NextResponse.json(status);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[ConductorAPI] POST error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const status = await conductor.getSystemStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('[ConductorAPI] GET error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
