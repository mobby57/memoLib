import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const PISTE_CLIENT_ID = process.env.PISTE_CLIENT_ID;
const PISTE_CLIENT_SECRET = process.env.PISTE_CLIENT_SECRET;
const PISTE_TOKEN_URL = 'https://oauth.piste.gouv.fr/api/oauth/token';
const LEGIFRANCE_API = 'https://api.piste.gouv.fr/dila/legifrance/lf-engine-app';

interface JurisprudenceResult {
  id: string;
  titre: string;
  date: string;
  juridiction: string;
  numero: string;
  resume: string;
  url: string;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const query = req.nextUrl.searchParams.get('q');
  const type = req.nextUrl.searchParams.get('type') || 'all'; // all, ceseda, jurisprudence, code
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');

  if (!query) return NextResponse.json({ error: 'Paramètre q requis' }, { status: 400 });

  // Si pas de clés PISTE, utiliser le fallback
  if (!PISTE_CLIENT_ID || !PISTE_CLIENT_SECRET) {
    const results = searchFallback(query, type);
    return NextResponse.json({ results, source: 'fallback', total: results.length });
  }

  try {
    const token = await getAccessToken();
    const results = await searchLegifrance(token, query, type, limit);
    return NextResponse.json({ results, source: 'legifrance', total: results.length });
  } catch (error) {
    const results = searchFallback(query, type);
    return NextResponse.json({ results, source: 'fallback', total: results.length, _error: 'API indisponible' });
  }
}

async function getAccessToken(): Promise<string> {
  const res = await fetch(PISTE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: PISTE_CLIENT_ID!,
      client_secret: PISTE_CLIENT_SECRET!,
      scope: 'openid',
    }),
  });
  const data = await res.json();
  return data.access_token;
}

async function searchLegifrance(token: string, query: string, type: string, limit: number): Promise<JurisprudenceResult[]> {
  const fond = type === 'jurisprudence' ? 'JURI' : type === 'ceseda' ? 'CODE_DATE' : 'ALL';

  const res = await fetch(`${LEGIFRANCE_API}/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recherche: {
        champs: [{ typeChamp: 'ALL', criteres: [{ typeRecherche: 'EXACTE', valeur: query }] }],
        filtres: [{ facette: 'NOM_CODE', valeurs: type === 'ceseda' ? ['Code de l\'entrée et du séjour des étrangers'] : [] }],
        pageNumber: 1,
        pageSize: limit,
        sort: 'PERTINENCE',
        typePagination: 'DEFAUT',
      },
      fond,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Legifrance API: ${res.status}`);
  const data = await res.json();

  return (data.results || []).map((r: any) => ({
    id: r.id || r.cid,
    titre: r.titre || r.titreLong || 'Sans titre',
    date: r.dateTexte || r.dateDecision || '',
    juridiction: r.juridiction || r.nature || '',
    numero: r.numero || r.num || '',
    resume: (r.texte || r.resume || '').slice(0, 300),
    url: `https://www.legifrance.gouv.fr/${r.id ? 'juri/id/' + r.id : ''}`,
  }));
}

function searchFallback(query: string, type: string): JurisprudenceResult[] {
  // Base de données locale de références CESEDA courantes
  const CESEDA_REFS: JurisprudenceResult[] = [
    { id: 'L511-1', titre: 'OQTF - Obligation de quitter le territoire', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L511-1', resume: "L'autorité administrative peut obliger un étranger à quitter le territoire français lorsque...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776905' },
    { id: 'L313-11', titre: 'Carte de séjour temporaire - Vie privée et familiale', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L313-11', resume: "La carte de séjour temporaire portant la mention 'vie privée et familiale' est délivrée de plein droit...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776832' },
    { id: 'L431-2', titre: 'Titre de séjour - Renouvellement', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L431-2', resume: "Le renouvellement du titre de séjour est subordonné au respect des conditions prévues pour sa délivrance...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776780' },
    { id: 'L521-1', titre: 'Expulsion - Conditions', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L521-1', resume: "L'expulsion peut être prononcée si la présence en France d'un étranger constitue une menace grave pour l'ordre public...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776900' },
    { id: 'L741-1', titre: 'Demande d\'asile - Procédure', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L741-1', resume: "Tout étranger présent sur le territoire français et souhaitant demander l'asile se présente en personne...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776700' },
  ];

  const q = query.toLowerCase();
  return CESEDA_REFS.filter((r) =>
    r.titre.toLowerCase().includes(q) ||
    r.resume.toLowerCase().includes(q) ||
    r.numero.toLowerCase().includes(q)
  ).slice(0, 10);
}
