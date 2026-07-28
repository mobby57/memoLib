import { NextRequest, NextResponse } from 'next/server';
import { checkDeadlineAlerts } from '@/lib/cron/deadline-alerts';
import { logger } from '@/lib/logger';

async function handleCron(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
    }

    const token = request.nextUrl.searchParams.get('token');
    if (!cronSecret || (authHeader !== `Bearer ${cronSecret}` && token !== cronSecret)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
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
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export const GET = handleCron;
export const POST = handleCron;
