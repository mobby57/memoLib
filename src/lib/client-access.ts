import { prisma, withTenantContext } from '@/lib/prisma';
import { resolveActiveClerkUser } from '@/lib/auth/resolve-clerk-user';

type ClientGrant = { id: string; tenantId: string; expiresAt: Date | null };

export async function findActiveClientDossierGrant(clerkUserId: string, dossierId: string) {
  const user = await resolveActiveClerkUser(clerkUserId);
  if (!user || user.role !== 'CLIENT') return null;

  const [lookup] = await prisma.$queryRaw<Array<{ tenantId: string | null }>>`
    SELECT public.memolib_client_dossier_tenant(${user.id}, ${dossierId}) AS "tenantId"
  `;
  if (!lookup?.tenantId) return null;

  const tenantId = lookup.tenantId;
  const grant = await withTenantContext<ClientGrant | null>(tenantId, transaction =>
    transaction.accessGrant.findFirst({
      where: {
        tenantId,
        clientUserId: user.id,
        dossierId,
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        revokedAt: null,
        invitation: { status: 'ACCEPTED' },
      },
      select: { id: true, tenantId: true, expiresAt: true },
    })
  );

  return grant ? { user, grant } : null;
}
