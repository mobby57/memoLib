import { NextRequest, NextResponse } from 'next/server';
import { runMonitors } from '@/lib/workflows/monitors';

/**
 * 🔄 API Cron: Exécution périodique des moniteurs
 * 
 * À appeler toutes les 15 minutes via un cron job
 */

export async function GET(request: NextRequest) {
  try {
    // Vérifier le token de sécurité
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'dev-secret-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    console.log('⏰ Exécution cron: moniteurs de workflows');

    // Exécuter les moniteurs
    await runMonitors();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Moniteurs exécutés avec succès',
    });
  } catch (error) {
    console.error('Erreur exécution cron:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'exécution des moniteurs' },
      { status: 500 }
    );
  }
}
