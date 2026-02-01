import { NextRequest } from 'next/server';
import { GET, POST, PATCH } from '@/app/api/information-units/route';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    informationUnit: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    informationStatusHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('/api/information-units', () => {
  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return information units', async () => {
      const mockUnits = [{ id: '1', content: 'test', currentStatus: 'RECEIVED' }];
      (prisma.informationUnit.findMany as jest.Mock).mockResolvedValue(mockUnits);
      (prisma.informationUnit.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest(`http://localhost/api/information-units?tenantId=${mockTenantId}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.units).toEqual(mockUnits);
      expect(data.total).toBe(1);
    });

    it('should return 400 if tenantId missing', async () => {
      const request = new NextRequest('http://localhost/api/information-units');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });
  });

  describe('POST', () => {
    it('should create information unit', async () => {
      const mockUnit = { id: '1', content: 'test', currentStatus: 'RECEIVED' };
      (prisma.informationUnit.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.informationUnit.create as jest.Mock).mockResolvedValue(mockUnit);
      (prisma.informationStatusHistory.create as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost/api/information-units', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: mockTenantId,
          source: 'EMAIL',
          content: 'test content',
          changedBy: mockUserId,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 409 if duplicate', async () => {
      (prisma.informationUnit.findUnique as jest.Mock).mockResolvedValue({ id: '1' });

      const request = new NextRequest('http://localhost/api/information-units', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: mockTenantId,
          source: 'EMAIL',
          content: 'test',
          changedBy: mockUserId,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(409);
    });
  });

  describe('PATCH', () => {
    it('should update status', async () => {
      const mockUnit = { id: '1', currentStatus: 'RECEIVED' };
      (prisma.informationUnit.findUnique as jest.Mock).mockResolvedValue(mockUnit);
      (prisma.$transaction as jest.Mock).mockResolvedValue([{ ...mockUnit, currentStatus: 'CLASSIFIED' }]);

      const request = new NextRequest('http://localhost/api/information-units', {
        method: 'PATCH',
        body: JSON.stringify({
          unitId: '1',
          newStatus: 'CLASSIFIED',
          changedBy: mockUserId,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
