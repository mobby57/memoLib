import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { judilibreClient } from '@/lib/legifrance/judilibre-client';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const query = req.nextUrl.searchParams.get('q');
  const type = req.nextUrl.searchParams.get('type') || 'all';
  const source = req.nextUrl.searchParams.get('source') || 'auto'; // auto | postgres | judilibre | fallback
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '10'), 50);
  const page = Math.max(parseInt(req.nextUrl.searchParams.get('page') || '1'), 1);
  const offset = (page - 1) * limit;

  if (!query) return NextResponse.json({ error: 'Paramètre q requis' }, { status: 400 });

  // Source priority: postgres → judilibre → fallback
  if (source === 'auto') {
    // 1. Try PostgreSQL (indexed decisions)
    const count = await prisma.jurisprudence.count();
    if (count > 0) {
      return searchPostgres(query, type, limit, offset);
    }

    // 2. Try Judilibre API
    if (judilibreClient.isAvailable()) {
      try {
        return await searchJudilibre(query, type, limit, page);
      } catch (error) {
        logger.warn('[Jurisprudence] Judilibre indisponible, fallback local', { error });
      }
    }

    // 3. Fallback static
    const results = searchFallback(query, type);
    return NextResponse.json({ results, source: 'fallback', total: results.length, page });
  }

  // Explicit source selection
  if (source === 'postgres') {
    return searchPostgres(query, type, limit, offset);
  }

  if (source === 'judilibre') {
    if (!judilibreClient.isAvailable()) {
      return NextResponse.json(
        { error: 'Judilibre non configuré (JUDILIBRE_KEY_ID requis)' },
        { status: 503 }
      );
    }
    return searchJudilibre(query, type, limit, page);
  }

  // fallback
  const results = searchFallback(query, type);
  return NextResponse.json({ results, source: 'fallback', total: results.length, page });
}

// ============================================
// SOURCE: POSTGRESQL (données indexées localement)
// ============================================

async function searchPostgres(query: string, type: string, limit: number, offset: number) {
  const tsQuery = query.trim();
  const themeFilter = type !== 'all' ? [type.toUpperCase()] : undefined;

  const results: any[] = await prisma.$queryRawUnsafe(`
    SELECT id, "externalId", titre, date, juridiction, numero, chambre, solution, resume, url, themes,
           ts_rank("searchVector", plainto_tsquery('french', $1)) as rank
    FROM "Jurisprudence"
    WHERE "searchVector" @@ plainto_tsquery('french', $1)
    ${themeFilter ? `AND $2 = ANY(themes)` : ''}
    ORDER BY rank DESC, date DESC
    LIMIT $${themeFilter ? '3' : '2'}
    OFFSET $${themeFilter ? '4' : '3'}
  `, tsQuery, ...(themeFilter ? [themeFilter[0], limit, offset] : [limit, offset]));

  const total: any[] = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int as count FROM "Jurisprudence"
    WHERE "searchVector" @@ plainto_tsquery('french', $1)
    ${themeFilter ? `AND $2 = ANY(themes)` : ''}
  `, tsQuery, ...(themeFilter ? [themeFilter[0]] : []));

  return NextResponse.json({
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
      rank: r.rank,
    })),
    source: 'postgresql',
    total: total[0]?.count || 0,
    page: Math.floor(offset / limit) + 1,
    pages: Math.ceil((total[0]?.count || 0) / limit),
  });
}

// ============================================
// SOURCE: JUDILIBRE (API Cour de cassation)
// ============================================

async function searchJudilibre(query: string, type: string, limit: number, page: number) {
  const result = await judilibreClient.search({
    query,
    page_size: limit,
    page: page - 1, // Judilibre pages start at 0
    sort: 'score',
    order: 'desc',
    resolve_references: true,
    ...(type !== 'all' && { theme: [type] }),
  });

  return NextResponse.json({
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
  });
}

// ============================================
// SOURCE: FALLBACK (données statiques CESEDA)
// ============================================

function searchFallback(query: string, type: string) {
  const CESEDA_REFS = [
    { id: 'L511-1', titre: 'OQTF - Obligation de quitter le territoire', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L511-1', resume: "L'autorité administrative peut obliger un étranger à quitter le territoire français lorsque...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776905', themes: ['OQTF'] },
    { id: 'L313-11', titre: 'Carte de séjour temporaire - Vie privée et familiale', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L313-11', resume: "La carte de séjour temporaire portant la mention 'vie privée et familiale' est délivrée de plein droit...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776832', themes: ['TITRE_SEJOUR'] },
    { id: 'L431-2', titre: 'Titre de séjour - Renouvellement', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L431-2', resume: "Le renouvellement du titre de séjour est subordonné au respect des conditions prévues pour sa délivrance...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776780', themes: ['TITRE_SEJOUR'] },
    { id: 'L521-1', titre: 'Expulsion - Conditions', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L521-1', resume: "L'expulsion peut être prononcée si la présence en France d'un étranger constitue une menace grave pour l'ordre public...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776900', themes: ['EXPULSION'] },
    { id: 'L741-1', titre: "Demande d'asile - Procédure", date: '2024-01-01', juridiction: 'CESEDA', numero: 'L741-1', resume: "Tout étranger présent sur le territoire français et souhaitant demander l'asile se présente en personne...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776700', themes: ['ASILE'] },
    { id: 'L421-1', titre: 'Regroupement familial - Conditions', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L421-1', resume: "Le ressortissant étranger qui séjourne régulièrement en France depuis au moins dix-huit mois peut demander à bénéficier du regroupement familial...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776850', themes: ['REGROUPEMENT_FAMILIAL'] },
    { id: 'L823-1', titre: 'Naturalisation - Conditions', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L823-1', resume: "Nul ne peut être naturalisé s'il ne justifie d'une résidence habituelle en France pendant les cinq années qui précèdent le dépôt de sa demande...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776600', themes: ['NATURALISATION'] },
  ];

  const q = query.toLowerCase();
  return CESEDA_REFS.filter(r =>
    r.titre.toLowerCase().includes(q) ||
    r.resume.toLowerCase().includes(q) ||
    r.numero.toLowerCase().includes(q) ||
    r.themes.some(t => t.toLowerCase().includes(q))
  ).slice(0, 10);
}
