/**
 * EventLog Service - Traçabilité immuable
 *
 * Implémentation RULE-004, RULE-005, RULE-006 (BUSINESS_RULES.md)
 *
 * Principes :
 * 1. Immuabilité absolue : Un EventLog créé ne peut JAMAIS être modifié/supprimé
 * 2. Exhaustivité : TOUTE action significative génère un EventLog
 * 3. Checksum : Garantie d'intégrité via hash SHA-256
 */

import { prisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

type EventType = string;
type ActorType = string;

// ============================================
// TYPES
// ============================================

export interface CreateEventLogParams {
  eventType: EventType;
  entityType: string;
  entityId: string;
  actorType: ActorType;
  actorId?: string;
  metadata?: Record<string, any>;
  tenantId: string;
}

export interface EventLogData {
  id: string;
  timestamp: Date;
  eventType: EventType;
  entityType: string;
  entityId: string;
  actorType: ActorType;
  actorId: string | null;
  metadata: any;
  checksum: string;
  tenantId: string;
}

// ============================================
// SERVICE
// ============================================

export class EventLogService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Créer un EventLog immuable
   *
   * RULE-005 : Génère un checksum SHA-256 pour garantir l'intégrité
   * RULE-006 : L'événement est horodaté côté serveur
   */
  async createEventLog(params: CreateEventLogParams): Promise<EventLogData> {
    const { eventType, entityType, entityId, actorType, actorId, metadata = {}, tenantId } = params;

    // Horodatage serveur (source de vérité - RULE-003)
    const timestamp = new Date();

    // Calcul checksum AVANT insertion (RULE-006)
    const checksum = this.calculateChecksum({
      timestamp,
      eventType,
      entityType,
      entityId,
      actorType,
      actorId: actorId || null,
      metadata,
      tenantId,
    });

    // Création en DB
    const eventLog = await this.prisma.eventLog.create({
      data: {
        timestamp,
        eventType,
        entityType,
        entityId,
        actorType,
        actorId: actorId || null,
        metadata: metadata as any,
        tenantId,
        immutable: true, // Toujours true (sécurité DB)
        checksum,
      },
    });

    return eventLog;
  }

  /**
   * Calculer le checksum SHA-256 d'un événement
   *
   * RULE-006 : Hash canonique pour vérification d'intégrité
   */
  private calculateChecksum(event: {
    timestamp: Date;
    eventType: EventType;
    entityType: string;
    entityId: string;
    actorType: ActorType;
    actorId: string | null;
    metadata: any;
    tenantId: string;
  }): string {
    // Canonicalisation : ordre déterministe des champs
    const canonical = JSON.stringify({
      timestamp: event.timestamp.toISOString(),
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      actorType: event.actorType,
      actorId: event.actorId,
      metadata: event.metadata,
      tenantId: event.tenantId,
    });

    return createHash('sha256').update(canonical, 'utf8').digest('hex');
  }

  /**
   * Vérifier l'intégrité d'un EventLog
   *
   * Retourne true si le checksum stocké = checksum recalculé
   */
  async verifyIntegrity(eventLogId: string): Promise<boolean> {
    const eventLog = await this.prisma.eventLog.findUnique({
      where: { id: eventLogId },
    });

    if (!eventLog) {
      throw new Error(`EventLog ${eventLogId} not found`);
    }

    const recalculatedChecksum = this.calculateChecksum({
      timestamp: eventLog.timestamp,
      eventType: eventLog.eventType,
      entityType: eventLog.entityType,
      entityId: eventLog.entityId,
      actorType: eventLog.actorType,
      actorId: eventLog.actorId,
      metadata: eventLog.metadata,
      tenantId: eventLog.tenantId,
    });

    return recalculatedChecksum === eventLog.checksum;
  }

  /**
   * Récupérer la timeline d'une entité
   *
   * Retourne tous les EventLog liés à une entité, triés chronologiquement
   */
  async getTimeline(params: {
    entityType: string;
    entityId: string;
    tenantId: string;
    limit?: number;
    offset?: number;
  }): Promise<EventLogData[]> {
    const { entityType, entityId, tenantId, limit = 100, offset = 0 } = params;

    return await this.prisma.eventLog.findMany({
      where: {
        entityType,
        entityId,
        tenantId,
      },
      orderBy: {
        timestamp: 'desc', // Plus récent en premier
      },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Récupérer tous les événements d'un tenant (admin)
   *
   * Filtres optionnels : eventType, actorId, période
   */
  async getAuditTrail(params: {
    tenantId: string;
    eventType?: EventType;
    actorId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<EventLogData[]> {
    const { tenantId, eventType, actorId, startDate, endDate, limit = 100, offset = 0 } = params;

    const where: any = {
      tenantId,
      ...(eventType && { eventType }),
      ...(actorId && { actorId }),
      ...(startDate || endDate
        ? {
            timestamp: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    return await this.prisma.eventLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Compter les événements (pour pagination)
   */
  async countEvents(params: {
    tenantId: string;
    entityType?: string;
    entityId?: string;
    eventType?: EventType;
  }): Promise<number> {
    const { tenantId, entityType, entityId, eventType } = params;

    return await this.prisma.eventLog.count({
      where: {
        tenantId,
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
        ...(eventType && { eventType }),
      },
    });
  }

  /**
   * Vérifier l'intégrité de tous les EventLog d'un tenant
   *
   * Usage : Cron job de vérification périodique
   * Retourne les IDs des événements corrompus (checksum invalide)
   */
  async verifyAllIntegrity(tenantId: string): Promise<string[]> {
    const events = await this.prisma.eventLog.findMany({
      where: { tenantId },
      select: {
        id: true,
        timestamp: true,
        eventType: true,
        entityType: true,
        entityId: true,
        actorType: true,
        actorId: true,
        metadata: true,
        checksum: true,
        tenantId: true,
      },
    });

    const corruptedIds: string[] = [];

    for (const event of events) {
      const recalculatedChecksum = this.calculateChecksum(event);
      if (recalculatedChecksum !== event.checksum) {
        corruptedIds.push(event.id);
      }
    }

    return corruptedIds;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

// Vérifier si prisma est une vraie instance ou un mock
const isRealPrisma = prisma && typeof prisma.eventLog?.create === 'function';
export const eventLogService = new EventLogService(isRealPrisma ? undefined : prisma);

// ============================================
// HELPER : Créer EventLog (shortcut)
// ============================================

export async function createEventLog(params: CreateEventLogParams): Promise<EventLogData> {
  return eventLogService.createEventLog(params);
}
