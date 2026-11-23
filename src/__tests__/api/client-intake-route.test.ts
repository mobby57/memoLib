import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  checkRateLimit: vi.fn(),
  findActiveClientDossierGrant: vi.fn(),
  withTenantContextBatch: vi.fn(),
  documentCreate: vi.fn(),
  mkdir: vi.fn(),
  unlink: vi.fn(),
  writeFile: vi.fn(),
  scanDocumentAsync: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock('@/lib/client-access', () => ({
  findActiveClientDossierGrant: mocks.findActiveClientDossierGrant,
}));
vi.mock('@/lib/prisma', () => ({
  withTenantContextBatch: mocks.withTenantContextBatch,
}));
vi.mock('@/lib/security/antivirus', () => ({
  scanDocumentAsync: mocks.scanDocumentAsync,
}));
vi.mock('@/lib/logger', () => ({
  logger: { error: mocks.loggerError },
}));
vi.mock('node:fs/promises', () => ({
  mkdir: mocks.mkdir,
  unlink: mocks.unlink,
  writeFile: mocks.writeFile,
}));

import { POST } from '@/app/api/client/intake/route';

function createRequest(payload: unknown) {
  return new Request('http://localhost/api/client/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

describe('/api/client/intake', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: 'clerk-user-id' });
    mocks.checkRateLimit.mockResolvedValue({ success: true });
    mocks.findActiveClientDossierGrant.mockResolvedValue({
      user: { id: 'database-user-id', role: 'CLIENT' },
      grant: { tenantId: 'tenant-a' },
    });
    mocks.withTenantContextBatch.mockResolvedValue([]);
    mocks.documentCreate.mockResolvedValue({ id: 'document-id' });
    mocks.mkdir.mockResolvedValue(undefined);
    mocks.unlink.mockResolvedValue(undefined);
    mocks.writeFile.mockResolvedValue(undefined);
    mocks.scanDocumentAsync.mockResolvedValue(undefined);
  });

  it('rejects incomplete answers before checking access or writing', async () => {
    const response = await POST(createRequest({
      dossierId: 'dossier-a',
      originalLang: 'fr',
      answers: { q1: 'Situation décrite' },
    }));

    expect(response.status).toBe(400);
    expect(mocks.findActiveClientDossierGrant).not.toHaveBeenCalled();
    expect(mocks.withTenantContextBatch).not.toHaveBeenCalled();
  });

  it('rejects users without an active grant before storing data', async () => {
    mocks.findActiveClientDossierGrant.mockResolvedValue(null);

    const response = await POST(createRequest({
      dossierId: 'dossier-b',
      originalLang: 'fr',
      answers: { q1: 'Situation décrite', q2: 'Aucun enfant' },
    }));

    expect(response.status).toBe(403);
    expect(mocks.withTenantContextBatch).not.toHaveBeenCalled();
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it('stores the form under the grant tenant and internal user ID', async () => {
    mocks.withTenantContextBatch.mockImplementation(
      async (
        _tenantId: string,
        operations: (client: { document: { create: (args: unknown) => Promise<unknown> } }) => Promise<unknown>[]
      ) => Promise.all(operations({ document: { create: mocks.documentCreate } }))
    );

    const response = await POST(createRequest({
      dossierId: 'dossier-a',
      originalLang: 'fr',
      answers: { q1: 'Situation décrite', q2: 'Aucun enfant' },
    }));

    expect(response.status).toBe(201);
    expect(mocks.findActiveClientDossierGrant).toHaveBeenCalledWith('clerk-user-id', 'dossier-a');
    expect(mocks.withTenantContextBatch).toHaveBeenCalledWith('tenant-a', expect.any(Function));
    expect(mocks.documentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-a',
        dossierId: 'dossier-a',
        uploadedBy: 'database-user-id',
        category: 'client-intake',
      }),
    });
    expect(mocks.writeFile).toHaveBeenCalledTimes(1);
    expect(mocks.scanDocumentAsync).toHaveBeenCalledTimes(1);
  });

  it('stores the portal submission as a document requiring review', async () => {
    mocks.withTenantContextBatch.mockImplementation(
      async (
        _tenantId: string,
        operations: (client: { document: { create: (args: unknown) => Promise<unknown> } }) => Promise<unknown>[]
      ) => Promise.all(operations({ document: { create: mocks.documentCreate } }))
    );
    const response = await POST(createRequest({
      dossierId: 'dossier-a',
      originalLang: 'fr',
      answers: { nom: 'Test', prenom: 'Client', adresse: 'Adresse fictive', recit: 'Situation fictive' },
    }));

    expect(response.status).toBe(201);
    expect(mocks.documentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ dossierId: 'dossier-a', category: 'client-intake' }),
    });
    expect(mocks.writeFile).toHaveBeenCalledOnce();
  });
});
