import { NextRequest } from 'next/server';
import { GET, POST, PATCH } from '@/app/api/legal-deadlines/route';
import prisma from '@/lib/prisma';

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    dossier: {
      findFirst: jest.fn(),
    },
    legalDeadline: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('/api/legal-deadlines', () => {
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    jest.clearAllMocks();
    const { getServerSession } = jest.requireMock('next-auth') as { getServerSession: jest.Mock };
    getServerSession.mockResolvedValue({
      user: { id: 'user-1', tenantId: mockTenantId, role: 'LAWYER' },
    });
  });

  describe('GET', () => {
    it('should return deadlines', async () => {
      const mockDeadlines = [{ id: '1', type: 'RECOURS_CONTENTIEUX', status: 'PENDING' }];
      (prisma.legalDeadline.findMany as jest.Mock).mockResolvedValue(mockDeadlines);
      (prisma.legalDeadline.count as jest.Mock).mockResolvedValue(1);

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
      (prisma.dossier.findFirst as jest.Mock).mockResolvedValue({ id: 'dossier-1' });
      (prisma.legalDeadline.create as jest.Mock).mockResolvedValue(mockDeadline);

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
      (prisma.legalDeadline.findFirst as jest.Mock).mockResolvedValue({ id: '1' });
      (prisma.legalDeadline.update as jest.Mock).mockResolvedValue({ id: '1', status: 'COMPLETED' });

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
