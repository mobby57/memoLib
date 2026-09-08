/**
 * Tests de la classification réelle d'InformationUnitService (réparation :
 * remplacement de la classification simulée par IA + fallback regex).
 *
 * Couvre : chemin IA réussi, fallback regex quand l'IA échoue, et le fait que
 * chaque unité créée transite bien vers CLASSIFIED avec une confiance RÉELLE
 * (plus le 0.89 codé en dur).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, generateWithCostControl } = vi.hoisted(() => ({
  mockPrisma: {
    informationUnit: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  generateWithCostControl: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/ai/hybrid-client', () => ({ hybridAI: { generateWithCostControl } }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));

import { InformationUnitService, InformationUnitStatus } from '@/lib/services/information-unit.service';

const service = new InformationUnitService();

function setupCreateMocks() {
  mockPrisma.informationUnit.findUnique
    // 1er appel: dédup (aucun doublon)
    .mockResolvedValueOnce(null)
    // 2e appel: dans transition() pour lire l'unité créée
    .mockResolvedValueOnce({
      id: 'unit-1',
      currentStatus: InformationUnitStatus.RECEIVED,
      statusHistory: [],
    });
  mockPrisma.informationUnit.create.mockResolvedValue({
    id: 'unit-1',
    currentStatus: InformationUnitStatus.RECEIVED,
  });
  mockPrisma.informationUnit.update.mockResolvedValue({ id: 'unit-1' });
}

describe('[Réparation] InformationUnitService — classification réelle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('utilise la classification IA quand elle réussit (confiance réelle, pas 0.89 simulé)', async () => {
    setupCreateMocks();
    generateWithCostControl.mockResolvedValue({
      response: '{"caseType":"OQTF","priority":"critique","confidence":0.92}',
      model: 'llama3.2:3b',
    });

    await service.create({ tenantId: 't1', source: 'EMAIL', content: 'OQTF reçue, recours urgent' });

    // La transition CLASSIFIED doit porter la confiance IA réelle (0.92), method 'ai'.
    const updateCall = mockPrisma.informationUnit.update.mock.calls[0][0];
    expect(updateCall.data.currentStatus).toBe(InformationUnitStatus.CLASSIFIED);
    expect(updateCall.data.metadata.confidence).toBe(0.92);
    expect(updateCall.data.metadata.method).toBe('ai');
    expect(updateCall.data.metadata.caseType).toBe('OQTF');
    expect(generateWithCostControl).toHaveBeenCalledTimes(1);
  });

  it('bascule sur le fallback regex quand l’IA échoue (jamais d’échec silencieux)', async () => {
    setupCreateMocks();
    generateWithCostControl.mockRejectedValue(new Error('Ollama indisponible'));

    await service.create({
      tenantId: 't1',
      source: 'EMAIL',
      content: 'Bonjour, refus de titre de séjour, je souhaite un recours.',
    });

    const updateCall = mockPrisma.informationUnit.update.mock.calls[0][0];
    expect(updateCall.data.currentStatus).toBe(InformationUnitStatus.CLASSIFIED);
    expect(updateCall.data.metadata.method).toBe('fallback');
    expect(updateCall.data.metadata.classifier).toBe('regex-fallback');
    // La confiance provient du classifieur regex réel (nombre entre 0 et 1).
    expect(typeof updateCall.data.metadata.confidence).toBe('number');
    expect(updateCall.data.metadata.confidence).toBeGreaterThanOrEqual(0);
    expect(updateCall.data.metadata.confidence).toBeLessThanOrEqual(1);
  });

  it('marque needsHumanReview quand la confiance IA est faible', async () => {
    setupCreateMocks();
    generateWithCostControl.mockResolvedValue({
      response: '{"caseType":"GENERAL","priority":"normale","confidence":0.4}',
      model: 'llama3.2:3b',
    });

    await service.create({ tenantId: 't1', source: 'EMAIL', content: 'Message ambigu' });

    const updateCall = mockPrisma.informationUnit.update.mock.calls[0][0];
    expect(updateCall.data.metadata.confidence).toBe(0.4);
    expect(updateCall.data.metadata.needsHumanReview).toBe(true);
  });

  it('retourne l’unité existante sur doublon (dédup SHA-256) sans reclassifier', async () => {
    mockPrisma.informationUnit.findUnique.mockResolvedValueOnce({ id: 'dup', currentStatus: 'RECEIVED' });

    const res = await service.create({ tenantId: 't1', source: 'EMAIL', content: 'déjà vu' });

    expect(res.id).toBe('dup');
    expect(mockPrisma.informationUnit.create).not.toHaveBeenCalled();
    expect(generateWithCostControl).not.toHaveBeenCalled();
  });
});
