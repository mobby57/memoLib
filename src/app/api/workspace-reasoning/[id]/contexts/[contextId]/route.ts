/**
import { logger } from '@/lib/logger';
 * API Route: POST /api/workspace-reasoning/[id]/contexts/[contextId]
 * Confirme ou rejette un contexte
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { logger } from '@/lib/logger';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; contextId: string } }
) {
  const prisma = await getSecurePrisma();
  try {
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifiÃ©' },
        { status: 401 }
      );
    }

    const { id: workspaceId, contextId } = params;
    const body = await request.json();
    const { action } = body; // 'confirm' ou 'reject'

    if (!action || !['confirm', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action doit Ãªtre "confirm" ou "reject"' },
        { status: 400 }
      );
    }

    // VÃ©rifier workspace
    const workspace = await prisma.workspaceReasoning.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace non trouvÃ©' },
        { status: 404 }
      );
    }

    const userTenantId = (session.user as any).tenantId;
    if (workspace.tenantId !== userTenantId) {
      return NextResponse.json(
        { error: 'AccÃ¨s refusÃ© - Isolation tenant' },
        { status: 403 }
      );
    }

    if (workspace.locked) {
      return NextResponse.json(
        { error: 'Workspace verrouillÃ©' },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;

    if (action === 'confirm') {
      // Confirmer le contexte
      const context = await prisma.contextHypothesis.update({
        where: { id: contextId },
        data: {
          certaintyLevel: 'CONFIRMED'
        }
      });

      await prisma.reasoningTrace.create({
        data: {
          workspaceId,
          step: 'CONTEXT_CONFIRMED',
          explanation: `Contexte confirmÃ©: ${context.description}`,
          metadata: JSON.stringify({ contextId }),
          createdBy: userId
        }
      });

      return NextResponse.json({
        success: true,
        context
      });

    } else {
      // Rejeter (supprimer) le contexte
      const context = await prisma.contextHypothesis.findUnique({
        where: { id: contextId }
      });

      if (context) {
        await prisma.contextHypothesis.delete({
          where: { id: contextId }
        });

        await prisma.reasoningTrace.create({
          data: {
            workspaceId,
            step: 'CONTEXT_REJECTED',
            explanation: `Contexte rejetÃ©: ${context.description}`,
            metadata: JSON.stringify({ contextId }),
            createdBy: userId
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Contexte rejetÃ©'
      });
    }

  } catch (error) {
    logger.error('Error updating context:', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

