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
import { InformationUnitStatus, InformationUnitSource } from '@prisma/client';
import crypto from 'crypto';

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
  toStatus: InformationUnitStatus;
  reason: string;
  changedBy: string;
  metadata?: Record<string, any>;
}

interface EscalationResult {
  unitId: string;
  previousStatus: InformationUnitStatus;
  newStatus: InformationUnitStatus;
  escalationAction: string;
  escalatedAt: Date;
}

// ============================================
// STATE MACHINE RULES
// ============================================

// Define allowed transitions (CLOSED PIPELINE)
const ALLOWED_TRANSITIONS: Record<InformationUnitStatus, InformationUnitStatus[]> = {
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
const STATUS_TIMEOUTS: Record<InformationUnitStatus, number> = {
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
    const existing = await prisma.informationUnit.findUnique({
      where: { contentHash },
    });

    if (existing) {
      console.warn(`[InformationUnit] Duplicate detected for tenant ${input.tenantId}`);
      return existing;
    }

    // Create unit in RECEIVED status
    const unit = await prisma.informationUnit.create({
      data: {
        tenantId: input.tenantId,
        source: input.source,
        content: input.content,
        contentHash,
        sourceMetadata: input.sourceMetadata,
        linkedWorkspaceId: input.linkedWorkspaceId,
        metadata: input.metadata,
        currentStatus: InformationUnitStatus.RECEIVED,
        statusReason: `Recu via ${input.source}`,
        lastStatusChangeBy: 'system',
        statusHistory: [
          {
            timestamp: new Date().toISOString(),
            fromStatus: null,
            toStatus: InformationUnitStatus.RECEIVED,
            reason: `Auto-cree via ${input.source}`,
            changedBy: 'system',
            metadata: input.sourceMetadata,
          },
        ],
      },
    });

    // Auto-classify to CLASSIFIED (simulated AI classification)
    // In production, this would call AI classification service
    await this.transition({
      unitId: unit.id,
      toStatus: InformationUnitStatus.CLASSIFIED,
      reason: 'Classification automatique (IA)',
      changedBy: 'system',
      metadata: {
        confidence: 0.89,
        classifier: 'llama3.2:3b',
      },
    });

    return unit;
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

    // Append to audit trail
    const newHistory = [
      ...((unit.statusHistory as any[]) || []),
      {
        timestamp: new Date().toISOString(),
        fromStatus: unit.currentStatus,
        toStatus: input.toStatus,
        reason: input.reason,
        changedBy: input.changedBy,
        metadata: input.metadata,
      },
    ];

    // Determine if this status requires human action
    const requiresAction = this.checkHumanActionRequired(input.toStatus);

    // Update unit
    const updated = await prisma.informationUnit.update({
      where: { id: input.unitId },
      data: {
        currentStatus: input.toStatus,
        statusReason: input.reason,
        statusHistory: newHistory,
        lastStatusChangeAt: new Date(),
        lastStatusChangeBy: input.changedBy,
        requiresHumanAction: requiresAction,
        metadata: input.metadata,
      },
    });

    return updated;
  }

  /**
   * Validate state machine transition is allowed
   * @throws Error if transition is forbidden
   */
  private validateTransition(
    fromStatus: InformationUnitStatus,
    toStatus: InformationUnitStatus
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
  private validateStatusRequirements(status: InformationUnitStatus, reason: string): void {
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
  private checkHumanActionRequired(status: InformationUnitStatus): boolean {
    return [InformationUnitStatus.HUMAN_ACTION_REQUIRED, InformationUnitStatus.AMBIGUOUS].includes(
      status
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
      let newStatus: InformationUnitStatus | null = null;
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
            if (process.env.RESEND_API_KEY && unit.metadata?.clientEmail) {
              await resend.emails.send({
                from: process.env.EMAIL_FROM || 'noreply@memoLib.com',
                to: unit.metadata.clientEmail as string,
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

    return {
      unitId: unit.id,
      tenantId: unit.tenantId,
      source: unit.source,
      contentHash: unit.contentHash,
      receivedAt: unit.receivedAt,
      currentStatus: unit.currentStatus,
      statusHistory: unit.statusHistory,
      integrity_hash: this.calculateHash(JSON.stringify(unit.statusHistory)),
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
