/**
 * Mock Clerk pour les tests.
 * Usage dans un test :
 *   import { setClerkUser } from '@/test/auth-mock';
 *   setClerkUser('client@test.fr'); // ou null pour déconnecté
 */
export const clerkState = {
  userId: null as string | null,
  sessionId: null as string | null,
};

export function setClerkUser(userId: string | null) {
  clerkState.userId = userId;
  clerkState.sessionId = userId ? `sess_${userId}` : null;
}
