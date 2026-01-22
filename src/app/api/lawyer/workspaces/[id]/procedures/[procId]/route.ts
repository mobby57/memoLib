/**
 * API Route - Procédure Individuelle
 * GET /api/lawyer/workspaces/[id]/procedures/[procId] - Détails procédure
 * PATCH /api/lawyer/workspaces/[id]/procedures/[procId] - Modifier procédure
 * DELETE /api/lawyer/workspaces/[id]/procedures/[procId] - Supprimer procédure
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; procId: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
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
      return NextResponse.json({ error: 'Procédure non trouvée' }, { status: 404 });
    }

    if (procedure.workspaceId !== params.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      procedure,
    });

  } catch (error) {
    console.error('Erreur récupération procédure:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; procId: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;
    const body = await request.json();

    // Vérifier que la procédure existe et appartient au workspace
    const existing = await prisma.procedure.findUnique({
      where: { id: params.procId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Procédure non trouvée' }, { status: 404 });
    }

    if (existing.workspaceId !== params.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Construire données de mise à jour
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
        // Créer événement timeline
        await prisma.timelineEvent.create({
          data: {
            workspaceId: params.id,
            eventType: 'status_changed',
            title: `Statut procédure modifié`,
            description: `${existing.status} → ${body.status}`,
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

    // Toujours mettre à jour updatedAt
    updateData.updatedAt = new Date();

    // Mettre à jour procédure
    const procedure = await prisma.procedure.update({
      where: { id: params.procId },
      data: updateData,
      include: {
        checklist: true,
        echeances: true,
      },
    });

    // Mettre à jour lastActivityDate workspace
    await prisma.workspace.update({
      where: { id: params.id },
      data: { lastActivityDate: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Procédure mise à jour',
      procedure,
    });

  } catch (error) {
    console.error('Erreur mise à jour procédure:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; procId: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;

    // Vérifier que la procédure existe et appartient au workspace
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
      return NextResponse.json({ error: 'Procédure non trouvée' }, { status: 404 });
    }

    if (procedure.workspaceId !== params.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Supprimer en cascade (Prisma devrait gérer automatiquement avec onDelete: Cascade)
    await prisma.procedure.delete({
      where: { id: params.procId },
    });

    // Créer événement timeline
    await prisma.timelineEvent.create({
      data: {
        workspaceId: params.id,
        eventType: 'procedure_deleted',
        title: `Procédure ${procedure.procedureType} supprimée`,
        description: procedure.title,
        actorType: 'user',
        actorId: user.id,
      },
    });

    // Mettre à jour stats workspace
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
      message: 'Procédure supprimée',
    });

  } catch (error) {
    console.error('Erreur suppression procédure:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
