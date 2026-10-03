/**
 * Tests pour src/app/api/audit-logs/route.ts
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Clerk auth
const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock('@/lib/clerk-auth', () => ({
  auth: mockAuth,
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    auditLog: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
  prisma: {
    auditLog: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    aIDecision: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import prisma from '@/lib/prisma';
import { GET, POST, PATCH, DELETE } from '@/app/api/audit-logs/route';

const mockPrisma = prisma as any;

function createMockRequest(url: string, options?: { method?: string; body?: any }) {
  return {
    url,
    method: options?.method || 'GET',
    json: async () => options?.body || {},
  } as any;
}

describe('audit-logs route — Full Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue({
        isAuthenticated: false,
        clerkUserId: null,
        orgId: null,
        user: null,
      });
      const req = createMockRequest('http://localhost/api/audit-logs?tenantId=t1');
      const res = await GET(req);
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toContain('Non authentifie');
    });

    it('should return 403 for non-allowed roles', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', role: 'CLIENT', tenantId: 't1', email: 'x@x.com' },
      });
      const req = createMockRequest('http://localhost/api/audit-logs');
      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it('should return logs for ADMIN', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', role: 'ADMIN', tenantId: 't1', email: 'admin@test.com' },
      });
      mockPrisma.auditLog.findMany.mockResolvedValue([{ id: 'log1', action: 'CREATE' }]);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const req = createMockRequest('http://localhost/api/audit-logs');
      const res = await GET(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.logs).toHaveLength(1);
      expect(data.total).toBe(1);
    });

    it('should apply filters', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', role: 'LAWYER', tenantId: 't1', email: 'law@test.com' },
      });
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const req = createMockRequest(
        'http://localhost/api/audit-logs?userId=u2&action=CREATE&entityType=dossier&entityId=d1&startDate=2026-01-01&endDate=2026-12-31&limit=50&offset=10'
      );
      const res = await GET(req);
      expect(res.status).toBe(200);
    });

    it('should handle SUPER_ADMIN with tenantId param', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', role: 'SUPER_ADMIN', email: 'super@test.com' },
      });
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const req = createMockRequest('http://localhost/api/audit-logs?tenantId=t1');
      const res = await GET(req);
      expect(res.status).toBe(200);
    });

    it('should return 400 for SUPER_ADMIN without tenantId', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', role: 'SUPER_ADMIN', email: 'super@test.com' },
      });
      const req = createMockRequest('http://localhost/api/audit-logs');
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it('should return 403 for tenant mismatch', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', role: 'ADMIN', tenantId: 't1', email: 'a@b.com' },
      });
      const req = createMockRequest('http://localhost/api/audit-logs?tenantId=t2');
      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it('should return 500 on error', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', role: 'ADMIN', tenantId: 't1', email: 'a@b.com' },
      });
      mockPrisma.auditLog.findMany.mockRejectedValue(new Error('DB down'));

      const req = createMockRequest('http://localhost/api/audit-logs');
      const res = await GET(req);
      expect(res.status).toBe(500);
    });
  });

  describe('POST', () => {
    it('should create audit log', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', role: 'ADMIN', tenantId: 't1', email: 'a@b.com' },
      });
      mockPrisma.auditLog.findFirst.mockResolvedValue(null);
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'newlog', action: 'CREATE' });

      const req = createMockRequest('http://localhost/api/audit-logs', {
        method: 'POST',
        body: {
          tenantId: 't1',
          action: 'CREATE_DOSSIER',
          entityType: 'dossier',
          entityId: 'd1',
          oldValue: null,
          newValue: { status: 'active' },
        },
      });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should chain hash from previous log', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', role: 'ADMIN', tenantId: 't1', email: 'a@b.com' },
      });
      mockPrisma.auditLog.findFirst.mockResolvedValue({ id: 'prev', timestampHash: 'abc123' });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'newlog' });

      const req = createMockRequest('http://localhost/api/audit-logs', {
        method: 'POST',
        body: { tenantId: 't1', action: 'UPDATE', entityType: 'dossier', entityId: 'd1' },
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ previousLogId: 'prev' }),
      }));
    });

    it('should return 400 for missing fields', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', role: 'ADMIN', tenantId: 't1', email: 'a@b.com' },
      });
      const req = createMockRequest('http://localhost/api/audit-logs', {
        method: 'POST',
        body: { tenantId: 't1' }, // missing action, entityType, entityId
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue({
        isAuthenticated: false,
        clerkUserId: null,
        orgId: null,
        user: null,
      });
      const req = createMockRequest('http://localhost/api/audit-logs', {
        method: 'POST',
        body: { tenantId: 't1', action: 'X', entityType: 'Y', entityId: 'Z' },
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('should return 500 on error', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'u1', role: 'ADMIN', tenantId: 't1', email: 'a@b.com' },
      });
      mockPrisma.auditLog.findFirst.mockRejectedValue(new Error('fail'));

      const req = createMockRequest('http://localhost/api/audit-logs', {
        method: 'POST',
        body: { tenantId: 't1', action: 'X', entityType: 'Y', entityId: 'Z' },
      });
      const res = await POST(req);
      expect(res.status).toBe(500);
    });
  });

  describe('PATCH', () => {
    it('should return 403 (immutable)', async () => {
      const res = await PATCH();
      const data = await res.json();
      expect(res.status).toBe(403);
      expect(data.error).toContain('immuables');
    });
  });

  describe('DELETE', () => {
    it('should return 403 (immutable)', async () => {
      const res = await DELETE();
      const data = await res.json();
      expect(res.status).toBe(403);
      expect(data.error).toContain('immuables');
    });
  });
});


