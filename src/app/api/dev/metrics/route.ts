import { NextResponse } from 'next/server';
import { logger } from '@/lib/dev/advanced-logger';

/**
 * GET /api/dev/metrics - Recupere les metriques de performance
 */
export async function GET() {
  try {
    const metrics = logger.getPerformanceMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur recuperation metriques' },
      { status: 500 }
    );
  }
}
