/**
 * Tests DossierMatcherService — rattachement automatique au dossier.
 * Importe le service réel; mocke uniquement Prisma.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    client: { findFirst: vi.fn() },
    dossier: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { DossierMatcherService } from '@/lib/services/dossier-matcher.service';

const service = new DossierMatcherService();

describe('DossierMatcherService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('revue humaine si aucun client identifié', async () => {
    mockPrisma.client.findFirst.mockResolvedValue(null);

    const r = await service.match({ tenantId: 't1', senderEmail: 'inconnu@x.fr' });

    expect(r.matched).toBe(false);
    expect(r.needsHumanReview).toBe(true);
    expect(r.dossierId).toBeNull();
  });

  it('revue humaine si client identifié mais aucun dossier ouvert', async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: 'c1' });
    mockPrisma.dossier.findMany.mockResolvedValue([]);

    const r = await service.match({ tenantId: 't1', senderEmail: 'jean@dupont.fr' });

    expect(r.matched).toBe(false);
    expect(r.needsHumanReview).toBe(true);
    expect(r.clientId).toBe('c1');
  });

  it('match haute confiance si un unique dossier ouvert', async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: 'c1' });
    mockPrisma.dossier.findMany.mockResolvedValue([
      { id: 'd1', numero: 'D-2026-0001', typeDossier: 'OQTF' },
    ]);

    const r = await service.match({ tenantId: 't1', senderEmail: 'jean@dupont.fr' });

    expect(r.matched).toBe(true);
    expect(r.dossierId).toBe('d1');
    expect(r.confidence).toBeGreaterThanOrEqual(0.9);
    expect(r.needsHumanReview).toBe(false);
  });

  it('départage plusieurs dossiers par type détecté', async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: 'c1' });
    mockPrisma.dossier.findMany.mockResolvedValue([
      { id: 'd1', numero: 'D-2026-0001', typeDossier: 'OQTF' },
      { id: 'd2', numero: 'D-2026-0002', typeDossier: 'TITRE_SEJOUR' },
    ]);

    const r = await service.match({
      tenantId: 't1',
      senderEmail: 'jean@dupont.fr',
      detectedTypeDossier: 'titre_sejour',
    });

    expect(r.matched).toBe(true);
    expect(r.dossierId).toBe('d2');
    expect(r.needsHumanReview).toBe(false);
  });

  it('revue humaine si plusieurs dossiers non départageables', async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: 'c1' });
    mockPrisma.dossier.findMany.mockResolvedValue([
      { id: 'd1', numero: 'D-2026-0001', typeDossier: 'OQTF' },
      { id: 'd2', numero: 'D-2026-0002', typeDossier: 'OQTF' },
    ]);

    const r = await service.match({
      tenantId: 't1',
      senderEmail: 'jean@dupont.fr',
      detectedTypeDossier: 'OQTF',
    });

    expect(r.matched).toBe(false);
    expect(r.needsHumanReview).toBe(true);
    expect(r.candidates).toHaveLength(2);
  });

  it('identifie le client par nom si pas d’email', async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: 'c9' });
    mockPrisma.dossier.findMany.mockResolvedValue([
      { id: 'd9', numero: 'D-2026-0009', typeDossier: 'ASILE' },
    ]);

    const r = await service.match({ tenantId: 't1', detectedClientName: 'Dupont' });

    expect(r.matched).toBe(true);
    expect(r.clientId).toBe('c9');
    // findFirst appelé avec un OR sur lastName/firstName
    const call = mockPrisma.client.findFirst.mock.calls[0][0];
    expect(JSON.stringify(call.where)).toContain('lastName');
  });
});
