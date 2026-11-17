import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getServerSessionCompat: vi.fn(),
  documentFindFirst: vi.fn(),
  documentFindMany: vi.fn(),
  dossierFindFirst: vi.fn(),
  clientFindFirst: vi.fn(),
  documentCreate: vi.fn(),
  getSecurePrisma: vi.fn(),
}));

vi.mock('@/lib/auth/getServerSessionCompat', () => ({
  getServerSessionCompat: mocks.getServerSessionCompat,
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    document: {
      findFirst: mocks.documentFindFirst,
      findMany: mocks.documentFindMany,
      create: mocks.documentCreate,
    },
    dossier: { findFirst: mocks.dossierFindFirst },
    client: { findFirst: mocks.clientFindFirst },
  },
  getSecurePrisma: mocks.getSecurePrisma,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

import { GET, POST } from '@/app/api/documents/route';
import { GET as GETDocumentDownload } from '@/app/api/documents/download/route';
import { GET as GETDocumentDownloadById } from '@/app/api/documents/download/[id]/route';

describe('/api/documents tenant scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSecurePrisma.mockResolvedValue({
      document: { findFirst: mocks.documentFindFirst },
    });
  });

  it('requires an authenticated session for document reads', async () => {
    mocks.getServerSessionCompat.mockResolvedValue(null);
    const response = await GET(new NextRequest('http://localhost/api/documents?id=document-b'));

    expect(response.status).toBe(401);
    expect(mocks.documentFindFirst).not.toHaveBeenCalled();
  });

  it('limits direct document lookups to the active tenant', async () => {
    mocks.getServerSessionCompat.mockResolvedValue({
      user: {
        id: 'user-a',
        role: 'AVOCAT',
        tenantId: 'tenant-a',
        clientId: null,
      },
    });
    mocks.documentFindFirst.mockResolvedValue(null);

    const response = await GET(new NextRequest('http://localhost/api/documents?id=document-b'));

    expect(response.status).toBe(404);
    expect(mocks.documentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'document-b', tenantId: 'tenant-a' }) })
    );
  });

  it('uses the session tenant rather than caller-supplied tenant and uploader IDs', async () => {
    mocks.getServerSessionCompat.mockResolvedValue({
      user: {
        id: 'user-a',
        role: 'AVOCAT',
        tenantId: 'tenant-a',
        clientId: null,
      },
    });
    mocks.dossierFindFirst.mockResolvedValue(null);

    const formData = new FormData();
    formData.set('file', new File([new Uint8Array([37, 80, 68, 70])], 'test.pdf', {
      type: 'application/pdf',
    }));
    formData.set('tenantId', 'tenant-b');
    formData.set('uploadedBy', 'user-b');
    formData.set('dossierId', 'dossier-b');

    const response = await POST(
      new NextRequest('http://localhost/api/documents', { method: 'POST', body: formData })
    );

    expect(response.status).toBe(404);
    expect(mocks.dossierFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'dossier-b', tenantId: 'tenant-a' }),
      })
    );
    expect(mocks.documentCreate).not.toHaveBeenCalled();
  });

  it('scopes the download-by-query route to the session tenant', async () => {
    mocks.getServerSessionCompat.mockResolvedValue({
      user: { id: 'user-a', role: 'AVOCAT', tenantId: 'tenant-a', clientId: null },
    });
    mocks.documentFindFirst.mockResolvedValue(null);

    const response = await GETDocumentDownload(
      new NextRequest('http://localhost/api/documents/download?id=document-a')
    );

    expect(response.status).toBe(404);
    expect(mocks.documentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'document-a', tenantId: 'tenant-a' }),
      })
    );
  });

  it('rejects a local download path that escapes the uploads directory', async () => {
    mocks.getServerSessionCompat.mockResolvedValue({
      user: { id: 'user-a', role: 'AVOCAT', tenantId: 'tenant-a', clientId: null },
    });
    mocks.documentFindFirst.mockResolvedValue({
      id: 'document-a',
      storageKey: '/uploads/../../outside.txt',
      filename: 'outside.txt',
      mimeType: 'text/plain',
      antivirusStatus: 'CLEAN',
    });

    const response = await GETDocumentDownload(
      new NextRequest('http://localhost/api/documents/download?id=document-a')
    );

    expect(response.status).toBe(400);
  });

  it('requires a linked client before allowing client document downloads', async () => {
    mocks.getServerSessionCompat.mockResolvedValue({
      user: { id: 'user-a', role: 'CLIENT', tenantId: 'tenant-a', clientId: null },
    });

    const response = await GETDocumentDownload(
      new NextRequest('http://localhost/api/documents/download?id=document-a')
    );

    expect(response.status).toBe(403);
    expect(mocks.documentFindFirst).not.toHaveBeenCalled();
    expect(mocks.getSecurePrisma).not.toHaveBeenCalled();
  });

  it('scopes ID downloads to the tenant and client relationship', async () => {
    mocks.getServerSessionCompat.mockResolvedValue({
      user: { id: 'user-a', role: 'CLIENT', tenantId: 'tenant-a', clientId: 'client-a' },
    });
    mocks.documentFindFirst.mockResolvedValue(null);

    const response = await GETDocumentDownloadById(
      new NextRequest('http://localhost/api/documents/download/document-a'),
      { params: Promise.resolve({ id: 'document-a' }) }
    );

    expect(response.status).toBe(404);
    expect(mocks.documentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'document-a',
          tenantId: 'tenant-a',
          OR: [{ clientId: 'client-a' }, { Dossier: { clientId: 'client-a' } }],
        },
      })
    );
  });

  it('rejects ID downloads whose local path escapes the uploads directory', async () => {
    mocks.getServerSessionCompat.mockResolvedValue({
      user: { id: 'user-a', role: 'AVOCAT', tenantId: 'tenant-a', clientId: null },
    });
    mocks.documentFindFirst.mockResolvedValue({
      id: 'document-a',
      tenantId: 'tenant-a',
      clientId: null,
      filename: 'outside.txt',
      mimeType: 'text/plain',
      storageKey: '/uploads/../../outside.txt',
      size: 12,
      antivirusStatus: 'CLEAN',
    });

    const response = await GETDocumentDownloadById(
      new NextRequest('http://localhost/api/documents/download/document-a'),
      { params: Promise.resolve({ id: 'document-a' }) }
    );

    expect(response.status).toBe(400);
  });
});
