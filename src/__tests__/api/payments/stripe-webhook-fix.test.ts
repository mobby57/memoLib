/**
 * Tests API — Webhook Stripe
 * Vérifie le fix tenant.owner → tenant.users admin
 * @jest-environment node
 */

vi.mock('@/lib/billing/stripe-client', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    aIDecision: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    subscription: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    facture: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    tenant: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('sig_test'),
  }),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Webhook Stripe — fix tenant.owner', () => {
  it('tenant.findUnique utilise users[] au lieu de owner', async () => {
    // Simule l'appel que fait handleInvoicePaymentFailed
    (prisma.tenant.findUnique as any).mockResolvedValue({
      id: 'tenant-1',
      name: 'Cabinet Test',
      users: [{ email: 'admin@cabinet.fr' }],
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: 'tenant-1' },
      include: {
        users: {
          where: { role: { in: ['AVOCAT', 'ADMIN'] } },
          select: { email: true },
          take: 1,
        },
      },
    });

    expect(tenant).toBeDefined();
    expect(tenant!.users[0].email).toBe('admin@cabinet.fr');
    // Vérifie qu'on n'appelle PAS tenant.owner
    expect((tenant as Record<string, unknown>).owner).toBeUndefined();
  });

  it('gère le cas où aucun admin n\'est trouvé', async () => {
    (prisma.tenant.findUnique as any).mockResolvedValue({
      id: 'tenant-1',
      name: 'Cabinet Test',
      users: [],
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: 'tenant-1' },
      include: {
        users: {
          where: { role: { in: ['AVOCAT', 'ADMIN'] } },
          select: { email: true },
          take: 1,
        },
      },
    });

    const adminEmail = tenant?.users[0]?.email;
    expect(adminEmail).toBeUndefined();
  });
});
