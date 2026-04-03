/**
 * API Routes Legifrance pour Next.js
 *
 * Recherche unifiee: depots GitHub locaux + API PISTE
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-session';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { legifranceApi } from '@/lib/legifrance/api-client';
import { unifiedSearch } from '@/lib/legifrance/unified-search';
import { syncAllSources, getSourcesStatus } from '@/lib/legifrance/git-sources';
import { listAvailableCodes } from '@/lib/legifrance/code-parser';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { action, params } = body;

    logger.info(`Requete Legifrance: ${action}`, { userId, action });

    let result;

    switch (action) {
      // ============================================
      // RECHERCHE UNIFIEE (local + API)
      // ============================================

      case 'unified-search':
        result = await unifiedSearch(params.query, {
          codes: params.codes,
          includeConstitution: params.includeConstitution ?? true,
          includeApi: params.includeApi ?? true,
          apiFond: params.apiFond,
          maxLocal: params.maxLocal,
          maxApi: params.maxApi,
        });
        break;

      // ============================================
      // GESTION DES SOURCES GIT
      // ============================================

      case 'sync-sources':
        result = syncAllSources();
        break;

      case 'sources-status':
        result = {
          sources: getSourcesStatus(),
          codes: listAvailableCodes(),
        };
        break;

      // ============================================
      // RECHERCHE CESEDA (API PISTE)
      // ============================================

      case 'search-ceseda':
        result = await legifranceApi.searchCeseda(params);
        break;

      case 'get-ceseda-article':
        result = await legifranceApi.getCesedaArticle(params.numeroArticle, params.date);
        break;

      case 'search-ceseda-keywords':
        result = await legifranceApi.searchCesedaByKeywords(params.keywords, params.options);
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
        result = {
          available: isAvailable,
          environment: legifranceApi.getEnvironment(),
          localSources: getSourcesStatus().map((s) => ({ name: s.name, available: s.available })),
        };
        break;

      default:
        return NextResponse.json({ error: `Action non supportee: ${action}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      data: result,
      environment: legifranceApi.getEnvironment(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Erreur API Legifrance', error);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const isAvailable = await legifranceApi.ping().catch(() => false);
    const localStatus = getSourcesStatus();
    const codes = listAvailableCodes();

    return NextResponse.json({
      api: { available: isAvailable, environment: legifranceApi.getEnvironment() },
      local: {
        sources: localStatus.map((s) => ({
          name: s.name,
          description: s.description,
          available: s.available,
          commitHash: s.commitHash,
        })),
        codesCount: codes.length,
      },
      endpoints: [
        'unified-search',
        'sync-sources',
        'sources-status',
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
      { available: false, error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
