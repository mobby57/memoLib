/**
 * API Cron pour vérifier les alertes de coûts
 * Appeler quotidiennement via Vercel Cron ou externe
 * 
 * Vercel Cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cost-alerts",
 *     "schedule": "0 8 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { runCostAlertCheck } from '@/lib/billing/cost-alerts';

// Clé secrète pour protéger le cron
const CRON_SECRET = process.env.CRON_SECRET || 'dev-cron-secret';

export async function GET(request: NextRequest) {
  // Vérifier l'autorisation
  const authHeader = request.headers.get('authorization');
  const cronHeader = request.headers.get('x-vercel-cron');
  
  // Autoriser si:
  // 1. Header Vercel Cron (appelé par Vercel)
  // 2. Authorization Bearer correct
  // 3. En développement local
  const isAuthorized = 
    cronHeader === '1' ||
    authHeader === `Bearer ${CRON_SECRET}` ||
    process.env.NODE_ENV === 'development';

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  try {
    console.log('[Cron Cost Alerts] Exécution...');
    
    const result = await runCostAlertCheck();

    return NextResponse.json({
      success: true,
      message: 'Check des alertes terminé',
      ...result,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron Cost Alerts] Erreur:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors du check des alertes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Permettre aussi POST pour les appels manuels
export async function POST(request: NextRequest) {
  return GET(request);
}
