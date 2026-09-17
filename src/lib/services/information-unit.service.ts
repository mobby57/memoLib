/**
 * InformationUnitService
 *
 * Core service for the "Zero Ignored Information" guarantee
 * Implements closed pipeline state machine with automatic escalations
 *
 * Pipeline: RECEIVED -> CLASSIFIED -> ANALYZED -> [INCOMPLETE|AMBIGUOUS|RESOLVED] -> CLOSED
 *
 * @file src/lib/services/information-unit.service.ts
 * @date 2026-01-22
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { hybridAI } from '@/lib/ai/hybrid-client';
import { classifyEmail } from '@/lib/classifiers/email-classifier';
import { logger } from '@/lib/logger';

type InformationUnitSource = string;

export const InformationUnitStatus = {
  RECEIVED: 'RECEIVED',
  CLASSIFIED: 'CLASSIFIED',
  ANALYZED: 'ANALYZED',
  INCOMPLETE: 'INCOMPLETE',
  AMBIGUOUS: 'AMBIGUOUS',
  HUMAN_ACTION_REQUIRED: 'HUMAN_ACTION_REQUIRED',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

type InformationUnitStatusValue =
  (typeof InformationUnitStatus)[keyof typeof InformationUnitStatus];

// ============================================
// TYPES
// ============================================

interface CreateInformationUnitInput {
  tenantId: string;
  source: InformationUnitSource;
  content: string;
  sourceMetadata?: Record<string, any>;
  linkedWorkspaceId?: string;
  metadata?: Record<string, any>;
}

interface TransitionInput {
  unitId: string;
  toStatus: InformationUnitStatusValue;
  reason: string;
  changedBy: string;
  metadata?: Record<string, any>;
}

interface EscalationResult {
  unitId: string;
  previousStatus: InformationUnitStatusValue;
  newStatus: InformationUnitStatusValue;
  escalationAction: string;
  escalatedAt: Date;
}

// ============================================
// STATE MACHINE RULES
// ============================================

// Define allowed transitions (CLOSED PIPELINE)
const ALLOWED_TRANSITIONS: Record<InformationUnitStatusValue, InformationUnitStatusValue[]> = {
  RECEIVED: ['CLASSIFIED'],
  CLASSIFIED: ['ANALYZED'],
  ANALYZED: ['INCOMPLETE', 'AMBIGUOUS', 'RESOLVED'],
  INCOMPLETE: ['INCOMPLETE', 'HUMAN_ACTION_REQUIRED', 'RESOLVED'], // Can stay or escalate
  AMBIGUOUS: ['HUMAN_ACTION_REQUIRED', 'RESOLVED'], // Ambiguous items go to human action
  HUMAN_ACTION_REQUIRED: ['RESOLVED'], // Only one way out
  RESOLVED: ['CLOSED'], // Can only go to closed
  CLOSED: [], // Terminal state
};

// Status timeouts (maximum time in each status)
const STATUS_TIMEOUTS: Record<InformationUnitStatusValue, number> = {
  RECEIVED: 5 * 60, // 5 minutes
  CLASSIFIED: 15 * 60, // 15 minutes
  ANALYZED: 30 * 60, // 30 minutes
  INCOMPLETE: 72 * 60 * 60, // 72 hours (escalates at 72h)
  AMBIGUOUS: 1 * 60 * 60, // 1 hour (should escalate immediately)
  HUMAN_ACTION_REQUIRED: 96 * 60 * 60, // 96 hours (escalates at 96h)
  RESOLVED: 7 * 24 * 60 * 60, // 7 days
  CLOSED: Infinity, // No timeout
};

// ============================================
// ESCALATION RULES
// ============================================

const ESCALATION_RULES = {
  INCOMPLETE: {
    reminder_at: 48 * 60 * 60, // 48 hours: send reminder to client
    escalate_at: 72 * 60 * 60, // 72 hours: escalate to HUMAN_ACTION_REQUIRED
  },
  AMBIGUOUS: {
    immediate: true, // Immediate escalation
  },
  HUMAN_ACTION_REQUIRED: {
    escalate_at: 96 * 60 * 60, // 96 hours: escalate to admin alert
  },
};

// ============================================
// SERVICE CLASS
// ============================================

export class InformationUnitService {
  /**
   * Create a new information unit
   * Auto-transitions: RECEIVED -> (auto-classify) -> CLASSIFIED
   */
  async create(input: CreateInformationUnitInput) {
    // Calculate content hash for deduplication
    const contentHash = this.calculateHash(input.content);

    // Check for duplicate
    const existing = await prisma.informationUnit.findFirst({
      where: { tenantId: input.tenantId, contentHash },
    });

    if (existing) {
      console.warn(`[InformationUnit] Duplicate detected for tenant ${input.tenantId}`);
      return existing;
    }

    // Create unit in RECEIVED status.
    // Aligné sur le schéma réel : id/updatedAt requis (pas de @default), metadata
    // et sourceMetadata sont des colonnes `text` (JSON sérialisé), et l'historique
    // de statut va dans la table dédiée InformationStatusHistory (pas une colonne
    // statusHistory qui n'existe pas).
    const now = new Date();
    const unit = await prisma.informationUnit.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        source: input.source,
        content: input.content,
        contentHash,
        sourceMetadata: input.sourceMetadata ? JSON.stringify(input.sourceMetadata) : null,
        linkedWorkspaceId: input.linkedWorkspaceId,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        currentStatus: InformationUnitStatus.RECEIVED,
        lastStatusChangeBy: 'system',
        lastStatusChangeAt: now,
        updatedAt: now,
      },
    });

    // Historique initial dans la table dédiée
    await this.recordHistory({
      unitId: unit.id,
      fromStatus: null,
      toStatus: InformationUnitStatus.RECEIVED,
      reason: `Auto-cree via ${input.source}`,
      changedBy: 'system',
    });

    // Auto-classify: appelle la VRAIE classification (IA + fallback regex),
    // remplace l'ancienne simulation codée en dur (confidence: 0.89).
    const classification = await this.classify(input.content, input.tenantId);

    await this.transition({
      unitId: unit.id,
      toStatus: InformationUnitStatus.CLASSIFIED,
      reason: `Classification ${classification.method} (confiance ${classification.confidence})`,
      changedBy: 'system',
      metadata: {
        confidence: classification.confidence,
        classifier: classification.classifier,
        method: classification.method,
        caseType: classification.caseType,
        priority: classification.priority,
        needsHumanReview: classification.needsHumanReview,
      },
    });

    return unit;
  }

  /**
   * Enregistre une entrée d'historique de statut dans la table dédiée
   * InformationStatusHistory (source de vérité de l'audit trail).
   */
  private async recordHistory(entry: {
    unitId: string;
    fromStatus: InformationUnitStatusValue | null;
    toStatus: InformationUnitStatusValue;
    reason: string;
    changedBy: string;
  }): Promise<void> {
    await prisma.informationStatusHistory.create({
      data: {
        id: crypto.randomUUID(),
        unitId: entry.unitId,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        reason: entry.reason,
        changedBy: entry.changedBy,
        changedAt: new Date(),
      },
    });
  }

  /**
   * Classifie un contenu entrant (PUBLIC — réutilisable par IngestionService).
   *
   * Stratégie protectrice (cf. thèse "ne rien perdre") :
   *  1. IA réelle (hybridAI : Ollama -> cloud -> ...) pour type de dossier + confiance.
   *  2. Fallback déterministe (classifyEmail regex) si l'IA échoue ou renvoie
   *     une réponse non exploitable.
   *  3. Confiance faible => needsHumanReview = true (l'unité sera routée vers
   *     validation humaine plutôt que traitée automatiquement).
   *
   * @returns confidence réelle (0-1), classifier utilisé, method ('ai'|'fallback'),
   *          caseType, priority, needsHumanReview.
   */
  async classify(
    content: string,
    tenantId: string
  ): Promise<{
    confidence: number;
    classifier: string;
    method: 'ai' | 'fallback';
    caseType?: string;
    priority?: string;
    needsHumanReview: boolean;
  }> {
    const HUMAN_REVIEW_THRESHOLD = 0.7;

    // 1. Tentative IA réelle
    try {
      const prompt = `Classe ce contenu juridique entrant. Ne retourne aucun identifiant personnel.

Contenu :
${content.slice(0, 4000)}

Retourne UNIQUEMENT ce JSON :
{"caseType":"OQTF|ASILE|TITRE_SEJOUR|NATURALISATION|REGROUPEMENT_FAMILIAL|CONTENTIEUX|GENERAL","priority":"basse|normale|haute|critique","confidence":0.0}`;

      const result = await hybridAI.generateWithCostControl(prompt, tenantId);
      const match = result.response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as {
          caseType?: string;
          priority?: string;
          confidence?: number;
        };
        const confidence =
          typeof parsed.confidence === 'number'
            ? Math.max(0, Math.min(1, parsed.confidence))
            : 0;
        if (parsed.caseType && confidence > 0) {
          return {
            confidence,
            classifier: (result as { model?: string }).model || 'hybrid-ai',
            method: 'ai',
            caseType: parsed.caseType,
            priority: parsed.priority,
            needsHumanReview: confidence < HUMAN_REVIEW_THRESHOLD,
          };
        }
      }
      logger.warn('[InformationUnit] Réponse IA non exploitable, fallback regex', { tenantId });
    } catch (error) {
      logger.warn('[InformationUnit] Classification IA échouée, fallback regex', {
        tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // 2. Fallback déterministe (regex) — jamais d'échec silencieux
    const fallback = classifyEmail('', content);
    return {
      confidence: fallback.confidence,
      classifier: 'regex-fallback',
      method: 'fallback',
      caseType: fallback.caseType,
      priority: fallback.priority,
      // needsHumanReview vrai si le fallback le juge, OU si confiance faible.
      needsHumanReview: fallback.needsHumanReview || fallback.confidence < HUMAN_REVIEW_THRESHOLD,
    };
  }

  /**
   * Transition unit to new status (enforces state machine rules)
   */
  async transition(input: TransitionInput) {
    const unit = await prisma.informationUnit.findUnique({
      where: { id: input.unitId },
    });

    if (!unit) {
      throw new Error(`InformationUnit not found: ${input.unitId}`);
    }

    // Validate transition is allowed
    this.validateTransition(unit.currentStatus, input.toStatus);

    // Validate required fields for state transitions
    this.validateStatusRequirements(input.toStatus, input.reason);

    // Enregistrer l'historique dans la table dédiée (au lieu d'une colonne
    // statusHistory inexistante).
    await this.recordHistory({
      unitId: input.unitId,
      fromStatus: unit.currentStatus,
      toStatus: input.toStatus,
      reason: input.reason,
      changedBy: input.changedBy,
    });

    // Fusionner les metadata existantes (colonne text/JSON) avec les nouvelles,
    // et y porter requiresHumanAction (pas de colonne dédiée dans le schéma réel).
    const existingMeta = this.parseJson(unit.metadata);
    const requiresAction = this.checkHumanActionRequired(input.toStatus);
    const mergedMeta = {
      ...existingMeta,
      ...(input.metadata || {}),
      requiresHumanAction: requiresAction,
      lastReason: input.reason,
    };

    const now = new Date();
    const updated = await prisma.informationUnit.update({
      where: { id: input.unitId },
      data: {
        currentStatus: input.toStatus,
        lastStatusChangeAt: now,
        lastStatusChangeBy: input.changedBy,
        metadata: JSON.stringify(mergedMeta),
        updatedAt: now,
        // Horodatage des jalons de pipeline
        ...(input.toStatus === InformationUnitStatus.CLASSIFIED ? { classifiedAt: now } : {}),
        ...(input.toStatus === InformationUnitStatus.ANALYZED ? { analyzedAt: now } : {}),
        ...(input.toStatus === InformationUnitStatus.RESOLVED ? { resolvedAt: now } : {}),
        ...(input.toStatus === InformationUnitStatus.CLOSED ? { closedAt: now } : {}),
      },
    });

    return updated;
  }

  /** Parse une colonne JSON (text) de façon sûre. */
  private parseJson(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'string') return {};
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  /**
   * Validate state machine transition is allowed
   * @throws Error if transition is forbidden
   */
  private validateTransition(
    fromStatus: InformationUnitStatusValue,
    toStatus: InformationUnitStatusValue
  ): void {
    // CRITICAL RULE: No direct jump to CLOSED except from RESOLVED (check first for specific error message)
    if (
      toStatus === InformationUnitStatus.CLOSED &&
      fromStatus !== InformationUnitStatus.RESOLVED
    ) {
      throw new Error(
        `PIPELINE ERROR: Cannot transition from ${fromStatus} to CLOSED. Must pass through RESOLVED first.`
      );
    }

    const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];

    if (!allowed.includes(toStatus)) {
      throw new Error(
        `Forbidden transition: ${fromStatus} -> ${toStatus}. ` + `Allowed: ${allowed.join(', ')}`
      );
    }
  }

  /**
   * Validate status-specific requirements
   */
  private validateStatusRequirements(status: InformationUnitStatusValue, reason: string): void {
    if (!reason || reason.trim().length === 0) {
      throw new Error(`Transition reason is required for status: ${status}`);
    }

    // HUMAN_ACTION_REQUIRED must have detailed reason
    if (status === InformationUnitStatus.HUMAN_ACTION_REQUIRED && reason.length < 10) {
      throw new Error(`HUMAN_ACTION_REQUIRED requires detailed reason (min 10 chars)`);
    }
  }

  /**
   * Check if status requires human action
   */
  private checkHumanActionRequired(status: InformationUnitStatusValue): boolean {
    return (
      status === InformationUnitStatus.HUMAN_ACTION_REQUIRED ||
      status === InformationUnitStatus.AMBIGUOUS
    );
  }

  /**
   * Escalate stale units (cron job)
   * Rules:
   * - INCOMPLETE > 48h: reminder email to client
   * - INCOMPLETE > 72h: escalate to HUMAN_ACTION_REQUIRED
   * - HUMAN_ACTION_REQUIRED > 96h: admin alert
   * - AMBIGUOUS: immediate escalation
   */
  async escalateStaleUnits(): Promise<EscalationResult[]> {
    const results: EscalationResult[] = [];
    const now = new Date();

    // Find units needing escalation
    const staleUnits = await prisma.informationUnit.findMany({
      where: {
        currentStatus: {
          in: [
            InformationUnitStatus.INCOMPLETE,
            InformationUnitStatus.AMBIGUOUS,
            InformationUnitStatus.HUMAN_ACTION_REQUIRED,
          ],
        },
      },
    });

    for (const unit of staleUnits) {
      const timeSinceChange = (now.getTime() - unit.lastStatusChangeAt.getTime()) / 1000;

      let shouldEscalate = false;
      let newStatus: InformationUnitStatusValue | null = null;
      let escalationAction = '';

      // INCOMPLETE escalation rules
      if (unit.currentStatus === InformationUnitStatus.INCOMPLETE) {
        if (timeSinceChange > ESCALATION_RULES.INCOMPLETE.escalate_at) {
          // 72h: escalate to HUMAN_ACTION_REQUIRED
          newStatus = InformationUnitStatus.HUMAN_ACTION_REQUIRED;
          escalationAction = 'ESCALATE_TO_HUMAN_ACTION';
          shouldEscalate = true;
        } else if (timeSinceChange > ESCALATION_RULES.INCOMPLETE.reminder_at) {
          // 48h: send reminder email (don't transition yet)
          escalationAction = 'CLIENT_REMINDER';
          // Send reminder email to client
          try {
            const { Resend } = await import('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);
            const unitMeta = this.parseJson(unit.metadata);
            if (process.env.RESEND_API_KEY && unitMeta.clientEmail) {
              await resend.emails.send({
                from: process.env.EMAIL_FROM || 'noreply@memoLib.com',
                to: unitMeta.clientEmail as string,
                subject: 'Rappel : Informations manquantes - memoLib',
                html: `<h2>Informations manquantes</h2><p>Des informations sont encore nécessaires pour votre dossier. Merci de les compléter.</p>`,
              });
            }
          } catch (emailError) {
            console.error('[Escalation] Failed to send client reminder:', emailError);
          }
        }
      }

      // AMBIGUOUS: immediate escalation
      if (unit.currentStatus === InformationUnitStatus.AMBIGUOUS) {
        newStatus = InformationUnitStatus.HUMAN_ACTION_REQUIRED;
        escalationAction = 'ESCALATE_AMBIGUOUS';
        shouldEscalate = true;
      }

      // HUMAN_ACTION_REQUIRED > 96h: admin alert
      if (
        unit.currentStatus === InformationUnitStatus.HUMAN_ACTION_REQUIRED &&
        timeSinceChange > ESCALATION_RULES.HUMAN_ACTION_REQUIRED.escalate_at
      ) {
        escalationAction = 'ADMIN_ALERT';
        // Send admin alert via Sentry
        import('@sentry/nextjs')
          .then(Sentry => {
            Sentry.captureMessage(
              `[ADMIN ALERT] Unité ${unit.id} en attente action humaine > 96h`,
              {
                level: 'warning',
                tags: { unitId: unit.id, escalation: 'admin_alert' },
                extra: { timeSinceChange, currentStatus: unit.currentStatus },
              }
            );
          })
          .catch(() => {});
      }

      // Perform escalation if needed
      if (shouldEscalate && newStatus) {
        await this.transition({
          unitId: unit.id,
          toStatus: newStatus,
          reason: `Escalation: ${escalationAction} (timeout)`,
          changedBy: 'system:escalation-cron',
          metadata: { escalationAction, timeSinceChange },
        });

        results.push({
          unitId: unit.id,
          previousStatus: unit.currentStatus,
          newStatus,
          escalationAction,
          escalatedAt: now,
        });
      }
    }

    return results;
  }

  /**
   * Block workspace closure if unresolved information exists
   * @throws Error if workspace has unresolved units
   */
  async validateWorkspaceClosurePossible(workspaceId: string): Promise<boolean> {
    const unresolvedCount = await prisma.informationUnit.count({
      where: {
        linkedWorkspaceId: workspaceId,
        currentStatus: {
          in: [
            InformationUnitStatus.RECEIVED,
            InformationUnitStatus.CLASSIFIED,
            InformationUnitStatus.ANALYZED,
            InformationUnitStatus.INCOMPLETE,
            InformationUnitStatus.AMBIGUOUS,
            InformationUnitStatus.HUMAN_ACTION_REQUIRED,
          ],
        },
      },
    });

    if (unresolvedCount > 0) {
      throw new Error(
        `Cannot close workspace: ${unresolvedCount} unresolved information units exist. ` +
          `All information must be in RESOLVED or CLOSED status.`
      );
    }

    return true;
  }

  /**
   * Export audit trail for given information unit
   * Format: JSON array with complete history
   */
  async exportAuditTrail(unitId: string) {
    const unit = await prisma.informationUnit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      throw new Error(`InformationUnit not found: ${unitId}`);
    }

    // L'historique vit dans la table dédiée InformationStatusHistory.
    const statusHistory = await prisma.informationStatusHistory.findMany({
      where: { unitId },
      orderBy: { changedAt: 'asc' },
    });

    return {
      unitId: unit.id,
      tenantId: unit.tenantId,
      source: unit.source,
      contentHash: unit.contentHash,
      receivedAt: unit.receivedAt,
      currentStatus: unit.currentStatus,
      statusHistory,
      integrity_hash: this.calculateHash(JSON.stringify(statusHistory)),
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate SHA-256 hash of content (for deduplication)
   */
  private calculateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get metrics dashboard data
   */
  async getMetrics(tenantId: string) {
    const statusCounts = await prisma.informationUnit.groupBy({
      by: ['currentStatus'],
      where: { tenantId },
      _count: true,
    });

    const total = statusCounts.reduce((sum, item) => sum + item._count, 0);
    const countsByStatus: Record<string, number> = {};

    statusCounts.forEach(item => {
      countsByStatus[item.currentStatus] = item._count;
    });

    // Calculate closure rate
    const closedCount = countsByStatus[InformationUnitStatus.CLOSED] || 0;
    const closureRate = total > 0 ? (closedCount / total) * 100 : 0;

    // Find average time in current status
    const units = await prisma.informationUnit.findMany({
      where: { tenantId },
      select: { lastStatusChangeAt: true },
    });

    const avgHours =
      units.length > 0
        ? units.reduce((sum, u) => {
            const hours = (Date.now() - u.lastStatusChangeAt.getTime()) / 3600000;
            return sum + hours;
          }, 0) / units.length
        : 0;

    return {
      totalUnits: total,
      countsByStatus,
      closureRate: closureRate.toFixed(2),
      avgHoursInCurrentStatus: avgHours.toFixed(2),
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const informationUnitService = new InformationUnitService();

