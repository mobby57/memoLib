/**
 * API Route - ProcÃ©dure Individuelle
 * GET /api/lawyer/workspaces/[id]/procedures/[procId] - DÃ©tails procÃ©dure
 * PATCH /api/lawyer/workspaces/[id]/procedures/[procId] - Modifier procÃ©dure
 * DELETE /api/lawyer/workspaces/[id]/procedures/[procId] - Supprimer procÃ©dure
 */

import { logger } from '@/lib/logger';
import { getSecurePrisma } from '@/lib/prisma';;
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; procId: string } }
) {
  const prisma = await getSecurePrisma();
  try {
    const session: any = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const procedure = await prisma.procedure.findUnique({
      where: { id: params.procId },
      include: {
        workspace: {
          select: {
            id: true,
            title: true,
            clientId: true,
            client: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        checklist: {
          orderBy: { order: 'asc' },
        },
        documents: {
          orderBy: { displayOrder: 'asc' },
        },
        documentDrafts: {
          orderBy: { createdAt: 'desc' },
        },
        echeances: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!procedure) {
      return NextResponse.json({ error: 'ProcÃ©dure non trouvÃ©e' }, { status: 404 });
    }

    if (procedure.workspaceId !== params.id) {
      return NextResponse.json({ error: 'AccÃ¨s refusÃ©' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      procedure,
    });
  } catch (error) {
    logger.error('Erreur rÃ©cupÃ©ration procÃ©dure', error instanceof Error ? error : undefined, {
      route: '/api/lawyer/workspaces/[id]/procedures/[procId]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; procId: string } }
) {
  const prisma = await getSecurePrisma();
  try {
    const session: any = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const user = session.user as any;
    const body = await request.json();

    // VÃ©rifier que la procÃ©dure existe et appartient au workspace
    const existing = await prisma.procedure.findUnique({
      where: { id: params.procId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ProcÃ©dure non trouvÃ©e' }, { status: 404 });
    }

    if (existing.workspaceId !== params.id) {
      return NextResponse.json({ error: 'AccÃ¨s refusÃ©' }, { status: 403 });
    }

    // Construire donnÃ©es de mise Ã  jour
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.reference !== undefined) updateData.reference = body.reference;
    if (body.status !== undefined) {
      updateData.status = body.status;
      // Si changement de statut
      if (body.status !== existing.status) {
        if (body.status === 'closed') {
          updateData.closedAt = new Date();
        }
        // CrÃ©er Ã©vÃ©nement timeline
        await prisma.timelineEvent.create({
          data: {
            workspaceId: params.id,
            eventType: 'status_changed',
            title: `Statut procÃ©dure modifiÃ©`,
            description: `${existing.status} â†’ ${body.status}`,
            actorType: 'user',
            actorId: user.id,
          },
        });
      }
    }

    if (body.urgencyLevel !== undefined) updateData.urgencyLevel = body.urgencyLevel;
    if (body.notificationDate !== undefined) {
      updateData.notificationDate = body.notificationDate ? new Date(body.notificationDate) : null;
    }
    if (body.deadlineDate !== undefined) {
      updateData.deadlineDate = body.deadlineDate ? new Date(body.deadlineDate) : null;
    }
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId;
    if (body.metadata !== undefined) {
      updateData.metadata = body.metadata ? JSON.stringify(body.metadata) : null;
    }
    if (body.outcome !== undefined) updateData.outcome = body.outcome;
    if (body.outcomeNotes !== undefined) updateData.outcomeNotes = body.outcomeNotes;

    // Toujours mettre Ã  jour updatedAt
    updateData.updatedAt = new Date();

    // Mettre Ã  jour procÃ©dure
    const procedure = await prisma.procedure.update({
      where: { id: params.procId },
      data: updateData,
      include: {
        checklist: true,
        echeances: true,
      },
    });

    // Mettre Ã  jour lastActivityDate workspace
    await prisma.workspace.update({
      where: { id: params.id },
      data: { lastActivityDate: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'ProcÃ©dure mise Ã  jour',
      procedure,
    });
  } catch (error) {
    logger.error('Erreur mise Ã  jour procÃ©dure', error instanceof Error ? error : undefined, {
      route: '/api/lawyer/workspaces/[id]/procedures/[procId]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; procId: string } }
) {
  const prisma = await getSecurePrisma();
  try {
    const session: any = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const user = session.user as any;

    // VÃ©rifier que la procÃ©dure existe et appartient au workspace
    const procedure = await prisma.procedure.findUnique({
      where: { id: params.procId },
      include: {
        checklist: true,
        documents: true,
        echeances: true,
        documentDrafts: true,
      },
    });

    if (!procedure) {
      return NextResponse.json({ error: 'ProcÃ©dure non trouvÃ©e' }, { status: 404 });
    }

    if (procedure.workspaceId !== params.id) {
      return NextResponse.json({ error: 'AccÃ¨s refusÃ©' }, { status: 403 });
    }

    // Supprimer en cascade (Prisma devrait gÃ©rer automatiquement avec onDelete: Cascade)
    await prisma.procedure.delete({
      where: { id: params.procId },
    });

    // CrÃ©er Ã©vÃ©nement timeline
    await prisma.timelineEvent.create({
      data: {
        workspaceId: params.id,
        eventType: 'procedure_deleted',
        title: `ProcÃ©dure ${procedure.procedureType} supprimÃ©e`,
        description: procedure.title,
        actorType: 'user',
        actorId: user.id,
      },
    });

    // Mettre Ã  jour stats workspace
    await prisma.workspace.update({
      where: { id: params.id },
      data: {
        totalProcedures: { decrement: 1 },
        activeProcedures: procedure.status === 'active' ? { decrement: 1 } : undefined,
        lastActivityDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ProcÃ©dure supprimÃ©e',
    });
  } catch (error) {
    logger.error('Erreur suppression procÃ©dure', error instanceof Error ? error : undefined, {
      route: '/api/lawyer/workspaces/[id]/procedures/[procId]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

