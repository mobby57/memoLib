

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockPrisma = {
  client: { findFirst: vi.fn() },
  dossier: { findFirst: vi.fn() },
  user: { findFirst: vi.fn() },
  facture: {
    findMany: vi.fn(),
    groupBy: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock('@/lib/auth', () => ({
  __esModule: true,
  default: vi.fn(() => vi.fn()),
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

vi.mock('@/lib/notifications', () => ({
  NotificationService: { factureCreated: vi.fn() },
}));

const { GET, POST } = require('@/app/api/factures/route') as typeof import('@/app/api/factures/route');

describe('/api/factures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const { getServerSession } = jest.requireMock('@/lib/auth') as { getServerSession: vi.Mock };
    getServerSession.mockResolvedValue({
      user: { id: 'user-1', tenantId: 'tenant-a', role: 'LAWYER' },
    });
  });

  it('refuse un tenant demandé différent de celui de la session', async () => {
    const response = await GET(new NextRequest('http://localhost/api/factures?tenantId=tenant-b'));

    expect(response.status).toBe(403);
    expect(mockPrisma.facture.findMany).not.toHaveBeenCalled();
  });

  it('crée une facture dans le tenant de la session', async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-1' });
    mockPrisma.facture.findFirst.mockResolvedValue(null);
    mockPrisma.facture.create.mockResolvedValue({ id: 'facture-1', tenantId: 'tenant-a' });
    mockPrisma.$transaction.mockImplementation(async (operation: (tx: typeof mockPrisma) => unknown) => operation(mockPrisma));

    const response = await POST(new NextRequest('http://localhost/api/factures', {
      method: 'POST',
      body: JSON.stringify({
        tenantId: 'tenant-b',
        clientId: 'client-1',
        lignes: [{ description: 'Consultation', prixUnitaire: 100 }],
      }),
    }));

    expect(response.status).toBe(201);
    expect(mockPrisma.facture.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tenantId: 'tenant-a', clientId: 'client-1' }),
    }));
  });
});
