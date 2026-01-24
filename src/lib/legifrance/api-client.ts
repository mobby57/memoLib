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
  buildCesedaSearch,
  buildJurisprudenceSearch,
} from '@/types/legifrance';

export class LegifranceApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = legifranceOAuth.getApiUrl();
  }

  /**
   * Requete generique a l'API Legifrance
   */
  private async request<T>(endpoint: string, body: any): Promise<T> {
    try {
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
        
        // Si 401, invalider le token et reessayer une fois
        if (response.status === 401) {
          legifranceOAuth.invalidateToken();
          return this.request<T>(endpoint, body);
        }

        throw new Error(
          `Erreur API Legifrance (${response.status}): ${errorText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(` Erreur requete Legifrance ${endpoint}:`, error);
      throw error;
    }
  }

  // ============================================
  // RECHERCHE GeNeRIQUE
  // ============================================

  /**
   * Recherche generique dans Legifrance
   */
  async search(searchRequest: SearchRequest): Promise<SearchResult> {
    return this.request<SearchResult>('/search', searchRequest);
  }

  // ============================================
  // CONSULTATION D'ARTICLES
  // ============================================

  /**
   * Recuperer un article par son ID
   */
  async getArticle(articleId: string): Promise<Article> {
    return this.request<Article>('/consult/getArticle', {
      id: articleId,
    });
  }

  /**
   * Recuperer une partie de texte legislatif (loi, ordonnance)
   */
  async getTextePart(textId: string, date?: number | string): Promise<TexteComplet> {
    return this.request<TexteComplet>('/consult/legiPart', {
      textId,
      date: date || Date.now(),
    });
  }

  // ============================================
  // SPeCIALISATIONS CESEDA
  // ============================================

  /**
   * Rechercher dans le CESEDA
   */
  async searchCeseda(params: CesedaSearchParams): Promise<SearchResult> {
    const { buildCesedaSearch } = await import('@/types/legifrance');
    const searchRequest = buildCesedaSearch(params);
    return this.search(searchRequest);
  }

  /**
   * Recuperer un article CESEDA specifique
   * 
   * @example
   * // Article L313-11 en vigueur aujourd'hui
   * await client.getCesedaArticle('L313-11')
   * 
   * // Article L313-11 au 1er janvier 2020
   * await client.getCesedaArticle('L313-11', new Date('2020-01-01'))
   */
  async getCesedaArticle(
    numeroArticle: string,
    date?: Date | string | number
  ): Promise<Article | null> {
    try {
      // etape 1: Rechercher l'article
      const dateVersion = date 
        ? (typeof date === 'string' ? date : date instanceof Date ? date.getTime() : date)
        : undefined;

      const searchResult = await this.searchCeseda({
        numeroArticle,
        dateVersion,
        etat: 'VIGUEUR',
        pageSize: 1,
      });

      if (!searchResult.results || searchResult.results.length === 0) {
        return null;
      }

      // etape 2: Recuperer le contenu complet
      const articleId = searchResult.results[0].id;
      return await this.getArticle(articleId);
    } catch (error) {
      console.error(`Erreur recuperation article CESEDA ${numeroArticle}:`, error);
      throw error;
    }
  }

  /**
   * Rechercher dans le CESEDA par mots-cles
   * 
   * @example
   * // Recherche "regroupement familial"
   * await client.searchCesedaByKeywords('regroupement familial', { pageSize: 20 })
   */
  async searchCesedaByKeywords(
    keywords: string,
    options: {
      dateVersion?: number | string;
      proximite?: number;
      pageNumber?: number;
      pageSize?: number;
    } = {}
  ): Promise<SearchResult> {
    return this.searchCeseda({
      keywords,
      ...options,
    });
  }

  // ============================================
  // JURISPRUDENCE
  // ============================================

  /**
   * Rechercher dans la jurisprudence administrative (CESEDA)
   * 
   * @example
   * // Recherche arrets CESEDA des 6 derniers mois
   * const sixMonthsAgo = new Date();
   * sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
   * 
   * await client.searchJurisprudenceAdministrative({
   *   keywords: 'CESEDA regroupement familial',
   *   dateDebut: sixMonthsAgo.toISOString().split('T')[0],
   *   dateFin: new Date().toISOString().split('T')[0],
   *   pageSize: 50
   * })
   */
  async searchJurisprudenceAdministrative(
    params: JurisprudenceSearchParams
  ): Promise<SearchResult> {
    const { buildJurisprudenceSearch } = await import('@/types/legifrance');
    const searchRequest = buildJurisprudenceSearch(params, 'administrative');
    return this.search(searchRequest);
  }

  /**
   * Rechercher dans la jurisprudence judiciaire
   */
  async searchJurisprudenceJudiciaire(
    params: JurisprudenceSearchParams
  ): Promise<SearchResult> {
    const { buildJurisprudenceSearch } = await import('@/types/legifrance');
    const searchRequest = buildJurisprudenceSearch(params, 'judiciaire');
    return this.search(searchRequest);
  }

  /**
   * Rechercher arrets CESEDA recents (6 derniers mois par defaut)
   */
  async getCesedaRecentCaseLaw(
    options: {
      keywords?: string;
      months?: number;
      pageSize?: number;
    } = {}
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

  // ============================================
  // JOURNAL OFFICIEL
  // ============================================

  /**
   * Recuperer les derniers JO
   */
  async getLastJournalOfficiel(nbElements: number = 5): Promise<any> {
    if (nbElements > 2500) {
      throw new Error('Le nombre d\'elements ne peut pas depasser 2500');
    }

    return this.request('/consult/lastNJo', {
      nbElement: nbElements,
    });
  }

  /**
   * Recuperer le contenu d'un conteneur JO
   */
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

  // ============================================
  // UTILITAIRES
  // ============================================

  /**
   * Verifier la disponibilite de l'API
   */
  async ping(): Promise<boolean> {
    try {
      const token = await legifranceOAuth.getValidToken();
      const response = await fetch(`${this.baseUrl}/list/ping`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Obtenir l'environnement actuel
   */
  getEnvironment(): 'sandbox' | 'production' {
    return legifranceOAuth.getEnvironment();
  }
}

// Instance singleton
export const legifranceApi = new LegifranceApiClient();

// Export pour tests ou usage multi-instances
export const createLegifranceApi = () => new LegifranceApiClient();
