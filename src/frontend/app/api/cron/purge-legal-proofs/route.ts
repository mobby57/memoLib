/**
 * API Route CRON - Purge Automatique Preuves Légales
 *
 * Exécuté mensuellement via Vercel Cron Jobs
 * Supprime preuves > 10 ans (sauf contentieux)
 *
 * Sécurité: Requiert token CRON_SECRET
 *
 * @route GET /api/cron/purge-legal-proofs
 */

import { getLegalProofRetentionStats, purgeLegalProofs } from '@/lib/cron/legal-proof-purge';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max (Vercel Pro)

/**
 * Purge CRON - Exécution mensuelle
 *
 * @example
 * ```bash
 * # Test local
 * curl -H "Authorization: Bearer your_secret" \
 *   http://localhost:3000/api/cron/purge-legal-proofs
 *
 * # Production (Vercel Cron automatic)
 * # Schedule: "0 2 1 * *" (1er du mois à 2h)
 * ```
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Sécurité: Vérifier token Vercel Cron
    const authHeader = req.headers.get('authorization');
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error('[CRON] CRON_SECRET non configuré');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    if (authHeader !== expectedToken) {
      console.warn('[CRON] Tentative accès non autorisée');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Purge Legal Proofs - Démarrage');

    // 2. Statistiques pré-purge
    const statsBefore = await getLegalProofRetentionStats();
    console.log('[CRON] Stats avant purge:', statsBefore);

    // 3. Exécuter purge (production)
    const purgeResult = await purgeLegalProofs({
      dryRun: false,
      archiveBeforeDelete: true,
      ignoreActiveContentieux: true,
      retentionYears: 10,
    });

    // 4. Statistiques post-purge
    const statsAfter = await getLegalProofRetentionStats();
    console.log('[CRON] Stats après purge:', statsAfter);

    // 5. Résultat
    const executionTime = Date.now() - startTime;
    const response = {
      success: true,
      purgeResult,
      statsBefore,
      statsAfter,
      executionTime,
      timestamp: new Date().toISOString(),
    };

    console.log(
      `[CRON] Purge terminée: ${purgeResult.deleted} preuves supprimées en ${executionTime}ms`
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);

    console.error('[CRON] Erreur purge:', message);
    console.error('[CRON] Stack:', error instanceof Error ? error.stack : 'N/A');

    // Sentry reporting (si configuré)
    if (typeof window === 'undefined' && global.Sentry) {
      global.Sentry.captureException(error, {
        tags: {
          cron: 'purge-legal-proofs',
        },
        extra: {
          executionTime,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
        executionTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint de test (dry-run)
 * Permet de simuler la purge sans suppression réelle
 *
 * @example
 * ```bash
 * curl -H "Authorization: Bearer your_secret" \
 *   -X POST \
 *   http://localhost:3000/api/cron/purge-legal-proofs
 * ```
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier auth
    const authHeader = req.headers.get('authorization');
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Purge Legal Proofs - DRY RUN');

    // Statistiques actuelles
    const stats = await getLegalProofRetentionStats();

    // Dry run
    const purgeResult = await purgeLegalProofs({
      dryRun: true,
      archiveBeforeDelete: true,
      ignoreActiveContentieux: true,
      retentionYears: 10,
    });

    return NextResponse.json({
      success: true,
      dryRun: true,
      stats,
      purgeResult,
      message: `${purgeResult.totalExpired} preuves seraient supprimées (${purgeResult.ignored} ignorées)`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[CRON] Erreur dry-run:', message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
