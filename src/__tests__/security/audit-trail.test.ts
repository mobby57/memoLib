/**
 * Tests unitaires — audit-trail.ts
 * Coverage cible : 80%+
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@prisma/client', () => {
  const auditLog = {
    findFirst: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
  };
  (globalThis as Record<string, unknown>).__auditLogMock = auditLog;

  class MockPrismaClient {
    auditLog = auditLog;
  }

  return {
    PrismaClient: MockPrismaClient,
  };
});

vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
}));
import {
  createAuditLog,
  getAuditLogs,
  generateComplianceReport,
  detectSuspiciousActivity,
  verifyAuditChainIntegrity,
  auditMiddleware,
} from '@/lib/security/audit-trail';

const mockAuditLog = (globalThis as Record<string, unknown>).__auditLogMock as {
  findFirst: vi.Mock;
  create: vi.Mock;
  findMany: vi.Mock;
};

const baseData = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  action: 'CREATE' as const,
  resource: 'DOSSIER' as const,
  description: 'Test action',
  success: true,
};

describe('createAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditLog.findFirst.mockResolvedValue(null);
    mockAuditLog.create.mockResolvedValue({ id: 'log-1', ...baseData });
  });

  it('crée une entrée avec previousHash genesis si aucune entrée précédente', async () => {
    await createAuditLog(baseData);

    expect(mockAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
        }),
      })
    );
  });

  it('chaîne le hash avec l\'entrée précédente', async () => {
    const prevHash = 'abc123def456';
    mockAuditLog.findFirst.mockResolvedValue({ id: 'prev-log', hash: prevHash });

    await createAuditLog(baseData);

    expect(mockAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ previousHash: prevHash }),
      })
    );
  });

  it('génère un hash SHA-256 non vide', async () => {
    await createAuditLog(baseData);

    const callArg = mockAuditLog.create.mock.calls[0][0].data;
    expect(callArg.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('log une alerte sécurité si success=false', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await createAuditLog({ ...baseData, success: false });
    expect(consoleSpy).toHaveBeenCalledWith('[SECURITY ALERT]', expect.any(Object));
    consoleSpy.mockRestore();
  });

  it('log une alerte sécurité si action=DATA_BREACH_ATTEMPT', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await createAuditLog({ ...baseData, action: 'DATA_BREACH_ATTEMPT' });
    expect(consoleSpy).toHaveBeenCalledWith('[SECURITY ALERT]', expect.any(Object));
    consoleSpy.mockRestore();
  });

  it('propage l\'erreur si Prisma échoue', async () => {
    mockAuditLog.create.mockRejectedValue(new Error('DB error'));
    await expect(createAuditLog(baseData)).rejects.toThrow('DB error');
  });

  it('fonctionne sans tenantId (action système)', async () => {
    await createAuditLog({ ...baseData, tenantId: undefined });
    expect(mockAuditLog.create).toHaveBeenCalled();
  });
});

describe('getAuditLogs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne les logs filtrés', async () => {
    const mockLogs = [{ id: 'log-1', action: 'CREATE', resource: 'DOSSIER' }];
    mockAuditLog.findMany.mockResolvedValue(mockLogs);

    const result = await getAuditLogs({ tenantId: 'tenant-1', limit: 10 });

    expect(result).toEqual(mockLogs);
    expect(mockAuditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
        take: 10,
      })
    );
  });

  it('utilise limit=100 par défaut', async () => {
    mockAuditLog.findMany.mockResolvedValue([]);
    await getAuditLogs({});
    expect(mockAuditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });

  it('filtre sensitiveData si sensitiveOnly=true', async () => {
    mockAuditLog.findMany.mockResolvedValue([]);
    await getAuditLogs({ sensitiveOnly: true });
    expect(mockAuditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ sensitiveData: true }),
      })
    );
  });

  it('filtre par dates et action', async () => {
    mockAuditLog.findMany.mockResolvedValue([]);
    const start = new Date('2026-01-01');
    const end = new Date('2026-12-31');
    await getAuditLogs({ action: 'READ', startDate: start, endDate: end, userId: 'u1' });
    expect(mockAuditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'u1',
          action: 'READ',
          timestamp: { gte: start, lte: end },
        }),
      })
    );
  });
});

describe('generateComplianceReport', () => {
  beforeEach(() => vi.clearAllMocks());

  it('génère un rapport avec statistiques correctes', async () => {
    const logs = [
      { action: 'CREATE', resource: 'DOSSIER', success: true, sensitiveData: false, userId: 'u1', timestamp: new Date() },
      { action: 'READ', resource: 'CLIENT', success: true, sensitiveData: true, userId: 'u2', timestamp: new Date() },
      { action: 'DELETE', resource: 'EMAIL', success: false, sensitiveData: true, userId: 'u1', timestamp: new Date() },
    ];
    mockAuditLog.findMany.mockResolvedValue(logs);

    const start = new Date('2026-01-01');
    const end = new Date('2026-12-31');
    const report = await generateComplianceReport('tenant-1', start, end);

    expect(report.statistics.totalActions).toBe(3);
    expect(report.statistics.sensitiveDataAccess).toBe(2);
    expect(report.statistics.failedActions).toBe(1);
    expect(report.statistics.uniqueUsers).toBe(2);
    expect(report.statistics.actionsByType.CREATE).toBe(1);
    expect(report.statistics.resourcesByType.CLIENT).toBe(1);
    expect(report.tenantId).toBe('tenant-1');
    expect(report.logs).toHaveLength(3);
  });
});

describe('detectSuspiciousActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditLog.findFirst.mockResolvedValue(null);
    mockAuditLog.create.mockResolvedValue({ id: 'alert-log' });
  });

  it('détecte les tentatives de login multiples (>5)', async () => {
    const failedLogins = Array(6).fill({ action: 'FAILED_LOGIN', sensitiveData: false, timestamp: new Date() });
    mockAuditLog.findMany.mockResolvedValue(failedLogins);

    const result = await detectSuspiciousActivity('user-1');

    expect(result.suspicious).toBe(true);
    expect(result.details.multipleFailedLogins).toBe(true);
  });

  it('détecte les exports excessifs (>20)', async () => {
    const exports = Array(21).fill({ action: 'EXPORT', sensitiveData: false, timestamp: new Date() });
    mockAuditLog.findMany.mockResolvedValue(exports);

    const result = await detectSuspiciousActivity('user-1');

    expect(result.suspicious).toBe(true);
    expect(result.details.excessiveExports).toBe(true);
  });

  it('détecte les accès en heures inhabituelles', async () => {
    const nightAccess = Array(11).fill(null).map(() => ({
      action: 'READ',
      sensitiveData: false,
      timestamp: new Date('2026-01-01T03:00:00'),
    }));
    mockAuditLog.findMany.mockResolvedValue(nightAccess);

    const result = await detectSuspiciousActivity('user-1', 24);

    expect(result.suspicious).toBe(true);
    expect(result.details.unusualHours).toBe(true);
  });

  it('détecte les accès massifs aux données sensibles', async () => {
    const reads = Array(101).fill({
      action: 'READ',
      sensitiveData: true,
      timestamp: new Date(),
    });
    mockAuditLog.findMany.mockResolvedValue(reads);

    const result = await detectSuspiciousActivity('user-1');

    expect(result.suspicious).toBe(true);
    expect(result.details.massDataAccess).toBe(true);
  });

  it('retourne false si activité normale', async () => {
    mockAuditLog.findMany.mockResolvedValue([
      { action: 'READ', sensitiveData: false, timestamp: new Date() },
    ]);

    const result = await detectSuspiciousActivity('user-1');

    expect(result.suspicious).toBe(false);
  });

  it('crée un log DATA_BREACH_ATTEMPT si activité suspecte', async () => {
    const failedLogins = Array(6).fill({ action: 'FAILED_LOGIN', sensitiveData: false, timestamp: new Date() });
    mockAuditLog.findMany.mockResolvedValue(failedLogins);

    await detectSuspiciousActivity('user-1');

    expect(mockAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'DATA_BREACH_ATTEMPT' }),
      })
    );
  });
});

describe('verifyAuditChainIntegrity', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne valid=true si aucune entrée', async () => {
    mockAuditLog.findMany.mockResolvedValue([]);
    const result = await verifyAuditChainIntegrity('tenant-1');
    expect(result).toEqual({ valid: true, totalEntries: 0 });
  });

  it('détecte une chaîne cassée (previousHash incorrect)', async () => {
    const crypto = await import('crypto');
    const genesis = '0000000000000000000000000000000000000000000000000000000000000000';
    const ts1 = new Date('2026-01-01');
    const hash1 = crypto.createHash('sha256').update(JSON.stringify({
      previousHash: genesis,
      userId: 'u1',
      tenantId: 'tenant-1',
      action: 'CREATE',
      resource: 'DOSSIER',
      resourceId: null,
      description: 'test',
      timestamp: ts1.toISOString(),
    })).digest('hex');

    const entries = [
      {
        id: 'e1',
        userId: 'u1',
        tenantId: 'tenant-1',
        action: 'CREATE',
        resource: 'DOSSIER',
        resourceId: null,
        description: 'test',
        timestamp: ts1,
        previousHash: genesis,
        hash: hash1,
      },
      {
        id: 'e2',
        userId: 'u1',
        tenantId: 'tenant-1',
        action: 'UPDATE',
        resource: 'DOSSIER',
        resourceId: null,
        description: 'test2',
        timestamp: new Date('2026-01-02'),
        previousHash: 'WRONG_HASH',
        hash: 'validhash2',
      },
    ];
    mockAuditLog.findMany.mockResolvedValue(entries);

    const result = await verifyAuditChainIntegrity('tenant-1');

    expect(result.valid).toBe(false);
    expect(result.brokenAt?.id).toBe('e2');
  });

  it('détecte une entrée dont le hash a été altéré', async () => {
    const crypto = await import('crypto');
    const previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date('2026-01-01');
    const validHash = crypto.createHash('sha256').update(JSON.stringify({
      previousHash,
      userId: 'u1',
      tenantId: 'tenant-1',
      action: 'CREATE',
      resource: 'DOSSIER',
      resourceId: null,
      description: 'test',
      timestamp: timestamp.toISOString(),
    })).digest('hex');

    mockAuditLog.findMany.mockResolvedValue([
      {
        id: 'e1',
        userId: 'u1',
        tenantId: 'tenant-1',
        action: 'CREATE',
        resource: 'DOSSIER',
        resourceId: null,
        description: 'test',
        timestamp,
        previousHash,
        hash: validHash.replace('a', 'b'),
      },
    ]);

    const result = await verifyAuditChainIntegrity();

    expect(result.valid).toBe(false);
    expect(result.brokenAt?.position).toBe(0);
  });

  it('valide une chaîne intègre', async () => {
    const crypto = await import('crypto');
    const previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date('2026-01-01');
    const hash = crypto.createHash('sha256').update(JSON.stringify({
      previousHash,
      userId: 'u1',
      tenantId: 'tenant-1',
      action: 'CREATE',
      resource: 'DOSSIER',
      resourceId: null,
      description: 'test',
      timestamp: timestamp.toISOString(),
    })).digest('hex');

    mockAuditLog.findMany.mockResolvedValue([
      {
        id: 'e1',
        userId: 'u1',
        tenantId: 'tenant-1',
        action: 'CREATE',
        resource: 'DOSSIER',
        resourceId: null,
        description: 'test',
        timestamp,
        previousHash,
        hash,
      },
    ]);

    const result = await verifyAuditChainIntegrity('tenant-1');

    expect(result.valid).toBe(true);
    expect(result.totalEntries).toBe(1);
  });
});

describe('auditMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditLog.findFirst.mockResolvedValue(null);
    mockAuditLog.create.mockResolvedValue({ id: 'middleware-log' });
  });

  it('journalise une requête réussie', async () => {
    const middleware = auditMiddleware('READ', 'CLIENT');
    const req = {
      method: 'GET',
      url: '/api/clients/1',
      params: { id: 'client-1' },
      query: {},
      headers: { 'x-forwarded-for': '127.0.0.1', 'user-agent': 'vi' },
      socket: { remoteAddress: '127.0.0.1' },
    };
    const session = { user: { id: 'user-1', tenantId: 'tenant-1' } };

    const result = await middleware(req, session, async () => ({ ok: true }));

    expect(result).toEqual({ ok: true });
    expect(mockAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          tenantId: 'tenant-1',
          action: 'READ',
          resource: 'CLIENT',
          success: true,
          sensitiveData: true,
        }),
      })
    );
  });

  it('journalise une requête en échec', async () => {
    const middleware = auditMiddleware('DELETE', 'DOCUMENT');
    const req = {
      method: 'DELETE',
      url: '/api/documents/1',
      params: { id: 'doc-1' },
      query: {},
      headers: {},
      socket: { remoteAddress: '10.0.0.1' },
    };

    await expect(
      middleware(req, { user: { id: 'user-2' } }, async () => {
        throw new Error('Forbidden');
      })
    ).rejects.toThrow('Forbidden');

    expect(mockAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          success: false,
          metadata: expect.objectContaining({ error: 'Forbidden' }),
        }),
      })
    );
  });
});
