import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),

    userConsent: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },

    aIDecision: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },

    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },

    email: {
      findMany: vi.fn(),
    },

    stripeCustomer: {
      findUnique: vi.fn(),
    },

    subscription: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },

    auditLog: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },

    userSettings: {
      findUnique: vi.fn(),
    },

    session: {
      findMany: vi.fn(),
    },

    dataExportRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },

    deletionRequest: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },

    dataBreach: {
      create: vi.fn(),
      update: vi.fn(),
    },

    dataSubjectRequest: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },

    dossier: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },

    notification: {
      deleteMany: vi.fn(),
    },

    calendarEvent: {
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import {
  DATA_RETENTION,
  GDPRCompliance,
  checkLegalRetention,
} from '@/lib/compliance/gdpr';

const db = prisma as unknown as {
  $transaction: ReturnType<typeof vi.fn>;
  userConsent: { create: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  user: { findUnique: ReturnType<typeof vi.fn> };
  auditLog: { findMany: ReturnType<typeof vi.fn> };
  dataSubjectRequest: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  dossier: { findFirst: ReturnType<typeof vi.fn> };
};

describe('GDPR compliance service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockResolvedValue([]);
  });

  it('records explicit consent atomically without collecting request metadata', async () => {
    await GDPRCompliance.recordConsents('user-1', [
      { type: 'analytics', granted: true, version: '2026-10-01' },
      { type: 'marketing', granted: false, version: '2026-10-01' },
    ]);

    expect(db.$transaction).toHaveBeenCalledOnce();
    expect(db.userConsent.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: 'analytics',
        granted: true,
        policyVersion: '2026-10-01',
      },
    });
  });

  it('exports only records bound to the authenticated user and tenant', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'person@example.test',
      name: 'Person',
      avatar: null,
      phone: null,
      language: 'fr',
      timezone: 'Europe/Paris',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
    });
    db.userConsent.findMany.mockResolvedValue([]);
    db.auditLog.findMany.mockResolvedValue([]);

    await GDPRCompliance.exportUserData('user-1', ['usage']);

    expect(db.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-1', userId: 'user-1' } })
    );
  });

  it('refuses export when the local Clerk-mapped user has no tenant', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'user-1', tenantId: null });

    await expect(GDPRCompliance.exportUserData('user-1')).rejects.toThrow('Unable to prepare');
  });

  it('creates an erasure request for manual review rather than deleting tenant data', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' });
    db.dataSubjectRequest.findFirst.mockResolvedValue(null);
    db.dataSubjectRequest.create.mockResolvedValue({
      id: 'request-1',
      userId: 'user-1',
      requestedAt: new Date(),
      scheduledFor: new Date(),
      status: 'PENDING_REVIEW',
    });

    const request = await GDPRCompliance.requestDeletion('user-1');

    expect(request.status).toBe('PENDING_REVIEW');
    expect(db.dataSubjectRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: 'tenant-1', requestType: 'ERASURE' }),
      })
    );
  });

  it('fails closed for a dossier outside the tenant scope', async () => {
    db.dossier.findFirst.mockResolvedValue(null);

    await expect(checkLegalRetention('dossier-1', 'tenant-1')).resolves.toEqual(
      expect.objectContaining({ canDelete: false })
    );
  });

  it('keeps a configured retention boundary pending human validation', async () => {
    db.dossier.findFirst.mockResolvedValue({
      createdAt: new Date(),
      dateCloture: new Date(),
      statut: 'clos',
    });

    const result = await checkLegalRetention('dossier-1', 'tenant-1');

    expect(DATA_RETENTION.legalFiles).toBe(1825);
    expect(result.canDelete).toBe(false);
    expect(result.retentionEndDate).toBeInstanceOf(Date);
  });
});
