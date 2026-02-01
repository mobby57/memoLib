import { NextRequest, NextResponse } from 'next/server';
import { runMonitors } from '@/lib/workflows/monitors';
import { logger } from '@/lib/logger';

/**
 *  API Cron: Execution periodique des moniteurs
 *
 * a appeler toutes les 15 minutes via un cron job
 */

export async function GET(request: NextRequest) {
  try {
    // Verifier le token de securite
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'dev-secret-token';

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    logger.info('Exécution cron: moniteurs de workflows', { job: 'workflows' });

    // Executer les moniteurs
    await runMonitors();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Moniteurs executes avec succes',
    });
  } catch (error) {
    logger.error('Erreur exécution cron workflows', error instanceof Error ? error : undefined, {
      job: 'workflows',
    });
    return NextResponse.json(
      { error: "Erreur lors de l'execution des moniteurs" },
      { status: 500 }
    );
  }
}
