import { NextRequest, NextResponse } from 'next/server';
import { runIntakePurge } from '@/lib/cron/intake-purge';
import { logger } from '@/lib/logger';
import { requireCronSecret } from '@/lib/security/cron-auth';

export const dynamic = 'force-dynamic';

/**
 * Cron — purge RGPD des demandes d'intake expirées (rétention).
 * En production, l'accès exige CRON_SECRET (Bearer ou ?token=).
 * En développement uniquement, l'authentification est désactivée.
 *
 * Query params optionnels : ?days=365&dryRun=1
 */
async function handleCron(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      const authError = requireCronSecret(request);
      if (authError) return authError;
    }

    const daysParam = Number(request.nextUrl.searchParams.get('days'));
    const dryRun = request.nextUrl.searchParams.get('dryRun') === '1';

    const result = await runIntakePurge({
      ...(Number.isFinite(daysParam) && daysParam > 0 ? { retentionDays: daysParam } : {}),
      dryRun,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error('Erreur cron intake-purge', error instanceof Error ? error : undefined, {
      job: 'intake-purge',
    });
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

export const GET = handleCron;
export const POST = handleCron;
