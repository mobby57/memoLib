import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { searchService, SearchResultType } from '@/lib/services/searchService';
import { logSearch } from '@/lib/services/searchAnalytics';

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
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
      tenantId: session.user.tenantId || undefined,
      types,
      limit,
      includeArchived,
    });

    const executionTime = performance.now() - startTime;

    // Logger la recherche de manière asynchrone (ne bloque pas la réponse)
    logSearch({
      query,
      resultCount: results.length,
      executionTime,
      types,
      userId: session.user.id,
      tenantId: session.user.tenantId || undefined,
    }).catch((err) => console.error('Erreur logging recherche:', err));

    return NextResponse.json({
      results,
      query,
      total: results.length,
      executionTime: Math.round(executionTime),
      types: types || ['client', 'dossier', 'document', 'email'],
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500 }
    );
  }
}
