/**
 * Tests unitaires pour canAccessDossier (Dossier Access Control)
 * Vérifie l'isolation tenant, les admins globaux, le responsable,
 * les DossierMember et les refus d'accès.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    dossier: {
      findFirst: vi.fn(),
    },
    dossierMember: {
      findUnique: vi.fn(),
    },
    teamMember: {
      findUnique: vi.fn(),
    },
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

import prisma from '@/lib/prisma';
import { canAccessDossier } from '@/lib/auth/dossier-access';

const mockedDossierFindFirst = (prisma as any).dossier.findFirst as ReturnType<typeof vi.fn>;
const mockedMemberFindUnique = (prisma as any).dossierMember.findUnique as ReturnType<typeof vi.fn>;
const mockedTeamMemberFindUnique = (prisma as any).teamMember.findUnique as ReturnType<typeof vi.fn>;

describe('canAccessDossier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedTeamMemberFindUnique.mockResolvedValue(null);
  });

  it("refuse l'accès si le dossier n'existe pas dans le tenant (isolation cross-tenant / IDOR)", async () => {
    mockedDossierFindFirst.mockResolvedValue(null);

    const result = await canAccessDossier({
      userId: 'user-1',
      tenantId: 'tenant-A',
      role: 'COLLABORATEUR',
      dossierId: 'dossier-in-tenant-B',
      action: 'read',
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('dossier_not_found');
    // La requête doit être scopée par tenantId (anti-IDOR)
    expect(mockedDossierFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'dossier-in-tenant-B', tenantId: 'tenant-A' } })
    );
  });

  it('autorise un admin global (AVOCAT) même sans être responsable ni membre', async () => {
    mockedDossierFindFirst.mockResolvedValue({ id: 'd1', tenantId: 't1', responsableId: 'someone-else' });
    mockedMemberFindUnique.mockResolvedValue(null);

    const result = await canAccessDossier({
      userId: 'user-1',
      tenantId: 't1',
      role: 'AVOCAT',
      dossierId: 'd1',
      action: 'manage',
    });

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('global_admin');
  });

  it('autorise le responsable du dossier même sans permission RBAC globale de manage', async () => {
    mockedDossierFindFirst.mockResolvedValue({ id: 'd1', tenantId: 't1', responsableId: 'user-1' });
    mockedMemberFindUnique.mockResolvedValue(null);

    const result = await canAccessDossier({
      userId: 'user-1',
      tenantId: 't1',
      role: 'STAGIAIRE',
      dossierId: 'd1',
      action: 'manage',
    });

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('responsable');
  });

  it('autorise un DossierMember COLLABORATOR à écrire mais pas à gérer (manage)', async () => {
    mockedDossierFindFirst.mockResolvedValue({ id: 'd1', tenantId: 't1', responsableId: 'other-user' });
    mockedMemberFindUnique.mockResolvedValue({ role: 'COLLABORATOR' });

    const write = await canAccessDossier({
      userId: 'user-1',
      tenantId: 't1',
      role: 'STAGIAIRE',
      dossierId: 'd1',
      action: 'write',
    });
    expect(write.allowed).toBe(true);
    expect(write.reason).toBe('dossier_member');

    const manage = await canAccessDossier({
      userId: 'user-1',
      tenantId: 't1',
      role: 'STAGIAIRE',
      dossierId: 'd1',
      action: 'manage',
    });
    expect(manage.allowed).toBe(false);
    expect(manage.reason).toBe('no_access');
  });

  it('autorise un DossierMember VIEWER en lecture seule', async () => {
    mockedDossierFindFirst.mockResolvedValue({ id: 'd1', tenantId: 't1', responsableId: 'other-user' });
    mockedMemberFindUnique.mockResolvedValue({ role: 'VIEWER' });

    const read = await canAccessDossier({
      userId: 'user-1',
      tenantId: 't1',
      role: 'STAGIAIRE',
      dossierId: 'd1',
      action: 'read',
    });
    expect(read.allowed).toBe(true);

    const write = await canAccessDossier({
      userId: 'user-1',
      tenantId: 't1',
      role: 'STAGIAIRE',
      dossierId: 'd1',
      action: 'write',
    });
    expect(write.allowed).toBe(false);
    expect(write.reason).toBe('no_access');
  });

  it("refuse l'accès à un utilisateur sans lien avec le dossier (ni admin, ni responsable, ni membre)", async () => {
    mockedDossierFindFirst.mockResolvedValue({ id: 'd1', tenantId: 't1', responsableId: 'other-user' });
    mockedMemberFindUnique.mockResolvedValue(null);

    const result = await canAccessDossier({
      userId: 'user-1',
      tenantId: 't1',
      role: 'STAGIAIRE',
      dossierId: 'd1',
      action: 'write',
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('no_access');
  });

  it('autorise la lecture pour un rôle avec permission RBAC globale dossiers:read (COLLABORATEUR), même non-membre', async () => {
    mockedDossierFindFirst.mockResolvedValue({ id: 'd1', tenantId: 't1', responsableId: 'other-user' });
    mockedMemberFindUnique.mockResolvedValue(null);

    const result = await canAccessDossier({
      userId: 'user-1',
      tenantId: 't1',
      role: 'COLLABORATEUR',
      dossierId: 'd1',
      action: 'read',
    });

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('global_admin');
  });

  it('autorise un membre de l\'équipe assignée au dossier (héritage équipe→dossier) en lecture et écriture', async () => {
    mockedDossierFindFirst.mockResolvedValue({ id: 'd1', tenantId: 't1', responsableId: 'other-user', teamId: 'team-social' });
    mockedMemberFindUnique.mockResolvedValue(null);
    mockedTeamMemberFindUnique.mockResolvedValue({ id: 'tm-1' });

    const write = await canAccessDossier({
      userId: 'user-1',
      tenantId: 't1',
      role: 'STAGIAIRE',
      dossierId: 'd1',
      action: 'write',
    });
    expect(write.allowed).toBe(true);
    expect(write.reason).toBe('team_member');
    expect(mockedTeamMemberFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { teamId_userId: { teamId: 'team-social', userId: 'user-1' } } })
    );
  });

  it("n'accorde jamais 'manage' via le seul héritage équipe (réservé à RBAC global/responsable/DossierMember explicite)", async () => {
    mockedDossierFindFirst.mockResolvedValue({ id: 'd1', tenantId: 't1', responsableId: 'other-user', teamId: 'team-social' });
    mockedMemberFindUnique.mockResolvedValue(null);
    mockedTeamMemberFindUnique.mockResolvedValue({ id: 'tm-1' });

    const manage = await canAccessDossier({
      userId: 'user-1',
      tenantId: 't1',
      role: 'STAGIAIRE',
      dossierId: 'd1',
      action: 'manage',
    });
    expect(manage.allowed).toBe(false);
    expect(manage.reason).toBe('no_access');
  });

  it("refuse l'accès pour un utilisateur hors équipe du dossier et sans autre lien", async () => {
    mockedDossierFindFirst.mockResolvedValue({ id: 'd1', tenantId: 't1', responsableId: 'other-user', teamId: 'team-social' });
    mockedMemberFindUnique.mockResolvedValue(null);
    mockedTeamMemberFindUnique.mockResolvedValue(null);

    const result = await canAccessDossier({
      userId: 'user-1',
      tenantId: 't1',
      role: 'STAGIAIRE',
      dossierId: 'd1',
      action: 'write',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('no_access');
  });
});
