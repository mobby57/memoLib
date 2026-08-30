import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';

async function resolveTenantAccess(requestedTenantId: string | null): Promise<
  | { tenantId: string; role: string; userId: string; userEmail: string }
  | { error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Non authentifie' }, { status: 401 }) };
  }

  const role = String((session.user as any).role || '').toUpperCase();
  const sessionTenantId = (session.user as any).tenantId as string | undefined;
  const userId = String((session.user as any).id || '');
  const userEmail = String((session.user as any).email || '');

  if (role === 'SUPER_ADMIN') {
    if (!requestedTenantId) {
      return { error: NextResponse.json({ error: 'tenantId requis' }, { status: 400 }) };
    }
    return { tenantId: requestedTenantId, role, userId, userEmail };
  }

  if (!sessionTenantId) {
    return { error: NextResponse.json({ error: 'Tenant non trouve' }, { status: 403 }) };
  }

  if (requestedTenantId && requestedTenantId !== sessionTenantId) {
    return { error: NextResponse.json({ error: 'Acces interdit' }, { status: 403 }) };
  }

  return { tenantId: sessionTenantId, role, userId, userEmail };
}

// GET - Liste des logs d'audit
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get('tenantId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '100', 10));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const access = await resolveTenantAccess(requestedTenantId);
    if ('error' in access) {
      return access.error;
    }

    const allowedReadRoles = new Set(['ADMIN', 'SUPER_ADMIN', 'LAWYER']);
    if (!allowedReadRoles.has(access.role)) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 });
    }

    const tenantId = access.tenantId;

    const where: Record<string, unknown> = { tenantId };
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) (where.timestamp as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.timestamp as Record<string, unknown>).lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, hasMore: offset + logs.length < total });
  } catch (error) {
    logger.error('Erreur GET audit-logs:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer un log d'audit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      userId,
      userEmail,
      userRole,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
    } = body;

    if (!tenantId || !action || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    const access = await resolveTenantAccess(tenantId);
    if ('error' in access) {
      return access.error;
    }

    const effectiveTenantId = access.tenantId;
    const effectiveUserId = access.userId;
    const effectiveUserEmail = access.userEmail;
    const effectiveRole = access.role;

    // Récupérer le dernier log pour la chaîne
    const lastLog = await prisma.auditLog.findFirst({
      where: { tenantId: effectiveTenantId },
      orderBy: { timestamp: 'desc' },
      select: { id: true, timestampHash: true },
    });

    // Calcul du hash cryptographique
    const timestamp = new Date();
    const hashData = `${action}|${entityType}|${entityId}|${timestamp.toISOString()}|${lastLog?.timestampHash || ''}`;
    const timestampHash = crypto.createHash('sha256').update(hashData).digest('hex');

    const log = await prisma.auditLog.create({
      data: {
        tenantId: effectiveTenantId,
        userId: effectiveUserId,
        userEmail: effectiveUserEmail,
        userRole: effectiveRole,
        action,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ipAddress,
        userAgent,
        timestamp,
        timestampHash,
        previousLogId: lastLog?.id || null,
      },
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    logger.error('Erreur POST audit-log:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Interdit (logs immuables)
export async function PATCH() {
  return NextResponse.json(
    { error: 'Les logs d\'audit sont immuables' },
    { status: 403 }
  );
}

// DELETE - Interdit (logs immuables)
export async function DELETE() {
  return NextResponse.json(
    { error: 'Les logs d\'audit sont immuables' },
    { status: 403 }
  );
}
