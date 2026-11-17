import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * Resolves the active Clerk organization to an internal tenant and membership.
 * Personal accounts remain available for existing client and super-admin users.
 */
export async function getServerSessionCompat() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      clerkUserId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      tenantId: true,
      clientId: true,
    },
  });

  if (!user || user.status !== 'active') return null;

  if (orgId) {
    if (!orgRole) return null;

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrganizationId: orgId },
      select: { id: true, name: true, status: true },
    });

    if (!tenant || tenant.status !== 'active') return null;

    const membership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: user.id,
        },
      },
      select: { role: true, clerkRole: true },
    });

    if (!membership || membership.clerkRole !== orgRole) return null;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: membership.role,
        tenantId: tenant.id,
        tenantName: tenant.name,
        clientId: user.clientId,
      },
    };
  }

  if (user.role === 'CLIENT' && user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { id: true, name: true, status: true },
    });

    if (!tenant || tenant.status !== 'active') return null;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: tenant.id,
        tenantName: tenant.name,
        clientId: user.clientId,
      },
    };
  }

  if (user.role === 'SUPER_ADMIN') {
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: null,
        tenantName: null,
        clientId: user.clientId,
      },
    };
  }

  return null;
}
