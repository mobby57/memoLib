import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resolveUser: vi.fn(),
  lookup: vi.fn(),
  scoped: vi.fn(),
  findGrant: vi.fn(),
}));
vi.mock('@/lib/auth/resolve-clerk-user', () => ({ resolveActiveClerkUser: mocks.resolveUser }));
vi.mock('@/lib/prisma', () => ({
  prisma: { $queryRaw: mocks.lookup },
  withTenantContext: mocks.scoped,
}));

import { findActiveClientDossierGrant } from '@/lib/client-access';

describe('accès client sous contexte tenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveUser.mockResolvedValue({ id: 'client-id', role: 'CLIENT' });
    mocks.lookup.mockResolvedValue([{ tenantId: 'tenant-a' }]);
    mocks.findGrant.mockResolvedValue({ id: 'grant-id', tenantId: 'tenant-a', expiresAt: null });
    mocks.scoped.mockImplementation(async (_tenantId, operation) => operation({
      accessGrant: { findFirst: mocks.findGrant },
    }));
  });

  it('vérifie l’accès actif dans le tenant trouvé', async () => {
    const result = await findActiveClientDossierGrant('clerk-id', 'dossier-id');
    expect(result?.grant.id).toBe('grant-id');
    expect(mocks.scoped).toHaveBeenCalledWith('tenant-a', expect.any(Function));
    expect(mocks.findGrant).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        tenantId: 'tenant-a', clientUserId: 'client-id', dossierId: 'dossier-id',
        status: 'ACTIVE', revokedAt: null, invitation: { status: 'ACCEPTED' },
      }),
    }));
  });

  it('ne donne aucun accès si la vérification tenant ne trouve pas de grant actif', async () => {
    mocks.findGrant.mockResolvedValue(null);
    expect(await findActiveClientDossierGrant('clerk-id', 'dossier-id')).toBeNull();
  });

  it('n’effectue aucune recherche de grant pour un utilisateur non client', async () => {
    mocks.resolveUser.mockResolvedValue({ id: 'lawyer-id', role: 'AVOCAT' });
    expect(await findActiveClientDossierGrant('clerk-id', 'dossier-id')).toBeNull();
    expect(mocks.lookup).not.toHaveBeenCalled();
  });
});
