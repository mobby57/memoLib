import { NextResponse } from 'next/server';
import { logger } from '@/lib/dev/advanced-logger';

/**
 * GET /api/dev/metrics - Récupère les métriques de performance
 */
export async function GET() {
  try {
    const metrics = logger.getPerformanceMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur récupération métriques' },
      { status: 500 }
    );
  }
}
