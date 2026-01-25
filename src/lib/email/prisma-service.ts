import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface EmailClassificationData {
  type: 'nouveau_client' | 'reponse_client' | 'laposte_notification' | 'ceseda' | 'urgent' | 'spam' | 'general';
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  tags: string[];
  suggestedAction?: string;
}

export class EmailPrismaService {
  private gmail: any = null;
  private auth: OAuth2Client | null = null;

  async connect(): Promise<void> {
    const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
    const TOKEN_PATH = path.join(process.cwd(), 'token.json');
    const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

    if (!fs.existsSync(TOKEN_PATH)) {
      throw new Error('Token non trouve. Executez email-monitor.ts d\'abord.');
    }

    const content = fs.readFileSync(TOKEN_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    this.auth = google.auth.fromJSON(credentials) as OAuth2Client;
    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
  }

  /**
   * Sauvegarde un email dans la base de donnees avec classification
   */
  async saveEmail(params: {
    messageId: string;
    threadId?: string;
    from: string;
    to: string;
    subject: string;
    bodyText?: string;
    bodyHtml?: string;
    receivedDate: Date;
    classification: EmailClassificationData;
    attachments?: any[];
    tenantId?: string;
  }): Promise<void> {
    try {
      // Verifier si l'email existe deja
      const existing = await prisma.email.findUnique({
        where: { messageId: params.messageId }
      });

      if (existing) {
        console.log(` Email ${params.messageId} deja en base`);
        return;
      }

      // Creer l'email avec classification
      const email = await prisma.email.create({
        data: {
          messageId: params.messageId,
          threadId: params.threadId,
          from: params.from,
          to: params.to,
          subject: params.subject,
          bodyText: params.bodyText,
          bodyHtml: params.bodyHtml,
          receivedDate: params.receivedDate,
          attachments: params.attachments ? JSON.stringify(params.attachments) : null,
          tenantId: params.tenantId,
          classification: {
            create: {
              type: params.classification.type,
              priority: params.classification.priority,
              confidence: params.classification.confidence,
              tags: JSON.stringify(params.classification.tags),
              suggestedAction: params.classification.suggestedAction
            }
          }
        },
        include: {
          classification: true
        }
      });

      console.log(` Email sauvegarde: ${email.id}`);

      // Auto-traitement selon le type
      await this.autoProcessEmail(email.id, params.classification);

    } catch (error: any) {
      console.error(' Erreur sauvegarde email:', error.message);
      throw error;
    }
  }

  /**
   * Traitement automatique selon la classification
   */
  private async autoProcessEmail(emailId: string, classification: EmailClassificationData): Promise<void> {
    try {
      const email = await prisma.email.findUnique({
        where: { id: emailId },
        include: { classification: true }
      });

      if (!email) return;

      // === NOUVEAU CLIENT === 
      if (classification.type === 'nouveau_client') {
        await this.createProspectFromEmail(email);
      }

      // === LA POSTE ===
      else if (classification.type === 'laposte_notification') {
        await this.extractTrackingNumbers(email);
      }

      // === CESEDA URGENT ===
      else if (classification.type === 'ceseda' || classification.priority === 'critical') {
        await this.createUrgentAlert(email);
      }

      // === RePONSE CLIENT ===
      else if (classification.type === 'reponse_client') {
        await this.linkToExistingClient(email);
      }

    } catch (error: any) {
      console.error(' Erreur auto-traitement:', error.message);
    }
  }

  /**
   * Creer un prospect depuis un email nouveau client
   */
  private async createProspectFromEmail(email: any): Promise<void> {
    try {
      // Extraire nom/prenom depuis expediteur (basique)
      const fromMatch = email.from.match(/([^<]+)</);
      const fullName = fromMatch ? fromMatch[1].trim() : email.from;
      const nameParts = fullName.split(' ');
      
      const firstName = nameParts[0] || 'Prenom';
      const lastName = nameParts.slice(1).join(' ') || 'Nom';

      // Verifier si client existe deja
      const existingClient = await prisma.client.findFirst({
        where: {
          email: email.from.match(/<(.+)>/)?.[1] || email.from
        }
      });

      if (existingClient) {
        // Lier l'email au client existant
        await prisma.email.update({
          where: { id: email.id },
          data: { clientId: existingClient.id }
        });
        console.log(` Email lie au client existant: ${existingClient.firstName} ${existingClient.lastName}`);
        return;
      }

      // Creer nouveau client en statut prospect
      const newClient = await prisma.client.create({
        data: {
          firstName,
          lastName,
          email: email.from.match(/<(.+)>/)?.[1] || email.from,
          status: 'prospect',
          source: 'email',
          datePremiereVisite: new Date(),
          tenantId: email.tenantId || process.env.DEFAULT_TENANT_ID!,
          notes: `Premier contact par email: ${email.subject}\nDate: ${email.receivedDate.toISOString()}`
        }
      });

      // Lier l'email au nouveau client
      await prisma.email.update({
        where: { id: email.id },
        data: { clientId: newClient.id }
      });

      console.log(` Nouveau prospect cree: ${newClient.firstName} ${newClient.lastName}`);

    } catch (error: any) {
      console.error(' Erreur creation prospect:', error.message);
    }
  }

  /**
   * Extraire numeros de suivi La Poste
   */
  private async extractTrackingNumbers(email: any): Promise<void> {
    try {
      const text = (email.bodyText || '').toLowerCase();
      
      // Patterns numeros de suivi (exemples)
      const patterns = [
        /[0-9]{2}[a-z]{2}[0-9]{9}[a-z]{2}/gi, // Format La Poste
        /[0-9]{13}/g, // Format Colissimo
        /[a-z]{2}[0-9]{9}[a-z]{2}/gi // Format recommande
      ];

      const trackingNumbers: string[] = [];
      
      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          trackingNumbers.push(...matches);
        }
      }

      if (trackingNumbers.length > 0) {
        await prisma.email.update({
          where: { id: email.id },
          data: { trackingNumbers: JSON.stringify([...new Set(trackingNumbers)]) }
        });
        
        console.log(` Numeros de suivi extraits: ${trackingNumbers.join(', ')}`);
      }

    } catch (error: any) {
      console.error(' Erreur extraction tracking:', error.message);
    }
  }

  /**
   * Creer une alerte urgente
   */
  private async createUrgentAlert(email: any): Promise<void> {
    try {
      if (!email.tenantId) return;

      await prisma.alert.create({
        data: {
          tenantId: email.tenantId,
          dossierId: email.dossierId || '', // Requis par le schema
          alertType: 'legal_deadline',
          severity: 'CRITICAL',
          message: `Email urgent: ${email.subject}\nDe: ${email.from}\nRecu: ${email.receivedDate.toISOString()}\n\n${email.bodyText?.substring(0, 500)}`,
        }
      });

      console.log(` Alerte urgente creee pour email ${email.id}`);

    } catch (error: any) {
      console.error(' Erreur creation alerte:', error.message);
    }
  }

  /**
   * Lier email a client existant (reponse)
   */
  private async linkToExistingClient(email: any): Promise<void> {
    try {
      const fromEmail = email.from.match(/<(.+)>/)?.[1] || email.from;

      const client = await prisma.client.findFirst({
        where: { email: fromEmail }
      });

      if (client) {
        await prisma.email.update({
          where: { id: email.id },
          data: { clientId: client.id }
        });
        
        console.log(` Email lie au client: ${client.firstName} ${client.lastName}`);
      }

    } catch (error: any) {
      console.error(' Erreur liaison client:', error.message);
    }
  }

  /**
   * Recuperer emails non traites
   */
  async getUnprocessedEmails(tenantId?: string): Promise<any[]> {
    return await prisma.email.findMany({
      where: {
        tenantId,
        isRead: false
      },
      include: {
        classification: true,
        client: true,
        dossier: true
      },
      orderBy: {
        receivedDate: 'desc'
      }
    });
  }

  /**
   * Marquer email comme lu
   */
  async markAsRead(emailId: string): Promise<void> {
    await prisma.email.update({
      where: { id: emailId },
      data: { isRead: true }
    });
  }

  /**
   * Valider classification
   */
  async validateClassification(emailId: string, userId: string, correctedType?: string): Promise<void> {
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: { classification: true }
    });

    if (!email?.classification) return;

    await prisma.emailClassification.update({
      where: { id: email.classification.id },
      data: {
        validated: true,
        validatedBy: userId,
        validatedAt: new Date(),
        correctedType
      }
    });
  }

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

export const emailPrismaService = new EmailPrismaService();
