/**
 * API Route: POST /api/workspace-reasoning/[id]/actions/[actionId]
 * Marque une action comme exécutée
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; actionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { id: workspaceId, actionId } = params;
    const body = await request.json();
    const { result } = body;

    // Vérifier workspace
    const workspace = await prisma.workspaceReasoning.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace non trouvé' },
        { status: 404 }
      );
    }

    const userTenantId = (session.user as any).tenantId;
    if (workspace.tenantId !== userTenantId) {
      return NextResponse.json(
        { error: 'Accès refusé - Isolation tenant' },
        { status: 403 }
      );
    }

    if (workspace.locked) {
      return NextResponse.json(
        { error: 'Workspace verrouillé' },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;

    // Marquer comme exécutée
    const action = await prisma.proposedAction.update({
      where: { id: actionId },
      data: {
        executed: true,
        executedBy: userId,
        executedAt: new Date(),
        result: result || 'Exécutée manuellement',
        updatedAt: new Date()
      }
    });

    // Trace
    await prisma.reasoningTrace.create({
      data: {
        workspaceId,
        step: 'ACTION_EXECUTED',
        explanation: `Action exécutée: ${action.description}`,
        metadata: JSON.stringify({
          actionId,
          actionType: action.type,
          result
        }),
        createdBy: userId
      }
    });

    return NextResponse.json({
      success: true,
      action
    });

  } catch (error) {
    console.error('Error executing action:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
