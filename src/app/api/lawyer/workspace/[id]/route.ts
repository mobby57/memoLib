import { logger } from '@/lib/logger';
import { getSecurePrisma } from '@/lib/prisma';;
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/lawyer/workspace/[id]
 * RÃ©cupÃ¨re un workspace complet avec toutes ses relations
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getSecurePrisma();
  try {
    const session = await getServerSessionCompat();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;
    const workspaceId = params.id;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvÃ©' }, { status: 400 });
    }

    // RÃ©cupÃ©rer le workspace avec TOUTES ses relations
    const workspace = await prisma.workspaceReasoning.findFirst({
      where: {
        id: workspaceId,
        tenantId, // Isolation tenant stricte
      },
      include: {
        // Toutes les entitÃ©s du schÃ©ma canonique
        facts: {
          orderBy: { createdAt: 'desc' },
        },
        contexts: {
          orderBy: { createdAt: 'desc' },
        },
        obligations: {
          orderBy: { createdAt: 'desc' },
        },
        missingElements: {
          orderBy: { createdAt: 'desc' },
        },
        risks: {
          orderBy: { riskScore: 'desc' },
        },
        proposedActions: {
          orderBy: { createdAt: 'desc' },
        },
        reasoningTraces: {
          orderBy: { createdAt: 'asc' },
        },
        transitions: {
          orderBy: { triggeredAt: 'desc' },
          take: 20, // Limiter l'historique
        },
        // Relations mÃ©tier optionnelles
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        dossier: {
          select: {
            id: true,
            numero: true,
            typeDossier: true,
            statut: true,
          },
        },
        email: {
          select: {
            id: true,
            from: true,
            subject: true,
            receivedDate: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace non trouvÃ©' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      workspace,
    });
  } catch (error) {
    logger.error('Erreur rÃ©cupÃ©ration workspace', error instanceof Error ? error : undefined, {
      route: '/api/lawyer/workspace/[id]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * PATCH /api/lawyer/workspace/[id]
 * Mettre Ã  jour un workspace (lock, state, etc.)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getSecurePrisma();
  try {
    const session = await getServerSessionCompat();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;
    const userId = user.id;
    const workspaceId = params.id;

    // VÃ©rifier que le workspace appartient au tenant
    const existing = await prisma.workspaceReasoning.findFirst({
      where: { id: workspaceId, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Workspace non trouvÃ©' }, { status: 404 });
    }

    const body = await request.json();
    const { locked, currentState, uncertaintyLevel, procedureType } = body;

    const updateData: any = {};

    if (locked !== undefined) {
      updateData.locked = locked;
      if (locked) {
        updateData.completedAt = new Date();
      }
    }

    if (currentState && currentState !== existing.currentState) {
      updateData.currentState = currentState;
      updateData.stateChangedAt = new Date();
      updateData.stateChangedBy = userId;

      // CrÃ©er une transition
      await prisma.reasoningTransition.create({
        data: {
          workspaceId,
          fromState: existing.currentState,
          toState: currentState,
          triggeredBy: userId,
          reason: `Changement manuel d'Ã©tat`,
        },
      });
    }

    if (uncertaintyLevel !== undefined) {
      updateData.uncertaintyLevel = uncertaintyLevel;
    }

    if (procedureType !== undefined) {
      updateData.procedureType = procedureType;
    }

    // Mettre Ã  jour
    const updated = await prisma.workspaceReasoning.update({
      where: { id: workspaceId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      workspace: updated,
    });
  } catch (error) {
    logger.error('Erreur mise Ã  jour workspace', error instanceof Error ? error : undefined, {
      route: '/api/lawyer/workspace/[id]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/lawyer/workspace/[id]
 * Supprimer un workspace (soft delete via Prisma middleware)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getSecurePrisma();
  try {
    const session = await getServerSessionCompat();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;
    const workspaceId = params.id;

    // VÃ©rifier isolation tenant
    const existing = await prisma.workspaceReasoning.findFirst({
      where: { id: workspaceId, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Workspace non trouvÃ©' }, { status: 404 });
    }

    // Soft delete (gÃ©rÃ© par middleware Prisma)
    await prisma.workspaceReasoning.delete({
      where: { id: workspaceId },
    });

    return NextResponse.json({
      success: true,
      message: 'Workspace supprimÃ©',
    });
  } catch (error) {
    logger.error('Erreur suppression workspace', error instanceof Error ? error : undefined, {
      route: '/api/lawyer/workspace/[id]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

