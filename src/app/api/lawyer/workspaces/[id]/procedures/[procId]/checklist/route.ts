/**
 * API Route - Checklist Items d'une Procédure
 * PATCH /api/lawyer/workspaces/[id]/procedures/[procId]/checklist - Toggle checklist item
 */

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

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
    const { itemId, completed } = body;

    if (!itemId || completed === undefined) {
      return NextResponse.json({ error: 'itemId et completed requis' }, { status: 400 });
    }

    // Vérifier que la procédure existe et appartient au workspace
    const procedure = await prisma.procedure.findUnique({
      where: { id: params.procId },
    });

    if (!procedure) {
      return NextResponse.json({ error: 'Procédure non trouvée' }, { status: 404 });
    }

    if (procedure.workspaceId !== params.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Mettre à jour checklist item
    const checklistItem = await prisma.procedureChecklistItem.update({
      where: { id: itemId },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
        completedBy: completed ? user.id : null,
      },
    });

    // Créer événement timeline si complété
    if (completed) {
      await prisma.timelineEvent.create({
        data: {
          workspaceId: params.id,
          eventType: 'checklist_completed',
          title: 'Item checklist complété',
          description: checklistItem.label,
          actorType: 'user',
          actorId: user.id,
        },
      });
    }

    // Mettre à jour lastActivityDate workspace
    await prisma.workspace.update({
      where: { id: params.id },
      data: { lastActivityDate: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: completed ? 'Item complété' : 'Item décoché',
      checklistItem,
    });
  } catch (error) {
    logger.error('Erreur mise à jour checklist', error instanceof Error ? error : undefined, {
      route: '/api/lawyer/workspaces/[id]/procedures/[procId]/checklist',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
