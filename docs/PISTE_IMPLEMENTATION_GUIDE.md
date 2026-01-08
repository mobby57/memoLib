# 📘 GUIDE D'IMPLÉMENTATION PISTE - API Légifrance

## 📄 Source
**Document analysé :** `PISTE-Guide_Utilisateur.pdf` (6.74 Mo)  
**Date :** 7 janvier 2026  
**Ressources officielles :** 
- https://piste.gouv.fr/
- https://aife.economie.gouv.fr/

---

## 🎯 Objectifs de l'Intégration PISTE

L'API PISTE (Plateforme d'Interopérabilité pour les Services de l'État) permet d'accéder aux données juridiques officielles de **Légifrance** :

- ✅ **Code de l'entrée et du séjour des étrangers (CESEDA)** - Articles L313-11, etc.
- ✅ **Jurisprudence** - Conseil d'État, CAA, TA, CNDA
- ✅ **Codes** - Code civil, Code pénal, etc.
- ✅ **Textes consolidés** - Versions à jour des textes

---

## 🔑 Authentification OAuth 2.0

### Prérequis

1. **Créer un compte PISTE** : https://piste.gouv.fr/
2. **Demander des credentials** pour l'API Légifrance
3. **Obtenir :**
   - `client_id` (Sandbox et Production)
   - `client_secret` (Sandbox et Production)

### Configuration `.env.local`

```bash
# API Légifrance PISTE - Sandbox (Tests)
PISTE_SANDBOX_CLIENT_ID=your-sandbox-client-id
PISTE_SANDBOX_CLIENT_SECRET=your-sandbox-client-secret
PISTE_SANDBOX_OAUTH_URL=https://sandbox-oauth.piste.gouv.fr/api/oauth/token
PISTE_SANDBOX_API_URL=https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app

# API Légifrance PISTE - Production
PISTE_PROD_CLIENT_ID=your-production-client-id
PISTE_PROD_CLIENT_SECRET=your-production-client-secret
PISTE_PROD_OAUTH_URL=https://oauth.piste.gouv.fr/api/oauth/token
PISTE_PROD_API_URL=https://api.piste.gouv.fr/dila/legifrance/lf-engine-app

# Environnement actif (sandbox | production)
PISTE_ENVIRONMENT=sandbox
```

### Flux OAuth 2.0 Client Credentials

```typescript
// src/lib/legifrance/piste-auth.ts
interface PisteConfig {
  clientId: string;
  clientSecret: string;
  oauthUrl: string;
  apiUrl: string;
}

interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number; // secondes
  scope: string;
}

class PisteAuthClient {
  private config: PisteConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(environment: 'sandbox' | 'production' = 'sandbox') {
    const prefix = environment === 'sandbox' ? 'PISTE_SANDBOX' : 'PISTE_PROD';
    
    this.config = {
      clientId: process.env[`${prefix}_CLIENT_ID`] || '',
      clientSecret: process.env[`${prefix}_CLIENT_SECRET`] || '',
      oauthUrl: process.env[`${prefix}_OAUTH_URL`] || '',
      apiUrl: process.env[`${prefix}_API_URL`] || '',
    };
  }

  /**
   * Obtenir un token d'accès (avec cache automatique)
   */
  async getAccessToken(): Promise<string> {
    // Vérifier si le token est encore valide (marge de 5 minutes)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken;
    }

    // Requête OAuth 2.0 Client Credentials
    const response = await fetch(this.config.oauthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'openid', // Scope par défaut PISTE
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur OAuth: ${response.status} ${response.statusText}`);
    }

    const data: TokenResponse = await response.json();
    
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    return this.accessToken;
  }

  /**
   * Effectuer une requête authentifiée vers l'API Légifrance
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const pisteAuth = new PisteAuthClient(
  process.env.PISTE_ENVIRONMENT as 'sandbox' | 'production' || 'sandbox'
);
```

---

## 🔍 Endpoints API Légifrance

### 1. Recherche d'Articles CESEDA

```typescript
// src/lib/legifrance/ceseda-search.ts
import { pisteAuth } from './piste-auth';

interface ArticleSearchParams {
  articleNumber?: string; // Ex: "L313-11"
  keywords?: string; // Mots-clés
  section?: string; // Section du code
}

interface ArticleResult {
  id: string;
  title: string;
  content: string;
  articleNumber: string;
  lastModified: string;
  url: string;
}

export async function searchCESEDA(params: ArticleSearchParams): Promise<ArticleResult[]> {
  const response = await pisteAuth.request<any>('/ceseda/search', {
    method: 'POST',
    body: JSON.stringify({
      query: params.keywords || params.articleNumber,
      filters: {
        code: 'CESEDA',
        section: params.section,
      },
    }),
  });

  return response.results.map((result: any) => ({
    id: result.id,
    title: result.title,
    content: result.text,
    articleNumber: result.article_num,
    lastModified: result.updated_at,
    url: result.permalink,
  }));
}
```

### 2. Recherche de Jurisprudence

```typescript
interface JurisprudenceSearchParams {
  keywords: string;
  jurisdiction?: 'CE' | 'CAA' | 'TA' | 'CNDA'; // Conseil d'État, CAA, TA, CNDA
  dateFrom?: string; // ISO 8601
  dateTo?: string;
  limit?: number;
}

interface JurisprudenceResult {
  id: string;
  jurisdiction: string;
  decisionNumber: string;
  decisionDate: string;
  summary: string;
  fullText?: string;
  url: string;
}

export async function searchJurisprudence(
  params: JurisprudenceSearchParams
): Promise<JurisprudenceResult[]> {
  const response = await pisteAuth.request<any>('/jurisprudence/search', {
    method: 'POST',
    body: JSON.stringify({
      query: params.keywords,
      filters: {
        jurisdiction: params.jurisdiction,
        date_start: params.dateFrom,
        date_end: params.dateTo,
      },
      pagination: {
        limit: params.limit || 20,
      },
    }),
  });

  return response.results;
}
```

### 3. Consultation d'Article par ID

```typescript
export async function getArticleById(articleId: string): Promise<ArticleResult> {
  return pisteAuth.request<ArticleResult>(`/article/${articleId}`);
}
```

---

## 🗄️ Stockage & Cache Local

### Modèle Prisma pour le Cache

```prisma
model LegifranceCache {
  id           String   @id @default(uuid())
  articleId    String   @unique // ID Légifrance
  articleNum   String   // Ex: "L313-11"
  code         String   // "CESEDA", "CODE_CIVIL", etc.
  title        String
  content      String   @db.Text
  lastModified DateTime
  cachedAt     DateTime @default(now())
  expiresAt    DateTime // Cache valide 30 jours
  url          String?

  @@index([articleNum, code])
  @@index([expiresAt])
}
```

### Service de Cache

```typescript
// src/lib/legifrance/cache-service.ts
import { prisma } from '@/lib/prisma';

export async function getCachedArticle(
  articleNum: string,
  code: string = 'CESEDA'
): Promise<ArticleResult | null> {
  const cached = await prisma.legifranceCache.findFirst({
    where: {
      articleNum,
      code,
      expiresAt: { gte: new Date() }, // Pas expiré
    },
  });

  if (!cached) return null;

  return {
    id: cached.articleId,
    title: cached.title,
    content: cached.content,
    articleNumber: cached.articleNum,
    lastModified: cached.lastModified.toISOString(),
    url: cached.url || '',
  };
}

export async function cacheArticle(article: ArticleResult, code: string = 'CESEDA') {
  await prisma.legifranceCache.upsert({
    where: { articleId: article.id },
    create: {
      articleId: article.id,
      articleNum: article.articleNumber,
      code,
      title: article.title,
      content: article.content,
      lastModified: new Date(article.lastModified),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      url: article.url,
    },
    update: {
      title: article.title,
      content: article.content,
      lastModified: new Date(article.lastModified),
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
}
```

---

## 🚀 Routes API Next.js

### Route de Recherche CESEDA

```typescript
// src/app/api/legifrance/ceseda/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { searchCESEDA } from '@/lib/legifrance/ceseda-search';
import { getCachedArticle, cacheArticle } from '@/lib/legifrance/cache-service';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { articleNumber, keywords } = await req.json();

  try {
    // 1. Vérifier le cache local
    if (articleNumber) {
      const cached = await getCachedArticle(articleNumber);
      if (cached) {
        return NextResponse.json({
          success: true,
          source: 'cache',
          results: [cached],
        });
      }
    }

    // 2. Requête API Légifrance
    const results = await searchCESEDA({ articleNumber, keywords });

    // 3. Mettre en cache
    for (const result of results) {
      await cacheArticle(result);
    }

    return NextResponse.json({
      success: true,
      source: 'api',
      results,
    });
  } catch (error) {
    console.error('Erreur recherche CESEDA:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500 }
    );
  }
}
```

---

## 🎨 Interface Utilisateur

### Composant de Recherche CESEDA

```tsx
// src/components/legifrance/CESEDASearch.tsx
'use client';

import { useState } from 'react';

export function CESEDASearch() {
  const [articleNum, setArticleNum] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    try {
      const res = await fetch('/api/legifrance/ceseda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleNumber: articleNum }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={articleNum}
          onChange={(e) => setArticleNum(e.target.value)}
          placeholder="Ex: L313-11"
          className="px-4 py-2 border rounded flex-1"
        />
        <button
          onClick={search}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? 'Recherche...' : 'Rechercher'}
        </button>
      </div>

      {results.map((result) => (
        <div key={result.id} className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">{result.title}</h3>
          <p className="text-sm text-gray-600 mb-2">
            Article {result.articleNumber}
          </p>
          <div className="text-gray-800 whitespace-pre-wrap">
            {result.content}
          </div>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm mt-2 inline-block"
          >
            Voir sur Légifrance →
          </a>
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Checklist d'Implémentation

### Phase 1 : Configuration (Priorité Haute)
- [ ] Créer un compte PISTE (https://piste.gouv.fr/)
- [ ] Demander les credentials API Légifrance (Sandbox)
- [ ] Configurer `.env.local` avec `PISTE_SANDBOX_*`
- [ ] Tester l'authentification OAuth 2.0

### Phase 2 : Backend (Priorité Haute)
- [ ] Créer `src/lib/legifrance/piste-auth.ts`
- [ ] Créer `src/lib/legifrance/ceseda-search.ts`
- [ ] Créer `src/lib/legifrance/cache-service.ts`
- [ ] Ajouter le modèle `LegifranceCache` à Prisma
- [ ] Migrer la base : `npx prisma db push`

### Phase 3 : API Routes (Priorité Haute)
- [ ] Créer `/api/legifrance/ceseda/route.ts`
- [ ] Créer `/api/legifrance/jurisprudence/route.ts`
- [ ] Créer `/api/legifrance/article/[id]/route.ts`
- [ ] Ajouter la gestion d'erreurs et logs

### Phase 4 : Frontend (Priorité Moyenne)
- [ ] Créer `components/legifrance/CESEDASearch.tsx`
- [ ] Créer `components/legifrance/JurisprudenceSearch.tsx`
- [ ] Ajouter dans `/lawyer/dossiers/[id]` (détails dossier)
- [ ] Ajouter dans `/lawyer/veille-juridique`

### Phase 5 : Automatisation (Priorité Basse)
- [ ] Cron job quotidien pour vérifier les mises à jour CESEDA
- [ ] Alertes automatiques sur modifications d'articles
- [ ] Suggestions automatiques d'articles pertinents par dossier
- [ ] Export PDF des articles pour archivage

### Phase 6 : Production (Avant Déploiement)
- [ ] Obtenir credentials Production
- [ ] Configurer `PISTE_PROD_*` sur le serveur
- [ ] Basculer `PISTE_ENVIRONMENT=production`
- [ ] Tester en production avec vrais dossiers
- [ ] Documenter dans guide utilisateur avocat

---

## 🔒 Sécurité & Conformité

### Protection des Credentials

- ✅ **Jamais de credentials en dur** dans le code
- ✅ **Variables d'environnement** uniquement (.env.local)
- ✅ **Gitignore** : `.env.local` ajouté
- ✅ **Rotation des secrets** tous les 6 mois

### Gestion des Erreurs

```typescript
try {
  const results = await searchCESEDA({ articleNumber });
} catch (error) {
  if (error.message.includes('401')) {
    // Token expiré, redemander
  } else if (error.message.includes('429')) {
    // Rate limit, attendre
  } else {
    // Autre erreur
    logger.error('Erreur Légifrance', error);
  }
}
```

### Logging RGPD

```typescript
import { logger } from '@/lib/logger';

logger.audit('LEGIFRANCE_API_CALL', userId, tenantId, {
  endpoint: '/ceseda/search',
  articleNumber: 'L313-11', // Pas de données client
  rgpdCompliant: true,
});
```

---

## 📊 Monitoring & Analytics

### Métriques à Suivre

- **Nombre de requêtes API** / jour
- **Taux de cache hit** (cache local vs API)
- **Temps de réponse** moyen
- **Erreurs OAuth** (tokens expirés)
- **Articles les plus consultés**

### Dashboard Admin

```typescript
// src/app/admin/legifrance-stats/page.tsx
- Total requêtes : 1,245
- Cache hit rate : 78%
- Temps moyen : 180ms
- Top articles : L313-11 (234), L511-1 (189), L314-8 (156)
```

---

## 🎯 Cas d'Usage CESEDA

### 1. Consultation Article lors de Création Dossier

```typescript
// Avocat crée un dossier OQTF
// → Système suggère automatiquement Art. L511-1 (OQTF)
// → Affiche le texte complet + lien Légifrance
```

### 2. Veille Juridique Automatique

```typescript
// Cron job quotidien
// → Vérifie les mises à jour CESEDA
// → Alerte si Art. L313-11 modifié (utilisé dans 45 dossiers)
// → Email avocat + notification dashboard
```

### 3. Recherche Contextuelle

```typescript
// Avocat tape "regroupement familial" dans la recherche
// → API retourne Art. L411-1 à L411-5 (regroupement familial)
// → Cache local pour accès rapide
```

---

## 🚀 Avantages Compétitifs

| Fonctionnalité | Concurrent | IA Poste Manager |
|----------------|------------|------------------|
| Accès CESEDA | Manuel | ✅ Automatique API |
| Mise à jour textes | Hebdomadaire | ✅ Temps réel |
| Suggestions articles | Aucune | ✅ IA contextuelle |
| Cache local | Non | ✅ Réponse <100ms |
| Alertes modifications | Non | ✅ Email + Dashboard |

---

## 📚 Ressources

- **Guide Utilisateur PISTE** : `PISTE-Guide_Utilisateur.pdf` (6.74 Mo)
- **Site officiel** : https://piste.gouv.fr/
- **AIFE** : https://aife.economie.gouv.fr/
- **RFC OAuth 2.0** : https://datatracker.ietf.org/doc/html/rfc6749
- **Documentation existante** : [LEGIFRANCE_API_INTEGRATION.md](../LEGIFRANCE_API_INTEGRATION.md)

---

**Date de création :** 7 janvier 2026  
**Version :** 1.0  
**Auteur :** IA Poste Manager - Analyse PDF PISTE  
**Statut :** Prêt pour implémentation

