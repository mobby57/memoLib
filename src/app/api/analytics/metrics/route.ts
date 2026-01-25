/**
 * API Métriques de Performance
 * 
 * Endpoint pour récupérer les métriques de performance du système
 * Utilisé par le dashboard monitoring et les alertes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getPerformanceStats, collectMetric } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    // Auth check - admin only
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !['ADMIN', 'SUPER_ADMIN', 'AVOCAT'].includes(token.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');

    // Si une opération spécifique est demandée
    if (operation) {
      const stats = getPerformanceStats(operation);
      return NextResponse.json({ operation, stats });
    }

    // Sinon, retourner les métriques globales
    const operations = [
      'api.clients.get',
      'api.clients.list',
      'api.dossiers.get',
      'api.dossiers.list',
      'api.ai.chat',
      'api.ai.suggestions',
      'db.query',
      'cache.hit',
      'cache.miss',
    ];

    const metrics: Record<string, ReturnType<typeof getPerformanceStats>> = {};
    for (const op of operations) {
      const stats = getPerformanceStats(op);
      if (stats.count > 0) {
        metrics[op] = stats;
      }
    }

    // Calculer les métriques globales
    const allStats = Object.values(metrics);
    const totalRequests = allStats.reduce((sum, s) => sum + s.count, 0);
    const avgResponseTime = allStats.length > 0
      ? allStats.reduce((sum, s) => sum + (s.mean * s.count), 0) / totalRequests
      : 0;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      summary: {
        totalRequests,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        operationsTracked: Object.keys(metrics).length,
      },
      operations: metrics,
      health: {
        status: avgResponseTime < 200 ? 'good' : avgResponseTime < 500 ? 'degraded' : 'critical',
        threshold: { good: 200, degraded: 500 },
      },
    });
  } catch (error) {
    console.error('[Metrics API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST pour enregistrer une métrique manuellement (pour les clients JS)
export async function POST(request: NextRequest) {
  try {
    const { operation, duration, metadata } = await request.json();

    if (!operation || typeof duration !== 'number') {
      return NextResponse.json(
        { error: 'operation and duration required' },
        { status: 400 }
      );
    }

    collectMetric(operation, duration, metadata);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Metrics API] POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
