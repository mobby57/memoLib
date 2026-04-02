/**
 * RGPD Compliance Service (Phase 9)
 *
 * Service RGPD complet:
 * - Export données personnelles (droit à la portabilité)
 * - Anonymisation utilisateur (droit à l'oubli)
 * - Suppression données (droit à l'effacement)
 * - Gestion consentements (RGPD Art. 7)
 * - EventLog pour traçabilité conformité
 *
 * Conformité RGPD:
 * - Art. 15: Droit d'accès
 * - Art. 16: Droit de rectification
 * - Art. 17: Droit à l'effacement
 * - Art. 20: Droit à la portabilité
 */

import { PrismaClient } from '@prisma/client';
import { EventLogService } from '@/lib/services/event-log.service';

const prisma = new PrismaClient();
const eventLogService = new EventLogService();

interface ExportData {
  user: any;
  dossiers: any[];
  documents: any[];
  comments: any[];
  chatSessions: any[];
  consents: any[];
  auditLogs: any[];
  exportMetadata: {
    exportedAt: string;
    requestedBy: string;
    dataSize: number;
    itemsCount: number;
  };
}

interface AnonymizationResult {
  userId: string;
  anonymizedFields: string[];
  tablesAffected: string[];
  timestamp: Date;
}

interface DeletionResult {
  userId: string;
  deletedRecords: {
    [tableName: string]: number;
  };
  totalDeleted: number;
  timestamp: Date;
}

export class RGPDComplianceService {
  /**
   * Export complet des données personnelles (Art. 15 + 20 RGPD)
   * Format JSON structuré avec toutes les données utilisateur
   */
  async exportUserData(params: {
    userId: string;
    tenantId: string;
    requestedBy: string;
  }): Promise<{ requestId: string; exportData: ExportData }> {
    const { userId, tenantId, requestedBy } = params;

    // Créer demande d'export
    const exportRequest = await prisma.dataExportRequest.create({
      data: {
        tenantId,
        userId,
        status: 'processing',
        format: 'json',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      },
    });

    await eventLogService.createEventLog({
      tenantId,
      actorId: requestedBy,
      actorType: 'USER',
      eventType: 'DATA_EXPORT_REQUESTED',
      entityType: 'user',
      entityId: userId,
      metadata: {
        requestId: exportRequest.id,
        format: 'json',
      },
    });

    try {
      // Récupérer TOUTES les données utilisateur
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          tenant: {
            select: { id: true, name: true, subdomain: true },
          },
          client: true,
          oauthTokens: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Dossiers
      const dossiers = await prisma.dossier.findMany({
        where: {
          tenantId,
          OR: [
            { responsableId: userId },
            { collaborateurs: { contains: userId } },
          ],
        },
        include: {
          client: {
            select: { firstName: true, lastName: true, email: true },
          },
          emails: {
            select: { id: true, subject: true, receivedAt: true },
          },
          legalDeadlines: true,
        },
      });

      // Documents uploadés
      const documents = await prisma.document.findMany({
        where: {
          tenantId,
          uploadedBy: userId,
        },
        select: {
          id: true,
          filename: true,
          category: true,
          size: true,
          ocrProcessed: true,
          createdAt: true,
        },
      });

      // Commentaires
      const comments = await prisma.comment.findMany({
        where: {
          tenantId,
          authorId: userId,
        },
      });

      // Sessions chat IA
      const chatSessions = await prisma.chatSession.findMany({
        where: {
          tenantId,
          userId,
        },
        include: {
          messages: {
            select: {
              role: true,
              content: true,
              createdAt: true,
            },
          },
        },
      });

      // Consentements
      const consents = await prisma.consentRecord.findMany({
        where: {
          tenantId,
          userId,
        },
      });

      // Audit logs (accès, actions)
      const auditLogs = await prisma.eventLog.findMany({
        where: {
          tenantId,
          actorId: userId,
        },
        orderBy: { timestamp: 'desc' },
        take: 1000, // Limiter à 1000 derniers
      });

      // Construire export
      const exportData: ExportData = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          language: user.language,
          timezone: user.timezone,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          tenant: user.tenant,
          client: user.client,
        },
        dossiers: dossiers.map((d) => ({
          id: d.id,
          numero: d.numero,
          typeDossier: d.typeDossier,
          objet: d.objet,
          statut: d.statut,
          client: d.client,
          emailsCount: d.emails.length,
          deadlinesCount: d.legalDeadlines.length,
          createdAt: d.dateCreation,
        })),
        documents: documents,
        comments: comments.map((c) => ({
          id: c.id,
          content: c.content,
          entityType: c.entityType,
          createdAt: c.createdAt,
        })),
        chatSessions: chatSessions.map((s) => ({
          id: s.id,
          title: s.title,
          messagesCount: s.messages.length,
          messages: s.messages,
          createdAt: s.createdAt,
        })),
        consents: consents.map((c) => ({
          purpose: c.purpose,
          granted: c.granted,
          grantedAt: c.grantedAt,
          revokedAt: c.revokedAt,
        })),
        auditLogs: auditLogs.map((log) => ({
          timestamp: log.timestamp,
          eventType: log.eventType,
          entityType: log.entityType,
          metadata: log.metadata,
        })),
        exportMetadata: {
          exportedAt: new Date().toISOString(),
          requestedBy,
          dataSize: 0, // Calculé après
          itemsCount:
            dossiers.length +
            documents.length +
            comments.length +
            chatSessions.length +
            consents.length +
            auditLogs.length,
        },
      };

      // Calculer taille
      const exportJson = JSON.stringify(exportData, null, 2);
      const exportSize = Buffer.from(exportJson).length;
      exportData.exportMetadata.dataSize = exportSize;

      // Mettre à jour requête (en prod: uploader vers S3/Blob)
      await prisma.dataExportRequest.update({
        where: { id: exportRequest.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          exportSize,
          exportUrl: `/exports/${exportRequest.id}.json`, // Simulation
        },
      });

      // EventLog
      await eventLogService.createEventLog({
        tenantId,
        actorId: requestedBy,
        actorType: 'SYSTEM',
        eventType: 'DATA_EXPORTED',
        entityType: 'user',
        entityId: userId,
        metadata: {
          requestId: exportRequest.id,
          dataSize: exportSize,
          itemsCount: exportData.exportMetadata.itemsCount,
          format: 'json',
        },
      });

      return {
        requestId: exportRequest.id,
        exportData,
      };
    } catch (error: any) {
      // Échec export
      await prisma.dataExportRequest.update({
        where: { id: exportRequest.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Anonymise données utilisateur (Art. 17 RGPD - Droit à l'oubli)
   * Remplace données personnelles identifiantes tout en gardant structure
   */
  async anonymizeUser(params: {
    userId: string;
    tenantId: string;
    requestedBy: string;
  }): Promise<AnonymizationResult> {
    const { userId, tenantId, requestedBy } = params;

    const timestamp = new Date();
    const anonymizedSuffix = `-anonymized-${Date.now()}`;

    const tablesAffected: string[] = [];

    // 1. Anonymiser User
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `anonymized${anonymizedSuffix}@deleted.local`,
        name: 'Utilisateur Anonymisé',
        phone: null,
        avatar: null,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    tablesAffected.push('users');

    // 2. Anonymiser Client associé (si existe)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clientId: true },
    });

    if (user?.clientId) {
      await prisma.client.update({
        where: { id: user.clientId },
        data: {
          firstName: 'Anonymisé',
          lastName: 'ANONYMISE',
          email: `anonymized${anonymizedSuffix}@deleted.local`,
          phone: null,
          phoneSecondaire: null,
          address: null,
          passportNumber: null,
        },
      });
      tablesAffected.push('clients');
    }

    // 3. Anonymiser OAuthTokens (révoquer)
    await prisma.oAuthToken.updateMany({
      where: { userId },
      data: {
        accessToken: 'REVOKED',
        refreshToken: 'REVOKED',
        revokedAt: timestamp,
      },
    });
    tablesAffected.push('oauth_tokens');

    // 4. Anonymiser commentaires (contenu supprimé)
    await prisma.comment.updateMany({
      where: { authorId: userId },
      data: {
        content: '[Contenu supprimé - utilisateur anonymisé]',
      },
    });
    tablesAffected.push('comments');

    // 5. Anonymiser sessions chat
    await prisma.chatSession.updateMany({
      where: { userId },
      data: {
        title: '[Session anonymisée]',
      },
    });
    tablesAffected.push('chat_sessions');

    // EventLog anonymisation
    await eventLogService.createEventLog({
      tenantId,
      actorId: requestedBy,
      actorType: 'SYSTEM',
      eventType: 'DATA_ANONYMIZED',
      entityType: 'user',
      entityId: userId,
      metadata: {
        tablesAffected,
        anonymizedFields: ['email', 'name', 'phone', 'address', 'passportNumber'],
        timestamp: timestamp.toISOString(),
      },
    });

    return {
      userId,
      anonymizedFields: ['email', 'name', 'phone', 'address', 'passportNumber', 'comments', 'chatSessions'],
      tablesAffected,
      timestamp,
    };
  }

  /**
   * Supprime complètement données utilisateur (Art. 17 RGPD)
   * ATTENTION: Suppression CASCADE irréversible
   */
  async deleteUserData(params: {
    userId: string;
    tenantId: string;
    requestedBy: string;
  }): Promise<DeletionResult> {
    const { userId, tenantId, requestedBy } = params;

    const deletedRecords: { [tableName: string]: number } = {};

    // Compter avant suppression
    const chatMessages = await prisma.chatMessage.count({ where: { userId } });
    const chatSessions = await prisma.chatSession.count({ where: { userId } });
    const comments = await prisma.comment.count({ where: { authorId: userId } });
    const mentions = await prisma.mention.count({ where: { userId } });
    const documents = await prisma.document.count({ where: { uploadedBy: userId } });
    const oauthTokens = await prisma.oAuthToken.count({ where: { userId } });
    const consents = await prisma.consentRecord.count({ where: { userId } });
    const exportRequests = await prisma.dataExportRequest.count({ where: { userId } });

    deletedRecords['chat_messages'] = chatMessages;
    deletedRecords['chat_sessions'] = chatSessions;
    deletedRecords['comments'] = comments;
    deletedRecords['mentions'] = mentions;
    deletedRecords['documents'] = documents;
    deletedRecords['oauth_tokens'] = oauthTokens;
    deletedRecords['consent_records'] = consents;
    deletedRecords['data_export_requests'] = exportRequests;

    // EventLog AVANT suppression (conservé pour audit)
    await eventLogService.createEventLog({
      tenantId,
      actorId: requestedBy,
      actorType: 'SYSTEM',
      eventType: 'DATA_DELETED',
      entityType: 'user',
      entityId: userId,
      metadata: {
        deletedRecords,
        cascadeCount: Object.values(deletedRecords).reduce((a, b) => a + b, 0),
        timestamp: new Date().toISOString(),
      },
    });

    // Suppression User (CASCADE automatique via Prisma schema)
    await prisma.user.delete({
      where: { id: userId },
    });

    deletedRecords['users'] = 1;

    const totalDeleted = Object.values(deletedRecords).reduce((a, b) => a + b, 0);

    return {
      userId,
      deletedRecords,
      totalDeleted,
      timestamp: new Date(),
    };
  }

  /**
   * Accorde consentement utilisateur (Art. 7 RGPD)
   */
  async grantConsent(params: {
    userId: string;
    tenantId: string;
    purpose: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<any> {
    const { userId, tenantId, purpose, ipAddress, userAgent } = params;

    const consent = await prisma.consentRecord.create({
      data: {
        tenantId,
        userId,
        purpose,
        granted: true,
        grantedAt: new Date(),
        ipAddress,
        userAgent,
        consentMethod: 'explicit_checkbox',
      },
    });

    await eventLogService.createEventLog({
      tenantId,
      actorId: userId,
      actorType: 'USER',
      eventType: 'CONSENT_GRANTED',
      entityType: 'consent',
      entityId: consent.id,
      metadata: {
        purpose,
        ipAddress,
        method: 'explicit_checkbox',
      },
    });

    return consent;
  }

  /**
   * Révoque consentement utilisateur (Art. 7 RGPD)
   */
  async revokeConsent(params: { consentId: string; userId: string; tenantId: string }): Promise<any> {
    const { consentId, userId, tenantId } = params;

    const consent = await prisma.consentRecord.update({
      where: { id: consentId },
      data: {
        granted: false,
        revokedAt: new Date(),
      },
    });

    await eventLogService.createEventLog({
      tenantId,
      actorId: userId,
      actorType: 'USER',
      eventType: 'CONSENT_REVOKED',
      entityType: 'consent',
      entityId: consentId,
      metadata: {
        purpose: consent.purpose,
        revokedAt: consent.revokedAt?.toISOString(),
      },
    });

    return consent;
  }

  /**
   * Liste consentements utilisateur
   */
  async listUserConsents(params: { userId: string; tenantId: string }): Promise<any[]> {
    const { userId, tenantId } = params;

    return prisma.consentRecord.findMany({
      where: {
        userId,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Récupère demande d'export
   */
  async getExportRequest(requestId: string): Promise<any> {
    return prisma.dataExportRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }
}
