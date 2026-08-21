import { NextRequest, NextResponse } from 'next/server';
import { checkDeadlineAlerts } from '@/lib/cron/deadline-alerts';
import { logger } from '@/lib/logger';

async function handleCron(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Vercel Cron envoie automatiquement le header si CRON_SECRET est défini
    // En dev, on accepte sans auth
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

    const result = await checkDeadlineAlerts();

    return NextResponse.json({
      success: true,
      message: 'Alertes vérifiées',
      stats: result,
    });
  } catch (error) {
    logger.error('Erreur cron deadline-alerts', error instanceof Error ? error : undefined, {
      job: 'deadline-alerts',
    });
    return NextResponse.json({ error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}

export const GET = handleCron;
export const POST = handleCron;
