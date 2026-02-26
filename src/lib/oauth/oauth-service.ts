import { z } from 'zod';

export type OAuthProvider = 'google' | 'microsoft' | 'github';

export const OAuthConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url(),
});

export type OAuthConfig = z.infer<typeof OAuthConfigSchema>;

export class OAuthServiceError extends Error {
  constructor(
    public provider: OAuthProvider,
    message: string,
    public cause?: any
  ) {
    super(`OAuth error [${provider}]: ${message}`);
  }
}

/**
 * Base OAuth service connector
 * Handles token exchange, refresh, and user info retrieval
 */
export abstract class BaseOAuthConnector {
  protected config: OAuthConfig;
  protected provider: OAuthProvider;

  constructor(provider: OAuthProvider, config: OAuthConfig) {
    this.provider = provider;
    this.config = OAuthConfigSchema.parse(config);
  }

  abstract getAuthorizationUrl(state: string, scopes?: string[]): string;
  abstract exchangeCode(
    code: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }>;
  abstract refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }>;
  abstract getUserInfo(accessToken: string): Promise<any>;

  protected async fetchOAuth(url: string, options: RequestInit = {}): Promise<any> {
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (e: any) {
      throw new OAuthServiceError(this.provider, e.message, e);
    }
  }
}

/**
 * Google OAuth connector
 * Supports Calendar, Contacts, and basic profile scopes
 */
export class GoogleOAuthConnector extends BaseOAuthConnector {
  constructor(config: OAuthConfig) {
    super('google', config);
  }

  getAuthorizationUrl(state: string, scopes: string[] = ['openid', 'profile', 'email']): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code: string) {
    const data = await this.fetchOAuth('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: JSON.stringify({
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  async refreshToken(refreshToken: string) {
    const data = await this.fetchOAuth('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }

  async getUserInfo(accessToken: string) {
    return this.fetchOAuth('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
}

/**
 * Microsoft OAuth connector
 * Supports Microsoft Graph (Calendar, Contacts, Mail)
 */
export class MicrosoftOAuthConnector extends BaseOAuthConnector {
  constructor(config: OAuthConfig) {
    super('microsoft', config);
  }

  getAuthorizationUrl(state: string, scopes: string[] = ['openid', 'profile', 'email']): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      prompt: 'consent',
    });
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string) {
    const data = await this.fetchOAuth(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        body: JSON.stringify({
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          grant_type: 'authorization_code',
        }),
      }
    );

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  async refreshToken(refreshToken: string) {
    const data = await this.fetchOAuth(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      }
    );

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }

  async getUserInfo(accessToken: string) {
    return this.fetchOAuth('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
}

/**
 * GitHub OAuth connector
 * Supports user profile and read-only scopes
 */
export class GitHubOAuthConnector extends BaseOAuthConnector {
  constructor(config: OAuthConfig) {
    super('github', config);
  }

  getAuthorizationUrl(state: string, scopes: string[] = ['read:user', 'user:email']): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: scopes.join(' '),
      state,
      allow_signup: 'true',
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string) {
    const data = await this.fetchOAuth('https://github.com/login/oauth/access_token', {
      method: 'POST',
      body: JSON.stringify({
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
      }),
    });

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 28800, // GitHub doesn't always return expires_in
    };
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    throw new OAuthServiceError('github', 'GitHub does not support token refresh');
  }

  async getUserInfo(accessToken: string) {
    return this.fetchOAuth('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  }
}

/**
 * OAuth service factory and manager
 */
export class OAuthService {
  private connectors: Map<OAuthProvider, BaseOAuthConnector> = new Map();

  register(provider: OAuthProvider, connector: BaseOAuthConnector) {
    this.connectors.set(provider, connector);
  }

  getConnector(provider: OAuthProvider): BaseOAuthConnector {
    const connector = this.connectors.get(provider);
    if (!connector) {
      throw new OAuthServiceError(provider, `Provider not configured`);
    }
    return connector;
  }

  getAuthorizationUrl(provider: OAuthProvider, state: string, scopes?: string[]): string {
    const connector = this.getConnector(provider);
    return connector.getAuthorizationUrl(state, scopes ?? []);
  }

  async exchangeCode(provider: OAuthProvider, code: string) {
    const connector = this.getConnector(provider);
    return connector.exchangeCode(code);
  }

  async refreshToken(provider: OAuthProvider, refreshToken: string) {
    const connector = this.getConnector(provider);
    return connector.refreshToken(refreshToken);
  }

  async getUserInfo(provider: OAuthProvider, accessToken: string) {
    const connector = this.getConnector(provider);
    return connector.getUserInfo(accessToken);
  }
}

/**
 * Initialize OAuth service with environment variables
 */
export function initializeOAuthService(): OAuthService {
  const service = new OAuthService();

  // Google OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    service.register(
      'google',
      new GoogleOAuthConnector({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
      })
    );
  }

  // Microsoft OAuth
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    service.register(
      'microsoft',
      new MicrosoftOAuthConnector({
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/microsoft`,
      })
    );
  }

  // GitHub OAuth
  if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    service.register(
      'github',
      new GitHubOAuthConnector({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
        redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/github`,
      })
    );
  }

  return service;
}

// Export singleton
export const oauthService = initializeOAuthService();
