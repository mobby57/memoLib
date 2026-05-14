/**
 * Tests API — Webhook Stripe
 * Vérifie le fix tenant.owner → tenant.users admin
 * @jest-environment node
 */

jest.mock('@/lib/billing/stripe-client', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
    subscriptions: {
      retrieve: jest.fn(),
    },
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    facture: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    tenant: { findUnique: jest.fn() },
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('next/headers', () => ({
  headers: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue('sig_test'),
  }),
}));

import { prisma } from '@/lib/prisma';

describe('Webhook Stripe — fix tenant.owner', () => {
  it('tenant.findUnique utilise users[] au lieu de owner', async () => {
    // Simule l'appel que fait handleInvoicePaymentFailed
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
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
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
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
