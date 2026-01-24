/**
 * Client OAuth2.0 pour API Legifrance (PISTE)
 * 
 * Gestion des tokens OAuth avec flux Client Credentials
 * Documentation: https://developer.aife.economie.gouv.fr/
 */

interface OAuthToken {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
  expires_at: number; // Timestamp d'expiration calcule
}

interface PisteConfig {
  clientId: string;
  clientSecret: string;
  oauthUrl: string;
  apiUrl: string;
  environment: 'sandbox' | 'production';
}

export class LegifranceOAuthClient {
  private config: PisteConfig;
  private token: OAuthToken | null = null;
  private isConfigured: boolean = false;

  constructor(environment: 'sandbox' | 'production' = 'sandbox') {
    const isSandbox = environment === 'sandbox';
    
    this.config = {
      clientId: isSandbox 
        ? process.env.PISTE_SANDBOX_CLIENT_ID || '' 
        : process.env.PISTE_PROD_CLIENT_ID || '',
      clientSecret: isSandbox 
        ? process.env.PISTE_SANDBOX_CLIENT_SECRET || '' 
        : process.env.PISTE_PROD_CLIENT_SECRET || '',
      oauthUrl: isSandbox 
        ? process.env.PISTE_SANDBOX_OAUTH_URL || 'https://sandbox-oauth.piste.gouv.fr/api/oauth/token' 
        : process.env.PISTE_PROD_OAUTH_URL || '',
      apiUrl: isSandbox 
        ? process.env.PISTE_SANDBOX_API_URL || 'https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app' 
        : process.env.PISTE_PROD_API_URL || '',
      environment,
    };

    // Validation configuration - juste un warning, pas d'erreur
    this.isConfigured = !!(this.config.clientId && this.config.clientSecret);
    if (!this.isConfigured) {
      console.warn(
        `️ Configuration PISTE manquante pour l'environnement ${environment}. ` +
        `L'API Legifrance sera desactivee.`
      );
    }
  }

  /**
   * Verifie si le client est configure
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Obtenir un token OAuth valide (recupere ou renouvelle)
   */
  async getValidToken(): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('API Legifrance non configuree');
    }
    
    // Si token existant et encore valide (avec marge de 5 minutes)
    if (this.token && this.token.expires_at > Date.now() + 5 * 60 * 1000) {
      return this.token.access_token;
    }

    // Sinon, obtenir un nouveau token
    await this.fetchNewToken();
    return this.token!.access_token;
  }

  /**
   * Recuperer un nouveau token OAuth
   */
  private async fetchNewToken(): Promise<void> {
    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'openid',
      });

      const response = await fetch(this.config.oauthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept-Encoding': 'gzip,deflate',
          'User-Agent': 'IA-Poste-Manager/1.0',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erreur OAuth PISTE (${response.status}): ${errorText}`
        );
      }

      const data = await response.json();

      this.token = {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        scope: data.scope,
        expires_at: Date.now() + data.expires_in * 1000,
      };

      console.log(
        ` Token OAuth PISTE obtenu (${this.config.environment}). ` +
        `Expire dans ${data.expires_in}s`
      );
    } catch (error) {
      console.error(' Erreur obtention token PISTE:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'URL de base de l'API
   */
  getApiUrl(): string {
    return this.config.apiUrl;
  }

  /**
   * Obtenir l'environnement actuel
   */
  getEnvironment(): 'sandbox' | 'production' {
    return this.config.environment;
  }

  /**
   * Verifier si le client est configure
   */
  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret);
  }

  /**
   * Invalider le token actuel (force un renouvellement)
   */
  invalidateToken(): void {
    this.token = null;
  }
}

// Instance singleton selon environnement (.env)
const environment = (process.env.PISTE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';
export const legifranceOAuth = new LegifranceOAuthClient(environment);

// Export pour tests ou usage multi-environnements
export const createLegifranceOAuth = (env: 'sandbox' | 'production') => {
  return new LegifranceOAuthClient(env);
};
