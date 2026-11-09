/**
 * Client API Judilibre (Cour de cassation)
 *
 * Alternative/complément à l'API Légifrance via PISTE.
 * L'API Judilibre donne accès aux décisions pseudonymisées de la Cour de cassation
 * et des cours d'appel (jurisprudence judiciaire).
 *
 * Authentification : KeyId dans le header (obtenu via PISTE)
 * Documentation : https://github.com/Cour-de-cassation/judilibre-search
 *
 * Endpoints :
 * - GET /search       — Recherche plein texte avec filtres
 * - GET /decision     — Récupération d'une décision complète
 * - GET /taxonomy     — Listes de termes (chambres, formations, solutions...)
 * - GET /stats        — Statistiques sur la base
 * - GET /export       — Export par lots
 */

import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface JudilibreSearchParams {
  query: string;
  field?: string[];
  operator?: 'or' | 'and' | 'exact';
  type?: string[];
  theme?: string[];
  chamber?: string[];
  formation?: string[];
  jurisdiction?: ('cc' | 'ca' | 'tj' | 'tcom')[];
  location?: string[];
  publication?: string[];
  solution?: string[];
  date_start?: string; // YYYY-MM-DD
  date_end?: string;   // YYYY-MM-DD
  sort?: 'score' | 'scorepub' | 'date';
  order?: 'asc' | 'desc';
  page_size?: number;  // max 50
  page?: number;       // starts at 0
  resolve_references?: boolean;
}

export interface JudilibreDecision {
  id: string;
  jurisdiction: string;
  chamber: string;
  number: string;
  numbers?: string[];
  ecli?: string;
  formation?: string;
  publication?: string[];
  decision_date: string;
  type: string;
  solution: string;
  summary?: string;
  themes?: string[];
  text?: string;
  zones?: Record<string, Array<{ start: number; end: number }>>;
  score?: number;
  highlights?: Record<string, string[]>;
}

export interface JudilibreSearchResult {
  page: number;
  page_size: number;
  query: Record<string, unknown>;
  total: number;
  previous_page: string | null;
  next_page: string | null;
  took: number;
  max_score: number;
  results: JudilibreDecision[];
}

export interface JudilibreTaxonomy {
  id: string;
  result: Array<{ key: string; value: string }> | { value: string };
}

export interface JudilibreStats {
  requestPerDay: number;
  oldestDecision: string;
  newestDecision: string;
  indexedTotal: number;
  indexedByJurisdiction: Array<{ value: number; label: string }>;
  indexedByYear: Array<{ value: number; label: string }>;
}

// ============================================
// CLIENT
// ============================================

export class JudilibreClient {
  private keyId: string;
  private baseUrl: string;
  private oauthUrl: string;
  private clientId: string;
  private clientSecret: string;
  private isConfigured: boolean;
  private authMode: 'apikey' | 'oauth';
  private oauthToken: { access_token: string; expires_at: number } | null = null;

  constructor() {
    const environment = process.env.JUDILIBRE_ENVIRONMENT || 'sandbox';
    const isSandbox = environment === 'sandbox';

    this.baseUrl = isSandbox
      ? 'https://sandbox-api.piste.gouv.fr/cassation/judilibre/v1.0'
      : 'https://api.piste.gouv.fr/cassation/judilibre/v1.0';

    this.oauthUrl = isSandbox
      ? 'https://sandbox-oauth.piste.gouv.fr/api/oauth/token'
      : 'https://oauth.piste.gouv.fr/api/oauth/token';

    // Auth mode 1: API Key (header KeyId)
    this.keyId = process.env.JUDILIBRE_KEY_ID || process.env.PISTE_SANDBOX_KEY_ID || '';

    // Auth mode 2: OAuth2 Client Credentials
    this.clientId = isSandbox
      ? (process.env.PISTE_SANDBOX_CLIENT_ID || '')
      : (process.env.PISTE_PROD_CLIENT_ID || '');
    this.clientSecret = isSandbox
      ? (process.env.PISTE_SANDBOX_CLIENT_SECRET || '')
      : (process.env.PISTE_PROD_CLIENT_SECRET || '');

    // Determine auth mode
    if (this.keyId) {
      this.authMode = 'apikey';
      this.isConfigured = true;
    } else if (this.clientId && this.clientSecret) {
      this.authMode = 'oauth';
      this.isConfigured = true;
    } else {
      this.authMode = 'apikey';
      this.isConfigured = false;
      logger.debug('[Judilibre] Aucune authentification configurée — fallback local activé');
    }
  }

  /**
   * Obtenir un token OAuth2 valide
   */
  private async getOAuthToken(): Promise<string> {
    // Token encore valide (marge 5 min)
    if (this.oauthToken && this.oauthToken.expires_at > Date.now() + 5 * 60 * 1000) {
      return this.oauthToken.access_token;
    }

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: 'openid',
    });

    const response = await fetch(this.oauthUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`OAuth Judilibre failed (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    this.oauthToken = {
      access_token: data.access_token,
      expires_at: Date.now() + data.expires_in * 1000,
    };

    return this.oauthToken.access_token;
  }

  /**
   * Vérifie si le client est configuré et disponible
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Requête générique à l'API Judilibre
   */
  private async request<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
    if (!this.isConfigured) {
      throw new Error('Judilibre non configuré (JUDILIBRE_KEY_ID ou PISTE_SANDBOX_CLIENT_ID/SECRET requis)');
    }

    // Construire l'URL avec query params
    const url = new URL(`${this.baseUrl}${endpoint}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(value));
      }
    }

    // Build headers based on auth mode
    const headers: Record<string, string> = { 'Accept': 'application/json' };

    if (this.authMode === 'apikey') {
      headers['KeyId'] = this.keyId;
    } else {
      const token = await this.getOAuthToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
      });

      if (response.status === 401 && this.authMode === 'oauth') {
        // Token expiré, retry une fois
        this.oauthToken = null;
        const newToken = await this.getOAuthToken();
        headers['Authorization'] = `Bearer ${newToken}`;
        
        const retryResponse = await fetch(url.toString(), { method: 'GET', headers });
        if (!retryResponse.ok) {
          throw new Error(`Erreur API Judilibre (${retryResponse.status}): ${await retryResponse.text()}`);
        }
        return await retryResponse.json() as T;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erreur API Judilibre (${response.status}): ${errorText}`
        );
      }

      return await response.json() as T;
    } catch (error) {
      logger.error(`[Judilibre] Erreur requête ${endpoint}`, error);
      throw error;
    }
  }

  // ============================================
  // RECHERCHE
  // ============================================

  /**
   * Recherche plein texte dans Judilibre
   *
   * @example
   * // Recherche OQTF dans les arrêts de la Cour de cassation
   * await client.search({ query: 'OQTF obligation quitter territoire' })
   *
   * // Recherche dans les motivations uniquement
   * await client.search({ query: 'CESEDA L511-1', field: ['motivations'] })
   *
   * // Filtrer par solution (cassation)
   * await client.search({ query: 'titre séjour', solution: ['cassation'] })
   */
  async search(params: JudilibreSearchParams): Promise<JudilibreSearchResult> {
    return this.request<JudilibreSearchResult>('/search', params as unknown as Record<string, unknown>);
  }

  // ============================================
  // DÉCISION COMPLÈTE
  // ============================================

  /**
   * Récupérer une décision complète par son ID
   *
   * @example
   * await client.getDecision('5fca7d162a251e6bf9c78514')
   */
  async getDecision(id: string, options?: {
    resolve_references?: boolean;
    query?: string;
  }): Promise<JudilibreDecision> {
    return this.request<JudilibreDecision>('/decision', {
      id,
      ...options,
    });
  }

  // ============================================
  // TAXONOMIE
  // ============================================

  /**
   * Récupérer les termes de taxonomie
   *
   * @example
   * // Toutes les entrées disponibles
   * await client.getTaxonomy()
   *
   * // Les chambres de la Cour de cassation
   * await client.getTaxonomy('chamber', { context_value: 'cc' })
   *
   * // Le label d'une solution
   * await client.getTaxonomy('solution', { key: 'cassation' })
   */
  async getTaxonomy(id?: string, options?: {
    key?: string;
    value?: string;
    context_value?: string;
  }): Promise<JudilibreTaxonomy> {
    return this.request<JudilibreTaxonomy>('/taxonomy', {
      id,
      ...options,
    });
  }

  // ============================================
  // STATISTIQUES
  // ============================================

  /**
   * Statistiques sur la base Judilibre
   */
  async getStats(options?: {
    jurisdiction?: string;
    date_start?: string;
    date_end?: string;
  }): Promise<JudilibreStats> {
    return this.request<JudilibreStats>('/stats', options || {});
  }

  // ============================================
  // MÉTHODES SPÉCIALISÉES CESEDA
  // ============================================

  /**
   * Rechercher jurisprudence CESEDA récente
   * Optimisé pour les besoins des avocats en droit des étrangers
   *
   * @example
   * await client.searchCesedaCaseLaw('OQTF', { months: 12 })
   */
  async searchCesedaCaseLaw(
    keywords: string,
    options: {
      months?: number;
      pageSize?: number;
      solution?: string[];
      jurisdiction?: ('cc' | 'ca')[];
    } = {}
  ): Promise<JudilibreSearchResult> {
    const { months = 6, pageSize = 20, solution, jurisdiction } = options;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return this.search({
      query: keywords,
      operator: 'and',
      date_start: startDate.toISOString().split('T')[0],
      date_end: endDate.toISOString().split('T')[0],
      page_size: Math.min(pageSize, 50),
      sort: 'date',
      order: 'desc',
      resolve_references: true,
      ...(solution && { solution }),
      ...(jurisdiction && { jurisdiction }),
    });
  }

  /**
   * Rechercher par numéro de pourvoi
   */
  async searchByNumber(number: string): Promise<JudilibreSearchResult> {
    return this.search({
      query: number,
      operator: 'exact',
      page_size: 5,
    });
  }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

export const judilibreClient = new JudilibreClient();
export const createJudilibreClient = () => new JudilibreClient();
