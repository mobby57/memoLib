import { createAuditLog, getAuditContext } from '@/lib/audit';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    auditLog: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('Audit Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAuditLog', () => {
    it('should create audit log with hash', async () => {
      const mockLastLog = { id: 'log-1', timestampHash: 'hash-1' };
      (prisma.auditLog.findFirst as jest.Mock).mockResolvedValue(mockLastLog);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log-2' });

      const context = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        userEmail: 'user@test.com',
        userRole: 'admin',
      };

      await createAuditLog(context, 'CREATE', 'Client', 'client-1', null, { name: 'Test' });

      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (prisma.auditLog.findFirst as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const context = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        userEmail: 'user@test.com',
        userRole: 'admin',
      };

      await expect(
        createAuditLog(context, 'CREATE', 'Client', 'client-1')
      ).resolves.not.toThrow();
    });
  });

  describe('getAuditContext', () => {
    it('should extract context from request', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((key: string) => {
            if (key === 'x-forwarded-for') return '192.168.1.1';
            if (key === 'user-agent') return 'Mozilla/5.0';
            return null;
          }),
        },
      } as unknown as Request;

      const user = {
        id: 'user-1',
        email: 'user@test.com',
        role: 'admin',
        tenantId: 'tenant-1',
      };

      const context = getAuditContext(mockRequest, user);

      expect(context.tenantId).toBe('tenant-1');
      expect(context.userId).toBe('user-1');
      expect(context.ipAddress).toBe('192.168.1.1');
      expect(context.userAgent).toBe('Mozilla/5.0');
    });
  });
});
