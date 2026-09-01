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
 * tenant source of truth until user provisioning stores a durable Clerk ID.
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
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  if (!email) {
    return {
      isAuthenticated: true,
      clerkUserId: clerkSession.userId,
      orgId: clerkSession.orgId ?? null,
      user: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tenantId: true,
      clientId: true,
    },
  });

  return {
    isAuthenticated: true,
    clerkUserId: clerkSession.userId,
    orgId: clerkSession.orgId ?? null,
    user: user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId ?? undefined,
          clientId: user.clientId ?? undefined,
        }
      : null,
  };
}
