/**
 * DeadlineMonitorService - Phase 6
 * Monitoring et notifications délais critiques
 */

import { PrismaClient, DeadlineStatus } from '@prisma/client';
import { EventLogService } from '../../../lib/services/event-log.service';

interface DeadlineCheckResult {
  deadlineId: string;
  label: string;
  dueDate: Date;
  previousStatus: DeadlineStatus;
  newStatus: DeadlineStatus;
  daysRemaining: number;
  eventCreated: boolean;
}

export class DeadlineMonitorService {
  private prisma: PrismaClient;
  private eventLogService: EventLogService;

  constructor(prisma?: PrismaClient, eventLogService?: EventLogService) {
    this.prisma = prisma || new PrismaClient();
    this.eventLogService = eventLogService || new EventLogService(this.prisma);
  }

  /**
   * Calculer jours restants jusqu'à deadline
   */
  private calculateDaysRemaining(dueDate: Date): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Déterminer status selon jours restants
   */
  private determineStatus(daysRemaining: number, currentStatus: DeadlineStatus): DeadlineStatus {
    // Ne pas changer si déjà COMPLETED ou CANCELLED
    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
      return currentStatus;
    }

    if (daysRemaining < 0) {
      return 'OVERDUE';
    } else if (daysRemaining === 0 || daysRemaining === 1) {
      return 'CRITICAL'; // J-1 ou J-0
    } else if (daysRemaining <= 3) {
      return 'URGENT'; // J-3 à J-2
    } else if (daysRemaining <= 7) {
      return 'APPROACHING'; // J-7 à J-4
    }
    return 'PENDING';
  }

  /**
   * Vérifier et mettre à jour une deadline
   */
  private async checkSingleDeadline(deadline: any): Promise<DeadlineCheckResult | null> {
    const daysRemaining = this.calculateDaysRemaining(deadline.dueDate);
    const newStatus = this.determineStatus(daysRemaining, deadline.status);

    // Pas de changement nécessaire
    if (newStatus === deadline.status) {
      return null;
    }

    // Mettre à jour status + flags alert
    const updates: any = { status: newStatus };

    if (daysRemaining <= 7 && !deadline.alertJ7Sent) {
      updates.alertJ7Sent = true;
    }
    if (daysRemaining <= 3 && !deadline.alertJ3Sent) {
      updates.alertJ3Sent = true;
    }
    if (daysRemaining <= 1 && !deadline.alertJ1Sent) {
      updates.alertJ1Sent = true;
    }

    await this.prisma.legalDeadline.update({
      where: { id: deadline.id },
      data: updates,
    });

    // Créer EventLog selon nouveau status
    let eventType: any = null;
    if (newStatus === 'APPROACHING') eventType = 'DEADLINE_APPROACHING';
    else if (newStatus === 'URGENT') eventType = 'DEADLINE_URGENT';
    else if (newStatus === 'CRITICAL') eventType = 'DEADLINE_CRITICAL';
    else if (newStatus === 'OVERDUE') eventType = 'DEADLINE_MISSED';

    let eventCreated = false;
    if (eventType) {
      await this.eventLogService.createEventLog({
        tenantId: deadline.tenantId,
        eventType,
        actorType: 'SYSTEM',
        entityType: 'deadline',
        entityId: deadline.id,
        metadata: {
          deadlineId: deadline.id,
          label: deadline.label,
          type: deadline.type,
          dueDate: deadline.dueDate.toISOString(),
          daysRemaining,
          previousStatus: deadline.status,
          newStatus,
          dossierId: deadline.dossierId,
          clientId: deadline.clientId,
        },
      });
      eventCreated = true;
    }

    return {
      deadlineId: deadline.id,
      label: deadline.label,
      dueDate: deadline.dueDate,
      previousStatus: deadline.status,
      newStatus,
      daysRemaining,
      eventCreated,
    };
  }

  /**
   * Vérifier toutes les deadlines actives
   */
  async checkAllDeadlines(tenantId?: string) {
    const where: any = {
      status: {
        notIn: ['COMPLETED', 'CANCELLED'],
      },
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const deadlines = await this.prisma.legalDeadline.findMany({
      where,
      include: {
        dossier: {
          select: { numero: true, objet: true, statut: true },
        },
        client: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const results: DeadlineCheckResult[] = [];

    for (const deadline of deadlines) {
      const result = await this.checkSingleDeadline(deadline);
      if (result) {
        results.push(result);
      }
    }

    return {
      checked: deadlines.length,
      updated: results.length,
      results,
    };
  }

  /**
   * Récupérer deadlines urgentes (upcoming)
   */
  async getUpcomingDeadlines(
    tenantId: string,
    options: {
      status?: DeadlineStatus[];
      dossierId?: string;
      limit?: number;
      daysAhead?: number;
    } = {}
  ) {
    const { status = ['APPROACHING', 'URGENT', 'CRITICAL', 'OVERDUE'], dossierId, limit = 50, daysAhead = 30 } =
      options;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const where: any = {
      tenantId,
      status: { in: status },
      dueDate: { lte: futureDate },
    };

    if (dossierId) {
      where.dossierId = dossierId;
    }

    const deadlines = await this.prisma.legalDeadline.findMany({
      where,
      include: {
        dossier: {
          select: {
            id: true,
            numero: true,
            objet: true,
            statut: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
    });

    // Enrichir avec jours restants
    const enriched = deadlines.map((d) => ({
      ...d,
      daysRemaining: this.calculateDaysRemaining(d.dueDate),
    }));

    return {
      deadlines: enriched,
      total: enriched.length,
      byStatus: {
        critical: enriched.filter((d) => d.status === 'CRITICAL').length,
        urgent: enriched.filter((d) => d.status === 'URGENT').length,
        approaching: enriched.filter((d) => d.status === 'APPROACHING').length,
        overdue: enriched.filter((d) => d.status === 'OVERDUE').length,
      },
    };
  }

  /**
   * Marquer une deadline comme complétée
   */
  async completeDeadline(deadlineId: string, tenantId: string, userId: string, note?: string) {
    const deadline = await this.prisma.legalDeadline.findUnique({
      where: { id: deadlineId },
    });

    if (!deadline || deadline.tenantId !== tenantId) {
      throw new Error('Deadline not found');
    }

    await this.prisma.legalDeadline.update({
      where: { id: deadlineId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedBy: userId,
        completionNote: note,
      },
    });

    // EventLog DEADLINE_COMPLETED
    await this.eventLogService.createEventLog({
      tenantId,
      eventType: 'DEADLINE_COMPLETED',
      actorType: 'USER',
      actorId: userId,
      entityType: 'deadline',
      entityId: deadlineId,
      metadata: {
        deadlineId,
        label: deadline.label,
        type: deadline.type,
        dueDate: deadline.dueDate.toISOString(),
        completionNote: note,
        wasOverdue: deadline.status === 'OVERDUE',
      },
    });

    return { success: true };
  }

  /**
   * Stats deadlines pour dashboard
   */
  async getDeadlineStats(tenantId: string) {
    const [total, byStatus, overdueSoon] = await Promise.all([
      this.prisma.legalDeadline.count({
        where: {
          tenantId,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
      this.prisma.legalDeadline.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
      this.prisma.legalDeadline.count({
        where: {
          tenantId,
          status: { in: ['CRITICAL', 'URGENT'] },
        },
      }),
    ]);

    return {
      total,
      activeDeadlines: total,
      overdueSoon,
      byStatus: byStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
}
