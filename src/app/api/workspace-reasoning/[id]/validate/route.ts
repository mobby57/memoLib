/**
 * API Route: POST /api/workspace-reasoning/[id]/validate
 * Validation finale par l'humain (verrouille le workspace)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { WorkspaceReasoningService } from '@/lib/workspace-reasoning-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getSecurePrisma();
  try {
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const workspaceId = params.id;
    const body = await request.json();
    const { validationNote } = body;

    // RÃ©cupÃ©rer le workspace avec relations
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
      return NextResponse.json({ error: 'Workspace non trouvÃ©' }, { status: 404 });
    }

    const userTenantId = (session.user as any).tenantId;
    if (workspace.tenantId !== userTenantId) {
      return NextResponse.json({ error: 'AccÃ¨s refusÃ© - Isolation tenant' }, { status: 403 });
    }

    // VÃ©rifier que le workspace est prÃªt Ã  Ãªtre verrouillÃ©
    if (!WorkspaceReasoningService.canLockWorkspace(workspace as any)) {
      return NextResponse.json(
        { error: 'Workspace non prÃªt pour validation - RÃ©soudre les Ã©lÃ©ments bloquants' },
        { status: 400 }
      );
    }

    if (workspace.locked) {
      return NextResponse.json({ error: 'Workspace dÃ©jÃ  verrouillÃ©' }, { status: 400 });
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

    // CrÃ©er trace finale
    await prisma.reasoningTrace.create({
      data: {
        workspaceId,
        step: 'WORKSPACE_VALIDATED',
        explanation: 'Workspace validÃ© et verrouillÃ© par humain',
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
      message: 'Workspace validÃ© et verrouillÃ©',
    });
  } catch (error) {
    logger.error('Erreur validation workspace', error instanceof Error ? error : undefined, {
      route: '/api/workspace-reasoning/[id]/validate',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

