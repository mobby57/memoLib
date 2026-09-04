import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/teams/route';
import prisma from '@/lib/prisma';

const mockTenantId = 'tenant-123';

let mockSessionUser: Record<string, unknown> | undefined = {
  id: 'user-123',
  role: 'AVOCAT',
  tenantId: mockTenantId,
  email: 'user@test.com',
};

vi.mock('@/lib/clerk-auth', () => ({
  auth: vi.fn(async () => (mockSessionUser ? { user: mockSessionUser } : { user: null })),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    team: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  };
  return { __esModule: true, default: mockPrisma };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('/api/teams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionUser = { id: 'user-123', role: 'AVOCAT', tenantId: mockTenantId, email: 'user@test.com' };
  });

  describe('GET', () => {
    it('liste les équipes du tenant', async () => {
      (prisma as any).team.findMany.mockResolvedValue([{ id: 't1', name: 'Droit social' }]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.teams).toHaveLength(1);
    });

    it('refuse (401) sans session', async () => {
      mockSessionUser = undefined;
      const response = await GET();
      expect(response.status).toBe(401);
    });
  });

  describe('POST', () => {
    it('crée une équipe pour un AVOCAT (permission users:manage)', async () => {
      (prisma as any).team.create.mockResolvedValue({ id: 't1', name: 'Contentieux' });

      const request = new NextRequest('http://localhost/api/teams', {
        method: 'POST',
        body: JSON.stringify({ name: 'Contentieux' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('refuse (403) pour un rôle sans permission users:manage (STAGIAIRE)', async () => {
      mockSessionUser = { id: 'user-1', role: 'STAGIAIRE', tenantId: mockTenantId };

      const request = new NextRequest('http://localhost/api/teams', {
        method: 'POST',
        body: JSON.stringify({ name: 'Contentieux' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('refuse (400) si le nom est manquant', async () => {
      const request = new NextRequest('http://localhost/api/teams', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('retourne 409 si le nom existe déjà (contrainte unique tenantId+name)', async () => {
      (prisma as any).team.create.mockRejectedValue({ code: 'P2002' });

      const request = new NextRequest('http://localhost/api/teams', {
        method: 'POST',
        body: JSON.stringify({ name: 'Contentieux' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(409);
    });
  });
});
