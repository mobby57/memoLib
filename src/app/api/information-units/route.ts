import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';

async function resolveTenantAccess(requestedTenantId: string | null): Promise<
  | { tenantId: string; role: string; userId: string }
  | { error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Non authentifie' }, { status: 401 }) };
  }

  const role = String((session.user as any).role || '').toUpperCase();
  const sessionTenantId = (session.user as any).tenantId as string | undefined;
  const userId = String((session.user as any).id || '');

  if (role === 'SUPER_ADMIN') {
    if (!requestedTenantId) {
      return { error: NextResponse.json({ error: 'tenantId requis' }, { status: 400 }) };
    }
    return { tenantId: requestedTenantId, role, userId };
  }

  if (!sessionTenantId) {
    return { error: NextResponse.json({ error: 'Tenant non trouve' }, { status: 403 }) };
  }

  if (requestedTenantId && requestedTenantId !== sessionTenantId) {
    return { error: NextResponse.json({ error: 'Acces interdit' }, { status: 403 }) };
  }

  return { tenantId: sessionTenantId, role, userId };
}

// GET - Liste des InformationUnits
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '50', 10));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const access = await resolveTenantAccess(requestedTenantId);
    if ('error' in access) {
      return access.error;
    }

    const tenantId = access.tenantId;

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
    const { tenantId, source, content, sourceMetadata } = body;

    const access = await resolveTenantAccess((tenantId as string | null) || null);
    if ('error' in access) {
      return access.error;
    }

    const effectiveTenantId = access.tenantId;
    const effectiveChangedBy = access.userId;

    if (!source || !content) {
      return NextResponse.json(
        { error: 'source et content requis' },
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
        tenantId: effectiveTenantId,
        source,
        content,
        contentHash,
        sourceMetadata: sourceMetadata ? JSON.stringify(sourceMetadata) : null,
        currentStatus: 'RECEIVED',
        lastStatusChangeBy: effectiveChangedBy,
        lastStatusChangeAt: new Date(),
      },
    });

    await prisma.informationStatusHistory.create({
      data: {
        unitId: unit.id,
        toStatus: 'RECEIVED',
        changedBy: effectiveChangedBy,
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
    const { unitId, newStatus, reason, linkedWorkspaceId } = body;

    if (!unitId || !newStatus) {
      return NextResponse.json(
        { error: 'unitId et newStatus requis' },
        { status: 400 }
      );
    }

    const unit = await prisma.informationUnit.findUnique({ where: { id: unitId } });
    if (!unit) {
      return NextResponse.json({ error: 'InformationUnit non trouvée' }, { status: 404 });
    }

    const access = await resolveTenantAccess(unit.tenantId);
    if ('error' in access) {
      return access.error;
    }

    const effectiveChangedBy = access.userId;

    const [updatedUnit] = await prisma.$transaction([
      prisma.informationUnit.update({
        where: { id: unitId },
        data: {
          currentStatus: newStatus,
          lastStatusChangeBy: effectiveChangedBy,
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
          changedBy: effectiveChangedBy,
        },
      }),
    ]);

    return NextResponse.json({ success: true, unit: updatedUnit });
  } catch (error) {
    logger.error('Erreur PATCH information-unit:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
