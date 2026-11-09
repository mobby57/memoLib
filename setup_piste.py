import os

print("🚀 Configuration de l'intégration PISTE pour MemoLib...")

# 1. Création du dossier lib s'il n'existe pas
os.makedirs("src/lib", exist_ok=True)

# 2. Création du client PISTE
piste_client = """import 'server-only';

const PISTE_OAUTH_URL = 'https://oauth.piste.gouv.fr/api/oauth/token';
const LEGIFRANCE_API_URL = 'https://api.piste.gouv.fr/dila/legifrance/lf-engine-app';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

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
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
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
"""
with open("src/lib/piste-client.ts", "w", encoding="utf-8") as f:
    f.write(piste_client)
print("✅ Client PISTE créé : src/lib/piste-client.ts")

# 3. Création de la route API
os.makedirs("src/app/api/legal/search", exist_ok=True)
api_route = """import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { rechercherArticleCESEDA } from '@/lib/piste-client';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const article = searchParams.get('article');
    
    if (!article) {
      return NextResponse.json({ error: "Paramètre 'article' manquant" }, { status: 400 });
    }

    const data = await rechercherArticleCESEDA(article);
    return NextResponse.json(data);

  } catch (error) {
    console.error("[LEGAL_API] Erreur:", error);
    return NextResponse.json({ error: "Erreur lors de la recherche juridique" }, { status: 500 });
  }
}
"""
with open("src/app/api/legal/search/route.ts", "w", encoding="utf-8") as f:
    f.write(api_route)
print("✅ Route API créée : src/app/api/legal/search/route.ts")

# 4. Mise à jour du .env.example
if os.path.exists(".env.example"):
    with open(".env.example", "r", encoding="utf-8") as f:
        env_content = f.read()
    if "PISTE_CLIENT_ID" not in env_content:
        with open(".env.example", "a", encoding="utf-8") as f:
            f.write("\n# API PISTE\nPISTE_CLIENT_ID=\"...\"\nPISTE_CLIENT_SECRET=\"...\"\n")
        print("✅ Variables PISTE ajoutées au .env.example")

print("\n🎉 Terminé ! N'oublie pas de mettre tes vraies clés PISTE dans .env.local")
