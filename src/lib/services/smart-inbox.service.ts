/**
 * SmartInboxService - Service de scoring intelligent des emails (Phase 4)
 *
 * Calcule un score de priorité 0-100 pour chaque email basé sur:
 * - Urgence (30%)
 * - Client VIP (25%)
 * - Deadline proche (20%)
 * - Sentiment (15%)
 * - Attachments (10%)
 *
 * @example
 * ```ts
 * const service = new SmartInboxService();
 * const score = await service.calculateScore(email, tenant);
 * console.log(score.score); // 85
 * console.log(score.factors); // { urgency: 30, vipClient: 25, ... }
 * ```
 */

import { PrismaClient, Email, Client } from '@prisma/client';
import { eventLogService } from './event-log.service';

export type ScoringFactors = {
  urgency: number; // 0-30
  vipClient: number; // 0-25
  hasDeadline: number; // 0-20
  sentiment: number; // 0-15
  hasAttachments: number; // 0-10
  total: number; // 0-100
};

export type InboxScoreResult = {
  score: number;
  factors: ScoringFactors;
  model: string;
  confidence: 'low' | 'medium' | 'high';
};

export class SmartInboxService {
  constructor(private prisma: PrismaClient = new PrismaClient()) {}

  /**
   * Calcule le score de priorité pour un email
   */
  async calculateScore(email: Email, tenantId: string): Promise<InboxScoreResult> {
    const factors: ScoringFactors = {
      urgency: 0,
      vipClient: 0,
      hasDeadline: 0,
      sentiment: 0,
      hasAttachments: 0,
      total: 0,
    };

    // 1. Urgence (30 points max)
    factors.urgency = this.scoreUrgency(email.urgency);

    // 2. Client VIP (25 points max)
    if (email.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: email.clientId },
      });
      factors.vipClient = await this.scoreVIPClient(client);
    }

    // 3. Deadline proche (20 points max)
    factors.hasDeadline = await this.scoreDeadline(email);

    // 4. Sentiment (15 points max)
    factors.sentiment = this.scoreSentiment(email.sentiment);

    // 5. Attachments (10 points max)
    const attachments = await this.prisma.emailAttachment.count({
      where: { emailId: email.id },
    });
    factors.hasAttachments = this.scoreAttachments(attachments);

    // Total
    factors.total = Math.min(
      100,
      factors.urgency +
        factors.vipClient +
        factors.hasDeadline +
        factors.sentiment +
        factors.hasAttachments
    );

    // Confidence basée sur nombre de facteurs non-nuls
    const nonZeroFactors = Object.values(factors).filter(v => v > 0).length - 1; // -1 pour exclure total
    const confidence: 'low' | 'medium' | 'high' =
      nonZeroFactors >= 4 ? 'high' : nonZeroFactors >= 2 ? 'medium' : 'low';

    return {
      score: factors.total,
      factors,
      model: 'smart-inbox-v1',
      confidence,
    };
  }

  /**
   * Score urgence: critical=30, high=20, medium=10, low=5
   */
  private scoreUrgency(urgency: string): number {
    switch (urgency.toLowerCase()) {
      case 'critical':
        return 30;
      case 'high':
        return 20;
      case 'medium':
        return 10;
      case 'low':
        return 5;
      default:
        return 0;
    }
  }

  /**
   * Score client VIP: 25 points si VIP, 0 sinon
   * Critères VIP: >5 dossiers actifs OU factures >10k€
   */
  private async scoreVIPClient(client: Client | null): Promise<number> {
    if (!client) return 0;

    const dossiers = await this.prisma.dossier.count({
      where: {
        clientId: client.id,
        statut: 'en_cours',
      },
    });

    if (dossiers >= 5) return 25;

    // TODO: Vérifier montant factures si >10k€
    // const factures = await prisma.facture.aggregate({ ... })

    return 0;
  }

  /**
   * Score deadline proche: 20 points si deadline <7j, 10 si <30j
   */
  private async scoreDeadline(email: Email): Promise<number> {
    if (!email.dossierId) return 0;

    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const urgentDeadline = await this.prisma.legalDeadline.findFirst({
      where: {
        dossierId: email.dossierId,
        dueDate: {
          gte: now,
          lte: in7days,
        },
        status: { in: ['PENDING', 'APPROACHING', 'URGENT'] },
      },
    });

    if (urgentDeadline) return 20;

    const approachingDeadline = await this.prisma.legalDeadline.findFirst({
      where: {
        dossierId: email.dossierId,
        dueDate: {
          gte: now,
          lte: in30days,
        },
        status: { in: ['PENDING', 'APPROACHING'] },
      },
    });

    if (approachingDeadline) return 10;

    return 0;
  }

  /**
   * Score sentiment: negative=15 (besoin aide), neutral=8, positive=5
   */
  private scoreSentiment(sentiment: string): number {
    switch (sentiment.toLowerCase()) {
      case 'negative':
        return 15; // Client mécontent = prioritaire
      case 'neutral':
        return 8;
      case 'positive':
        return 5;
      default:
        return 0;
    }
  }

  /**
   * Score attachments: 10 points si >=1 pièce jointe
   */
  private scoreAttachments(count: number): number {
    return count > 0 ? 10 : 0;
  }

  /**
   * Sauvegarde le score en DB et trace avec EventLog
   */
  async saveScore(emailId: string, scoreResult: InboxScoreResult, tenantId: string): Promise<void> {
    // Créer/mettre à jour InboxScore
    await this.prisma.inboxScore.upsert({
      where: { emailId },
      create: {
        emailId,
        score: scoreResult.score,
        factors: scoreResult.factors,
        model: scoreResult.model,
        confidence: scoreResult.confidence,
      },
      update: {
        score: scoreResult.score,
        factors: scoreResult.factors,
        model: scoreResult.model,
        confidence: scoreResult.confidence,
        calculatedAt: new Date(),
      },
    });

    // Tracer avec EventLog
    await eventLogService.createEventLog({
      eventType: 'FLOW_SCORED',
      entityType: 'email',
      entityId: emailId,
      actorType: 'AI',
      tenantId,
      metadata: {
        score: scoreResult.score,
        factors: scoreResult.factors,
        model: scoreResult.model,
        confidence: scoreResult.confidence,
      },
    });
  }

  /**
   * Récupère emails triés par score (inbox priorisée)
   */
  async getPrioritizedInbox(
    tenantId: string,
    options: {
      minScore?: number;
      category?: string;
      urgency?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { minScore = 0, category, urgency, limit = 50, offset = 0 } = options;

    const emails = await this.prisma.email.findMany({
      where: {
        tenantId,
        isArchived: false,
        ...(category && { category }),
        ...(urgency && { urgency }),
        inboxScore: {
          score: { gte: minScore },
        },
      },
      include: {
        inboxScore: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        dossier: {
          select: {
            numero: true,
            objet: true,
          },
        },
      },
      orderBy: {
        inboxScore: {
          score: 'desc',
        },
      },
      take: limit,
      skip: offset,
    });

    return emails;
  }

  /**
   * Stats scoring pour dashboard
   */
  async getScoringStats(tenantId: string) {
    const scores = await this.prisma.inboxScore.findMany({
      where: {
        email: {
          tenantId,
          isArchived: false,
        },
      },
      select: {
        score: true,
      },
    });

    const total = scores.length;
    const avgScore = total > 0 ? scores.reduce((sum, s) => sum + s.score, 0) / total : 0;
    const highPriority = scores.filter(s => s.score >= 70).length;
    const mediumPriority = scores.filter(s => s.score >= 40 && s.score < 70).length;
    const lowPriority = scores.filter(s => s.score < 40).length;

    return {
      total,
      avgScore: Math.round(avgScore),
      highPriority,
      mediumPriority,
      lowPriority,
      distribution: {
        high: Math.round((highPriority / total) * 100) || 0,
        medium: Math.round((mediumPriority / total) * 100) || 0,
        low: Math.round((lowPriority / total) * 100) || 0,
      },
    };
  }
}

export const smartInboxService = new SmartInboxService();
