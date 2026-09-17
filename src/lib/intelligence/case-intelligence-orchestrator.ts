import { prisma } from '@/lib/prisma';
import {
  ingestionService,
  type IngestInput,
  type IngestResult,
} from '@/lib/services/ingestion.service';
import {
  extractionPipeline,
  type ExtractionPipeline,
} from '@/lib/services/extractionPipeline';
import type { ExtractedDates } from '@/lib/legal/dateValidator';

export interface DeadlineCandidate {
  type: string;
  title: string;
  description?: string;
  dates: ExtractedDates;
  confidence: number;
  sourceExcerpt?: string;
}

export interface CaseIntelligenceInput extends IngestInput {
  deadlineCandidates?: DeadlineCandidate[];
}

export interface MatterContext {
  id: string;
  numero: string;
  typeDossier: string;
  clientId: string;
}

export interface DeadlineProposal {
  type: string;
  title: string;
  description?: string;
  deadlineDate: Date | null;
  notificationDate: Date | null;
  confidence: number;
  sourceExcerpt?: string;
  validationErrors: string[];
  validationWarnings: string[];
  requiresHumanReview: boolean;
}

export interface SuggestedAction {
  type: 'REVIEW_DEADLINE';
  title: string;
  deadlineProposalIndex: number;
  requiresHumanApproval: true;
}

export interface CaseIntelligenceResult {
  unit: Pick<IngestResult, 'unitId' | 'duplicate'>;
  classification: IngestResult['classification'];
  matching: IngestResult['dossier'];
  matter: MatterContext | null;
  deadlineProposals: DeadlineProposal[];
  suggestedActions: SuggestedAction[];
  requiresHumanReview: boolean;
}

export interface CaseIntelligenceDependencies {
  ingest: (input: IngestInput) => Promise<IngestResult>;
  processDates: ExtractionPipeline['process'];
  findMatter: (tenantId: string, dossierId: string) => Promise<MatterContext | null>;
}

const defaultDependencies: CaseIntelligenceDependencies = {
  ingest: (input) => ingestionService.ingest(input),
  processDates: extractionPipeline.process.bind(extractionPipeline),
  findMatter: (tenantId, dossierId) =>
    prisma.dossier.findFirst({
      where: { id: dossierId, tenantId },
      select: { id: true, numero: true, typeDossier: true, clientId: true },
    }),
};

/**
 * Coordinates ingestion and legal-data validation without materializing legal
 * deadlines or executing actions. Its caller must be a trusted internal flow
 * that derives tenantId from authenticated context.
 */
export class CaseIntelligenceOrchestrator {
  constructor(
    private readonly dependencies: CaseIntelligenceDependencies = defaultDependencies
  ) {}

  async analyze(input: CaseIntelligenceInput): Promise<CaseIntelligenceResult> {
    if (!input.tenantId) {
      throw new Error('Case Intelligence requires a trusted tenantId');
    }

    const ingestion = await this.dependencies.ingest(input);
    const matter = await this.resolveMatter(input.tenantId, ingestion);
    const deadlineProposals = this.createDeadlineProposals(input.deadlineCandidates ?? []);
    const suggestedActions = deadlineProposals.map((proposal, index) => ({
      type: 'REVIEW_DEADLINE' as const,
      title: `Valider l'échéance proposée : ${proposal.title}`,
      deadlineProposalIndex: index,
      requiresHumanApproval: true as const,
    }));

    return {
      unit: { unitId: ingestion.unitId, duplicate: ingestion.duplicate },
      classification: ingestion.classification,
      matching: ingestion.dossier,
      matter,
      deadlineProposals,
      suggestedActions,
      requiresHumanReview:
        ingestion.needsHumanReview ||
        (ingestion.dossier.matched && matter === null) ||
        deadlineProposals.some((proposal) => proposal.requiresHumanReview),
    };
  }

  private async resolveMatter(
    tenantId: string,
    ingestion: IngestResult
  ): Promise<MatterContext | null> {
    if (!ingestion.dossier.matched || !ingestion.dossier.dossierId) {
      return null;
    }

    return this.dependencies.findMatter(tenantId, ingestion.dossier.dossierId);
  }

  private createDeadlineProposals(candidates: DeadlineCandidate[]): DeadlineProposal[] {
    return candidates.map((candidate) => {
      const validation = this.dependencies.processDates(candidate.dates, {
        source: 'case-intelligence',
        confidence: candidate.confidence,
      });
      const confidence = Math.min(candidate.confidence, validation.finalConfidence);

      return {
        type: candidate.type,
        title: candidate.title,
        description: candidate.description,
        deadlineDate: this.toDateOrNull(validation.validated.deadlineDate),
        notificationDate: this.toDateOrNull(validation.validated.notificationDate),
        confidence,
        sourceExcerpt: candidate.sourceExcerpt,
        validationErrors: validation.validation.errors.map((error) => error.message),
        validationWarnings: validation.validation.warnings.map((warning) => warning.message),
        requiresHumanReview:
          validation.humanReviewRequired || confidence < 0.7,
      };
    });
  }

  private toDateOrNull(value: Date | string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}

export const caseIntelligenceOrchestrator = new CaseIntelligenceOrchestrator();
