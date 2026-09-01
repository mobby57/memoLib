import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import type { OAuthProvider } from '@/lib/oauth/oauth-service';
import { oauthTokenService } from '@/lib/oauth/token-service';
/**
 * Middleware to ensure OAuth token is valid
 * Automatically refreshes if needed
 */
export async function withOAuthToken(provider: OAuthProvider) {
  const { user } = await auth();
    const session = user ? { user } : null;

  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const token = await oauthTokenService.ensureValidToken(user.id, provider);
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




