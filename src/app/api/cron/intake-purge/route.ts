import { NextRequest, NextResponse } from 'next/server';
import { runIntakePurge } from '@/lib/cron/intake-purge';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Cron — purge RGPD des demandes d'intake expirées (rétention).
 * Sécurisé par CRON_SECRET (Bearer / token / header Vercel), comme les autres crons.
 *
 * Query params optionnels : ?days=365&dryRun=1
 */
async function handleCron(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === 'development') {
      // OK, pas d'auth en dev
    } else if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 503 });
    } else {
      const token = request.nextUrl.searchParams.get('token');
      const vercelCronHeader = request.headers.get('x-vercel-cron');
      if (authHeader !== `Bearer ${cronSecret}` && token !== cronSecret && !vercelCronHeader) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      }
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
