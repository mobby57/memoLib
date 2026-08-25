import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PATCH, DELETE } from '@/app/api/dossiers/[id]/members/route';
import prisma from '@/lib/prisma';

const mockTenantId = 'tenant-123';
const mockUserId = 'user-123';

let mockSessionUser: Record<string, unknown> = {
  id: mockUserId,
  role: 'STAGIAIRE', // rôle sans permission RBAC globale, pour tester le manage via DossierMember/responsable
  tenantId: mockTenantId,
  email: 'user@test.com',
};

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: mockSessionUser })),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    dossier: { findFirst: vi.fn() },
    dossierMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    teamMember: { findUnique: vi.fn() },
    user: { findFirst: vi.fn() },
  };
  return { __esModule: true, default: mockPrisma };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('/api/dossiers/[id]/members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionUser = {
      id: mockUserId,
      role: 'STAGIAIRE',
      tenantId: mockTenantId,
      email: 'user@test.com',
    };
    (prisma as any).teamMember.findUnique.mockResolvedValue(null);
  });

  describe('GET', () => {
    it('refuse (404) si le dossier n\'existe pas / autre tenant', async () => {
      (prisma as any).dossier.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/dossiers/d1/members');
      const response = await GET(request, makeParams('d1'));

      expect(response.status).toBe(404);
    });

    it('liste les membres si l\'utilisateur a accès en lecture (RBAC global)', async () => {
      mockSessionUser.role = 'COLLABORATEUR'; // a dossiers:read globalement
      (prisma as any).dossier.findFirst.mockResolvedValue({ id: 'd1', tenantId: mockTenantId, responsableId: null, teamId: null });
      (prisma as any).dossierMember.findMany.mockResolvedValue([
        { id: 'm1', userId: 'u2', role: 'COLLABORATOR', User: { id: 'u2', name: 'Marc', email: 'marc@test.com' } },
      ]);

      const request = new NextRequest('http://localhost/api/dossiers/d1/members');
      const response = await GET(request, makeParams('d1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.members).toHaveLength(1);
    });
  });

  describe('POST', () => {
    it('refuse (403) si l\'utilisateur ne peut pas manage ce dossier', async () => {
      (prisma as any).dossier.findFirst.mockResolvedValue({ id: 'd1', tenantId: mockTenantId, responsableId: 'other', teamId: null });

      const request = new NextRequest('http://localhost/api/dossiers/d1/members', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u2', role: 'COLLABORATOR' }),
      });
      const response = await POST(request, makeParams('d1'));

      expect(response.status).toBe(403);
    });

    it('ajoute un membre si l\'utilisateur est responsable du dossier', async () => {
      (prisma as any).dossier.findFirst.mockResolvedValue({ id: 'd1', tenantId: mockTenantId, responsableId: mockUserId, teamId: null });
      (prisma as any).user.findFirst.mockResolvedValue({ id: 'u2' });
      (prisma as any).dossierMember.upsert.mockResolvedValue({ id: 'm1', dossierId: 'd1', userId: 'u2', role: 'COLLABORATOR' });

      const request = new NextRequest('http://localhost/api/dossiers/d1/members', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u2', role: 'COLLABORATOR' }),
      });
      const response = await POST(request, makeParams('d1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('refuse (404) si l\'utilisateur cible n\'appartient pas au même tenant', async () => {
      (prisma as any).dossier.findFirst.mockResolvedValue({ id: 'd1', tenantId: mockTenantId, responsableId: mockUserId, teamId: null });
      (prisma as any).user.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/dossiers/d1/members', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u2', role: 'COLLABORATOR' }),
      });
      const response = await POST(request, makeParams('d1'));

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH', () => {
    it('modifie le rôle d\'un membre existant', async () => {
      (prisma as any).dossier.findFirst.mockResolvedValue({ id: 'd1', tenantId: mockTenantId, responsableId: mockUserId, teamId: null });
      (prisma as any).dossierMember.findUnique.mockResolvedValue({ id: 'm1', tenantId: mockTenantId });
      (prisma as any).dossierMember.update.mockResolvedValue({ id: 'm1', role: 'VIEWER' });

      const request = new NextRequest('http://localhost/api/dossiers/d1/members', {
        method: 'PATCH',
        body: JSON.stringify({ userId: 'u2', role: 'VIEWER' }),
      });
      const response = await PATCH(request, makeParams('d1'));

      expect(response.status).toBe(200);
    });

    it('refuse (404) si le membre à modifier n\'existe pas', async () => {
      (prisma as any).dossier.findFirst.mockResolvedValue({ id: 'd1', tenantId: mockTenantId, responsableId: mockUserId, teamId: null });
      (prisma as any).dossierMember.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/dossiers/d1/members', {
        method: 'PATCH',
        body: JSON.stringify({ userId: 'u2', role: 'VIEWER' }),
      });
      const response = await PATCH(request, makeParams('d1'));

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE', () => {
    it('retire un membre existant', async () => {
      (prisma as any).dossier.findFirst.mockResolvedValue({ id: 'd1', tenantId: mockTenantId, responsableId: mockUserId, teamId: null });
      (prisma as any).dossierMember.findUnique.mockResolvedValue({ id: 'm1', tenantId: mockTenantId });
      (prisma as any).dossierMember.delete.mockResolvedValue({});

      const request = new NextRequest('http://localhost/api/dossiers/d1/members?userId=u2', {
        method: 'DELETE',
      });
      const response = await DELETE(request, makeParams('d1'));

      expect(response.status).toBe(200);
    });

    it('refuse (403) sans accès manage', async () => {
      (prisma as any).dossier.findFirst.mockResolvedValue({ id: 'd1', tenantId: mockTenantId, responsableId: 'other', teamId: null });

      const request = new NextRequest('http://localhost/api/dossiers/d1/members?userId=u2', {
        method: 'DELETE',
      });
      const response = await DELETE(request, makeParams('d1'));

      expect(response.status).toBe(403);
    });
  });
});
