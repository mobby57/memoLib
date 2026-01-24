import { NextRequest, NextResponse } from 'next/server';
import { runMonitors } from '@/lib/workflows/monitors';

/**
 * [emoji] API Cron: Execution periodique des moniteurs
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

    console.log(' Execution cron: moniteurs de workflows');

    // Executer les moniteurs
    await runMonitors();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Moniteurs executes avec succes',
    });
  } catch (error) {
    console.error('Erreur execution cron:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'execution des moniteurs' },
      { status: 500 }
    );
  }
}
