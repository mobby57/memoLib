import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * Shim de compatibilité : remplace getServerSession() de NextAuth
 * Lit les métadonnées Clerk pour retourner tenantId, role, etc.
 */
export async function getServerSessionCompat() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  const meta = user.publicMetadata as {
    role?: string;
    tenantId?: string;
    tenantName?: string;
    clientId?: string;
  };

  return {
    user: {
      id: userId,
      name: user.fullName ?? user.firstName ?? 'Utilisateur',
      email: user.primaryEmailAddress?.emailAddress ?? '',
      role: meta?.role ?? 'ADMIN',
      tenantId: meta?.tenantId ?? null,
      tenantName: meta?.tenantName ?? null,
      clientId: meta?.clientId ?? null,
    },
  };
}
