import { NextRequest } from 'next/server';
import { GET, POST, PATCH } from '@/app/api/legal-deadlines/route';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma');

describe('/api/legal-deadlines', () => {
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return deadlines', async () => {
      const mockDeadlines = [{ id: '1', type: 'RECOURS_CONTENTIEUX', status: 'PENDING' }];
      (prisma.legalDeadline.findMany as jest.Mock).mockResolvedValue(mockDeadlines);
      (prisma.legalDeadline.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest(`http://localhost/api/legal-deadlines?tenantId=${mockTenantId}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.deadlines).toEqual(mockDeadlines);
    });
  });

  describe('POST', () => {
    it('should create deadline', async () => {
      const mockDeadline = { id: '1', type: 'RECOURS_CONTENTIEUX' };
      (prisma.legalDeadline.create as jest.Mock).mockResolvedValue(mockDeadline);

      const request = new NextRequest('http://localhost/api/legal-deadlines', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: mockTenantId,
          dossierId: 'dossier-1',
          clientId: 'client-1',
          type: 'RECOURS_CONTENTIEUX',
          label: 'Test',
          referenceDate: '2024-01-15',
          createdBy: 'user-1',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('PATCH', () => {
    it('should update deadline', async () => {
      (prisma.legalDeadline.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      (prisma.legalDeadline.update as jest.Mock).mockResolvedValue({ id: '1', status: 'COMPLETED' });

      const request = new NextRequest('http://localhost/api/legal-deadlines', {
        method: 'PATCH',
        body: JSON.stringify({
          deadlineId: '1',
          status: 'COMPLETED',
          completedBy: 'user-1',
        }),
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);
    });
  });
});
