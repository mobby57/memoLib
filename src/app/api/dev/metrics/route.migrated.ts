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
    logger.error('Erreur récupération métriques', error);
    return NextResponse.json({ error: 'Erreur récupération métriques' }, { status: 500 });
  }
}

export const GET = withAuth(handler, ['SUPER_ADMIN']);
