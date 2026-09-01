// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement import getServerSession
/**
 * API Routes Legifrance pour Next.js
 * 
 * Endpoints pour exposer les fonctionnalites Legifrance
 * avec authentification et isolation tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/clerk-auth';
import { legifranceApi } from '@/lib/legifrance/api-client';
import { logger } from '@/lib/logger';
import { searchCache } from '@/lib/cache/cache-service';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import crypto from 'crypto';

// Actions en lecture seule (résultats stables à court terme) éligibles au cache.
// 'ping' est volontairement exclu : il vérifie l'état live de l'API.
const CACHEABLE_ACTIONS = new Set([
  'search-ceseda',
  'get-ceseda-article',
  'search-ceseda-keywords',
  'search-jurisprudence-admin',
  'search-jurisprudence-judiciaire',
  'get-ceseda-recent-caselaw',
  'get-article',
  'get-texte',
  'get-last-jo',
  'get-jorf-content',
]);

/**
 * POST /api/legifrance/search
 * Recherche generique dans Legifrance
 */
export const POST = withRateLimit(
  async (req: NextRequest) => {
  try {
    // Authentification
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401 }
      );
    }

    const userId = (user as any).id;
    const tenantId = (user as any).tenantId;

    // Parse body
    const body = await req.json();
    const { action, params } = body;

    logger.info(`Requete Legifrance: ${action}`, { userId, tenantId, action });

    // Cache des recherches en lecture seule : évite de resolliciter PISTE
    // pour des requêtes identiques répétées par plusieurs avocats.
    const cacheable = CACHEABLE_ACTIONS.has(action);
    const cacheKey = cacheable
      ? `legifrance:${action}:${crypto.createHash('sha1').update(JSON.stringify(params || {})).digest('hex')}`
      : null;

    if (cacheKey) {
      const cached = await searchCache.get<Record<string, unknown>>(cacheKey);
      if (cached) {
        return NextResponse.json({ ...cached, cached: true });
      }
    }

    let result;

    switch (action) {
      // ============================================
      // RECHERCHE CESEDA
      // ============================================

      case 'search-ceseda':
        result = await legifranceApi.searchCeseda(params);
        break;

      case 'get-ceseda-article':
        const { numeroArticle, date } = params;
        result = await legifranceApi.getCesedaArticle(numeroArticle, date);
        break;

      case 'search-ceseda-keywords':
        const { keywords, options } = params;
        result = await legifranceApi.searchCesedaByKeywords(keywords, options);
        break;

      // ============================================
      // JURISPRUDENCE
      // ============================================

      case 'search-jurisprudence-admin':
        result = await legifranceApi.searchJurisprudenceAdministrative(params);
        break;

      case 'search-jurisprudence-judiciaire':
        result = await legifranceApi.searchJurisprudenceJudiciaire(params);
        break;

      case 'get-ceseda-recent-caselaw':
        result = await legifranceApi.getCesedaRecentCaseLaw(params);
        break;

      // ============================================
      // CONSULTATION
      // ============================================

      case 'get-article':
        result = await legifranceApi.getArticle(params.articleId);
        break;

      case 'get-texte':
        result = await legifranceApi.getTextePart(params.textId, params.date);
        break;

      // ============================================
      // JOURNAL OFFICIEL
      // ============================================

      case 'get-last-jo':
        result = await legifranceApi.getLastJournalOfficiel(params.nbElements);
        break;

      case 'get-jorf-content':
        result = await legifranceApi.getJorfContent(params.jorfContId, params.options);
        break;

      // ============================================
      // UTILITAIRES
      // ============================================

      case 'ping':
        const isAvailable = await legifranceApi.ping();
        result = { available: isAvailable, environment: legifranceApi.getEnvironment() };
        break;

      default:
        return NextResponse.json(
          { error: `Action non supportee: ${action}` },
          { status: 400 }
        );
    }

    // Log succes
    logger.info(`Legifrance ${action} reussi`, {
      userId,
      tenantId,
      action,
      resultCount: (result as any)?.totalResultNumber || (result as any)?.results?.length || 1,
    });

    const responsePayload = {
      success: true,
      action,
      data: result,
      environment: legifranceApi.getEnvironment(),
    };

    if (cacheKey) {
      await searchCache.set(cacheKey, responsePayload);
    }

    return NextResponse.json(responsePayload);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
    logger.error('Erreur API Legifrance', error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        environment: legifranceApi.getEnvironment(),
      },
      { status: 500 }
    );
  }
  },
  { type: 'api' }
);

/**
 * GET /api/legifrance/search
 * Health check et info environnement
 */
export async function GET(req: NextRequest) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401 }
      );
    }

    const isAvailable = await legifranceApi.ping();

    return NextResponse.json({
      available: isAvailable,
      environment: legifranceApi.getEnvironment(),
      endpoints: [
        'search-ceseda',
        'get-ceseda-article',
        'search-ceseda-keywords',
        'search-jurisprudence-admin',
        'search-jurisprudence-judiciaire',
        'get-ceseda-recent-caselaw',
        'get-article',
        'get-texte',
        'get-last-jo',
        'get-jorf-content',
        'ping',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        available: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}





