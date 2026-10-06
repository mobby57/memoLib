import { auth as clerkAuth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId?: string;
  clientId?: string;
  groups?: string[];
}

export interface AuthContext {
  isAuthenticated: boolean;
  clerkUserId: string | null;
  orgId: string | null;
  user: AuthenticatedUser | null;
}

/**
 * Resolves the Clerk identity to the existing MemoLib account.
 *
 * Clerk owns authentication. The local account remains the authorization and
 * tenant source of truth. Lien durable via User.clerkUserId, avec fallback sur
 * l'email pour les comptes legacy (crees avant la bascule tout-Clerk).
 */
export async function auth(): Promise<AuthContext> {
  const clerkSession = await clerkAuth();
  if (!clerkSession.isAuthenticated || !clerkSession.userId) {
    return {
      isAuthenticated: false,
      clerkUserId: null,
      orgId: null,
      user: null,
    };
  }

  const clerkUser = await currentUser();
  const clerkUserId = clerkUser?.id;
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  if (!clerkUserId || !email) {
    return {
      isAuthenticated: true,
      clerkUserId: clerkSession.userId,
      orgId: clerkSession.orgId ?? null,
      user: null,
    };
  }

  const selectUser = {
    id: true,
    email: true,
    name: true,
    role: true,
    tenantId: true,
    clientId: true,
  } as const;

  const toAuthUser = (u: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string | null;
    clientId: string | null;
  }): AuthenticatedUser => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    tenantId: u.tenantId ?? undefined,
    clientId: u.clientId ?? undefined,
  });

  // Priorite au lien durable clerkUserId ; fallback email pour comptes legacy.
  let user = await prisma.user.findUnique({ where: { clerkUserId }, select: selectUser });
  if (!user) {
    user = await prisma.user.findUnique({ where: { email }, select: selectUser });
  }

  return {
    isAuthenticated: true,
    clerkUserId: clerkSession.userId,
    orgId: clerkSession.orgId ?? null,
    user: user ? toAuthUser(user) : null,
  };
}
