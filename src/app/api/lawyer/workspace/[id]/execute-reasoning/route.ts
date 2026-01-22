/**
 * 🧠 API - EXÉCUTION DU RAISONNEMENT IA
 * 
 * POST /api/lawyer/workspace/[id]/execute-reasoning
 * 
 * Déclenche le raisonnement IA structuré pour faire progresser
 * le workspace à travers les états de la machine à états.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  executeReasoning,
  executeFullReasoning,
  executeNextStep,
} from '@/lib/reasoning/reasoning-service';
import { WorkspaceState } from '@/types/workspace-reasoning';
import { prisma } from '@/lib/prisma';

interface ExecuteReasoningBody {
  mode?: 'single' | 'next' | 'full';
  targetState?: WorkspaceState;
}

/**
 * POST - Exécuter le raisonnement IA
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = params.id;

    // Vérifier que le workspace existe et appartient au tenant
    const workspace = await prisma.workspaceReasoning.findFirst({
      where: {
        id: workspaceId,
        tenantId: (session.user as any).tenantId,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.locked) {
      return NextResponse.json(
        { error: 'Workspace is locked. Cannot execute reasoning.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: ExecuteReasoningBody = await request.json().catch(() => ({}));
    const mode = body.mode || 'next';

    let result;

    switch (mode) {
      case 'single':
        // Exécuter vers un état spécifique
        if (!body.targetState) {
          return NextResponse.json(
            { error: 'targetState required for mode=single' },
            { status: 400 }
          );
        }
        result = await executeReasoning(workspaceId, body.targetState);
        break;

      case 'next':
        // Exécuter la prochaine étape
        result = await executeNextStep(workspaceId);
        break;

      case 'full':
        // Exécuter tout le raisonnement d'un coup
        result = await executeFullReasoning(workspaceId);
        break;

      default:
        return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Recharger le workspace mis à jour
    const updatedWorkspace = await prisma.workspaceReasoning.findUnique({
      where: { id: workspaceId },
      include: {
        facts: true,
        contexts: true,
        obligations: true,
        missingElements: true,
        risks: true,
        proposedActions: true,
        reasoningTraces: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        transitions: {
          orderBy: { triggeredAt: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json({
      success: true,
      workspace: updatedWorkspace,
      result: {
        newState: result.newState || result.finalState,
        uncertaintyLevel: result.uncertaintyLevel,
        traces: result.traces,
        steps: 'steps' in result ? result.steps : undefined,
      },
    });
  } catch (error) {
    console.error('❌ Execute reasoning error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
