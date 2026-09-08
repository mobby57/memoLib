import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

/**
 * Tests de purge RGPD des demandes d'intake : purge unitaire, purge par email,
 * et job cron de rétention. Storage mocké (compte les suppressions).
 */

const store = new Set<string>();

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  storageDelete: vi.fn(),
  createAuditLog: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    intakeRequest: {
      findFirst: mocks.findFirst,
      findMany: mocks.findMany,
      delete: mocks.delete,
      deleteMany: mocks.deleteMany,
    },
  },
  prisma: {
    intakeRequest: {
      findFirst: mocks.findFirst,
      findMany: mocks.findMany,
      delete: mocks.delete,
      deleteMany: mocks.deleteMany,
    },
  },
}));

vi.mock('@/lib/storage', () => ({
  getStorageService: () => ({
    upload: async () => ({}),
    download: async () => Buffer.from(''),
    delete: async (key: string) => {
      mocks.storageDelete(key);
      store.delete(key);
    },
    exists: async () => true,
    list: async () => [],
  }),
}));

vi.mock('@/lib/security/audit-trail', () => ({ createAuditLog: mocks.createAuditLog }));

let purgeIntakeRequest: typeof import('@/lib/services/intake.service').purgeIntakeRequest;
let purgeIntakeByClientEmail: typeof import('@/lib/services/intake.service').purgeIntakeByClientEmail;
let runIntakePurge: typeof import('@/lib/cron/intake-purge').runIntakePurge;

beforeAll(async () => {
  process.env.ENCRYPTION_MASTER_KEY = 'test-master-key-of-sufficient-length-1234567890';
  ({ purgeIntakeRequest, purgeIntakeByClientEmail } = await import('@/lib/services/intake.service'));
  ({ runIntakePurge } = await import('@/lib/cron/intake-purge'));
});

beforeEach(() => {
  vi.clearAllMocks();
  store.clear();
  mocks.createAuditLog.mockResolvedValue({});
  mocks.delete.mockResolvedValue({});
  mocks.deleteMany.mockResolvedValue({ count: 0 });
});

describe('purgeIntakeRequest', () => {
  it('supprime les fichiers du storage puis la ligne, et audite', async () => {
    mocks.findFirst.mockResolvedValue({
      id: 'i1',
      tenantId: 't1',
      uploadedFiles: [
        { id: 'f1', storageKey: 'intake/t1/i1/f1.enc', documentLabel: 'X' },
        { id: 'f2', storageKey: 'intake/t1/i1/f2.enc', documentLabel: 'Y' },
      ],
    });

    const res = await purgeIntakeRequest('t1', 'i1', 'admin');

    expect(res).toEqual({ purgedRequests: 1, purgedFiles: 2 });
    expect(mocks.storageDelete).toHaveBeenCalledTimes(2);
    expect(mocks.delete).toHaveBeenCalledWith({ where: { id: 'i1' } });
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DELETE', sensitiveData: true })
    );
  });

  it('no-op si la demande n’existe pas', async () => {
    mocks.findFirst.mockResolvedValue(null);
    const res = await purgeIntakeRequest('t1', 'absent');
    expect(res).toEqual({ purgedRequests: 0, purgedFiles: 0 });
    expect(mocks.delete).not.toHaveBeenCalled();
  });
});

describe('purgeIntakeByClientEmail', () => {
  it('purge toutes les demandes de l’email (via hash) + fichiers', async () => {
    mocks.findMany.mockResolvedValue([
      { id: 'i1', uploadedFiles: [{ id: 'f1', storageKey: 'k1' }] },
      { id: 'i2', uploadedFiles: [] },
    ]);

    const res = await purgeIntakeByClientEmail('t1', 'Client@Example.com', 'admin');

    expect(res.purgedRequests).toBe(2);
    expect(res.purgedFiles).toBe(1);
    // La recherche se fait par hash (jamais l'email en clair).
    const whereArg = mocks.findMany.mock.calls[0][0].where;
    expect(whereArg.clientEmailHash).toBeDefined();
    expect(whereArg.clientEmailHash).not.toContain('@');
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { tenantId: 't1', id: { in: ['i1', 'i2'] } },
    });
  });
});

describe('runIntakePurge (cron rétention)', () => {
  it('dry-run : scanne sans supprimer', async () => {
    mocks.findMany.mockResolvedValue([{ id: 'i1', tenantId: 't1' }]);
    const res = await runIntakePurge({ dryRun: true, retentionDays: 30 });
    expect(res.dryRun).toBe(true);
    expect(res.scanned).toBe(1);
    expect(res.purgedRequests).toBe(0);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it('purge réelle : applique la rétention et supprime', async () => {
    mocks.findMany.mockResolvedValue([{ id: 'i1', tenantId: 't1' }]);
    mocks.findFirst.mockResolvedValue({ id: 'i1', tenantId: 't1', uploadedFiles: [] });

    const res = await runIntakePurge({ retentionDays: 365 });
    expect(res.scanned).toBe(1);
    expect(res.purgedRequests).toBe(1);
    // Le filtre applique le cutoff (updatedAt < cutoff) et le statut.
    const whereArg = mocks.findMany.mock.calls[0][0].where;
    expect(whereArg.updatedAt.lt).toBeInstanceOf(Date);
    expect(whereArg.status.in).toContain('COMPLETE');
  });
});
