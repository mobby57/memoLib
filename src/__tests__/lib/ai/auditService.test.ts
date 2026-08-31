import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Redéfinir le module @/lib/prisma avec le vrai client
vi.doMock('@/lib/prisma', () => ({
  prisma: new PrismaClient(),
}));

// Importer le service APRÈS le mock
const { AuditService } = await import('@/lib/ai/auditService');
const service = new AuditService();

// Récupérer le prisma pour les assertions
const { prisma } = await import('@/lib/prisma');

describe('AuditService', () => {
  const testEntry = {
    tenantId: 'test-tenant',
    userId: 'test-user',
    entityType: 'email' as const,
    entityId: 'email-123',
    decisionType: 'classification' as const,
    input: { text: 'OQTF reçue le 15/01' },
    output: { type: 'OQTF' },
    confidence: 0.85,
    source: 'ia' as const,
  };

  beforeAll(async () => {
    await prisma.aIDecision.deleteMany({ where: { entityId: { in: ['email-123', 'email-456', 'unreviewed-1'] } } });
  });

  afterAll(async () => {
    await prisma.aIDecision.deleteMany({ where: { entityId: { in: ['email-123', 'email-456', 'unreviewed-1'] } } });
  });

  it('devrait enregistrer une décision', async () => {
    await service.logDecision(testEntry);
    const entries = await prisma.aIDecision.findMany({
      where: { entityId: 'email-123' },
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].decisionType).toBe('classification');
  });

  it('devrait marquer une décision comme revue', async () => {
    const entry = await prisma.aIDecision.create({
      data: {
        ...testEntry,
        id: 'test-id',
        blockchainHash: 'hash',
      },
    });
    await service.markReviewed(entry.id, 'reviewer-123');
    const updated = await prisma.aIDecision.findUnique({
      where: { id: entry.id },
    });
    expect(updated?.humanReviewed).toBe(true);
    expect(updated?.reviewedBy).toBe('reviewer-123');
  });

  it('devrait récupérer l’historique', async () => {
    await prisma.aIDecision.create({
      data: {
        ...testEntry,
        entityId: 'email-456',
        id: 'history-1',
        blockchainHash: 'hash2',
      },
    });
    const history = await service.getHistory('email-456', 'email');
    expect(history).toHaveLength(1);
    expect(history[0].entityId).toBe('email-456');
  });

  it('devrait récupérer les décisions non revues', async () => {
    await prisma.aIDecision.create({
      data: {
        ...testEntry,
        tenantId: 'tenant-unreviewed',
        entityId: 'unreviewed-1',
        id: 'unreviewed-1',
        blockchainHash: 'hash3',
        humanReviewed: false,
      },
    });
    const unreviewed = await service.getUnreviewed('tenant-unreviewed');
    expect(unreviewed.length).toBeGreaterThan(0);
    expect(unreviewed[0].humanReviewed).toBe(false);
  });
});
