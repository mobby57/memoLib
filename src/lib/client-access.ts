import { prisma } from '@/lib/prisma';
import { resolveActiveClerkUser } from '@/lib/auth/resolve-clerk-user';

export async function findActiveClientDossierGrant(clerkUserId: string, dossierId: string) {
  const user = await resolveActiveClerkUser(clerkUserId);
  if (!user || user.role !== 'CLIENT') return null;

  const grant = await prisma.accessGrant.findFirst({
    where: {
      clientUserId: user.id,
      dossierId,
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      revokedAt: null,
      invitation: { status: 'ACCEPTED' },
    },
    select: { id: true, tenantId: true, expiresAt: true },
  });

  return grant ? { user, grant } : null;
}
