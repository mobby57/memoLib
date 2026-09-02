import { auth } from '@/lib/clerk-auth';
/**
 * API Métriques de Performance
 *
 * Endpoint pour récupérer les métriques de performance du système
 * Utilisé par le dashboard monitoring et les alertes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceStats, collectMetric } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { z } from 'zod';

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
] as const;

const operationSchema = z.enum(operations);
const metricSchema = z
  .object({
    operation: operationSchema,
    duration: z.number().finite().min(0).max(600_000),
  })
  .strict();

async function requireMonitoringAdmin() {
  const { user } = await auth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authError = await requireMonitoringAdmin();
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const parsedOperation = operationSchema
      .optional()
      .safeParse(searchParams.get('operation') ?? undefined);
    if (!parsedOperation.success) {
      return NextResponse.json(
        { error: 'Invalid operation', details: parsedOperation.error.flatten() },
        { status: 400 }
      );
    }
    const operation = parsedOperation.data;

    // Si une opération spécifique est demandée
    if (operation) {
      const stats = getPerformanceStats(operation);
      return NextResponse.json({ operation, stats });
    }

    // Sinon, retourner les métriques globales
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
    const avgResponseTime =
      allStats.length > 0
        ? allStats.reduce((sum, s) => sum + s.mean * s.count, 0) / totalRequests
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
    logger.error('Metrics API GET failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireMonitoringAdmin();
    if (authError) {
      return authError;
    }

    const parsedMetric = metricSchema.safeParse(await request.json());
    if (!parsedMetric.success) {
      return NextResponse.json(
        { error: 'Invalid metric', details: parsedMetric.error.flatten() },
        { status: 400 }
      );
    }

    const { operation, duration } = parsedMetric.data;
    collectMetric(operation, duration);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Metrics API POST failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
