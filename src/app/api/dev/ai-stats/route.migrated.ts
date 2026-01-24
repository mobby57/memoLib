import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { logger, LogCategory } from '@/lib/dev/advanced-logger';

async function handler() {
  try {
    const aiMetrics = logger.getPerformanceMetrics('AI');
    const aiLogs = logger.getLogs({ category: LogCategory.AI, limit: 1000 });

    // Analyse des modeles utilises
    const modelCounts = aiLogs.reduce((acc: any, log: any) => {
      const model = log.context?.model || 'unknown';
      acc[model] = (acc[model] || 0) + 1;
      return acc;
    }, {});

    const models = Object.entries(modelCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => (b.count as number) - (a.count as number));

    return NextResponse.json({
      ...aiMetrics,
      total: aiLogs.length,
      models,
      slowest: aiMetrics.slowestOperations?.slice(0, 5) || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Erreur statistiques IA', error);
    return NextResponse.json({ error: 'Erreur statistiques IA' }, { status: 500 });
  }
}

export const GET = withAuth(handler, ['SUPER_ADMIN']);
