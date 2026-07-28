import { NextRequest, NextResponse } from 'next/server';
import { runEscalation } from '@/lib/cron/escalation.service';
import { logger } from '@/lib/logger';

async function handleCron(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const token = request.nextUrl.searchParams.get('token');

  if (!cronSecret && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }
  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && token !== cronSecret) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const result = await runEscalation();
    return NextResponse.json({ success: true, stats: result });
  } catch (error) {
    logger.error('Erreur cron escalation', error instanceof Error ? error : undefined, { job: 'escalation' });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export const GET = handleCron;
export const POST = handleCron;
