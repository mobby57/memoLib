import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const {
  auth,
  canAccessDossier,
  checkRateLimit,
  findFirst,
  transaction,
  deleteDocument,
  createAuditLog,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  canAccessDossier: vi.fn(),
  checkRateLimit: vi.fn(),
  findFirst: vi.fn(),
  transaction: vi.fn(),
  deleteDocument: vi.fn(),
  createAuditLog: vi.fn(),
}));

vi.mock('@/lib/clerk-auth', () => ({ auth }));
vi.mock('@/lib/auth/dossier-access', () => ({ canAccessDossier }));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit,
  getClientIP: vi.fn(() => '127.0.0.1'),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    document: { findFirst, delete: deleteDocument },
    auditLog: { create: createAuditLog },
    $transaction: transaction,
  },
}));
vi.mock('@/lib/azure/clients', () => ({
  getBlobServiceClient: vi.fn(() => ({
    getContainerClient: vi.fn(() => ({
      getBlockBlobClient: vi.fn(() => ({ deleteIfExists: vi.fn() })),
    })),
  })),
}));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { DELETE } from '@/app/api/documents/[id]/route';
import { GET as download } from '@/app/api/documents/download/[id]/route';
import { GET as downloadByQuery } from '@/app/api/documents/download/route';
import { GET as clientDownload } from '@/app/api/client/documents/[id]/download/route';

describe('document route security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AZURE_STORAGE_CONTAINER = 'private-documents';
    auth.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.test',
        tenantId: 'tenant-1',
        role: 'LAWYER',
        groups: [],
      },
    });
    checkRateLimit.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: new Date(Date.now() + 60_000),
    });
  });

  it('validates document IDs before querying storage or the database', async () => {
    const response = await download(
      new NextRequest('http://localhost/api/documents/download/../../etc/passwd'),
      { params: Promise.resolve({ id: '../../etc/passwd' }) }
    );

    expect(response.status).toBe(400);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('applies the same document-ID validation to the compatibility download route', async () => {
    const response = await downloadByQuery(
      new NextRequest('http://localhost/api/documents/download?id=../../etc/passwd')
    );

    expect(response.status).toBe(400);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('does not query for a malformed client-document identifier', async () => {
    auth.mockResolvedValue({
      user: {
        id: 'user-1',
        tenantId: 'tenant-1',
        clientId: 'client-1',
        role: 'CLIENT',
      },
    });

    const response = await clientDownload(
      new NextRequest('http://localhost/api/client/documents/../../etc/passwd/download'),
      { params: Promise.resolve({ id: '../../etc/passwd' }) }
    );

    expect(response.status).toBe(400);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('requires dossier manage permission, not read permission, for deletion', async () => {
    findFirst.mockResolvedValue({
      id: 'document-1',
      dossierId: 'dossier-1',
      storageKey: 'azure://private-documents/documents/tenant-1/document-1/file.pdf',
      uploadedBy: 'user-1',
    });
    canAccessDossier.mockResolvedValue({ allowed: false });

    const response = await DELETE(
      new NextRequest('http://localhost/api/documents/document-1', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'document-1' }) }
    );

    expect(response.status).toBe(404);
    expect(canAccessDossier).toHaveBeenCalledWith(expect.objectContaining({ action: 'manage' }));
    expect(transaction).not.toHaveBeenCalled();
  });

  it('records an immutable audit entry with the document deletion', async () => {
    findFirst.mockResolvedValue({
      id: 'document-1',
      dossierId: 'dossier-1',
      storageKey: 'azure://private-documents/documents/tenant-1/document-1/file.pdf',
      uploadedBy: 'user-1',
    });
    canAccessDossier.mockResolvedValue({ allowed: true });
    transaction.mockImplementation((callback: (tx: unknown) => unknown) =>
      callback({
        document: { delete: deleteDocument },
        auditLog: { create: createAuditLog },
      })
    );

    const response = await DELETE(
      new NextRequest('http://localhost/api/documents/document-1', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'document-1' }) }
    );

    expect(response.status).toBe(200);
    expect(deleteDocument).toHaveBeenCalledWith({ where: { id: 'document-1' } });
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'DELETE', entityType: 'DOCUMENT' }),
      })
    );
  });
});
