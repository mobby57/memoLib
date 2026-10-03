import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '@/app/api/teams/[id]/route';
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
      update: vi.fn(),
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

describe('/api/teams/[id]', () => {
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

  describe('GET', () => {
    it('retourne le détail avec ses membres', async () => {
      (prisma as any).team.findFirst.mockResolvedValue({ id: 't1', name: 'Droit social', TeamMember: [] });

      const request = new NextRequest('http://localhost/api/teams/t1');
      const response = await GET(request, makeParams('t1'));

      expect(response.status).toBe(200);
    });

    it("retourne 404 si l'équipe n'existe pas dans ce tenant", async () => {
      (prisma as any).team.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/teams/t1');
      const response = await GET(request, makeParams('t1'));

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH', () => {
    it("renomme l'équipe", async () => {
      (prisma as any).team.findFirst.mockResolvedValue({ id: 't1', tenantId: mockTenantId });
      (prisma as any).team.update.mockResolvedValue({ id: 't1', name: 'Nouveau nom' });

      const request = new NextRequest('http://localhost/api/teams/t1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Nouveau nom' }),
      });
      const response = await PATCH(request, makeParams('t1'));

      expect(response.status).toBe(200);
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

      const request = new NextRequest('http://localhost/api/teams/t1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'x' }),
      });
      const response = await PATCH(request, makeParams('t1'));

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE', () => {
    it("supprime l'équipe existante", async () => {
      (prisma as any).team.findFirst.mockResolvedValue({ id: 't1', tenantId: mockTenantId });
      (prisma as any).team.delete.mockResolvedValue({});

      const request = new NextRequest('http://localhost/api/teams/t1', { method: 'DELETE' });
      const response = await DELETE(request, makeParams('t1'));

      expect(response.status).toBe(200);
    });

    it("retourne 404 si l'équipe n'existe pas", async () => {
      (prisma as any).team.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/teams/t1', { method: 'DELETE' });
      const response = await DELETE(request, makeParams('t1'));

      expect(response.status).toBe(404);
    });
  });
});
