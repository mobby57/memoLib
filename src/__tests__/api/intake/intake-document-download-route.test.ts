import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests de GET /api/intake/[id]/documents/[fileId] : RBAC, 404, intégrité,
 * téléchargement déchiffré + audit.
 */

const mocks = vi.hoisted(() => ({
  authMock: vi.fn(),
  getIntakeUploadedFile: vi.fn(),
  deleteIntakeUploadedFile: vi.fn(),
  createAuditLog: vi.fn(),
}));

vi.mock('@/lib/clerk-auth', () => ({ auth: () => mocks.authMock() }));
vi.mock('@/lib/services/intake.service', () => ({
  getIntakeUploadedFile: mocks.getIntakeUploadedFile,
  deleteIntakeUploadedFile: mocks.deleteIntakeUploadedFile,
}));
vi.mock('@/lib/security/audit-trail', () => ({ createAuditLog: mocks.createAuditLog }));

import { GET, DELETE } from '@/app/api/intake/[id]/documents/[fileId]/route';

const reader = { id: 'u1', role: 'COLLABORATEUR', tenantId: 't1', email: 'l@b.fr' };
const client = { id: 'u3', role: 'CLIENT', tenantId: 't1', email: 'c@b.fr' };
const manager = { id: 'u2', role: 'ADMIN', tenantId: 't1', email: 'a@b.fr' };
const params = { params: Promise.resolve({ id: 'i1', fileId: 'f1' }) };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createAuditLog.mockResolvedValue({});
});

describe('GET /api/intake/[id]/documents/[fileId]', () => {
  it('401 si non authentifié', async () => {
    mocks.authMock.mockResolvedValue({ user: null });
    const res = await GET({} as any, params);
    expect(res.status).toBe(401);
  });

  it('404 si la pièce est introuvable', async () => {
    mocks.authMock.mockResolvedValue({ user: reader });
    mocks.getIntakeUploadedFile.mockResolvedValue(null);
    const res = await GET({} as any, params);
    expect(res.status).toBe(404);
  });

  it('422 si l’intégrité échoue', async () => {
    mocks.authMock.mockResolvedValue({ user: reader });
    mocks.getIntakeUploadedFile.mockRejectedValue(new Error('Integrity check failed for uploaded file'));
    const res = await GET({} as any, params);
    expect(res.status).toBe(422);
  });

  it('renvoie le fichier déchiffré + audit', async () => {
    mocks.authMock.mockResolvedValue({ user: reader });
    mocks.getIntakeUploadedFile.mockResolvedValue({
      meta: { id: 'f1', fileName: 'piece.pdf', mimeType: 'application/pdf' },
      content: Buffer.from('%PDF-1.4 fake'),
    });

    const res = await GET({} as any, params);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('piece.pdf');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(mocks.getIntakeUploadedFile).toHaveBeenCalledWith('t1', 'i1', 'f1');
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DOWNLOAD', sensitiveData: true })
    );
  });
});

describe('DELETE /api/intake/[id]/documents/[fileId]', () => {
  it('403 pour un CLIENT (pas dossiers:manage)', async () => {
    mocks.authMock.mockResolvedValue({ user: client });
    const res = await DELETE({} as any, params);
    expect(res.status).toBe(403);
    expect(mocks.deleteIntakeUploadedFile).not.toHaveBeenCalled();
  });

  it('404 si la pièce n’existe pas', async () => {
    mocks.authMock.mockResolvedValue({ user: manager });
    mocks.deleteIntakeUploadedFile.mockResolvedValue({ deleted: false, completeness: 40 });
    const res = await DELETE({} as any, params);
    expect(res.status).toBe(404);
  });

  it('supprime la pièce (dossiers:manage) et renvoie la complétude', async () => {
    mocks.authMock.mockResolvedValue({ user: manager });
    mocks.deleteIntakeUploadedFile.mockResolvedValue({ deleted: true, completeness: 20 });
    const res = await DELETE({} as any, params);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ deleted: true, completeness: 20 });
    expect(mocks.deleteIntakeUploadedFile).toHaveBeenCalledWith('t1', 'i1', 'f1', 'u2');
  });
});
