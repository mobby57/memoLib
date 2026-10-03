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
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    informationStatusHistory: {
      create: vi.fn(),
    },
  },
  generateWithCostControl: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/ai/hybrid-client', () => ({ hybridAI: { generateWithCostControl } }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));

import { InformationUnitService, InformationUnitStatus } from '@/lib/services/information-unit.service';

const service = new InformationUnitService();

/** Récupère et parse le metadata (JSON string) du 1er update (transition CLASSIFIED). */
function classifiedMeta() {
  const call = mockPrisma.informationUnit.update.mock.calls[0][0];
  expect(call.data.currentStatus).toBe(InformationUnitStatus.CLASSIFIED);
  return JSON.parse(call.data.metadata);
}

function setupCreateMocks() {
  mockPrisma.informationUnit.findFirst.mockResolvedValueOnce(null);
  mockPrisma.informationUnit.findUnique.mockResolvedValueOnce({
    id: 'unit-1',
    currentStatus: InformationUnitStatus.RECEIVED,
    metadata: null,
  });
  mockPrisma.informationUnit.create.mockResolvedValue({
    id: 'unit-1',
    currentStatus: InformationUnitStatus.RECEIVED,
  });
  mockPrisma.informationUnit.update.mockResolvedValue({ id: 'unit-1' });
  mockPrisma.informationStatusHistory.create.mockResolvedValue({ id: 'h-1' });
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

    // La transition CLASSIFIED porte la confiance IA réelle (0.92), method 'ai'.
    const meta = classifiedMeta();
    expect(meta.confidence).toBe(0.92);
    expect(meta.method).toBe('ai');
    expect(meta.caseType).toBe('OQTF');
    expect(mockPrisma.informationUnit.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({ tenantId: 't1' }),
    });
    expect(generateWithCostControl).toHaveBeenCalledTimes(1);
    // L'historique est écrit dans la table dédiée (RECEIVED puis CLASSIFIED).
    expect(mockPrisma.informationStatusHistory.create).toHaveBeenCalledTimes(2);
  });

  it('bascule sur le fallback regex quand l’IA échoue (jamais d’échec silencieux)', async () => {
    setupCreateMocks();
    generateWithCostControl.mockRejectedValue(new Error('Ollama indisponible'));

    await service.create({
      tenantId: 't1',
      source: 'EMAIL',
      content: 'Bonjour, refus de titre de séjour, je souhaite un recours.',
    });

    const meta = classifiedMeta();
    expect(meta.method).toBe('fallback');
    expect(meta.classifier).toBe('regex-fallback');
    expect(typeof meta.confidence).toBe('number');
    expect(meta.confidence).toBeGreaterThanOrEqual(0);
    expect(meta.confidence).toBeLessThanOrEqual(1);
  });

  it('marque needsHumanReview quand la confiance IA est faible', async () => {
    setupCreateMocks();
    generateWithCostControl.mockResolvedValue({
      response: '{"caseType":"GENERAL","priority":"normale","confidence":0.4}',
      model: 'llama3.2:3b',
    });

    await service.create({ tenantId: 't1', source: 'EMAIL', content: 'Message ambigu' });

    const meta = classifiedMeta();
    expect(meta.confidence).toBe(0.4);
    expect(meta.needsHumanReview).toBe(true);
  });

  it('stocke metadata et sourceMetadata en JSON (colonnes text du schéma réel)', async () => {
    setupCreateMocks();
    generateWithCostControl.mockResolvedValue({
      response: '{"caseType":"OQTF","priority":"haute","confidence":0.8}',
      model: 'llama3.2:3b',
    });

    await service.create({
      tenantId: 't1',
      source: 'EMAIL',
      content: 'x',
      sourceMetadata: { emailId: 'e1' },
    });

    // create() doit fournir id + updatedAt (pas de @default dans le schéma) et
    // sérialiser sourceMetadata en string JSON.
    const createData = mockPrisma.informationUnit.create.mock.calls[0][0].data;
    expect(createData.id).toBeTruthy();
    expect(createData.updatedAt).toBeInstanceOf(Date);
    expect(typeof createData.sourceMetadata).toBe('string');
    expect(JSON.parse(createData.sourceMetadata)).toEqual({ emailId: 'e1' });
    // Ne doit PAS écrire de colonnes inexistantes.
    expect(createData.statusHistory).toBeUndefined();
    expect(createData.statusReason).toBeUndefined();
  });

  it('retourne l’unité existante sur doublon (dédup SHA-256) sans reclassifier', async () => {
    mockPrisma.informationUnit.findFirst.mockResolvedValueOnce({
      id: 'dup',
      currentStatus: 'RECEIVED',
    });

    const res = await service.create({ tenantId: 't1', source: 'EMAIL', content: 'déjà vu' });

    expect(res.id).toBe('dup');
    expect(mockPrisma.informationUnit.create).not.toHaveBeenCalled();
    expect(generateWithCostControl).not.toHaveBeenCalled();
  });
});
