import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  tenantFindUnique: vi.fn(),
  membershipFindUnique: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: mocks.auth,
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: mocks.userFindUnique },
    tenant: { findUnique: mocks.tenantFindUnique },
    tenantMembership: { findUnique: mocks.membershipFindUnique },
  },
}));

import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';

describe('getServerSessionCompat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves an active organization through the stored membership', async () => {
    mocks.auth.mockResolvedValue({ userId: 'clerk-user-a', orgId: 'clerk-org-a', orgRole: 'org:member' });
    mocks.userFindUnique.mockResolvedValue({
      id: 'internal-user-a',
      name: 'Avocat A',
      email: 'a@example.test',
      role: 'CLIENT',
      status: 'active',
      tenantId: null,
      clientId: null,
    });
    mocks.tenantFindUnique.mockResolvedValue({
      id: 'tenant-a',
      name: 'Cabinet A',
      status: 'active',
    });
    mocks.membershipFindUnique.mockResolvedValue({ role: 'AVOCAT', clerkRole: 'org:member' });

    await expect(getServerSessionCompat()).resolves.toEqual({
      user: {
        id: 'internal-user-a',
        name: 'Avocat A',
        email: 'a@example.test',
        role: 'AVOCAT',
        tenantId: 'tenant-a',
        tenantName: 'Cabinet A',
        clientId: null,
      },
    });
  });

  it('rejects a stale Clerk role and does not promote users by default', async () => {
    mocks.auth.mockResolvedValue({ userId: 'clerk-user-a', orgId: 'clerk-org-a', orgRole: 'org:admin' });
    mocks.userFindUnique.mockResolvedValue({
      id: 'internal-user-a',
      name: 'Utilisateur',
      email: 'a@example.test',
      role: 'ADMIN',
      status: 'active',
      tenantId: null,
      clientId: null,
    });
    mocks.tenantFindUnique.mockResolvedValue({
      id: 'tenant-a',
      name: 'Cabinet A',
      status: 'active',
    });
    mocks.membershipFindUnique.mockResolvedValue({ role: 'AVOCAT', clerkRole: 'org:member' });

    await expect(getServerSessionCompat()).resolves.toBeNull();

    mocks.auth.mockResolvedValue({ userId: 'clerk-user-a', orgId: null, orgRole: null });
    await expect(getServerSessionCompat()).resolves.toBeNull();
  });

  it('does not resolve a session without an internal Clerk identity mapping', async () => {
    mocks.auth.mockResolvedValue({ userId: 'clerk-user-a', orgId: null, orgRole: null });
    mocks.userFindUnique.mockResolvedValue(null);

    await expect(getServerSessionCompat()).resolves.toBeNull();
    expect(mocks.tenantFindUnique).not.toHaveBeenCalled();
  });
});
