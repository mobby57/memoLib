import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests du service d'export coffre-fort intake.
 * On mocke prisma, getIntakeRequest, encryptFile et l'audit pour vérifier :
 *  - agrégation des demandes du tenant
 *  - génération d'un buffer Excel non vide
 *  - chiffrement du fichier (encryptFile appelé sur le buffer)
 *  - audit de l'export
 */

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  getIntakeRequest: vi.fn(),
  encryptFile: vi.fn(),
  createAuditLog: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: { intakeRequest: { findMany: mocks.findMany } },
  prisma: { intakeRequest: { findMany: mocks.findMany } },
}));

vi.mock('@/lib/security/encryption', () => ({
  encryptFile: mocks.encryptFile,
}));

vi.mock('@/lib/services/intake.service', () => ({
  getIntakeRequest: mocks.getIntakeRequest,
}));

vi.mock('@/lib/security/audit-trail', () => ({
  createAuditLog: mocks.createAuditLog,
}));

import { exportIntakeVault } from '@/lib/services/intake-export.service';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.encryptFile.mockImplementation(async (buf: Buffer) => Buffer.concat([Buffer.from('ENC:'), buf]));
  mocks.createAuditLog.mockResolvedValue({});
});

describe('exportIntakeVault', () => {
  it('agrège les demandes, génère un Excel chiffré et audite', async () => {
    mocks.findMany.mockResolvedValue([{ id: 'i1' }, { id: 'i2' }]);
    mocks.getIntakeRequest.mockImplementation(async (_t: string, id: string) => ({
      id,
      type: 'OQTF',
      status: 'IN_PROGRESS',
      clientEmail: 'c@ex.fr',
      completeness: 50,
      data: { nom: 'X' },
      requiredDocuments: ['Passeport', 'Justificatif'],
      providedDocuments: ['Passeport'],
    }));

    const result = await exportIntakeVault('t1', { actorUserId: 'u1' });

    expect(result.count).toBe(2);
    expect(result.filename).toMatch(/^intake-vault-\d{4}-\d{2}-\d{2}\.xlsx\.enc$/);
    // Buffer chiffré (préfixe injecté par le mock encryptFile).
    expect(result.encrypted.subarray(0, 4).toString()).toBe('ENC:');
    // Le buffer Excel sous-jacent est non vide (signature ZIP "PK").
    expect(result.encrypted.subarray(4, 6).toString()).toBe('PK');
    // Chiffrement appelé + audit.
    expect(mocks.encryptFile).toHaveBeenCalledTimes(1);
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'EXPORT', sensitiveData: true })
    );
  });

  it('scope la requête au tenant', async () => {
    mocks.findMany.mockResolvedValue([]);
    await exportIntakeVault('t9');
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 't9' }) })
    );
  });

  it('rejette sans tenantId', async () => {
    await expect(exportIntakeVault('')).rejects.toThrow('tenantId is required');
  });
});
