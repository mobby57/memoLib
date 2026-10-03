import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests de /api/intake/[id]/documents : RBAC, validations, appel service.
 */

const mocks = vi.hoisted(() => ({
  authMock: vi.fn(),
  addIntakeUploadedFile: vi.fn(),
  listIntakeUploadedFiles: vi.fn(),
  scanDocumentAsync: vi.fn(),
}));

vi.mock('@/lib/clerk-auth', () => ({ auth: () => mocks.authMock() }));
vi.mock('@/lib/services/intake.service', () => ({
  addIntakeUploadedFile: mocks.addIntakeUploadedFile,
  listIntakeUploadedFiles: mocks.listIntakeUploadedFiles,
}));
vi.mock('@/lib/security/antivirus', () => ({ scanDocumentAsync: mocks.scanDocumentAsync }));

import { POST, GET } from '@/app/api/intake/[id]/documents/route';

const manager = { id: 'u1', role: 'ADMIN', tenantId: 't1', email: 'a@b.fr' };
const client = { id: 'u2', role: 'CLIENT', tenantId: 't1', email: 'c@b.fr' };
const params = { params: Promise.resolve({ id: 'i1' }) };

function uploadReq(fields: { documentLabel?: string; file?: File }) {
  const fd = new FormData();
  if (fields.documentLabel !== undefined) fd.append('documentLabel', fields.documentLabel);
  if (fields.file) fd.append('file', fields.file);
  return new Request('http://localhost/api/intake/i1/documents', { method: 'POST', body: fd }) as any;
}

function pdfFile(name = 'piece.pdf', size = 1024) {
  const blob = new Blob([new Uint8Array(size)], { type: 'application/pdf' });
  return new File([blob], name, { type: 'application/pdf' });
}

beforeEach(() => vi.clearAllMocks());

describe('POST /api/intake/[id]/documents', () => {
  it('403 pour un CLIENT (pas dossiers:manage)', async () => {
    mocks.authMock.mockResolvedValue({ user: client });
    const res = await POST(uploadReq({ documentLabel: 'Passeport', file: pdfFile() }), params);
    expect(res.status).toBe(403);
  });

  it('400 sans documentLabel', async () => {
    mocks.authMock.mockResolvedValue({ user: manager });
    const res = await POST(uploadReq({ file: pdfFile() }), params);
    expect(res.status).toBe(400);
  });

  it('400 sans fichier', async () => {
    mocks.authMock.mockResolvedValue({ user: manager });
    const res = await POST(uploadReq({ documentLabel: 'Passeport' }), params);
    expect(res.status).toBe(400);
  });

  it('400 type non autorisé', async () => {
    mocks.authMock.mockResolvedValue({ user: manager });
    const bad = new File([new Blob(['x'], { type: 'application/x-msdownload' })], 'v.exe', {
      type: 'application/x-msdownload',
    });
    const res = await POST(uploadReq({ documentLabel: 'Passeport', file: bad }), params);
    expect(res.status).toBe(400);
  });

  it('201 dépose la pièce (service appelé) et lance le scan antivirus', async () => {
    mocks.authMock.mockResolvedValue({ user: manager });
    mocks.addIntakeUploadedFile.mockResolvedValue({
      file: { id: 'f1', documentLabel: 'Passeport', fileName: 'piece.pdf' },
      completeness: 80,
    });

    const res = await POST(uploadReq({ documentLabel: 'Passeport', file: pdfFile() }), params);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.completeness).toBe(80);
    expect(mocks.addIntakeUploadedFile).toHaveBeenCalledWith(
      't1',
      'i1',
      expect.objectContaining({ documentLabel: 'Passeport', mimeType: 'application/pdf' }),
      'u1'
    );
    expect(mocks.scanDocumentAsync).toHaveBeenCalled();
  });

  it('404 si la demande n’existe pas', async () => {
    mocks.authMock.mockResolvedValue({ user: manager });
    mocks.addIntakeUploadedFile.mockRejectedValue(new Error('Intake request not found'));
    const res = await POST(uploadReq({ documentLabel: 'Passeport', file: pdfFile() }), params);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/intake/[id]/documents', () => {
  it('liste les pièces (dossiers:read)', async () => {
    mocks.authMock.mockResolvedValue({ user: manager });
    mocks.listIntakeUploadedFiles.mockResolvedValue([{ id: 'f1', fileName: 'piece.pdf' }]);
    const res = await GET({} as any, params);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.count).toBe(1);
    expect(mocks.listIntakeUploadedFiles).toHaveBeenCalledWith('t1', 'i1');
  });
});
