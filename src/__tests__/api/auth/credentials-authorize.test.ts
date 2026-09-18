import bcrypt from 'bcryptjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockWithLoginRateLimit } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
  mockWithLoginRateLimit: vi.fn((handler) => handler),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/middleware/rate-limit', () => ({
  withLoginRateLimit: mockWithLoginRateLimit,
}));
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}));
vi.mock('@/lib/auth', () => ({
  default: vi.fn(() => vi.fn()),
}));

function credentialsAuthorize() {
  const provider = authOptions.providers.find(
    (candidate) => candidate.id === 'credentials'
  );

  const authorize = (provider as { options?: { authorize?: unknown } } | undefined)
    ?.options?.authorize;
  if (typeof authorize !== 'function') {
    throw new Error('Credentials provider not configured');
  }

  return authorize as (
    credentials: { email: string; password: string },
    request?: Request
  ) => Promise<unknown>;
}

// ⚠️ describe.skip : ce test valide le provider "credentials" de NextAuth
// (authOptions), supprimé par la migration vers Clerk. Il n'existe plus de
// `authOptions` importable. À supprimer ou réécrire pour Clerk si un flux
// credentials est réintroduit. Laissé skip pour ne pas casser la suite sur du
// code retiré (référence `authOptions` non définie).
describe.skip('Credentials authentication', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'production';
    process.env.DEMO_MODE = 'false';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.DEMO_MODE = originalDemoMode;
  });

  it('rejects demo credentials with an incorrect password in production', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'demo-user',
      email: 'demo@memolib.fr',
      password: '$2b$10$hash',
      role: 'AVOCAT',
      tenantId: 'tenant-demo',
      Tenant: { status: 'active', name: 'Demo', Plan: { name: 'CABINET' } },
      clientId: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false);

    await expect(
      credentialsAuthorize()({
        email: 'demo@memolib.fr',
        password: 'arbitrary-password',
      })
    ).rejects.toThrow('Identifiants invalides');
  });

  it('rejects a demo account missing from the database', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      credentialsAuthorize()({
        email: 'demo@memolib.fr',
        password: 'arbitrary-password',
      })
    ).rejects.toThrow('Identifiants invalides');
  });

  it('rejects credentials when the database is unavailable', async () => {
    mockPrisma.user.findUnique.mockRejectedValue(new Error("Can't reach database"));

    await expect(
      credentialsAuthorize()({
        email: 'demo@memolib.fr',
        password: 'arbitrary-password',
      })
    ).rejects.toThrow('Identifiants invalides (DB indisponible)');
  });

  it('still authenticates a valid database user through bcrypt', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'lawyer@example.test',
      name: 'Lawyer',
      password: '$2b$10$hash',
      role: 'AVOCAT',
      tenantId: 'tenant-1',
      Tenant: { status: 'active', name: 'Cabinet', Plan: { name: 'CABINET' } },
      clientId: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true);

    await expect(
      credentialsAuthorize()({
        email: 'lawyer@example.test',
        password: 'valid-password',
      })
    ).resolves.toMatchObject({
      id: 'user-1',
      tenantId: 'tenant-1',
      role: 'AVOCAT',
    });
  });

  it('rejects all credential logins when demo mode is enabled in production', async () => {
    process.env.DEMO_MODE = 'true';

    await expect(
      credentialsAuthorize()({
        email: 'demo@memolib.fr',
        password: 'arbitrary-password',
      })
    ).rejects.toThrow('Service indisponible');
  });
});
