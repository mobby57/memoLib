import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockClerkAuth, mockCurrentUser, mockFindUnique } = vi.hoisted(() => ({
  mockClerkAuth: vi.fn(),
  mockCurrentUser: vi.fn(),
  mockFindUnique: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockClerkAuth,
  currentUser: mockCurrentUser,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mockFindUnique },
  },
}));

import { auth } from '@/lib/clerk-auth';

const PRISMA_USER = {
  id: 'user-1',
  email: 'me@cabinet.fr',
  name: 'Maitre Test',
  role: 'AVOCAT',
  tenantId: 'tenant-1',
  clientId: null,
};

describe('clerk-auth auth()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne non-authentifié si pas de session Clerk', async () => {
    mockClerkAuth.mockResolvedValue({ isAuthenticated: false, userId: null });

    const ctx = await auth();

    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.user).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('résout l’utilisateur par clerkUserId en priorité', async () => {
    mockClerkAuth.mockResolvedValue({ isAuthenticated: true, userId: 'clerk-1', orgId: 'org-1' });
    mockCurrentUser.mockResolvedValue({
      id: 'clerk-1',
      primaryEmailAddress: { emailAddress: 'me@cabinet.fr' },
    });
    mockFindUnique.mockResolvedValueOnce(PRISMA_USER);

    const ctx = await auth();

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clerkUserId: 'clerk-1' } })
    );
    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.user?.id).toBe('user-1');
    expect(ctx.user?.tenantId).toBe('tenant-1');
  });

  it('fallback sur l’email pour un compte legacy (clerkUserId absent)', async () => {
    mockClerkAuth.mockResolvedValue({ isAuthenticated: true, userId: 'clerk-2', orgId: null });
    mockCurrentUser.mockResolvedValue({
      id: 'clerk-2',
      primaryEmailAddress: { emailAddress: 'legacy@cabinet.fr' },
    });
    mockFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...PRISMA_USER, email: 'legacy@cabinet.fr' });

    const ctx = await auth();

    expect(mockFindUnique).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { email: 'legacy@cabinet.fr' } })
    );
    expect(ctx.user?.email).toBe('legacy@cabinet.fr');
  });

  it('user null si authentifié mais email Clerk absent', async () => {
    mockClerkAuth.mockResolvedValue({ isAuthenticated: true, userId: 'clerk-3', orgId: null });
    mockCurrentUser.mockResolvedValue({ id: 'clerk-3', primaryEmailAddress: null });

    const ctx = await auth();

    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.user).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});
