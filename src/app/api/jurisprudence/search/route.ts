import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { judilibreClient } from '@/lib/legifrance/judilibre-client';
import { logger } from '@/lib/logger';
import { checkFeatureAccess } from '@/lib/billing/features';
import { searchCache } from '@/lib/cache/cache-service';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import {
  normalizeArticleKey,
  buildPostgresSearch,
  filterFallbackRefs,
} from '@/lib/legal/jurisprudence-search';

export const GET = withRateLimit(
  async (req: NextRequest) => {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Feature gate : jurisprudence réservée au plan Cabinet+
  const tenantId = (user as any)?.tenantId;
  if (tenantId) {
    const gate = await checkFeatureAccess(tenantId, 'jurisprudence_search');
    if (!gate.allowed) {
      return NextResponse.json({
        error: 'FEATURE_GATED',
        ...gate,
        upgradeUrl: '/settings/billing?upgrade=true',
      }, { status: 403 });
    }
  }

  const query = req.nextUrl.searchParams.get('q');
  const type = req.nextUrl.searchParams.get('type') || 'all';
  const source = req.nextUrl.searchParams.get('source') || 'auto'; // auto | postgres | judilibre | fallback
  // Filtre optionnel par article CESEDA (ex: "R431-2") : ne retient que les
  // décisions liées à cet article (colonne relatedArticles).
  const articleRaw = req.nextUrl.searchParams.get('article');
  const article = articleRaw ? normalizeArticleKey(articleRaw) : null;
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '10'), 50);
  const page = Math.max(parseInt(req.nextUrl.searchParams.get('page') || '1'), 1);
  const offset = (page - 1) * limit;

  if (!query) return NextResponse.json({ error: 'Paramètre q requis' }, { status: 400 });

  // Cache des recherches (données juridiques publiques, non tenant-spécifiques) :
  // évite de re-solliciter Judilibre/Postgres pour des requêtes identiques répétées
  // par plusieurs avocats (ex: "OQTF", "titre de séjour") — réponse quasi-instantanée.
  // La clé inclut `article` pour ne pas confondre résultats filtrés et non filtrés.
  const cacheKey = `jurisprudence:${source}:${type}:${article ?? '-'}:${query.toLowerCase().trim()}:${limit}:${page}`;
  const cached = await searchCache.get<Record<string, unknown>>(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  const payload = await resolveSearch(query, type, source, limit, page, offset, article);
  if (!('error' in payload)) {
    await searchCache.set(cacheKey, payload);
  }
  return NextResponse.json(payload, 'status' in payload ? { status: payload.status as number } : undefined);
  },
  { type: 'api' }
);

async function resolveSearch(
  query: string,
  type: string,
  source: string,
  limit: number,
  page: number,
  offset: number,
  article: string | null = null,
): Promise<Record<string, unknown>> {
  // Source priority: postgres → judilibre → fallback
  if (source === 'auto') {
    // 1. Try PostgreSQL (indexed decisions)
    const count = await prisma.jurisprudence.count();
    if (count > 0) {
      return searchPostgres(query, type, limit, offset, article);
    }

    // 2. Try Judilibre API
    if (judilibreClient.isAvailable()) {
      try {
        return await searchJudilibre(query, type, limit, page, article);
      } catch (error) {
        logger.warn('[Jurisprudence] Judilibre indisponible, fallback local', { error });
      }
    }

    // 3. Fallback static
    const results = searchFallback(query, type, article);
    return { results, source: 'fallback', total: results.length, page };
  }

  // Explicit source selection
  if (source === 'postgres') {
    return searchPostgres(query, type, limit, offset, article);
  }

  if (source === 'judilibre') {
    if (!judilibreClient.isAvailable()) {
      return {
        error: 'Judilibre non configuré (JUDILIBRE_KEY_ID requis)',
        status: 503,
      };
    }
    return searchJudilibre(query, type, limit, page, article);
  }

  // fallback
  const results = searchFallback(query, type, article);
  return { results, source: 'fallback', total: results.length, page };
}

// ============================================
// SOURCE: POSTGRESQL (données indexées localement)
// ============================================

async function searchPostgres(query: string, type: string, limit: number, offset: number, article: string | null = null) {
  const tsQuery = query.trim();

  // Construction paramétrée (anti-injection) déléguée à la logique pure testée.
  const { where, params, limitIdx, offsetIdx } = buildPostgresSearch(tsQuery, type, article);

  const results: any[] = await prisma.$queryRawUnsafe(`
    SELECT id, "externalId", titre, date, juridiction, numero, chambre, solution, resume, url, themes, "relatedArticles",
           ts_rank("searchVector", plainto_tsquery('french', $1)) as rank
    FROM "Jurisprudence"
    WHERE ${where}
    ORDER BY rank DESC, date DESC
    LIMIT $${limitIdx}
    OFFSET $${offsetIdx}
  `, ...params, limit, offset);

  const total: any[] = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int as count FROM "Jurisprudence"
    WHERE ${where}
  `, ...params);

  return {
    results: results.map(r => ({
      id: r.id,
      titre: r.titre,
      date: r.date,
      juridiction: r.juridiction,
      numero: r.numero,
      chambre: r.chambre,
      solution: r.solution,
      resume: r.resume?.slice(0, 300),
      url: r.url,
      themes: r.themes,
      relatedArticles: r.relatedArticles,
      rank: r.rank,
    })),
    source: 'postgresql',
    total: total[0]?.count || 0,
    page: Math.floor(offset / limit) + 1,
    pages: Math.ceil((total[0]?.count || 0) / limit),
    ...(article ? { article } : {}),
  };
}

// ============================================
// SOURCE: JUDILIBRE (API Cour de cassation)
// ============================================

async function searchJudilibre(query: string, type: string, limit: number, page: number, article: string | null = null) {
  // Judilibre n'expose pas de filtre "article CESEDA" structuré : on enrichit la
  // requête plein texte avec la référence d'article (best-effort).
  const effectiveQuery = article ? `${query} ${article}` : query;
  const result = await judilibreClient.search({
    query: effectiveQuery,
    page_size: limit,
    page: page - 1, // Judilibre pages start at 0
    sort: 'score',
    order: 'desc',
    resolve_references: true,
    ...(type !== 'all' && { theme: [type] }),
  });

  return {
    results: result.results.map(d => ({
      id: d.id,
      titre: d.summary || `${d.type} - ${d.number}`,
      date: d.decision_date,
      juridiction: d.jurisdiction,
      numero: d.number,
      chambre: d.chamber,
      solution: d.solution,
      resume: d.highlights?.motivations?.[0]?.replace(/<\/?em>/g, '') || d.summary || '',
      url: d.ecli
        ? `https://www.legifrance.gouv.fr/juri/id/${d.id}`
        : undefined,
      themes: d.themes || [],
      ecli: d.ecli,
      rank: d.score,
    })),
    source: 'judilibre',
    total: result.total,
    page,
    pages: Math.ceil(result.total / limit),
    took: result.took,
    ...(article ? { article } : {}),
  };
}

// ============================================
// SOURCE: FALLBACK (données statiques CESEDA)
// ============================================

function searchFallback(query: string, type: string, article: string | null = null) {
  return filterFallbackRefs(query, type, article);
}




