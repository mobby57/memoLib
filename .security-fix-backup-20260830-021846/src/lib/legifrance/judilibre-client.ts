/**
 * Client API Judilibre (Cour de cassation)
 *
 * Accès à l'API Judilibre via PISTE.
 *
 * Authentification :
 * - Production : OAuth2 Client Credentials prioritaire
 * - Sandbox : OAuth2 prioritaire, API Key en fallback
 *
 * Endpoints :
 * - GET /search
 * - GET /decision
 * - GET /taxonomy
 * - GET /stats
 * - GET /export
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
  date_start?: string;
  date_end?: string;
  sort?: 'score' | 'scorepub' | 'date';
  order?: 'asc' | 'desc';
  page_size?: number;
  page?: number;
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
  zones?: Record<
    string,
    Array<{
      start: number;
      end: number;
    }>
  >;
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
  result:
    | Array<{
        key: string;
        value: string;
      }>
    | {
        value: string;
      };
}

export interface JudilibreStats {
  query: {
    jurisdiction: string[];
    location: string[];
    keys: string[];
  };

  results: {
    min_decision_date: string;
    max_decision_date: string;
    total_decisions: number;
  };
}

// ============================================
interface OAuthToken {
  access_token: string;
  expires_at: number;
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

  private oauthToken: OAuthToken | null = null;

  constructor() {
    const environment =
      process.env.JUDILIBRE_ENVIRONMENT ||
      process.env.PISTE_ENVIRONMENT ||
      'sandbox';

    const isSandbox = environment === 'sandbox';

    // --------------------------------------------
    // URLs
    // --------------------------------------------

    this.baseUrl = isSandbox
      ? process.env.PISTE_SANDBOX_API_URL ||
        'https://sandbox-api.piste.gouv.fr/cassation/judilibre/v1.0'
      : process.env.PISTE_PROD_API_URL ||
        'https://api.piste.gouv.fr/cassation/judilibre/v1.0';

    this.oauthUrl = isSandbox
      ? process.env.PISTE_SANDBOX_OAUTH_URL ||
        'https://sandbox-oauth.piste.gouv.fr/api/oauth/token'
      : process.env.PISTE_PROD_OAUTH_URL ||
        'https://oauth.piste.gouv.fr/api/oauth/token';

    // --------------------------------------------
    // API Key
    // --------------------------------------------

    this.keyId =
      process.env.JUDILIBRE_KEY_ID ||
      process.env.PISTE_SANDBOX_KEY_ID ||
      '';

    // --------------------------------------------
    // OAuth2
    // --------------------------------------------

    this.clientId = isSandbox
      ? process.env.PISTE_SANDBOX_CLIENT_ID || ''
      : process.env.PISTE_PROD_CLIENT_ID || '';

    this.clientSecret = isSandbox
      ? process.env.PISTE_SANDBOX_CLIENT_SECRET || ''
      : process.env.PISTE_PROD_CLIENT_SECRET || '';

    // --------------------------------------------
    // Sélection authentification
    //
    // OAuth est prioritaire.
    // --------------------------------------------

    if (this.clientId && this.clientSecret) {
      this.authMode = 'oauth';
      this.isConfigured = true;
    } else if (this.keyId) {
      this.authMode = 'apikey';
      this.isConfigured = true;
    } else {
      this.authMode = 'oauth';
      this.isConfigured = false;

      logger.debug(
        '[Judilibre] Aucune authentification configurée — fallback local activé'
      );
    }

    // Ne jamais logger les secrets.
    logger.debug('[Judilibre] Configuration', {
      environment,
      authMode: this.authMode,
      hasClientId: Boolean(this.clientId),
      hasClientSecret: Boolean(this.clientSecret),
      hasKeyId: Boolean(this.keyId),
      baseUrl: this.baseUrl,
      oauthUrl: this.oauthUrl,
    });
  }

  // ============================================
  // OAUTH
  // ============================================

  /**
   * Obtient un token OAuth2 valide.
   *
   * Utilise un cache local avec une marge de sécurité de 5 minutes.
   */
  private async getOAuthToken(): Promise<string> {
    if (
      this.oauthToken &&
      this.oauthToken.expires_at > Date.now() + 5 * 60 * 1000
    ) {
      return this.oauthToken.access_token;
    }

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: 'openid',
    });

    let response: Response;

    try {
      response = await fetch(this.oauthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: params.toString(),
      });
    } catch (error) {
      logger.error('[Judilibre] Erreur réseau OAuth', error);
      throw new Error(
        'Impossible de contacter le serveur OAuth PISTE'
      );
    }

    const responseText = await response.text();

    if (!response.ok) {
      logger.error('[Judilibre] Échec OAuth', {
        status: response.status,
        body: responseText,
      });

      throw new Error(
        `OAuth Judilibre failed (${response.status}): ${
          responseText || '(réponse vide)'
        }`
      );
    }

    let data: {
      access_token?: string;
      expires_in?: number;
    };

    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(
        'Réponse OAuth PISTE invalide : JSON attendu'
      );
    }

    if (!data.access_token) {
      throw new Error(
        'Réponse OAuth PISTE invalide : access_token manquant'
      );
    }

    const expiresIn =
      typeof data.expires_in === 'number'
        ? data.expires_in
        : 3600;

    this.oauthToken = {
      access_token: data.access_token,
      expires_at: Date.now() + expiresIn * 1000,
    };

    logger.debug('[Judilibre] Token OAuth obtenu', {
      expiresIn,
    });

    return this.oauthToken.access_token;
  }

  // ============================================
  // STATUS
  // ============================================

  isAvailable(): boolean {
    return this.isConfigured;
  }

  // ============================================
  // REQUEST
  // ============================================

  private async request<T>(
    endpoint: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    if (!this.isConfigured) {
      throw new Error(
        'Judilibre non configuré. ' +
          'Configurez PISTE_PROD_CLIENT_ID/SECRET ' +
          'ou JUDILIBRE_KEY_ID.'
      );
    }

    // --------------------------------------------
    // URL
    // --------------------------------------------

    const url = new URL(`${this.baseUrl}${endpoint}`);

    for (const [key, value] of Object.entries(params)) {
      if (
        value === undefined ||
        value === null ||
        value === ''
      ) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, String(item));
        }
      } else {
        url.searchParams.set(key, String(value));
      }
    }

    // --------------------------------------------
    // Headers
    // --------------------------------------------

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (this.authMode === 'oauth') {
      const token = await this.getOAuthToken();

      headers.Authorization = `Bearer ${token}`;
    } else {
      headers.KeyId = this.keyId;
    }

    // --------------------------------------------
    // Request
    // --------------------------------------------

    try {
      let response = await fetch(url.toString(), {
        method: 'GET',
        headers,
      });

      // ------------------------------------------
      // OAuth : token expiré
      // ------------------------------------------

      if (
        response.status === 401 &&
        this.authMode === 'oauth'
      ) {
        logger.debug(
          '[Judilibre] Token OAuth probablement expiré — renouvellement'
        );

        this.oauthToken = null;

        const newToken = await this.getOAuthToken();

        headers.Authorization = `Bearer ${newToken}`;

        response = await fetch(url.toString(), {
          method: 'GET',
          headers,
        });
      }

      // ------------------------------------------
      // Erreur API
      // ------------------------------------------

      if (!response.ok) {
        const errorText = await response.text();

        logger.error('[Judilibre] Erreur API', {
          endpoint,
          status: response.status,
          authMode: this.authMode,
          body: errorText || '(réponse vide)',
        });

        throw new Error(
          `Erreur API Judilibre (${response.status}): ${
            errorText || '(réponse vide)'
          }`
        );
      }

      // ------------------------------------------
      // JSON
      // ------------------------------------------

      const text = await response.text();

      if (!text) {
        throw new Error(
          `API Judilibre (${endpoint}) : réponse vide`
        );
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        throw new Error(
          `API Judilibre (${endpoint}) : réponse JSON invalide`
        );
      }
    } catch (error) {
      logger.error(
        `[Judilibre] Erreur requête ${endpoint}`,
        error
      );

      throw error;
    }
  }

  // ============================================
  // RECHERCHE
  // ============================================

  /**
   * Recherche plein texte dans Judilibre.
   */
  async search(
    params: JudilibreSearchParams
  ): Promise<JudilibreSearchResult> {
    return this.request<JudilibreSearchResult>(
      '/search',
      params as unknown as Record<string, unknown>
    );
  }

  // ============================================
  // DÉCISION
  // ============================================

  /**
   * Récupère une décision complète.
   */
  async getDecision(
    id: string,
    options?: {
      resolve_references?: boolean;
      query?: string;
    }
  ): Promise<JudilibreDecision> {
    return this.request<JudilibreDecision>(
      '/decision',
      {
        id,
        ...options,
      }
    );
  }

  // ============================================
  // TAXONOMIE
  // ============================================

  /**
   * Récupère les valeurs de taxonomie.
   */
  async getTaxonomy(
    id?: string,
    options?: {
      key?: string;
      value?: string;
      context_value?: string;
    }
  ): Promise<JudilibreTaxonomy> {
    return this.request<JudilibreTaxonomy>(
      '/taxonomy',
      {
        ...(id ? { id } : {}),
        ...options,
      }
    );
  }

  // ============================================
  // STATISTIQUES
  // ============================================

  /**
   * Statistiques sur la base Judilibre.
   */
  async getStats(
    options?: {
      jurisdiction?: string;
      date_start?: string;
      date_end?: string;
    }
  ): Promise<JudilibreStats> {
    return this.request<JudilibreStats>(
      '/stats',
      options || {}
    );
  }

  // ============================================
  // CESEDA
  // ============================================

  /**
   * Recherche de jurisprudence récente
   * relative au droit des étrangers / CESEDA.
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
    const {
      months = 6,
      pageSize = 20,
      solution,
      jurisdiction,
    } = options;

    const endDate = new Date();
    const startDate = new Date();

    startDate.setMonth(
      startDate.getMonth() - months
    );

    return this.search({
      query: keywords,
      operator: 'and',

      date_start: startDate
        .toISOString()
        .split('T')[0],

      date_end: endDate
        .toISOString()
        .split('T')[0],

      page_size: Math.min(
        Math.max(pageSize, 1),
        50
      ),

      sort: 'date',
      order: 'desc',

      resolve_references: true,

      ...(solution ? { solution } : {}),
      ...(jurisdiction ? { jurisdiction } : {}),
    });
  }

  // ============================================
  // POURVOI
  // ============================================

  /**
   * Recherche par numéro de pourvoi.
   */
  async searchByNumber(
    number: string
  ): Promise<JudilibreSearchResult> {
    return this.search({
      query: number,
      operator: 'exact',
      page_size: 5,
    });
  }
}

// ============================================
// SINGLETON
// ============================================

export const judilibreClient =
  new JudilibreClient();

export const createJudilibreClient =
  () => new JudilibreClient();
