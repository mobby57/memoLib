import { auth } from '@/lib/clerk-auth';
import { logger } from '@/lib/logger';
import { logSearch } from '@/lib/services/searchAnalytics';
import { SearchResultType, searchService } from '@/lib/services/searchService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = performance.now();

  try {
    const { user } = await auth();
    const session = user ? { user } : null;

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const types = searchParams.get('types')?.split(',') as SearchResultType[] | undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeArchived = searchParams.get('archived') === 'true';

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [], query: '' });
    }

    // Recherche avec le service
    const results = await searchService.search(query, {
      tenantId: user.tenantId || undefined,
      types,
      limit,
      includeArchived,
    });

    const userId = user.id;
    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur invalide' }, { status: 401 });
    }

    const executionTime = performance.now() - startTime;

    // Logger la recherche de maniere asynchrone (ne bloque pas la reponse)
    logSearch({
      query,
      resultCount: results.length,
      executionTime,
      types,
      userId,
      tenantId: user.tenantId || undefined,
    }).catch(err =>
      logger.error('Erreur logging recherche', err instanceof Error ? err : undefined, {
        route: '/api/search',
      })
    );

    return NextResponse.json({
      results,
      query,
      total: results.length,
      executionTime: Math.round(executionTime),
      types: types || ['client', 'dossier', 'document', 'email'],
    });
  } catch (error) {
    logger.error('Search error', error instanceof Error ? error : undefined, {
      route: '/api/search',
    });
    return NextResponse.json({ error: 'Erreur lors de la recherche' }, { status: 500 });
  }
}




