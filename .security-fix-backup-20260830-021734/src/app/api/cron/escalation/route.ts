import { NextRequest, NextResponse } from 'next/server';
import { runEscalation } from '@/lib/cron/escalation.service';
import { logger } from '@/lib/logger';

async function handleCron(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const token = request.nextUrl.searchParams.get('token');
  const vercelCronHeader = request.headers.get('x-vercel-cron');

  if (process.env.NODE_ENV !== 'development') {
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 503 });
    }
    if (authHeader !== `Bearer ${cronSecret}` && token !== cronSecret && !vercelCronHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  try {
    const result = await runEscalation();
    return NextResponse.json({ success: true, stats: result });
  } catch (error) {
    logger.error('Erreur cron escalation', error instanceof Error ? error : undefined, { job: 'escalation' });
    return NextResponse.json({ error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}

export const GET = handleCron;
export const POST = handleCron;
