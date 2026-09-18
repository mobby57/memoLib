import { describe, expect, it, vi } from 'vitest';
import {
  CaseIntelligenceOrchestrator,
  type CaseIntelligenceDependencies,
} from '@/lib/intelligence/case-intelligence-orchestrator';
import type { IngestResult } from '@/lib/services/ingestion.service';
import type { ExtractionResult } from '@/lib/services/extractionPipeline';

const matchedIngestion: IngestResult = {
  unitId: 'unit-1',
  duplicate: false,
  classification: {
    caseType: 'OQTF',
    priority: 'critique',
    confidence: 0.95,
    method: 'ai',
    needsHumanReview: false,
  },
  dossier: {
    matched: true,
    dossierId: 'matter-1',
    clientId: 'client-1',
    confidence: 0.9,
    needsHumanReview: false,
    reason: 'Client identifié avec un unique dossier ouvert',
  },
  needsHumanReview: false,
};

function validExtraction(): ExtractionResult {
  return {
    raw: {},
    validated: {
      decisionDate: null,
      notificationDate: new Date('2028-01-01T00:00:00.000Z'),
      deadlineDate: new Date('2028-01-31T00:00:00.000Z'),
      hearingDate: null,
      appealDate: null,
      otherDates: {},
    },
    validation: {
      valid: true,
      errors: [],
      warnings: [],
      infos: [],
      confidence: 0.95,
      humanReviewRequired: false,
      metadata: { validatedAt: new Date(), rulesApplied: [] },
    },
    correctionsApplied: [],
    humanReviewRequired: false,
    finalConfidence: 0.95,
  };
}

function dependencies(
  overrides: Partial<CaseIntelligenceDependencies> = {}
): CaseIntelligenceDependencies {
  return {
    ingest: vi.fn().mockResolvedValue(matchedIngestion),
    processDates: vi.fn().mockReturnValue(validExtraction()),
    findMatter: vi.fn().mockResolvedValue({
      id: 'matter-1',
      numero: 'DOS-2028-001',
      typeDossier: 'OQTF',
      clientId: 'client-1',
    }),
    ...overrides,
  };
}

describe('CaseIntelligenceOrchestrator', () => {
  it('returns validated proposals and a tenant-scoped matter context', async () => {
    const services = dependencies();
    const orchestrator = new CaseIntelligenceOrchestrator(services);

    const result = await orchestrator.analyze({
      tenantId: 'tenant-a',
      source: 'EMAIL',
      content: 'Décision OQTF reçue.',
      deadlineCandidates: [
        {
          type: 'CONTENTIOUS_APPEAL',
          title: 'Recours OQTF',
          confidence: 0.95,
          dates: {},
        },
      ],
    });

    expect(services.findMatter).toHaveBeenCalledWith('tenant-a', 'matter-1');
    expect(result.matter).toEqual({
      id: 'matter-1',
      numero: 'DOS-2028-001',
      typeDossier: 'OQTF',
      clientId: 'client-1',
    });
    expect(result.deadlineProposals[0]).toMatchObject({
      deadlineDate: new Date('2028-01-31T00:00:00.000Z'),
      confidence: 0.95,
      requiresHumanReview: false,
    });
    expect(result.suggestedActions).toEqual([
      {
        type: 'REVIEW_DEADLINE',
        title: "Valider l'échéance proposée : Recours OQTF",
        deadlineProposalIndex: 0,
        requiresHumanApproval: true,
      },
    ]);
    expect(result.requiresHumanReview).toBe(false);
  });

  it('requires review for an ambiguous match and does not resolve a matter', async () => {
    const services = dependencies({
      ingest: vi.fn().mockResolvedValue({
        ...matchedIngestion,
        dossier: {
          ...matchedIngestion.dossier,
          matched: false,
          dossierId: null,
          confidence: 0,
          needsHumanReview: true,
          reason: 'Plusieurs dossiers ouverts non départageables',
        },
        needsHumanReview: true,
      }),
    });
    const orchestrator = new CaseIntelligenceOrchestrator(services);

    const result = await orchestrator.analyze({
      tenantId: 'tenant-a',
      source: 'EMAIL',
      content: 'Message ambigu.',
    });

    expect(services.findMatter).not.toHaveBeenCalled();
    expect(result.matter).toBeNull();
    expect(result.requiresHumanReview).toBe(true);
  });

  it('does not expose a matter when the matched identifier is outside the tenant', async () => {
    const services = dependencies({
      findMatter: vi.fn().mockResolvedValue(null),
    });
    const orchestrator = new CaseIntelligenceOrchestrator(services);

    const result = await orchestrator.analyze({
      tenantId: 'tenant-a',
      source: 'EMAIL',
      content: 'Message reçu.',
    });

    expect(services.findMatter).toHaveBeenCalledWith('tenant-a', 'matter-1');
    expect(result.matter).toBeNull();
    expect(result.requiresHumanReview).toBe(true);
  });

  it('keeps invalid deadline extraction as a review-only proposal', async () => {
    const invalidExtraction = validExtraction();
    invalidExtraction.validated.deadlineDate = null;
    invalidExtraction.validation.errors = [
      {
        ruleId: 'DEADLINE_AFTER_NOTIFICATION',
        field: 'deadlineDate',
        message: 'La date limite doit être postérieure ou égale à la date de notification',
        severity: 'error',
      },
    ];
    invalidExtraction.validation.valid = false;
    invalidExtraction.humanReviewRequired = true;
    invalidExtraction.finalConfidence = 0.4;

    const orchestrator = new CaseIntelligenceOrchestrator(
      dependencies({
        processDates: vi.fn().mockReturnValue(invalidExtraction),
      })
    );

    const result = await orchestrator.analyze({
      tenantId: 'tenant-a',
      source: 'UPLOAD',
      content: 'Document numérisé.',
      deadlineCandidates: [
        {
          type: 'CONTENTIOUS_APPEAL',
          title: 'Recours à vérifier',
          confidence: 0.9,
          dates: {},
        },
      ],
    });

    expect(result.deadlineProposals[0]).toMatchObject({
      deadlineDate: null,
      confidence: 0.4,
      requiresHumanReview: true,
    });
    expect(result.suggestedActions[0].requiresHumanApproval).toBe(true);
  });
});
