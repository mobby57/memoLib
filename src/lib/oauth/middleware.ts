import type { OAuthProvider } from '@/lib/oauth/oauth-service';
import { oauthTokenService } from '@/lib/oauth/token-service';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';

/**
 * Middleware to ensure OAuth token is valid
 * Automatically refreshes if needed
 */
export async function withOAuthToken(provider: OAuthProvider) {
  const session = await getServerSessionCompat();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const token = await oauthTokenService.ensureValidToken(session.user.id, provider);
    return token;
  } catch (e: any) {
    throw new Error(`OAuth token access denied: ${e.message}`);
  }
}

/**
 * Utility to get OAuth token with optional refresh
 */
export async function getOAuthToken(provider: OAuthProvider, userId: string) {
  return oauthTokenService.ensureValidToken(userId, provider);
}
