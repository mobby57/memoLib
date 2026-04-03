import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-session';
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
 * GET /api/dev/workflow-stats - Statistiques workflows
 */
export async function GET() {
  try {
    const authError = await ensureAdminAccess();
    if (authError) {
      return authError;
    }

    const workflowLogs = logger.getLogs({ category: LogCategory.WORKFLOW, limit: 1000 });

    const active = workflowLogs.filter((log: any) =>
      log.message.includes('started')
    ).length;

    const completed = workflowLogs.filter((log: any) =>
      log.message.includes('completed')
    ).length;

    const failed = workflowLogs.filter((log: any) =>
      log.message.includes('failed')
    ).length;

    const pending = active - (completed + failed);

    // Stats par type de workflow
    const byType = workflowLogs.reduce((acc: any, log: any) => {
      const workflowId = log.context?.workflowId || 'unknown';
      if (!acc[workflowId]) {
        acc[workflowId] = { count: 0, success: 0, failed: 0 };
      }
      acc[workflowId].count++;
      if (log.message.includes('completed')) acc[workflowId].success++;
      if (log.message.includes('failed')) acc[workflowId].failed++;
      return acc;
    }, {});

    const byTypeArray = Object.entries(byType).map(([name, stats]: [string, any]) => ({
      name,
      count: stats.count,
      successRate: (stats.success / stats.count) * 100,
    }));

    const successRate = completed > 0 ? (completed / (completed + failed)) * 100 : 0;

    return NextResponse.json({
      active,
      completed,
      failed,
      pending,
      successRate,
      byType: byTypeArray,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur statistiques workflows' },
      { status: 500 }
    );
  }
}
