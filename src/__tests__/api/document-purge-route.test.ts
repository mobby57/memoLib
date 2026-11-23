import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getServerSessionCompat: vi.fn(),
  getSecurePrisma: vi.fn(),
  withTenantContext: vi.fn(),
  withTenantContextTransaction: vi.fn(),
  documentFindFirst: vi.fn(),
  auditCreate: vi.fn(),
  auditUpdate: vi.fn(),
  transactionDocumentFindFirst: vi.fn(),
  documentDelete: vi.fn(),
  deleteDocumentObject: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('@/lib/auth/getServerSessionCompat', () => ({
  getServerSessionCompat: mocks.getServerSessionCompat,
}));
vi.mock('@/lib/prisma', () => ({
  getSecurePrisma: mocks.getSecurePrisma,
  withTenantContext: mocks.withTenantContext,
  withTenantContextTransaction: mocks.withTenantContextTransaction,
}));
vi.mock('@/lib/security/document-storage', () => ({
  deleteDocumentObject: mocks.deleteDocumentObject,
  readDocumentBytes: vi.fn(),
}));
vi.mock('@/lib/logger', () => ({
  logger: { error: mocks.loggerError },
}));

import { DELETE } from '@/app/api/documents/download/[id]/route';

function createRequest(body: unknown = { procedureApplied: true }) {
  return new NextRequest('http://localhost/api/documents/download/document-a', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('DELETE /api/documents/download/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerSessionCompat.mockResolvedValue({
      user: {
        id: 'user-a',
        role: 'AVOCAT',
        tenantId: 'tenant-a',
        email: 'lawyer@example.com',
      },
    });
    mocks.getSecurePrisma.mockResolvedValue({
      document: { findFirst: mocks.documentFindFirst },
    });
    mocks.documentFindFirst.mockResolvedValue({
      id: 'document-a',
      storageKey: 'blob-encrypted:documents/tenant-a/document-a',
      _count: { Proof: 0 },
    });
    mocks.withTenantContext.mockImplementation(
      (_tenantId: string, operation: (transaction: unknown) => unknown) =>
        operation({ auditLog: { create: mocks.auditCreate } })
    );
    mocks.withTenantContextTransaction.mockImplementation(
      (_tenantId: string, operation: (transaction: unknown) => unknown) =>
        operation({
          document: {
            findFirst: mocks.transactionDocumentFindFirst,
            delete: mocks.documentDelete,
          },
          auditLog: { update: mocks.auditUpdate },
        })
    );
    mocks.transactionDocumentFindFirst.mockResolvedValue({
      id: 'document-a',
      _count: { Proof: 0 },
    });
    mocks.deleteDocumentObject.mockResolvedValue({ alreadyMissing: false });
  });

  it('requires explicit confirmation before deleting', async () => {
    const response = await DELETE(createRequest({ procedureApplied: false }), {
      params: Promise.resolve({ id: 'document-a' }),
    });

    expect(response.status).toBe(400);
    expect(mocks.deleteDocumentObject).not.toHaveBeenCalled();
  });

  it('refuses to delete documents linked to a proof', async () => {
    mocks.documentFindFirst.mockResolvedValue({
      id: 'document-a',
      storageKey: 'blob-encrypted:documents/tenant-a/document-a',
      _count: { Proof: 1 },
    });

    const response = await DELETE(createRequest(), {
      params: Promise.resolve({ id: 'document-a' }),
    });

    expect(response.status).toBe(409);
    expect(mocks.deleteDocumentObject).not.toHaveBeenCalled();
  });

  it('deletes storage and records only a minimal audit event after confirmation', async () => {
    const response = await DELETE(createRequest(), {
      params: Promise.resolve({ id: 'document-a' }),
    });

    expect(response.status).toBe(200);
    expect(mocks.deleteDocumentObject).toHaveBeenCalledWith(
      'blob-encrypted:documents/tenant-a/document-a'
    );
    expect(mocks.documentDelete).toHaveBeenCalledWith({ where: { id: 'document-a' } });
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userEmail: 'not-recorded',
          entityId: 'document-a',
          newValue: JSON.stringify({ state: 'purge_requested', procedureApplied: true }),
        }),
      })
    );
    expect(mocks.auditUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          newValue: JSON.stringify({ state: 'storage_deleted', procedureApplied: true }),
        },
      })
    );
  });

  it('keeps the database record when storage deletion is not confirmed', async () => {
    mocks.deleteDocumentObject.mockRejectedValue(new Error('storage unavailable'));

    const response = await DELETE(createRequest(), {
      params: Promise.resolve({ id: 'document-a' }),
    });

    expect(response.status).toBe(503);
    expect(mocks.documentDelete).not.toHaveBeenCalled();
    expect(mocks.withTenantContextTransaction).not.toHaveBeenCalled();
  });
});
