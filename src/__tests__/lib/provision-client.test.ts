import { describe, it, expect, vi, beforeEach } from 'vitest';

// P3.1 — garde-fou AVOCAT vs CLIENT dans le provisioning Clerk.
// Vérifie qu'un compte invité (accountType=client) devient CLIENT rattaché au
// cabinet, SANS créer de tenant, et que les cas dangereux sont refusés.

const { mocks } = vi.hoisted(() => ({
  mocks: {
    userFindFirst: vi.fn(),
    userCreate: vi.fn(),
    tenantFindUnique: vi.fn(),
    clientFindFirst: vi.fn(),
    tenantCreate: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findFirst: mocks.userFindFirst, create: mocks.userCreate },
    tenant: { findUnique: mocks.tenantFindUnique, create: mocks.tenantCreate },
    client: { findFirst: mocks.clientFindFirst },
    $transaction: vi.fn(),
  },
}));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/billing/stripe-client', () => ({ createStripeCustomer: vi.fn(), createCheckoutSession: vi.fn() }));
vi.mock('@/lib/billing/plans', () => ({ getStripePriceId: vi.fn() }));
vi.mock('@/lib/email/email-service', () => ({ sendEmail: vi.fn() }));

import { provisionFromClerk } from '@/lib/services/saas-provisioning';

function clientPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user_client_1',
    primary_email_address_id: 'e1',
    email_addresses: [{ id: 'e1', email_address: 'diallo@gmail.com' }],
    first_name: 'M',
    last_name: 'Diallo',
    public_metadata: { accountType: 'client', tenantId: 'tenant-A', clientId: 'client-1' },
    unsafe_metadata: {},
    ...overrides,
  } as any;
}

describe('provisionFromClerk — garde-fou CLIENT (P3.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userFindFirst.mockResolvedValue(null); // pas d'existant
  });

  it('crée un CLIENT rattaché au cabinet, SANS créer de tenant', async () => {
    mocks.tenantFindUnique.mockResolvedValue({ id: 'tenant-A' });
    mocks.clientFindFirst.mockResolvedValue({ id: 'client-1' });

    await provisionFromClerk(clientPayload());

    // User CLIENT créé, rattaché au bon tenant/client
    expect(mocks.userCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: 'CLIENT',
          tenantId: 'tenant-A',
          clientId: 'client-1',
        }),
      })
    );
    // AUCUN cabinet créé (c'est le bug qu'on corrige : un client ne doit pas devenir avocat)
    expect(mocks.tenantCreate).not.toHaveBeenCalled();
  });

  it('REFUSE le rattachement si le cabinet (tenant) n_existe pas', async () => {
    mocks.tenantFindUnique.mockResolvedValue(null);

    await provisionFromClerk(clientPayload());

    expect(mocks.userCreate).not.toHaveBeenCalled();
    expect(mocks.tenantCreate).not.toHaveBeenCalled();
  });

  it('REFUSE si le clientId appartient à un AUTRE cabinet (anti-fuite inter-cabinets)', async () => {
    mocks.tenantFindUnique.mockResolvedValue({ id: 'tenant-A' });
    mocks.clientFindFirst.mockResolvedValue(null); // clientId pas dans tenant-A

    await provisionFromClerk(clientPayload());

    expect(mocks.userCreate).not.toHaveBeenCalled();
  });

  it('REFUSE un client sans tenantId dans l_invitation', async () => {
    await provisionFromClerk(
      clientPayload({ public_metadata: { accountType: 'client' } })
    );
    expect(mocks.userCreate).not.toHaveBeenCalled();
  });
});
