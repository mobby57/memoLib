/**
 * Service Multi-Canal Centralisé
 * Gère tous les canaux de communication avec normalisation, IA et audit
 */

import { prisma } from '@/lib/prisma';
import { 
  ChannelType, 
  NormalizedMessage, 
  WebhookPayload,
  AIAnalysis,
  AuditEntry,
  ChannelConfig,
  UrgencyLevel,
  Attachment
} from './types';
import { AIService } from './ai-processor';
import { AuditService } from './audit-service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Adaptateurs pour chaque canal
 */
interface ChannelAdapter {
  parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>>;
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

    // Parser le payload vers format normalisé
    const parsedMessage = await adapter.parseWebhook(payload);
    
    // Créer le message normalisé complet
    const message: NormalizedMessage = {
      id: uuidv4(),
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

    // Log réception
    this.addAuditEntry(message, 'MESSAGE_RECEIVED', 'SYSTEM', { channel });

    // Stocker en base
    await this.storeMessage(message);

    // Traitement IA asynchrone
    this.processWithAI(message).catch(console.error);

    return message;
  }

  /**
   * Traitement IA du message
   */
  async processWithAI(message: NormalizedMessage): Promise<NormalizedMessage> {
    try {
      message.status = 'PROCESSING';
      await this.updateMessageStatus(message.id, 'PROCESSING');

      // Analyse IA
      const analysis = await this.aiService.analyzeMessage(message);
      message.aiAnalysis = analysis;

      // Détection d'urgence
      if (analysis.urgency === 'CRITICAL' || analysis.urgency === 'HIGH') {
        await this.createUrgentAlert(message, analysis);
      }

      // Auto-linking client/dossier
      if (message.sender.email || message.sender.phone) {
        await this.autoLinkClient(message);
      }

      message.status = 'PROCESSED';
      message.timestamps.processed = new Date();
      
      this.addAuditEntry(message, 'AI_PROCESSING_COMPLETE', 'AI', {
        summary: analysis.summary,
        urgency: analysis.urgency,
        tags: analysis.tags,
      });

      await this.updateMessage(message);
      
      return message;
    } catch (error) {
      message.status = 'FAILED';
      this.addAuditEntry(message, 'AI_PROCESSING_FAILED', 'SYSTEM', { 
        error: (error as Error).message 
      });
      await this.updateMessageStatus(message.id, 'FAILED');
      throw error;
    }
  }

  /**
   * Stocker le message en base
   */
  private async storeMessage(message: NormalizedMessage): Promise<void> {
    await prisma.channelMessage.create({
      data: {
        id: message.id,
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
        OR: [
          { email: message.sender.email },
          { phone: message.sender.phone },
        ],
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
  async getMessages(tenantId: string, options: {
    channel?: ChannelType;
    status?: string;
    clientId?: string;
    dossierId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{ messages: NormalizedMessage[]; total: number }> {
    const { channel, status, clientId, dossierId, startDate, endDate, page = 1, limit = 50 } = options;

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
      aiAnalysis: db.aiSummary ? {
        summary: db.aiSummary,
        category: db.aiCategory,
        tags: db.aiTags || [],
        urgency: db.aiUrgency || 'LOW',
        entities: [],
        suggestedActions: [],
        missingInfo: [],
        processedAt: db.processedAt,
        confidence: 0.8,
      } : undefined,
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

// ===== ADAPTATEURS CANAUX =====

class EmailAdapter implements ChannelAdapter {
  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      sender: {
        email: payload.from as string,
        name: payload.fromName as string,
      },
      recipient: {
        email: payload.to as string,
      },
      subject: payload.subject as string,
      body: payload.text as string,
      bodyHtml: payload.html as string,
      attachments: (payload.attachments as any[])?.map(a => ({
        id: uuidv4(),
        filename: a.filename,
        mimeType: a.contentType,
        size: a.size,
        url: a.url,
      })) || [],
    };
  }
}

class WhatsAppAdapter implements ChannelAdapter {
  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    const message = (payload.entry as any[])?.[0]?.changes?.[0]?.value?.messages?.[0];
    const contact = (payload.entry as any[])?.[0]?.changes?.[0]?.value?.contacts?.[0];
    
    return {
      sender: {
        phone: message?.from,
        name: contact?.profile?.name,
        externalId: message?.id,
      },
      body: message?.text?.body || message?.caption || '',
      attachments: message?.type !== 'text' ? [{
        id: uuidv4(),
        filename: `${message?.type}_${Date.now()}`,
        mimeType: this.getMimeType(message?.type),
        size: 0,
        url: message?.[message?.type]?.url,
      }] : [],
      channelMetadata: { messageType: message?.type },
    };
  }

  validateSignature(signature: string, payload: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return signature === `sha256=${expectedSig}`;
  }

  private getMimeType(type: string): string {
    const mimeTypes: Record<string, string> = {
      image: 'image/jpeg',
      video: 'video/mp4',
      audio: 'audio/ogg',
      document: 'application/octet-stream',
    };
    return mimeTypes[type] || 'application/octet-stream';
  }
}

class SMSAdapter implements ChannelAdapter {
  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    // Format Twilio
    return {
      sender: {
        phone: payload.From as string,
      },
      recipient: {
        phone: payload.To as string,
      },
      body: payload.Body as string,
      channelMetadata: {
        messageSid: payload.MessageSid,
        accountSid: payload.AccountSid,
      },
    };
  }

  validateSignature(signature: string, payload: string, secret: string): boolean {
    // Validation signature Twilio
    const twilio = require('twilio');
    return twilio.validateRequest(secret, signature, process.env.TWILIO_WEBHOOK_URL!, JSON.parse(payload));
  }
}

class VoiceAdapter implements ChannelAdapter {
  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      sender: {
        phone: payload.From as string,
        name: payload.CallerName as string,
      },
      body: payload.TranscriptionText as string || '[Transcription en cours...]',
      channelMetadata: {
        callSid: payload.CallSid,
        callDuration: payload.CallDuration,
        recordingUrl: payload.RecordingUrl,
        transcriptionSid: payload.TranscriptionSid,
      },
      attachments: payload.RecordingUrl ? [{
        id: uuidv4(),
        filename: `call_${payload.CallSid}.mp3`,
        mimeType: 'audio/mpeg',
        size: 0,
        url: payload.RecordingUrl as string,
      }] : [],
    };
  }
}

class SlackAdapter implements ChannelAdapter {
  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    const event = payload.event as any;
    return {
      sender: {
        externalId: event?.user,
        name: event?.user_profile?.display_name,
      },
      body: event?.text || '',
      channelMetadata: {
        channel: event?.channel,
        ts: event?.ts,
        threadTs: event?.thread_ts,
      },
      attachments: (event?.files as any[])?.map(f => ({
        id: uuidv4(),
        filename: f.name,
        mimeType: f.mimetype,
        size: f.size,
        url: f.url_private,
      })) || [],
    };
  }

  validateSignature(signature: string, payload: string, secret: string): boolean {
    const crypto = require('crypto');
    const [version, hash] = signature.split('=');
    const baseString = `${version}:${Date.now() / 1000}:${payload}`;
    const computedHash = crypto.createHmac('sha256', secret).update(baseString).digest('hex');
    return hash === computedHash;
  }
}

class TeamsAdapter implements ChannelAdapter {
  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      sender: {
        externalId: (payload.from as any)?.id,
        name: (payload.from as any)?.name,
      },
      body: payload.text as string || '',
      channelMetadata: {
        conversationId: (payload.conversation as any)?.id,
        activityId: payload.id,
      },
      attachments: (payload.attachments as any[])?.map(a => ({
        id: uuidv4(),
        filename: a.name || 'attachment',
        mimeType: a.contentType,
        size: 0,
        url: a.contentUrl,
      })) || [],
    };
  }
}

class LinkedInAdapter implements ChannelAdapter {
  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      sender: {
        externalId: payload.senderId as string,
      },
      body: payload.message as string || '',
      channelMetadata: payload,
    };
  }
}

class TwitterAdapter implements ChannelAdapter {
  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    const dm = (payload.direct_message_events as any[])?.[0];
    return {
      sender: {
        externalId: dm?.message_create?.sender_id,
      },
      body: dm?.message_create?.message_data?.text || '',
      channelMetadata: payload,
    };
  }
}

class FormAdapter implements ChannelAdapter {
  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      sender: {
        email: payload.email as string,
        name: payload.name as string,
        phone: payload.phone as string,
      },
      subject: payload.subject as string || 'Formulaire soumis',
      body: payload.message as string || JSON.stringify(payload.formData),
      channelMetadata: {
        formId: payload.formId,
        formType: payload.formType,
        formData: payload.formData,
      },
      consent: {
        status: payload.consentGiven ? 'GRANTED' : 'PENDING',
        grantedAt: payload.consentGiven ? new Date() : undefined,
        purpose: payload.consentPurpose as string,
      },
    };
  }
}

class DocumentAdapter implements ChannelAdapter {
  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      sender: {
        id: payload.uploadedBy as string,
      },
      body: payload.description as string || 'Document uploadé',
      attachments: [{
        id: uuidv4(),
        filename: payload.filename as string,
        mimeType: payload.mimeType as string,
        size: payload.size as number,
        blobPath: payload.blobPath as string,
        url: payload.url as string,
      }],
      channelMetadata: {
        documentType: payload.documentType,
        category: payload.category,
      },
    };
  }
}

class DeclanAdapter implements ChannelAdapter {
  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      body: payload.eventDescription as string || JSON.stringify(payload),
      channelMetadata: {
        eventType: payload.eventType,
        workflowId: payload.workflowId,
        triggeredBy: payload.triggeredBy,
      },
    };
  }
}

class InternalAdapter implements ChannelAdapter {
  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      sender: {
        id: payload.userId as string,
        name: payload.userName as string,
      },
      body: payload.message as string || '',
      subject: payload.subject as string,
      channelMetadata: payload,
    };
  }
}

// Export singleton
export const multiChannelService = new MultiChannelService();
