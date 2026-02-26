/**
 * API Route - Procédures Workspace
 * GET /api/lawyer/workspaces/[id]/procedures - Liste procédures
 * POST /api/lawyer/workspaces/[id]/procedures - Créer nouvelle procédure
 */

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const procedures = await prisma.procedure.findMany({
      where: { workspaceId: params.id },
      include: {
        checklist: true,
        documents: true,
        echeances: {
          where: { completed: false },
          orderBy: { date: 'asc' },
        },
        documentDrafts: {
          where: { status: { in: ['DRAFT', 'READY_TO_SEND'] } },
        },
      },
      orderBy: [{ urgencyLevel: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      procedures,
      count: procedures.length,
    });
  } catch (error) {
    logger.error('Erreur récupération procédures', error instanceof Error ? error : undefined, {
      route: '/api/lawyer/workspaces/[id]/procedures',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;
    const body = await request.json();

    // Validation
    if (!body.procedureType || !body.title) {
      return NextResponse.json({ error: 'procedureType et title requis' }, { status: 400 });
    }

    // Créer procédure
    const procedure = await prisma.procedure.create({
      data: {
        workspaceId: params.id,
        procedureType: body.procedureType,
        title: body.title,
        description: body.description,
        reference: body.reference || `${body.procedureType}-${Date.now()}`,
        status: body.status || 'active',
        urgencyLevel: body.urgencyLevel || 'moyen',
        notificationDate: body.notificationDate ? new Date(body.notificationDate) : undefined,
        deadlineDate: body.deadlineDate ? new Date(body.deadlineDate) : undefined,
        assignedToId: body.assignedToId || user.id,
        metadata: body.metadata ? JSON.stringify(body.metadata) : undefined,
      },
      include: {
        checklist: true,
        echeances: true,
      },
    });

    // Créer événement timeline
    await prisma.timelineEvent.create({
      data: {
        workspaceId: params.id,
        eventType: 'procedure_created',
        title: `Procédure ${procedure.procedureType} créée`,
        description: procedure.title,
        actorType: 'user',
        actorId: user.id,
      },
    });

    // Mettre à jour stats workspace
    await prisma.workspace.update({
      where: { id: params.id },
      data: {
        totalProcedures: { increment: 1 },
        activeProcedures: procedure.status === 'active' ? { increment: 1 } : undefined,
        lastActivityDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      procedure,
    });
  } catch (error) {
    logger.error('Erreur création procédure', error instanceof Error ? error : undefined, {
      route: '/api/lawyer/workspaces/[id]/procedures',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
