/**
 * Tests IngestionService — point d'entrée unique du flux entrant.
 * Mocke les deux briques orchestrées (InformationUnitService, DossierMatcher).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { create, classify, match } = vi.hoisted(() => ({
  create: vi.fn(),
  classify: vi.fn(),
  match: vi.fn(),
}));

vi.mock('@/lib/services/information-unit.service', () => ({
  informationUnitService: { create, classify },
}));
vi.mock('@/lib/services/dossier-matcher.service', () => ({
  dossierMatcher: { match },
}));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { IngestionService } from '@/lib/services/ingestion.service';

const service = new IngestionService();

describe('IngestionService — orchestration du flux entrant', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chaîne complète : unité créée -> classifiée -> rattachée au dossier', async () => {
    create.mockResolvedValue({ id: 'unit-1' });
    classify.mockResolvedValue({
      caseType: 'OQTF',
      priority: 'critique',
      confidence: 0.92,
      method: 'ai',
      needsHumanReview: false,
    });
    match.mockResolvedValue({
      matched: true,
      dossierId: 'd1',
      clientId: 'c1',
      confidence: 0.9,
      needsHumanReview: false,
      reason: 'unique dossier ouvert',
    });

    const r = await service.ingest({
      tenantId: 't1',
      source: 'EMAIL',
      content: 'OQTF reçue',
      senderEmail: 'jean@dupont.fr',
    });

    expect(r.unitId).toBe('unit-1');
    expect(r.classification.caseType).toBe('OQTF');
    expect(r.dossier.dossierId).toBe('d1');
    expect(r.needsHumanReview).toBe(false);
    // Le type détecté est transmis au matcher pour départager.
    expect(match).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 't1', senderEmail: 'jean@dupont.fr', detectedTypeDossier: 'OQTF' })
    );
  });

  it('needsHumanReview si le rattachement est incertain', async () => {
    create.mockResolvedValue({ id: 'unit-2' });
    classify.mockResolvedValue({
      caseType: 'OQTF',
      confidence: 0.9,
      method: 'ai',
      needsHumanReview: false,
    });
    match.mockResolvedValue({
      matched: false,
      dossierId: null,
      clientId: null,
      confidence: 0,
      needsHumanReview: true,
      reason: 'aucun client identifié',
    });

    const r = await service.ingest({ tenantId: 't1', source: 'EMAIL', content: 'x', senderEmail: 'inconnu@x.fr' });

    expect(r.dossier.matched).toBe(false);
    expect(r.needsHumanReview).toBe(true);
  });

  it('needsHumanReview si la classification est incertaine (même si dossier trouvé)', async () => {
    create.mockResolvedValue({ id: 'unit-3' });
    classify.mockResolvedValue({
      caseType: 'GENERAL',
      confidence: 0.4,
      method: 'ai',
      needsHumanReview: true,
    });
    match.mockResolvedValue({
      matched: true,
      dossierId: 'd1',
      clientId: 'c1',
      confidence: 0.9,
      needsHumanReview: false,
      reason: 'unique dossier',
    });

    const r = await service.ingest({ tenantId: 't1', source: 'SMS', content: 'msg ambigu' });

    expect(r.needsHumanReview).toBe(true);
  });
});
