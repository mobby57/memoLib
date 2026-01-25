/**
 * Service d'Audit pour conformité RGPD et traçabilité
 * Horodatage, logs immuables, export, suppression
 */

import { prisma } from '@/lib/prisma';
import { ChannelType, AuditEntry } from './types';
import crypto from 'crypto';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  channel?: ChannelType;
  actorType: 'SYSTEM' | 'USER' | 'AI';
  actorId?: string;
  actorName?: string;
  resourceType: string;
  resourceId: string;
  tenantId?: string;
  clientId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  hash: string; // Hash pour intégrité
  previousHash?: string; // Chaînage pour immutabilité
}

export interface RGPDConsentRecord {
  id: string;
  clientId: string;
  channel: ChannelType;
  purpose: string;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  expiresAt?: Date;
  proofDocument?: string;
  ipAddress?: string;
}

export interface DataRetentionPolicy {
  channel: ChannelType;
  retentionDays: number;
  autoArchive: boolean;
  autoDelete: boolean;
}

export class AuditService {
  private lastHash: string = '';

  /**
   * Logger un événement avec horodatage et chaînage
   */
  async log(params: {
    action: string;
    channel?: ChannelType;
    actorType?: 'SYSTEM' | 'USER' | 'AI';
    actorId?: string;
    actorName?: string;
    resourceType?: string;
    resourceId?: string;
    tenantId?: string;
    clientId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLogEntry> {
    const timestamp = new Date();
    const id = crypto.randomUUID();
    
    // Récupérer le dernier hash pour chaînage
    const lastEntry = await prisma.auditLog.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { hash: true },
    });
    const previousHash = lastEntry?.hash || '';

    // Créer le hash de cette entrée (intégrité)
    const dataToHash = JSON.stringify({
      id,
      timestamp: timestamp.toISOString(),
      action: params.action,
      details: params.details,
      previousHash,
    });
    const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    const entry: AuditLogEntry = {
      id,
      timestamp,
      action: params.action,
      channel: params.channel,
      actorType: params.actorType || 'SYSTEM',
      actorId: params.actorId,
      actorName: params.actorName,
      resourceType: params.resourceType || 'UNKNOWN',
      resourceId: params.resourceId || '',
      tenantId: params.tenantId,
      clientId: params.clientId,
      details: params.details || {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      hash,
      previousHash,
    };

    // Stocker en base
    await prisma.auditLog.create({
      data: {
        id: entry.id,
        timestamp: entry.timestamp,
        action: entry.action,
        channel: entry.channel,
        actorType: entry.actorType,
        actorId: entry.actorId,
        actorName: entry.actorName,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        tenantId: entry.tenantId,
        clientId: entry.clientId,
        details: entry.details as any,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        hash: entry.hash,
        previousHash: entry.previousHash,
      },
    });

    this.lastHash = hash;
    return entry;
  }

  /**
   * Vérifier l'intégrité de la chaîne d'audit
   */
  async verifyIntegrity(startDate?: Date, endDate?: Date): Promise<{
    valid: boolean;
    totalEntries: number;
    invalidEntries: string[];
    brokenChainAt?: string;
  }> {
    const where: any = {};
    if (startDate) where.timestamp = { gte: startDate };
    if (endDate) where.timestamp = { ...where.timestamp, lte: endDate };

    const entries = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    });

    const invalidEntries: string[] = [];
    let previousHash = '';
    let brokenChainAt: string | undefined;

    for (const entry of entries) {
      // Vérifier le chaînage
      if (entry.previousHash !== previousHash && !brokenChainAt) {
        brokenChainAt = entry.id;
      }

      // Vérifier le hash
      const dataToHash = JSON.stringify({
        id: entry.id,
        timestamp: entry.timestamp.toISOString(),
        action: entry.action,
        details: entry.details,
        previousHash: entry.previousHash,
      });
      const expectedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
      
      if (entry.hash !== expectedHash) {
        invalidEntries.push(entry.id);
      }

      previousHash = entry.hash;
    }

    return {
      valid: invalidEntries.length === 0 && !brokenChainAt,
      totalEntries: entries.length,
      invalidEntries,
      brokenChainAt,
    };
  }

  /**
   * Enregistrer un consentement RGPD
   */
  async recordConsent(params: {
    clientId: string;
    channel: ChannelType;
    purpose: string;
    granted: boolean;
    expiresAt?: Date;
    proofDocument?: string;
    ipAddress?: string;
  }): Promise<RGPDConsentRecord> {
    const id = crypto.randomUUID();
    const now = new Date();

    const record: RGPDConsentRecord = {
      id,
      clientId: params.clientId,
      channel: params.channel,
      purpose: params.purpose,
      granted: params.granted,
      grantedAt: params.granted ? now : undefined,
      revokedAt: !params.granted ? now : undefined,
      expiresAt: params.expiresAt,
      proofDocument: params.proofDocument,
      ipAddress: params.ipAddress,
    };

    await prisma.rGPDConsent.create({
      data: {
        id: record.id,
        clientId: record.clientId,
        channel: record.channel,
        purpose: record.purpose,
        granted: record.granted,
        grantedAt: record.grantedAt,
        revokedAt: record.revokedAt,
        expiresAt: record.expiresAt,
        proofDocument: record.proofDocument,
        ipAddress: record.ipAddress,
      },
    });

    // Log de l'événement
    await this.log({
      action: params.granted ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
      channel: params.channel,
      actorType: 'USER',
      resourceType: 'CONSENT',
      resourceId: id,
      clientId: params.clientId,
      details: {
        purpose: params.purpose,
        expiresAt: params.expiresAt,
      },
      ipAddress: params.ipAddress,
    });

    return record;
  }

  /**
   * Vérifier si un consentement est valide
   */
  async checkConsent(clientId: string, channel: ChannelType, purpose?: string): Promise<boolean> {
    const consent = await prisma.rGPDConsent.findFirst({
      where: {
        clientId,
        channel,
        granted: true,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
        ...(purpose && { purpose }),
      },
    });

    return !!consent;
  }

  /**
   * Exporter toutes les données d'un client (droit d'accès RGPD)
   */
  async exportClientData(clientId: string): Promise<{
    client: any;
    messages: any[];
    consents: any[];
    auditLogs: any[];
    exportedAt: Date;
  }> {
    const [client, messages, consents, auditLogs] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId }, include: { dossiers: true } }),
      prisma.channelMessage.findMany({ where: { clientId } }),
      prisma.rGPDConsent.findMany({ where: { clientId } }),
      prisma.auditLog.findMany({ where: { clientId }, orderBy: { timestamp: 'asc' } }),
    ]);

    const exportData = {
      client,
      messages,
      consents,
      auditLogs,
      exportedAt: new Date(),
    };

    // Log de l'export
    await this.log({
      action: 'RGPD_DATA_EXPORT',
      actorType: 'SYSTEM',
      resourceType: 'CLIENT',
      resourceId: clientId,
      clientId,
      details: {
        messagesCount: messages.length,
        consentsCount: consents.length,
        auditLogsCount: auditLogs.length,
      },
    });

    return exportData;
  }

  /**
   * Supprimer les données d'un client (droit à l'oubli RGPD)
   */
  async deleteClientData(clientId: string, options: {
    keepAuditLogs?: boolean;
    reason?: string;
    requestedBy?: string;
  } = {}): Promise<{
    deletedMessages: number;
    deletedDocuments: number;
    deletedConsents: number;
    anonymizedAuditLogs: number;
  }> {
    // Log avant suppression
    await this.log({
      action: 'RGPD_DELETION_REQUESTED',
      actorType: 'USER',
      actorId: options.requestedBy,
      resourceType: 'CLIENT',
      resourceId: clientId,
      clientId,
      details: {
        reason: options.reason,
        keepAuditLogs: options.keepAuditLogs,
      },
    });

    // Supprimer les messages
    const deletedMessages = await prisma.channelMessage.deleteMany({
      where: { clientId },
    });

    // Supprimer les documents liés
    const deletedDocuments = await prisma.document.deleteMany({
      where: { dossier: { clientId } },
    });

    // Supprimer les consentements
    const deletedConsents = await prisma.rGPDConsent.deleteMany({
      where: { clientId },
    });

    // Anonymiser les logs d'audit si demandé
    let anonymizedAuditLogs = 0;
    if (!options.keepAuditLogs) {
      const result = await prisma.auditLog.updateMany({
        where: { clientId },
        data: {
          clientId: null,
          details: { anonymized: true, originalClientId: 'DELETED' },
        },
      });
      anonymizedAuditLogs = result.count;
    }

    // Log final
    await this.log({
      action: 'RGPD_DELETION_COMPLETED',
      actorType: 'SYSTEM',
      resourceType: 'CLIENT',
      resourceId: clientId,
      details: {
        deletedMessages: deletedMessages.count,
        deletedDocuments: deletedDocuments.count,
        deletedConsents: deletedConsents.count,
        anonymizedAuditLogs,
      },
    });

    return {
      deletedMessages: deletedMessages.count,
      deletedDocuments: deletedDocuments.count,
      deletedConsents: deletedConsents.count,
      anonymizedAuditLogs,
    };
  }

  /**
   * Appliquer la politique de rétention des données
   */
  async applyRetentionPolicy(policy: DataRetentionPolicy): Promise<{
    archivedCount: number;
    deletedCount: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    let archivedCount = 0;
    let deletedCount = 0;

    if (policy.autoArchive) {
      const result = await prisma.channelMessage.updateMany({
        where: {
          channel: policy.channel,
          status: { not: 'ARCHIVED' },
          receivedAt: { lt: cutoffDate },
        },
        data: {
          status: 'ARCHIVED',
          archivedAt: new Date(),
        },
      });
      archivedCount = result.count;
    }

    if (policy.autoDelete) {
      const result = await prisma.channelMessage.deleteMany({
        where: {
          channel: policy.channel,
          status: 'ARCHIVED',
          archivedAt: { lt: cutoffDate },
        },
      });
      deletedCount = result.count;
    }

    if (archivedCount > 0 || deletedCount > 0) {
      await this.log({
        action: 'RETENTION_POLICY_APPLIED',
        channel: policy.channel,
        actorType: 'SYSTEM',
        resourceType: 'CHANNEL_MESSAGES',
        resourceId: policy.channel,
        details: {
          retentionDays: policy.retentionDays,
          archivedCount,
          deletedCount,
          cutoffDate,
        },
      });
    }

    return { archivedCount, deletedCount };
  }

  /**
   * Obtenir les logs d'audit avec filtrage
   */
  async getAuditLogs(params: {
    tenantId?: string;
    clientId?: string;
    channel?: ChannelType;
    action?: string;
    actorType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{ logs: AuditLogEntry[]; total: number }> {
    const { page = 1, limit = 50, ...filters } = params;
    
    const where: any = {};
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.channel) where.channel = filters.channel;
    if (filters.action) where.action = { contains: filters.action };
    if (filters.actorType) where.actorType = filters.actorType;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs: logs as AuditLogEntry[], total };
  }
}

export const auditService = new AuditService();
