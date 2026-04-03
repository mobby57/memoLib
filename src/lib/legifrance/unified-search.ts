/**
 * Recherche unifiee Legifrance
 *
 * Combine:
 * 1. Recherche locale dans les depots git (offline, rapide)
 * 2. Recherche API PISTE (online, jurisprudence, JO)
 *
 * Strategie: local-first, API en complement
 */

import { legifranceApi } from './api-client';
import { legifranceOAuth } from './oauth-client';
import { parseConstitution, parseCode, listAvailableCodes, type ParsedArticle } from './code-parser';
import { getSourcesStatus } from './git-sources';

export interface UnifiedSearchResult {
  query: string;
  localResults: LocalResult[];
  apiResults: ApiResult[];
  sources: string[];
  timing: { localMs: number; apiMs: number };
}

export interface LocalResult {
  article: ParsedArticle;
  score: number;
  highlight: string;
}

export interface ApiResult {
  id: string;
  title: string;
  type: string;
  source: 'PISTE';
  url?: string;
  snippet?: string;
}

/**
 * Recherche textuelle simple dans les articles locaux
 */
function searchLocal(query: string, articles: ParsedArticle[], maxResults = 20): LocalResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const scored: LocalResult[] = [];

  for (const article of articles) {
    const text = `${article.titre} ${article.numero} ${article.contenu}`.toLowerCase();
    let score = 0;

    for (const term of terms) {
      const idx = text.indexOf(term);
      if (idx !== -1) {
        score += 1;
        // Bonus si dans le numero ou titre
        if (article.numero.toLowerCase().includes(term)) score += 3;
        if (article.titre.toLowerCase().includes(term)) score += 2;
      }
    }

    if (score > 0) {
      // Extraire un snippet autour du premier match
      const lowerContent = article.contenu.toLowerCase();
      const firstMatch = terms.reduce((best, t) => {
        const i = lowerContent.indexOf(t);
        return i !== -1 && (best === -1 || i < best) ? i : best;
      }, -1);

      const start = Math.max(0, firstMatch - 80);
      const end = Math.min(article.contenu.length, firstMatch + 200);
      const highlight = (start > 0 ? '...' : '') +
        article.contenu.slice(start, end).trim() +
        (end < article.contenu.length ? '...' : '');

      scored.push({ article, score, highlight });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

export interface UnifiedSearchOptions {
  /** Codes a chercher localement (ex: ["CESEDA", "Code civil"]). Vide = tous */
  codes?: string[];
  /** Inclure la Constitution */
  includeConstitution?: boolean;
  /** Chercher aussi via API PISTE */
  includeApi?: boolean;
  /** Fond API PISTE (defaut: CODE_ETAT) */
  apiFond?: 'CODE_ETAT' | 'CETAT' | 'JURI' | 'JORF';
  /** Nombre max de resultats locaux */
  maxLocal?: number;
  /** Nombre max de resultats API */
  maxApi?: number;
}

/**
 * Recherche unifiee dans toutes les sources
 */
export async function unifiedSearch(
  query: string,
  options: UnifiedSearchOptions = {}
): Promise<UnifiedSearchResult> {
  const {
    codes = [],
    includeConstitution = true,
    includeApi = true,
    apiFond = 'CODE_ETAT',
    maxLocal = 20,
    maxApi = 10,
  } = options;

  const sources: string[] = [];
  let localResults: LocalResult[] = [];
  let apiResults: ApiResult[] = [];
  let localMs = 0;
  let apiMs = 0;

  // 1. Recherche locale
  const localStart = Date.now();
  const status = getSourcesStatus();
  const hasLocal = status.some((s) => s.available);

  if (hasLocal) {
    let articles: ParsedArticle[] = [];

    if (includeConstitution && status.find((s) => s.name === 'constitution')?.available) {
      articles.push(...parseConstitution());
      sources.push('Constitution (local)');
    }

    if (status.find((s) => s.name === 'codes')?.available) {
      if (codes.length > 0) {
        for (const c of codes) {
          articles.push(...parseCode(c));
          sources.push(`${c} (local)`);
        }
      } else {
        // Chercher dans tous les codes disponibles
        const available = listAvailableCodes();
        for (const c of available) {
          articles.push(...parseCode(c));
        }
        sources.push(`${available.length} codes (local)`);
      }
    }

    localResults = searchLocal(query, articles, maxLocal);
  }
  localMs = Date.now() - localStart;

  // 2. Recherche API PISTE (si configuree et demandee)
  if (includeApi && legifranceOAuth.isAvailable()) {
    const apiStart = Date.now();
    try {
      const result = await legifranceApi.search({
        fond: apiFond,
        recherche: {
          champs: [{
            typeChamp: 'ALL',
            criteres: [{
              valeur: query,
              typeRecherche: 'UN_DES_MOTS',
              operateur: 'ET',
            }],
            operateur: 'ET',
          }],
          pageNumber: 1,
          pageSize: maxApi,
          operateur: 'ET',
          sort: 'PERTINENCE',
          typePagination: 'DEFAUT',
        },
      });

      apiResults = (result.results || []).map((r) => ({
        id: r.id,
        title: r.title || r.id,
        type: r.nature || r.type || apiFond,
        source: 'PISTE' as const,
        url: r.url,
        snippet: r.summary,
      }));

      sources.push(`API PISTE (${legifranceApi.getEnvironment()})`);
    } catch (err: any) {
      console.warn('Recherche API PISTE echouee:', err.message);
    }
    apiMs = Date.now() - apiStart;
  }

  return {
    query,
    localResults,
    apiResults,
    sources,
    timing: { localMs, apiMs },
  };
}
