import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const query = req.nextUrl.searchParams.get('q');
  const type = req.nextUrl.searchParams.get('type') || 'all';
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '10'), 50);
  const page = Math.max(parseInt(req.nextUrl.searchParams.get('page') || '1'), 1);
  const offset = (page - 1) * limit;

  if (!query) return NextResponse.json({ error: 'Paramètre q requis' }, { status: 400 });

  // Check if we have data in PostgreSQL
  const count = await prisma.jurisprudence.count();

  if (count > 0) {
    return searchPostgres(query, type, limit, offset);
  }

  // Fallback to static data if DB is empty
  const results = searchFallback(query, type);
  return NextResponse.json({ results, source: 'fallback', total: results.length, page });
}

async function searchPostgres(query: string, type: string, limit: number, offset: number) {
  const tsQuery = query.trim();

  const themeFilter = type !== 'all' ? [type.toUpperCase()] : undefined;

  // Full-text search with ranking
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

function searchFallback(query: string, type: string) {
  const CESEDA_REFS = [
    { id: 'L511-1', titre: 'OQTF - Obligation de quitter le territoire', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L511-1', resume: "L'autorité administrative peut obliger un étranger à quitter le territoire français lorsque...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776905' },
    { id: 'L313-11', titre: 'Carte de séjour temporaire - Vie privée et familiale', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L313-11', resume: "La carte de séjour temporaire portant la mention 'vie privée et familiale' est délivrée de plein droit...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776832' },
    { id: 'L431-2', titre: 'Titre de séjour - Renouvellement', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L431-2', resume: "Le renouvellement du titre de séjour est subordonné au respect des conditions prévues pour sa délivrance...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776780' },
    { id: 'L521-1', titre: 'Expulsion - Conditions', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L521-1', resume: "L'expulsion peut être prononcée si la présence en France d'un étranger constitue une menace grave pour l'ordre public...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776900' },
    { id: 'L741-1', titre: "Demande d'asile - Procédure", date: '2024-01-01', juridiction: 'CESEDA', numero: 'L741-1', resume: "Tout étranger présent sur le territoire français et souhaitant demander l'asile se présente en personne...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776700' },
  ];

  const q = query.toLowerCase();
  return CESEDA_REFS.filter(r =>
    r.titre.toLowerCase().includes(q) ||
    r.resume.toLowerCase().includes(q) ||
    r.numero.toLowerCase().includes(q)
  ).slice(0, 10);
}
