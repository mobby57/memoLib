import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// GET - Liste des InformationUnits
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '50', 10));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    const where: Record<string, unknown> = { tenantId };
    if (status) where.currentStatus = status;
    if (source) where.source = source;

    const [units, total] = await Promise.all([
      prisma.informationUnit.findMany({
        where,
        include: {
          statusHistory: { orderBy: { changedAt: 'desc' }, take: 5 },
          proofs: { take: 3 },
        },
        orderBy: { receivedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.informationUnit.count({ where }),
    ]);

    return NextResponse.json({ units, total, hasMore: offset + units.length < total });
  } catch (error) {
    logger.error('Erreur GET information-units:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer une InformationUnit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, source, content, sourceMetadata, changedBy } = body;

    if (!tenantId || !source || !content || !changedBy) {
      return NextResponse.json(
        { error: 'tenantId, source, content et changedBy requis' },
        { status: 400 }
      );
    }

    const contentHash = crypto.createHash('sha256').update(content).digest('hex');

    const existing = await prisma.informationUnit.findUnique({
      where: { contentHash },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Information déjà enregistrée', unit: existing },
        { status: 409 }
      );
    }

    const unit = await prisma.informationUnit.create({
      data: {
        tenantId,
        source,
        content,
        contentHash,
        sourceMetadata: sourceMetadata ? JSON.stringify(sourceMetadata) : null,
        currentStatus: 'RECEIVED',
        lastStatusChangeBy: changedBy,
        lastStatusChangeAt: new Date(),
      },
    });

    await prisma.informationStatusHistory.create({
      data: {
        unitId: unit.id,
        toStatus: 'RECEIVED',
        changedBy,
        reason: 'Création initiale',
      },
    });

    return NextResponse.json({ success: true, unit });
  } catch (error) {
    logger.error('Erreur POST information-unit:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Mettre à jour le statut
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { unitId, newStatus, reason, changedBy, linkedWorkspaceId } = body;

    if (!unitId || !newStatus || !changedBy) {
      return NextResponse.json(
        { error: 'unitId, newStatus et changedBy requis' },
        { status: 400 }
      );
    }

    const unit = await prisma.informationUnit.findUnique({ where: { id: unitId } });
    if (!unit) {
      return NextResponse.json({ error: 'InformationUnit non trouvée' }, { status: 404 });
    }

    const [updatedUnit] = await prisma.$transaction([
      prisma.informationUnit.update({
        where: { id: unitId },
        data: {
          currentStatus: newStatus,
          lastStatusChangeBy: changedBy,
          lastStatusChangeAt: new Date(),
          ...(linkedWorkspaceId && { linkedWorkspaceId }),
          ...(newStatus === 'CLASSIFIED' && { classifiedAt: new Date() }),
          ...(newStatus === 'ANALYZED' && { analyzedAt: new Date() }),
          ...(newStatus === 'RESOLVED' && { resolvedAt: new Date() }),
          ...(newStatus === 'CLOSED' && { closedAt: new Date() }),
        },
      }),
      prisma.informationStatusHistory.create({
        data: {
          unitId,
          fromStatus: unit.currentStatus,
          toStatus: newStatus,
          reason,
          changedBy,
        },
      }),
    ]);

    return NextResponse.json({ success: true, unit: updatedUnit });
  } catch (error) {
    logger.error('Erreur PATCH information-unit:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
