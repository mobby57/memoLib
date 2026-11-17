import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getServerSessionCompat: vi.fn(),
}));

vi.mock('@/lib/auth/getServerSessionCompat', () => ({
  getServerSessionCompat: mocks.getServerSessionCompat,
}));

import prisma, { getSecurePrisma, getSystemPrisma } from '@/lib/prisma';

describe('Prisma client helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports the shared Prisma client as the default', async () => {
    const module = await import('@/lib/prisma');
    expect(module.default).toBe(prisma);
  });

  it('creates a system client without requiring a user session', () => {
    expect(getSystemPrisma()).toBeDefined();
    expect(mocks.getServerSessionCompat).not.toHaveBeenCalled();
  });

  it('rejects secure client access without a tenant session', async () => {
    mocks.getServerSessionCompat.mockResolvedValue(null);

    await expect(getSecurePrisma()).rejects.toThrow('Aucun cabinet');
  });

  it('creates a secure client for an authenticated tenant', async () => {
    mocks.getServerSessionCompat.mockResolvedValue({
      user: { tenantId: 'tenant-1' },
    });

    await expect(getSecurePrisma()).resolves.toBeDefined();
  });
});
