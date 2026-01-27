import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// GET - Liste des logs d'audit
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '100', 10));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

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

    if (!tenantId || !userId || !userEmail || !userRole || !action || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Récupérer le dernier log pour la chaîne
    const lastLog = await prisma.auditLog.findFirst({
      where: { tenantId },
      orderBy: { timestamp: 'desc' },
      select: { id: true, timestampHash: true },
    });

    // Calcul du hash cryptographique
    const timestamp = new Date();
    const hashData = `${action}|${entityType}|${entityId}|${timestamp.toISOString()}|${lastLog?.timestampHash || ''}`;
    const timestampHash = crypto.createHash('sha256').update(hashData).digest('hex');

    const log = await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        userEmail,
        userRole,
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
