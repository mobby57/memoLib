import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST, PATCH } from '@/app/api/information-units/route';
import prisma from '@/lib/prisma';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({
    user: {
      id: 'user-123',
      role: 'ADMIN',
      tenantId: 'tenant-123',
      email: 'user@test.com',
    },
  })),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    informationUnit: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    informationStatusHistory: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('/api/information-units', () => {
  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return information units', async () => {
      const mockUnits = [{ id: '1', content: 'test', currentStatus: 'RECEIVED' }];
      (prisma.informationUnit.findMany as any).mockResolvedValue(mockUnits);
      (prisma.informationUnit.count as any).mockResolvedValue(1);

      const request = new NextRequest(`http://localhost/api/information-units?tenantId=${mockTenantId}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.units).toEqual(mockUnits);
      expect(data.total).toBe(1);
    });

    it('should use tenantId from session if query tenantId is missing', async () => {
      (prisma.informationUnit.findMany as any).mockResolvedValue([]);
      (prisma.informationUnit.count as any).mockResolvedValue(0);

      const request = new NextRequest('http://localhost/api/information-units');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('POST', () => {
    it('should create information unit', async () => {
      const mockUnit = { id: '1', content: 'test', currentStatus: 'RECEIVED' };
      (prisma.informationUnit.findUnique as any).mockResolvedValue(null);
      (prisma.informationUnit.create as any).mockResolvedValue(mockUnit);
      (prisma.informationStatusHistory.create as any).mockResolvedValue({});

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
      (prisma.informationUnit.findUnique as any).mockResolvedValue({ id: '1' });

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
      (prisma.informationUnit.findUnique as any).mockResolvedValue(mockUnit);
      (prisma.$transaction as any).mockResolvedValue([{ ...mockUnit, currentStatus: 'CLASSIFIED' }]);

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
