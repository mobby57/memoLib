import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger, LogCategory } from '@/lib/dev/advanced-logger';

async function ensureAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }

  const role = String((session.user as any).role || '').toUpperCase();
  const allowedRoles = new Set(['ADMIN', 'SUPER_ADMIN']);
  if (!allowedRoles.has(role)) {
    return NextResponse.json({ error: 'Acces interdit' }, { status: 403 });
  }

  return null;
}

/**
 * GET /api/dev/ai-stats - Statistiques IA
 */
export async function GET() {
  try {
    const authError = await ensureAdminAccess();
    if (authError) {
      return authError;
    }

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
