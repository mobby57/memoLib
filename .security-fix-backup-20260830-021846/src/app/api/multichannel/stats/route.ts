/**
 * API Stats Multi-Canal
 * Statistiques et analytics pour tous les canaux
 */

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/multichannel/stats
 * Récupérer les statistiques multi-canal
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    if (!tenantId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 403 });
    }

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '7d';

    // Calculer les dates
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    // Stats par canal
    const channelStats = await prisma.channelMessage.groupBy({
      by: ['channel'],
      where: {
        tenantId,
        receivedAt: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
    });

    // Stats par statut
    const statusStats = await prisma.channelMessage.groupBy({
      by: ['status'],
      where: {
        tenantId,
        receivedAt: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
    });

    // Stats par urgence
    const urgencyStats = await prisma.channelMessage.groupBy({
      by: ['aiUrgency'],
      where: {
        tenantId,
        receivedAt: { gte: startDate, lte: endDate },
        aiUrgency: { not: null },
      },
      _count: { id: true },
    });

    // Messages par jour
    const dailyStats = await prisma.$queryRaw`
      SELECT
        DATE(received_at) as date,
        channel,
        COUNT(*) as count
      FROM channel_messages
      WHERE tenant_id = ${tenantId}
        AND received_at >= ${startDate}
        AND received_at <= ${endDate}
      GROUP BY DATE(received_at), channel
      ORDER BY date
    `;

    // Temps de traitement moyen
    const processingTimeStats = await prisma.channelMessage.aggregate({
      where: {
        tenantId,
        receivedAt: { gte: startDate, lte: endDate },
        processedAt: { not: null },
      },
      _avg: {
        // Calculer via raw query si nécessaire
      },
    });

    // Top clients
    const topClients = await prisma.channelMessage.groupBy({
      by: ['clientId'],
      where: {
        tenantId,
        receivedAt: { gte: startDate, lte: endDate },
        clientId: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Messages non traités
    const pendingMessages = await prisma.channelMessage.count({
      where: {
        tenantId,
        status: { in: ['RECEIVED', 'PROCESSING'] },
      },
    });

    // Messages urgents
    const urgentMessages = await prisma.channelMessage.count({
      where: {
        tenantId,
        aiUrgency: { in: ['HIGH', 'CRITICAL'] },
        status: { not: 'ARCHIVED' },
      },
    });

    return NextResponse.json({
      success: true,
      period,
      startDate,
      endDate,
      stats: {
        byChannel: channelStats.map(s => ({
          channel: s.channel,
          count: s._count.id,
        })),
        byStatus: statusStats.map(s => ({
          status: s.status,
          count: s._count.id,
        })),
        byUrgency: urgencyStats.map(s => ({
          urgency: s.aiUrgency,
          count: s._count.id,
        })),
        daily: dailyStats,
        topClients: topClients.map(c => ({
          clientId: c.clientId,
          messageCount: c._count.id,
        })),
        pendingMessages,
        urgentMessages,
        totalMessages: channelStats.reduce((acc, s) => acc + s._count.id, 0),
      },
    });
  } catch (error) {
    logger.error('Erreur stats multi-canal', error instanceof Error ? error : undefined, {
      route: '/api/multichannel/stats',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
