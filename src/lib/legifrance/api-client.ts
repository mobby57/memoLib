/**
 * Client API Legifrance (PISTE)
 *
 * Service pour interroger l'API Legifrance avec authentification OAuth
 * Specialise pour les besoins CESEDA de l'application
 */

import { legifranceOAuth } from './oauth-client';
import type {
  SearchRequest,
  SearchResult,
  Article,
  TexteComplet,
  CesedaSearchParams,
  JurisprudenceSearchParams,
} from '@/types/legifrance';
import { buildCesedaSearch, buildJurisprudenceSearch } from '@/types/legifrance';

const MAX_RETRIES = 1;

export class LegifranceApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = legifranceOAuth.getApiUrl();
  }

  private async request<T>(endpoint: string, body: any, retryCount = 0): Promise<T> {
    const token = await legifranceOAuth.getValidToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();

      if (response.status === 401 && retryCount < MAX_RETRIES) {
        legifranceOAuth.invalidateToken();
        return this.request<T>(endpoint, body, retryCount + 1);
      }

      throw new Error(`Erreur API Legifrance (${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  async search(searchRequest: SearchRequest): Promise<SearchResult> {
    return this.request<SearchResult>('/search', searchRequest);
  }

  async getArticle(articleId: string): Promise<Article> {
    return this.request<Article>('/consult/getArticle', { id: articleId });
  }

  async getTextePart(textId: string, date?: number | string): Promise<TexteComplet> {
    return this.request<TexteComplet>('/consult/legiPart', {
      textId,
      date: date || Date.now(),
    });
  }

  async searchCeseda(params: CesedaSearchParams): Promise<SearchResult> {
    return this.search(buildCesedaSearch(params));
  }

  async getCesedaArticle(
    numeroArticle: string,
    date?: Date | string | number
  ): Promise<Article | null> {
    const dateVersion = date
      ? (typeof date === 'string' ? date : date instanceof Date ? date.getTime() : date)
      : undefined;

    const searchResult = await this.searchCeseda({
      numeroArticle,
      dateVersion,
      etat: 'VIGUEUR',
      pageSize: 1,
    });

    if (!searchResult.results?.length) return null;

    return this.getArticle(searchResult.results[0].id);
  }

  async searchCesedaByKeywords(
    keywords: string,
    options: {
      dateVersion?: number | string;
      proximite?: number;
      pageNumber?: number;
      pageSize?: number;
    } = {}
  ): Promise<SearchResult> {
    return this.searchCeseda({ keywords, ...options });
  }

  async searchJurisprudenceAdministrative(
    params: JurisprudenceSearchParams
  ): Promise<SearchResult> {
    return this.search(buildJurisprudenceSearch(params, 'administrative'));
  }

  async searchJurisprudenceJudiciaire(
    params: JurisprudenceSearchParams
  ): Promise<SearchResult> {
    return this.search(buildJurisprudenceSearch(params, 'judiciaire'));
  }

  async getCesedaRecentCaseLaw(
    options: { keywords?: string; months?: number; pageSize?: number } = {}
  ): Promise<SearchResult> {
    const { keywords = 'CESEDA', months = 6, pageSize = 50 } = options;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return this.searchJurisprudenceAdministrative({
      keywords,
      dateDebut: startDate.toISOString().split('T')[0],
      dateFin: endDate.toISOString().split('T')[0],
      pageSize,
    });
  }

  async getLastJournalOfficiel(nbElements = 5): Promise<any> {
    if (nbElements > 2500) throw new Error("Le nombre d'elements ne peut pas depasser 2500");
    return this.request('/consult/lastNJo', { nbElement: nbElements });
  }

  async getJorfContent(jorfContId: string, options: {
    pageNumber?: number;
    pageSize?: number;
    highlightActivated?: boolean;
  } = {}): Promise<any> {
    return this.request('/consult/jorfCont', {
      id: jorfContId,
      pageNumber: options.pageNumber || 1,
      pageSize: options.pageSize || 10,
      highlightActivated: options.highlightActivated ?? true,
    });
  }

  async ping(): Promise<boolean> {
    try {
      const token = await legifranceOAuth.getValidToken();
      const response = await fetch(`${this.baseUrl}/list/ping`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getEnvironment(): 'sandbox' | 'production' {
    return legifranceOAuth.getEnvironment();
  }
}

export const legifranceApi = new LegifranceApiClient();
export const createLegifranceApi = () => new LegifranceApiClient();
