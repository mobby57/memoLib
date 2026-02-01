import { NextResponse } from 'next/server';
import { logger, LogCategory } from '@/lib/dev/advanced-logger';

/**
 * GET /api/dev/ai-stats - Statistiques IA
 */
export async function GET() {
  try {
    const aiMetrics = logger.getPerformanceMetrics('AI');
    const aiLogs = logger.getLogs({ category: LogCategory.AI, limit: 1000 });

    // Analyse des modeles utilises
    const modelCounts = aiLogs.reduce((acc: any, log: any) => {
      const model = log.context?.model || 'unknown';
      acc[model] = (acc[model] || 0) + 1;
      return acc;
    }, {});

    const models = Object.entries(modelCounts).map(([name, count]) => ({
      name,
      count,
    }));

    return NextResponse.json({
      ...aiMetrics,
      total: aiLogs.length,
      models,
      slowest: aiMetrics.slowestOperations.slice(0, 5),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur statistiques IA' },
      { status: 500 }
    );
  }
}
