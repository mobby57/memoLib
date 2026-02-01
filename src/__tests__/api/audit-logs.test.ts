import { NextRequest } from 'next/server';
import { GET, POST, PATCH, DELETE } from '@/app/api/audit-logs/route';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma');

describe('/api/audit-logs', () => {
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return audit logs', async () => {
      const mockLogs = [{ id: '1', action: 'CREATE', entityType: 'Client' }];
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue(mockLogs);
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest(`http://localhost/api/audit-logs?tenantId=${mockTenantId}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.logs).toEqual(mockLogs);
    });
  });

  describe('POST', () => {
    it('should create audit log', async () => {
      const mockLog = { id: '1', action: 'CREATE' };
      (prisma.auditLog.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue(mockLog);

      const request = new NextRequest('http://localhost/api/audit-logs', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: mockTenantId,
          userId: 'user-1',
          userEmail: 'user@test.com',
          userRole: 'admin',
          action: 'CREATE',
          entityType: 'Client',
          entityId: 'client-1',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('PATCH', () => {
    it('should return 403 (immutable)', async () => {
      const request = new NextRequest('http://localhost/api/audit-logs', {
        method: 'PATCH',
        body: JSON.stringify({ logId: '1' }),
      });

      const response = await PATCH();
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE', () => {
    it('should return 403 (immutable)', async () => {
      const response = await DELETE();
      expect(response.status).toBe(403);
    });
  });
});
