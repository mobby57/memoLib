import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
  rateLimit: vi.fn(),
  resolveUser: vi.fn(),
  lookup: vi.fn(),
  scoped: vi.fn(),
  findInvitation: vi.fn(),
  expireInvitation: vi.fn(),
  claim: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth, currentUser: mocks.currentUser }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: mocks.rateLimit }));
vi.mock('@/lib/auth/resolve-clerk-user', () => ({ resolveActiveClerkUser: mocks.resolveUser }));
vi.mock('@/lib/prisma', () => ({
  prisma: { $queryRaw: mocks.lookup },
  withTenantContext: mocks.scoped,
}));

import { POST } from '@/app/api/invitations/accept/route';

const token = 'a'.repeat(43);
const makeRequest = () => new Request('http://localhost/api/invitations/accept', {
  method: 'POST',
  body: JSON.stringify({ token }),
});

describe('acceptation sous contexte tenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: 'clerk-client' });
    mocks.currentUser.mockResolvedValue({
      emailAddresses: [{ emailAddress: 'client@example.invalid', verification: { status: 'verified' } }],
    });
    mocks.rateLimit.mockResolvedValue({ success: true });
    mocks.resolveUser.mockResolvedValue({ id: 'client-id', role: 'CLIENT' });
    mocks.lookup.mockResolvedValue([{ tenantId: 'tenant-a' }]);
    mocks.findInvitation.mockResolvedValue({
      id: 'invitation-id', tenantId: 'tenant-a', dossierId: 'dossier-id',
      email: 'client@example.invalid', status: 'PENDING', expiresAt: new Date('2100-01-01'),
    });
    mocks.claim.mockResolvedValue([{ id: 'grant-id' }]);
    mocks.scoped.mockImplementation(async (_tenantId, operation) => operation({
      invitation: { findFirst: mocks.findInvitation, updateMany: mocks.expireInvitation },
      $queryRaw: mocks.claim,
    }));
  });

  it('cherche et accepte une invitation existante dans son tenant', async () => {
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ dossierId: 'dossier-id' });
    expect(mocks.scoped).toHaveBeenCalledTimes(2);
    expect(mocks.scoped.mock.calls.every(([tenantId]) => tenantId === 'tenant-a')).toBe(true);
    expect(mocks.findInvitation).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId: 'tenant-a' }),
    }));
    expect(mocks.claim).toHaveBeenCalledOnce();
  });

  it('ne consomme pas le lien si l’adresse vérifiée ne correspond pas', async () => {
    mocks.currentUser.mockResolvedValue({
      emailAddresses: [{ emailAddress: 'other@example.invalid', verification: { status: 'verified' } }],
    });
    expect((await POST(makeRequest())).status).toBe(403);
    expect(mocks.claim).not.toHaveBeenCalled();
  });

  it('ne consomme pas un lien sans compte client actif', async () => {
    mocks.resolveUser.mockResolvedValue({ id: 'lawyer-id', role: 'AVOCAT' });
    expect((await POST(makeRequest())).status).toBe(403);
    expect(mocks.claim).not.toHaveBeenCalled();
  });

  it('refuse un jeton inconnu sans requête tenant', async () => {
    mocks.lookup.mockResolvedValue([{ tenantId: null }]);
    expect((await POST(makeRequest())).status).toBe(404);
    expect(mocks.scoped).not.toHaveBeenCalled();
  });
});
