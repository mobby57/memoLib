import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Liste des délais légaux
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const dossierId = searchParams.get('dossierId');
    const status = searchParams.get('status');
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '50', 10));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    const where: Record<string, unknown> = { tenantId };
    if (dossierId) where.dossierId = dossierId;
    if (status) where.status = status;

    const [deadlines, total] = await Promise.all([
      prisma.legalDeadline.findMany({
        where,
        include: {
          dossier: { select: { numero: true, client: { select: { firstName: true, lastName: true } } } },
          alerts: { orderBy: { sentAt: 'desc' }, take: 3 },
        },
        orderBy: { dueDate: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.legalDeadline.count({ where }),
    ]);

    return NextResponse.json({ deadlines, total, hasMore: offset + deadlines.length < total });
  } catch (error) {
    console.error('Erreur GET legal-deadlines:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer un délai légal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      dossierId,
      clientId,
      type,
      label,
      description,
      referenceDate,
      legalDays,
      legalBasis,
      createdBy,
    } = body;

    if (!tenantId || !dossierId || !clientId || !type || !label || !referenceDate || !createdBy) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    const refDate = new Date(referenceDate);
    if (isNaN(refDate.getTime())) {
      return NextResponse.json({ error: 'Format referenceDate invalide' }, { status: 400 });
    }

    // Calcul de la date limite
    const dueDate = new Date(refDate);
    if (legalDays) {
      dueDate.setDate(dueDate.getDate() + legalDays);
    } else {
      // Délais par défaut selon le type
      const defaultDays: Record<string, number> = {
        RECOURS_GRACIEUX: 60,
        RECOURS_HIERARCHIQUE: 60,
        RECOURS_CONTENTIEUX: 60,
        APPEL: 30,
        CASSATION: 60,
        OQTF: 30,
      };
      dueDate.setDate(dueDate.getDate() + (defaultDays[type] || 30));
    }

    const deadline = await prisma.legalDeadline.create({
      data: {
        tenantId,
        dossierId,
        clientId,
        type,
        label,
        description,
        referenceDate: refDate,
        dueDate,
        legalDays: legalDays || null,
        legalBasis,
        createdBy,
      },
    });

    return NextResponse.json({ success: true, deadline });
  } catch (error) {
    console.error('Erreur POST legal-deadline:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Mettre à jour un délai
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { deadlineId, status, completedBy, completionNote, proofId } = body;

    if (!deadlineId) {
      return NextResponse.json({ error: 'deadlineId requis' }, { status: 400 });
    }

    const existing = await prisma.legalDeadline.findUnique({ where: { id: deadlineId } });
    if (!existing) {
      return NextResponse.json({ error: 'Délai non trouvé' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (completedBy) {
      updateData.completedBy = completedBy;
      updateData.completedAt = new Date();
    }
    if (completionNote) updateData.completionNote = completionNote;
    if (proofId) updateData.proofId = proofId;

    const deadline = await prisma.legalDeadline.update({
      where: { id: deadlineId },
      data: updateData,
    });

    return NextResponse.json({ success: true, deadline });
  } catch (error) {
    console.error('Erreur PATCH legal-deadline:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
