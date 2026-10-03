import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE } from '@/app/api/teams/[id]/members/route';
import prisma from '@/lib/prisma';

const mockTenantId = 'tenant-123';

let mockUser: Record<string, unknown> | null = {
  id: 'user-123',
  role: 'AVOCAT',
  tenantId: mockTenantId,
  email: 'user@test.com',
  name: 'Test User',
};

const { mockAuth, mockPrisma } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrisma: {
    team: {
      findFirst: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
    teamMember: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/clerk-auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
  default: mockPrisma,
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('/api/teams/[id]/members', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUser = {
      id: 'user-123',
      role: 'AVOCAT',
      tenantId: mockTenantId,
      email: 'user@test.com',
      name: 'Test User',
    };

    mockAuth.mockResolvedValue({
      isAuthenticated: true,
      clerkUserId: 'clerk-user-123',
      orgId: 'org-123',
      user: mockUser,
    });
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
      mockUser = {
        id: 'user-1',
        role: 'STAGIAIRE',
        tenantId: mockTenantId,
        email: 'stagiaire@test.com',
        name: 'Test Stagiaire',
      };

      mockAuth.mockResolvedValue({
        isAuthenticated: true,
        clerkUserId: 'clerk-user-2',
        orgId: 'org-123',
        user: mockUser,
      });

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
