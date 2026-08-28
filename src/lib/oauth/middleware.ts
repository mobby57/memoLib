// CLERK-MIGRATION: Remplacement session.user -> user (vérifier)
// CLERK-MIGRATION: Remplacement getServerSession() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import type { OAuthProvider } from '@/lib/oauth/oauth-service';
import { oauthTokenService } from '@/lib/oauth/token-service';
import { getServerSession } from 'next-auth';

/**
 * Middleware to ensure OAuth token is valid
 * Automatically refreshes if needed
 */
export async function withOAuthToken(provider: OAuthProvider) {
  const session = await auth();

  if (!session?.user?.id) {
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




