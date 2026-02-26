/**
 * Service Multi-Canal Centralisé
 * Gère tous les canaux de communication avec normalisation, IA et audit
 */

import { prisma } from '@/lib/prisma';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  DeclanAdapter,
  DocumentAdapter,
  EmailAdapter,
  FormAdapter,
  InternalAdapter,
  LinkedInAdapter,
  SlackAdapter,
  SMSAdapter,
  TeamsAdapter,
  TwitterAdapter,
  VoiceAdapter,
  WhatsAppAdapter,
} from './adapters';
import { AIService } from './ai-processor';
import { AuditService } from './audit-service';
import { AIAnalysis, AuditEntry, ChannelType, NormalizedMessage, WebhookPayload } from './types';

/**
 * Adaptateurs pour chaque canal
 */
export interface ChannelAdapter {
  parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>>;
  extractExternalId(payload: Record<string, unknown>): string | undefined;
  validateSignature?(signature: string, payload: string, secret: string): boolean;
  sendMessage?(message: NormalizedMessage): Promise<{ success: boolean; externalId?: string }>;
}

/**
 * Service principal multi-canal
 */
export class MultiChannelService {
  private adapters: Map<ChannelType, ChannelAdapter> = new Map();
  private aiService: AIService;
  private auditService: AuditService;

  constructor() {
    this.aiService = new AIService();
    this.auditService = new AuditService();
    this.registerAdapters();
  }

  /**
   * Calculer le checksum d'un message pour détection doublons
   * Hash déterministe basé sur: canal + externalId OU (expéditeur + contenu + timestamp)
   */
  private computeChecksum(
    message: Partial<NormalizedMessage>,
    channel: ChannelType,
    externalId?: string
  ): string {
    const checksumData = {
      channel,
      externalId: externalId || undefined,
      sender: message.sender?.email || message.sender?.phone || message.sender?.externalId,
      body: message.body,
      subject: message.subject,
      // Arrondir à la minute pour éviter doublons sur renvois rapides
      timestamp: message.timestamps?.received
        ? Math.floor(new Date(message.timestamps.received).getTime() / 60000)
        : undefined,
    };

    const dataString = JSON.stringify(checksumData);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Vérifier si un message est un doublon
   */
  private async isDuplicate(checksum: string): Promise<boolean> {
    const existing = await prisma.channelMessage.findFirst({
      where: { checksum },
      select: { id: true, createdAt: true },
    });

    if (existing) {
      // Audit du doublon détecté
      await this.auditService.log({
        action: 'DUPLICATE_MESSAGE_DETECTED',
        channel: 'SYSTEM' as any,
        details: {
          checksum,
          originalMessageId: existing.id,
          originalReceivedAt: existing.createdAt,
        },
      });
      return true;
    }

    return false;
  }

  /**
   * Enregistrer les adaptateurs pour chaque canal
   */
  private registerAdapters() {
    this.adapters.set('EMAIL', new EmailAdapter());
    this.adapters.set('WHATSAPP', new WhatsAppAdapter());
    this.adapters.set('SMS', new SMSAdapter());
    this.adapters.set('VOICE', new VoiceAdapter());
    this.adapters.set('SLACK', new SlackAdapter());
    this.adapters.set('TEAMS', new TeamsAdapter());
    this.adapters.set('LINKEDIN', new LinkedInAdapter());
    this.adapters.set('TWITTER', new TwitterAdapter());
    this.adapters.set('FORM', new FormAdapter());
    this.adapters.set('DOCUMENT', new DocumentAdapter());
    this.adapters.set('DECLAN', new DeclanAdapter());
    this.adapters.set('INTERNAL', new InternalAdapter());
  }

  /**
   * Recevoir et traiter un message de n'importe quel canal
   */
  async receiveMessage(webhookPayload: WebhookPayload): Promise<NormalizedMessage> {
    const { channel, payload, signature, timestamp } = webhookPayload;

    const adapter = this.adapters.get(channel);
    if (!adapter) {
      throw new Error(`Canal non supporté: ${channel}`);
    }

    // Valider la signature si disponible
    if (adapter.validateSignature && signature) {
      const secret = await this.getChannelSecret(channel);
      if (!adapter.validateSignature(signature, JSON.stringify(payload), secret)) {
        await this.auditService.log({
          action: 'WEBHOOK_SIGNATURE_INVALID',
          channel,
          details: { timestamp },
        });
        throw new Error('Signature webhook invalide');
      }
    }

    // Extraire externalId du payload source
    const externalId = adapter.extractExternalId(payload);

    // Parser le payload vers format normalisé
    const parsedMessage = await adapter.parseWebhook(payload);

    // Créer le message normalisé complet
    const message: NormalizedMessage = {
      id: uuidv4(),
      externalId,
      checksum: '', // Sera calculé ci-dessous
      channel,
      direction: 'INBOUND',
      status: 'RECEIVED',
      sender: parsedMessage.sender || { name: 'Unknown' },
      recipient: parsedMessage.recipient || {},
      body: parsedMessage.body || '',
      subject: parsedMessage.subject,
      bodyHtml: parsedMessage.bodyHtml,
      attachments: parsedMessage.attachments || [],
      channelMetadata: payload,
      timestamps: {
        received: new Date(timestamp),
      },
      consent: parsedMessage.consent || { status: 'PENDING' },
      auditTrail: [],
    };

    // Calculer checksum pour détection doublons
    message.checksum = this.computeChecksum(message, channel, externalId);

    // Vérifier doublon AVANT stockage
    const isDup = await this.isDuplicate(message.checksum);
    if (isDup) {
      throw new Error(
        `Message doublon détecté (checksum: ${message.checksum.substring(0, 12)}...)`
      );
    }

    // Stocker le message
    await this.storeMessage(message);

    // Ajouter entrée audit
    this.addAuditEntry(message, 'MESSAGE_RECEIVED', 'SYSTEM', {
      channel: channel,
      externalId: externalId,
    });

    // Traiter avec IA (asynchrone, non-bloquant)
    if (message.body) {
      this.processWithAI(message).catch(err => {
        console.error(`[AI Processing Error] ${message.id}:`, err);
      });
    }

    return message;
  }

  /**
   * Stocker le message en base
   */
  private async storeMessage(message: NormalizedMessage): Promise<void> {
    await prisma.channelMessage.create({
      data: {
        id: message.id,
        externalId: message.externalId,
        checksum: message.checksum,
        channel: message.channel,
        direction: message.direction,
        status: message.status,
        senderData: message.sender as any,
        recipientData: message.recipient as any,
        subject: message.subject,
        body: message.body,
        bodyHtml: message.bodyHtml,
        attachments: message.attachments as any,
        channelMetadata: message.channelMetadata as any,
        receivedAt: message.timestamps.received,
        consentStatus: message.consent.status,
        tenantId: message.tenantId,
        clientId: message.clientId,
        dossierId: message.dossierId,
        auditTrail: message.auditTrail as any,
      },
    });
  }

  /**
   * Mettre à jour le statut
   */
  private async updateMessageStatus(id: string, status: string): Promise<void> {
    await prisma.channelMessage.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Mettre à jour le message complet
   */
  private async updateMessage(message: NormalizedMessage): Promise<void> {
    await prisma.channelMessage.update({
      where: { id: message.id },
      data: {
        status: message.status,
        aiSummary: message.aiAnalysis?.summary,
        aiCategory: message.aiAnalysis?.category,
        aiTags: message.aiAnalysis?.tags || [],
        aiUrgency: message.aiAnalysis?.urgency,
        processedAt: message.timestamps.processed,
        clientId: message.clientId,
        dossierId: message.dossierId,
        auditTrail: message.auditTrail as any,
      },
    });
  }

  /**
   * Créer une alerte urgente
   */
  private async createUrgentAlert(message: NormalizedMessage, analysis: AIAnalysis): Promise<void> {
    await prisma.notification.create({
      data: {
        type: 'URGENT_MESSAGE',
        title: `[${analysis.urgency}] Message urgent via ${message.channel}`,
        message: analysis.summary || message.body.substring(0, 200),
        data: {
          messageId: message.id,
          channel: message.channel,
          sender: message.sender,
          urgency: analysis.urgency,
        } as any,
        tenantId: message.tenantId,
      },
    });

    this.addAuditEntry(message, 'URGENT_ALERT_CREATED', 'SYSTEM', {
      urgency: analysis.urgency,
    });
  }

  /**
   * Auto-lier à un client existant
   */
  private async autoLinkClient(message: NormalizedMessage): Promise<void> {
    const client = await prisma.client.findFirst({
      where: {
        OR: [{ email: message.sender.email }, { phone: message.sender.phone }],
      },
    });

    if (client) {
      message.clientId = client.id;
      message.tenantId = client.tenantId;

      this.addAuditEntry(message, 'CLIENT_AUTO_LINKED', 'SYSTEM', {
        clientId: client.id,
        matchedBy: message.sender.email ? 'email' : 'phone',
      });
    }
  }

  /**
   * Récupérer le secret du canal depuis Key Vault
   */
  private async getChannelSecret(channel: ChannelType): Promise<string> {
    const secretName = `CHANNEL_${channel}_SECRET`;
    // En prod, utiliser Azure Key Vault
    return process.env[secretName] || '';
  }

  /**
   * Ajouter une entrée d'audit
   */
  private addAuditEntry(
    message: NormalizedMessage,
    action: string,
    actorType: 'SYSTEM' | 'USER' | 'AI',
    details: Record<string, unknown> = {}
  ): void {
    const entry: AuditEntry = {
      timestamp: new Date(),
      action,
      actor: { type: actorType },
      details,
    };
    message.auditTrail.push(entry);
  }

  /**
   * Obtenir les messages d'un tenant
   */
  async getMessages(
    tenantId: string,
    options: {
      channel?: ChannelType;
      status?: string;
      clientId?: string;
      dossierId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ messages: NormalizedMessage[]; total: number }> {
    const {
      channel,
      status,
      clientId,
      dossierId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = options;

    const where: any = { tenantId };
    if (channel) where.channel = channel;
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (dossierId) where.dossierId = dossierId;
    if (startDate || endDate) {
      where.receivedAt = {};
      if (startDate) where.receivedAt.gte = startDate;
      if (endDate) where.receivedAt.lte = endDate;
    }

    const [messages, total] = await Promise.all([
      prisma.channelMessage.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.channelMessage.count({ where }),
    ]);

    return {
      messages: messages.map(this.dbToNormalized),
      total,
    };
  }

  /**
   * Convertir DB vers format normalisé
   */
  private dbToNormalized(db: any): NormalizedMessage {
    return {
      id: db.id,
      channel: db.channel,
      direction: db.direction,
      status: db.status,
      sender: db.senderData,
      recipient: db.recipientData,
      subject: db.subject,
      body: db.body,
      bodyHtml: db.bodyHtml,
      attachments: db.attachments || [],
      channelMetadata: db.channelMetadata || {},
      aiAnalysis: db.aiSummary
        ? {
            summary: db.aiSummary,
            category: db.aiCategory,
            tags: db.aiTags || [],
            urgency: db.aiUrgency || 'LOW',
            entities: [],
            suggestedActions: [],
            missingInfo: [],
            processedAt: db.processedAt,
            confidence: 0.8,
          }
        : undefined,
      timestamps: {
        received: db.receivedAt,
        processed: db.processedAt,
        archived: db.archivedAt,
      },
      consent: {
        status: db.consentStatus,
      },
      tenantId: db.tenantId,
      clientId: db.clientId,
      dossierId: db.dossierId,
      auditTrail: db.auditTrail || [],
    };
  }

  /**
   * Stats par canal
   */
  async getChannelStats(tenantId: string, period: { start: Date; end: Date }) {
    const stats = await prisma.channelMessage.groupBy({
      by: ['channel'],
      where: {
        tenantId,
        receivedAt: {
          gte: period.start,
          lte: period.end,
        },
      },
      _count: true,
    });

    return stats;
  }
}

// Export singleton
export const multiChannelService = new MultiChannelService();
