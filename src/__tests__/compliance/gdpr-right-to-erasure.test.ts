import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    dataSubjectRequest: { findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { GDPRCompliance } from '@/lib/compliance/gdpr';

const db = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  dataSubjectRequest: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
};

describe('RGPD — requests for erasure', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects requests for users without a local tenant boundary', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'user-1', tenantId: null });

    await expect(GDPRCompliance.requestDeletion('user-1')).rejects.toThrow('Unable to create');
  });

  it('does not create a second pending request', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' });
    db.dataSubjectRequest.findFirst.mockResolvedValue({ id: 'request-1' });

    await expect(GDPRCompliance.requestDeletion('user-1')).rejects.toThrow('already pending');
    expect(db.dataSubjectRequest.create).not.toHaveBeenCalled();
  });

  it('cancels only the current user’s pending erasure request', async () => {
    db.dataSubjectRequest.updateMany.mockResolvedValue({ count: 1 });

    await expect(GDPRCompliance.cancelDeletion('user-1')).resolves.toBe(true);
    expect(db.dataSubjectRequest.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', requestType: 'ERASURE', status: 'PENDING_REVIEW' },
      data: { status: 'CANCELLED', cancelledAt: expect.any(Date) },
    });
  });
});
