/**
 * Test d'INTÉGRATION (DB réelle) — attrape la dérive schéma↔code qui était
 * masquée par les mocks. Nécessite une vraie DATABASE_URL (DB Docker locale).
 *
 * Exclu de test:ci (dossier integration). Lancer via :
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/memolib \
 *     npx vitest run src/__tests__/integration/information-unit-db.test.ts
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// IA mockée (on teste la persistance, pas l'IA). Fallback regex utilisé.
vi.mock('@/lib/ai/hybrid-client', () => ({
  hybridAI: { generateWithCostControl: vi.fn().mockRejectedValue(new Error('no ai in test')) },
}));

const prisma = new PrismaClient();
const TENANT_ID = 'e2e-test-tenant'; // seedé par prisma/seed-e2e-user.ts

let InformationUnitService: any;

describe('[Intégration DB] InformationUnitService contre le schéma réel', () => {
  beforeAll(async () => {
    ({ InformationUnitService } = await import('@/lib/services/information-unit.service'));
    // S'assurer que le tenant de test existe (idempotent minimal).
    await prisma.tenant.upsert({
      where: { id: TENANT_ID },
      update: {},
      create: {
        id: TENANT_ID,
        name: 'Cabinet E2E Test',
        subdomain: `e2e-${Date.now()}`,
        planId: 'e2e-plan',
        status: 'active',
        updatedAt: new Date(),
      },
    }).catch(() => {});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('crée une unité réelle + historique en table, sans colonne fantôme', async () => {
    const service = new InformationUnitService();
    const content = `Contenu intégration ${crypto.randomUUID()}`;

    const unit = await service.create({
      tenantId: TENANT_ID,
      source: 'EMAIL',
      content,
      sourceMetadata: { emailId: 'int-1' },
    });

    // 1. L'unité existe réellement en base
    const persisted = await prisma.informationUnit.findUnique({ where: { id: unit.id } });
    expect(persisted).not.toBeNull();
    expect(persisted!.currentStatus).toBe('CLASSIFIED'); // RECEIVED -> CLASSIFIED
    // metadata/sourceMetadata sont des chaînes JSON (colonnes text)
    expect(typeof persisted!.sourceMetadata).toBe('string');
    expect(JSON.parse(persisted!.sourceMetadata!)).toEqual({ emailId: 'int-1' });

    // 2. L'historique est dans la table dédiée (RECEIVED puis CLASSIFIED)
    const history = await prisma.informationStatusHistory.findMany({
      where: { unitId: unit.id },
      orderBy: { changedAt: 'asc' },
    });
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0].toStatus).toBe('RECEIVED');
    expect(history[history.length - 1].toStatus).toBe('CLASSIFIED');

    // 3. exportAuditTrail lit bien depuis la table
    const audit = await service.exportAuditTrail(unit.id);
    expect(audit.statusHistory.length).toBeGreaterThanOrEqual(2);

    // Nettoyage
    await prisma.informationStatusHistory.deleteMany({ where: { unitId: unit.id } });
    await prisma.informationUnit.delete({ where: { id: unit.id } });
  });
});
