import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE } from '@/app/api/teams/[id]/members/route';
import prisma from '@/lib/prisma';

const mockTenantId = 'tenant-123';

let mockSessionUser: Record<string, unknown> | undefined = {
  id: 'user-123',
  role: 'AVOCAT',
  tenantId: mockTenantId,
};

vi.mock('@/lib/auth', () => ({
  getServerSession: vi.fn(async () => (mockSessionUser ? { user: mockSessionUser } : null)),
}));

vi.mock('@/lib/clerk-auth', () => ({
  auth: vi.fn(async () => ({
    isAuthenticated: Boolean(mockSessionUser),
    clerkUserId: mockSessionUser ? 'clerk_test' : null,
    orgId: null,
    user: mockSessionUser ?? null,
  })),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    team: { findFirst: vi.fn() },
    user: { findFirst: vi.fn() },
    teamMember: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  };
  return { __esModule: true, default: mockPrisma };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('/api/teams/[id]/members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionUser = { id: 'user-123', role: 'AVOCAT', tenantId: mockTenantId };
  });

  describe('POST', () => {
    it('ajoute un membre à une équipe existante', async () => {
      (prisma as any).team.findFirst.mockResolvedValue({ id: 't1', tenantId: mockTenantId });
      (prisma as any).user.findFirst.mockResolvedValue({ id: 'u2' });
      (prisma as any).teamMember.upsert.mockResolvedValue({ id: 'tm1', teamId: 't1', userId: 'u2', role: 'MEMBER' });

      const request = new NextRequest('http://localhost/api/teams/t1/members', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u2', role: 'ATTORNEY' }),
      });
      const response = await POST(request, makeParams('t1'));

      expect(response.status).toBe(200);
    });

    it("retourne 404 si l'équipe n'existe pas", async () => {
      (prisma as any).team.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/teams/t1/members', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u2' }),
      });
      const response = await POST(request, makeParams('t1'));

      expect(response.status).toBe(404);
    });

    it("retourne 404 si l'utilisateur cible n'est pas du même tenant", async () => {
      (prisma as any).team.findFirst.mockResolvedValue({ id: 't1', tenantId: mockTenantId });
      (prisma as any).user.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/teams/t1/members', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u2' }),
      });
      const response = await POST(request, makeParams('t1'));

      expect(response.status).toBe(404);
    });

    it('refuse (403) sans permission users:manage', async () => {
      mockSessionUser = { id: 'user-1', role: 'STAGIAIRE', tenantId: mockTenantId };

      const request = new NextRequest('http://localhost/api/teams/t1/members', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u2' }),
      });
      const response = await POST(request, makeParams('t1'));

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE', () => {
    it("retire un membre de l'équipe", async () => {
      (prisma as any).team.findFirst.mockResolvedValue({ id: 't1', tenantId: mockTenantId });
      (prisma as any).teamMember.findUnique.mockResolvedValue({ id: 'tm1', tenantId: mockTenantId });
      (prisma as any).teamMember.delete.mockResolvedValue({});

      const request = new NextRequest('http://localhost/api/teams/t1/members?userId=u2', { method: 'DELETE' });
      const response = await DELETE(request, makeParams('t1'));

      expect(response.status).toBe(200);
    });

    it("retourne 404 si le membre n'existe pas", async () => {
      (prisma as any).team.findFirst.mockResolvedValue({ id: 't1', tenantId: mockTenantId });
      (prisma as any).teamMember.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/teams/t1/members?userId=u2', { method: 'DELETE' });
      const response = await DELETE(request, makeParams('t1'));

      expect(response.status).toBe(404);
    });
  });
});
