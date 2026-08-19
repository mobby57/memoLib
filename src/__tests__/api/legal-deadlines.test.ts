import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST, PATCH } from '@/app/api/legal-deadlines/route';
import prisma from '@/lib/prisma';

vi.mock('next-auth', () => ({
  __esModule: true,
  default: vi.fn(() => vi.fn()),
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    dossier: {
      findFirst: vi.fn(),
    },
    legalDeadline: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('/api/legal-deadlines', () => {
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    vi.clearAllMocks();
    const { getServerSession } = jest.requireMock('next-auth') as { getServerSession: vi.Mock };
    getServerSession.mockResolvedValue({
      user: { id: 'user-1', tenantId: mockTenantId, role: 'LAWYER' },
    });
  });

  describe('GET', () => {
    it('should return deadlines', async () => {
      const mockDeadlines = [{ id: '1', type: 'RECOURS_CONTENTIEUX', status: 'PENDING' }];
      (prisma.legalDeadline.findMany as any).mockResolvedValue(mockDeadlines);
      (prisma.legalDeadline.count as any).mockResolvedValue(1);

      const request = new NextRequest('http://localhost/api/legal-deadlines');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.deadlines).toEqual(mockDeadlines);
    });
  });

  describe('POST', () => {
    it('should create deadline', async () => {
      const mockDeadline = { id: '1', type: 'RECOURS_CONTENTIEUX' };
      (prisma.dossier.findFirst as any).mockResolvedValue({ id: 'dossier-1' });
      (prisma.legalDeadline.create as any).mockResolvedValue(mockDeadline);

      const request = new NextRequest('http://localhost/api/legal-deadlines', {
        method: 'POST',
        body: JSON.stringify({
          dossierId: 'dossier-1',
          clientId: 'client-1',
          type: 'RECOURS_CONTENTIEUX',
          label: 'Test',
          referenceDate: '2024-01-15',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });
  });

  describe('PATCH', () => {
    it('should update deadline', async () => {
      (prisma.legalDeadline.findFirst as any).mockResolvedValue({ id: '1' });
      (prisma.legalDeadline.update as any).mockResolvedValue({ id: '1', status: 'COMPLETED' });

      const request = new NextRequest('http://localhost/api/legal-deadlines', {
        method: 'PATCH',
        body: JSON.stringify({
          deadlineId: '1',
          status: 'COMPLETED',
        }),
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);
    });
  });
});
