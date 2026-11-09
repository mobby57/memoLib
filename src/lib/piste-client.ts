import 'server-only';

const PISTE_OAUTH_URL = 'https://oauth.piste.gouv.fr/api/oauth/token';
const LEGIFRANCE_API_URL = 'https://api.piste.gouv.fr/dila/legifrance/lf-engine-app';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken!;

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.PISTE_CLIENT_ID!,
    client_secret: process.env.PISTE_CLIENT_SECRET!,
    scope: 'openid',
  });

  const res = await fetch(PISTE_OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) throw new Error('Échec de l authentification PISTE');

  const data = await res.json();
  cachedToken = data.access_token ?? null;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken!;
}

export async function rechercherArticleCESEDA(numeroArticle: string) {
  const token = await getAccessToken();
  
  const res = await fetch(`${LEGIFRANCE_API_URL}/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recherche: {
        champs: [{
          typeChamp: 'NUM_ARTICLE',
          criteres: [{ typeRecherche: 'EXACTE', valeur: numeroArticle, operateur: 'ET' }],
        }],
        filtres: [{ facette: 'NOM_CODE', valeurs: ["Code de l'entrée et du séjour des étrangers et du droit d'asile"] }],
        pageNumber: 1,
        pageSize: 5,
        typePagination: 'ARTICLE',
      },
      fond: 'CODE_DATE',
    }),
  });

  if (!res.ok) throw new Error('Erreur lors de la recherche Légifrance');
  return res.json();
}
