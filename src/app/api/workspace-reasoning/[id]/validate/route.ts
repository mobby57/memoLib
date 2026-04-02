/**
 * API Route: POST /api/workspace-reasoning/[id]/validate
 * Validation finale par l'humain (verrouille le workspace)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { WorkspaceReasoningService } from '@/lib/workspace-reasoning-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const workspaceId = params.id;
    const body = await request.json();
    const { validationNote } = body;

    // Récupérer le workspace avec relations
    const workspace = await prisma.workspaceReasoning.findUnique({
      where: { id: workspaceId },
      include: {
        facts: true,
        contexts: true,
        obligations: true,
        missingElements: true,
        risks: true,
        proposedActions: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace non trouvé' }, { status: 404 });
    }

    const userTenantId = (session.user as any).tenantId;
    if (workspace.tenantId !== userTenantId) {
      return NextResponse.json({ error: 'Accès refusé - Isolation tenant' }, { status: 403 });
    }

    // Vérifier que le workspace est prêt à être verrouillé
    if (!WorkspaceReasoningService.canLockWorkspace(workspace as any)) {
      return NextResponse.json(
        { error: 'Workspace non prêt pour validation - Résoudre les éléments bloquants' },
        { status: 400 }
      );
    }

    if (workspace.locked) {
      return NextResponse.json({ error: 'Workspace déjà verrouillé' }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Verrouiller le workspace
    const updatedWorkspace = await prisma.workspaceReasoning.update({
      where: { id: workspaceId },
      data: {
        locked: true,
        validatedBy: userId,
        validatedAt: new Date(),
        validationNote,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        facts: true,
        contexts: true,
        obligations: true,
        missingElements: true,
        risks: true,
        proposedActions: true,
        reasoningTraces: true,
        transitions: true,
      },
    });

    // Créer trace finale
    await prisma.reasoningTrace.create({
      data: {
        workspaceId,
        step: 'WORKSPACE_VALIDATED',
        explanation: 'Workspace validé et verrouillé par humain',
        metadata: JSON.stringify({
          validatedBy: userId,
          uncertaintyFinal: workspace.uncertaintyLevel,
          qualityFinal: workspace.reasoningQuality,
          summary: WorkspaceReasoningService.generateExecutiveSummary(workspace as any),
        }),
        createdBy: userId,
      },
    });

    return NextResponse.json({
      success: true,
      workspace: updatedWorkspace,
      message: 'Workspace validé et verrouillé',
    });
  } catch (error) {
    logger.error('Erreur validation workspace', error instanceof Error ? error : undefined, {
      route: '/api/workspace-reasoning/[id]/validate',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
