/**
 * API Routes Légifrance pour Next.js
 * 
 * Endpoints pour exposer les fonctionnalités Légifrance
 * avec authentification et isolation tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { legifranceApi } from '@/lib/legifrance/api-client';
import { logger } from '@/lib/logger';

/**
 * POST /api/legifrance/search
 * Recherche générique dans Légifrance
 */
export async function POST(req: NextRequest) {
  try {
    // Authentification
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const tenantId = (session.user as any).tenantId;

    // Parse body
    const body = await req.json();
    const { action, params } = body;

    logger.info(`Requête Légifrance: ${action}`, { userId, tenantId, action });

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
          { error: `Action non supportée: ${action}` },
          { status: 400 }
        );
    }

    // Log succès
    logger.info(`Légifrance ${action} réussi`, {
      userId,
      tenantId,
      action,
      resultCount: (result as any)?.totalResultNumber || (result as any)?.results?.length || 1,
    });

    return NextResponse.json({
      success: true,
      action,
      data: result,
      environment: legifranceApi.getEnvironment(),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
    logger.error('Erreur API Légifrance', error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        environment: legifranceApi.getEnvironment(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/legifrance/search
 * Health check et info environnement
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
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
