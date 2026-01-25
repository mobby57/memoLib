import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { logger } from '@/lib/dev/advanced-logger';

async function handler() {
  try {
    const metrics = logger.getPerformanceMetrics();
    
    return NextResponse.json({
      ...metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Erreur recuperation metriques', error);
    return NextResponse.json({ error: 'Erreur recuperation metriques' }, { status: 500 });
  }
}

export const GET = withAuth(handler, ['SUPER_ADMIN']);
