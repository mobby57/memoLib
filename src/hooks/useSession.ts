'use client';

import { useAuth, useUser } from '@clerk/nextjs';

/**
 * Hook de compatibilité pour la migration NextAuth -> Clerk.
 * Simule l'ancien useSession() de NextAuth en utilisant les données Clerk.
 */
export function useSession() {
  const { isLoaded, isSignedIn, userId, orgId } = useAuth();
  const { user } = useUser();

  return {
    data: isSignedIn ? {
      user: {
        id: userId,
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName,
        role: (user?.publicMetadata?.role as string) || 'CLIENT',
        tenantId: orgId, // Le cabinet
      }
    } : null,
    status: !isLoaded ? 'loading' : isSignedIn ? 'authenticated' : 'unauthenticated'
  };
}
