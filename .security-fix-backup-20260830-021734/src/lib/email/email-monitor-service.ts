// @ts-nocheck
import { prisma } from '@/lib/prisma';
import { simpleParser } from 'mailparser';
import { ollama } from '@/lib/ai/ollama-client';
import { normalizeIncomingEmailPayload } from '@/lib/email/ingestion';

interface EmailClassification {
  clientEmail?: string;
  clientName?: string;
  dossierNumero?: string;
  typeDossier?: string;
  urgency: 'low' | 'medium' | 'high';
  shouldCreateDossier: boolean;
}

export class EmailMonitorService {
  // Classification IA avec fallback mots-clés
  private async classifyEmail(subject: string, body: string): Promise<EmailClassification> {
    // Tenter classification IA
    const useAI = await ollama.isAvailable();

    if (useAI) {
      try {
        const analysis = await ollama.analyzeEmail(subject, body);

        const emailMatch = body.match(/[\w.-]+@[\w.-]+\.\w+/);
        const dossierMatch = (subject + body).match(/(?:dos-|#)(\d{4,})/i);

        return {
          clientEmail: emailMatch?.[0],
          clientName: analysis.clientName,
          dossierNumero: analysis.entities.references?.[0] || dossierMatch?.[1],
          typeDossier: analysis.typeDossier,
          urgency: analysis.urgency,
          shouldCreateDossier: !dossierMatch && analysis.typeDossier !== 'GENERAL'
        };
      } catch (error) {
        console.log('IA fallback to keywords');
      }
    }

    // Fallback: classification par mots-clés
    return this.classifyByKeywords(subject, body);
  }

  private classifyByKeywords(subject: string, body: string): EmailClassification {
    const text = `${subject} ${body}`.toLowerCase();

    // Extraire email expéditeur
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const clientEmail = emailMatch?.[0];

    // Détecter type de dossier par mots-clés
    let typeDossier = 'GENERAL';
    if (text.includes('titre de séjour') || text.includes('carte de séjour')) {
      typeDossier = 'TITRE_SEJOUR';
    } else if (text.includes('naturalisation') || text.includes('nationalité')) {
      typeDossier = 'NATURALISATION';
    } else if (text.includes('regroupement familial')) {
      typeDossier = 'REGROUPEMENT_FAMILIAL';
    } else if (text.includes('oqtf') || text.includes('expulsion')) {
      typeDossier = 'CONTENTIEUX_OQTF';
    }

    // Détecter urgence
    let urgency: 'low' | 'medium' | 'high' = 'medium';
    if (text.includes('urgent') || text.includes('délai') || text.includes('audience')) {
      urgency = 'high';
    }

    // Extraire numéro de dossier si présent (format: DOS-XXXX ou #XXXX)
    const dossierMatch = text.match(/(?:dos-|#)(\d{4,})/i);
    const dossierNumero = dossierMatch?.[1];

    return {
      clientEmail,
      dossierNumero,
      typeDossier,
      urgency,
      shouldCreateDossier: !dossierNumero && typeDossier !== 'GENERAL'
    };
  }

  async processEmail(tenantId: string, rawEmail: string) {
    const parsed = await simpleParser(rawEmail);
    const normalized = normalizeIncomingEmailPayload(
      {
        from: parsed.from?.text || '',
        to: parsed.to?.text || '',
        subject: parsed.subject || '',
        body: parsed.text || '',
        htmlBody: typeof parsed.html === 'string' ? parsed.html : undefined,
        messageId: parsed.messageId || undefined,
        provider: 'gmail',
        sourceChannel: 'email',
        sourceDirection: 'inbound',
        rawFormat: 'rfc822',
        rawContent: rawEmail,
        receivedAt: parsed.date || new Date(),
        attachments: (parsed.attachments || []).map(attachment => ({
          filename: attachment.filename || 'attachment',
          mimeType: attachment.contentType,
          size: attachment.size,
          contentId: attachment.contentId || undefined,
          disposition: attachment.contentDisposition || undefined,
          checksum: attachment.checksum || undefined,
        })),
      },
      rawEmail
    );

    // Classification IA = aide à la décision, PAS action automatique
    const classification = await this.classifyEmail(
      parsed.subject || '',
      parsed.text || ''
    );

    // Stocker l'email brut en état RECEIVED — l'humain décidera
    const email = await prisma.email.create({
      data: {
        tenantId,
        messageId: normalized.messageId,
        providerMessageId: normalized.providerMessageId,
        threadId: normalized.threadId,
        internetMessageId: normalized.internetMessageId,
        sourceChannel: normalized.sourceChannel,
        sourceProvider: normalized.sourceProvider,
        sourceDirection: normalized.sourceDirection,
        from: normalized.from,
        fromAddress: normalized.fromAddress,
        to: normalized.to,
        toAddresses: normalized.toAddresses,
        cc: normalized.cc,
        bcc: normalized.bcc,
        replyTo: normalized.replyTo,
        inReplyTo: normalized.inReplyTo,
        referenceIds: normalized.referenceIds,
        subject: normalized.subject,
        body: normalized.body,
        bodyText: normalized.bodyText,
        htmlBody: normalized.htmlBody || undefined,
        preview: normalized.preview,
        hasAttachments: normalized.hasAttachments,
        rawFormat: normalized.rawFormat,
        rawPayload: normalized.rawPayload,
        rawHeaders: normalized.rawHeaders,
        rawContent: normalized.rawContent,
        normalizedPayload: normalized.normalizedPayload,
        contentHash: normalized.contentHash,
        category: classification.typeDossier,
        urgency: classification.urgency,
        aiAnalysis: JSON.stringify(classification),
        processingStatus: 'RECEIVED',
        isProcessed: false,
        receivedAt: normalized.receivedAt,
        receivedDate: normalized.receivedDate,
      }
    });

    if (normalized.attachments.length > 0) {
      await prisma.emailAttachment.createMany({
        data: normalized.attachments.map(attachment => ({
          emailId: email.id,
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          size: attachment.size,
          storageKey: attachment.storageKey,
          contentId: attachment.contentId,
          disposition: attachment.disposition,
          checksum: attachment.checksum,
          metadata: attachment.metadata,
        })),
      });
    }

    // Pas d'action automatique — l'email attend dans l'inbox
    // L'avocat décidera via POST /api/emails/[id]/integrate
    return {
      emailId: email.id,
      classification,
      processingStatus: 'RECEIVED',
    };
  }
}

export const emailMonitor = new EmailMonitorService();


