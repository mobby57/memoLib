import { PrismaClient } from '@prisma/client';
import { oauthService, type OAuthProvider } from './oauth-service';

const prisma = new PrismaClient();

export type OAuthTokenData = {
  provider: OAuthProvider;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope?: string;
};

/**
 * Service for managing stored OAuth tokens
 * Handles persistence, refresh, and revocation
 */
export class OAuthTokenService {
  /**
   * Store or update OAuth token for a user
   */
  async storeToken(userId: string, tokenData: OAuthTokenData) {
    const expiresAt = tokenData.expiresIn
      ? new Date(Date.now() + tokenData.expiresIn * 1000)
      : null;

    return prisma.oAuthToken.upsert({
      where: {
        userId_provider: {
          userId,
          provider: tokenData.provider,
        },
      },
      update: {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt,
        scope: tokenData.scope,
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        provider: tokenData.provider,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt,
        scope: tokenData.scope,
      },
    });
  }

  /**
   * Get stored token for a user and provider
   */
  async getToken(userId: string, provider: OAuthProvider) {
    const token = await prisma.oAuthToken.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (token?.revokedAt) {
      throw new Error(`OAuth token for ${provider} has been revoked`);
    }

    return token;
  }

  /**
   * Check if token is expired and refresh if needed
   */
  async ensureValidToken(userId: string, provider: OAuthProvider): Promise<string> {
    const token = await this.getToken(userId, provider);

    if (!token) {
      throw new Error(`No OAuth token found for ${provider}`);
    }

    // If token is expiring within 5 minutes, refresh it
    if (token.expiresAt && new Date() > new Date(token.expiresAt.getTime() - 5 * 60 * 1000)) {
      if (!token.refreshToken) {
        throw new Error(`Cannot refresh ${provider} token without refresh token`);
      }

      try {
        const refreshed = await oauthService.refreshToken(provider, token.refreshToken);
        await this.storeToken(userId, {
          provider,
          accessToken: refreshed.accessToken,
          refreshToken: token.refreshToken, // Keep old refresh token if new one not provided
          expiresIn: refreshed.expiresIn,
        });

        return refreshed.accessToken;
      } catch (e: any) {
        // If refresh fails, require re-authentication
        await this.revokeToken(userId, provider, 'Refresh failed');
        throw new Error(`Failed to refresh ${provider} token: ${e.message}`);
      }
    }

    // Update last used
    await prisma.oAuthToken.update({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      data: { lastUsedAt: new Date() },
    });

    return token.accessToken;
  }

  /**
   * Revoke token
   */
  async revokeToken(userId: string, provider: OAuthProvider, reason?: string) {
    const token = await prisma.oAuthToken.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (!token) return null;

    return prisma.oAuthToken.update({
      where: { id: token.id },
      data: {
        revokedAt: new Date(),
        accessToken: '', // Clear token data for security
        refreshToken: null,
      },
    });
  }

  /**
   * List all connected OAuth providers for a user
   */
  async getConnectedProviders(userId: string) {
    const tokens = await prisma.oAuthToken.findMany({
      where: { userId, revokedAt: null },
      select: {
        provider: true,
        scope: true,
        connectedAt: true,
        lastUsedAt: true,
      },
    });

    return tokens;
  }

  /**
   * Get all OAuth tokens for a user (without sensitive data)
   */
  async listTokens(userId: string) {
    return prisma.oAuthToken.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        scope: true,
        connectedAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
      orderBy: { connectedAt: 'desc' },
    });
  }
}

export const oauthTokenService = new OAuthTokenService();
