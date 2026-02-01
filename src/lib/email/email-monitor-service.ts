import { prisma } from '@/lib/prisma';
import { simpleParser } from 'mailparser';
import { ollama } from '@/lib/ai/ollama-client';

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
    
    const classification = await this.classifyEmail(
      parsed.subject || '',
      parsed.text || ''
    );

    // 1. Sauvegarder l'email
    const email = await prisma.email.create({
      data: {
        tenantId,
        messageId: parsed.messageId,
        from: parsed.from?.text || '',
        to: parsed.to?.text || '',
        subject: parsed.subject || '',
        body: parsed.text || '',
        htmlBody: parsed.html || undefined,
        category: classification.typeDossier,
        urgency: classification.urgency,
        isProcessed: false,
      }
    });

    // 2. Trouver ou créer le client
    let client = null;
    if (classification.clientEmail) {
      client = await prisma.client.findFirst({
        where: {
          tenantId,
          email: classification.clientEmail
        }
      });

      if (!client && classification.shouldCreateDossier) {
        // Créer client automatiquement
        const [firstName, ...lastNameParts] = (parsed.from?.text || 'Client').split(' ');
        client = await prisma.client.create({
          data: {
            tenantId,
            email: classification.clientEmail,
            firstName: firstName || 'Prénom',
            lastName: lastNameParts.join(' ') || 'Nom',
            status: 'actif'
          }
        });
      }
    }

    // 3. Trouver ou créer le dossier
    let dossier = null;
    if (classification.dossierNumero) {
      // Dossier existant
      dossier = await prisma.dossier.findFirst({
        where: {
          tenantId,
          numero: classification.dossierNumero
        }
      });
    } else if (classification.shouldCreateDossier && client) {
      // Créer nouveau dossier
      const numero = `DOS-${Date.now().toString().slice(-6)}`;
      dossier = await prisma.dossier.create({
        data: {
          tenantId,
          clientId: client.id,
          numero,
          typeDossier: classification.typeDossier,
          statut: 'en_cours',
          priorite: classification.urgency === 'high' ? 'haute' : 'normale',
          objet: parsed.subject || 'Nouveau dossier',
          description: `Créé automatiquement depuis email: ${parsed.subject}`
        }
      });
    }

    // 4. Lier email au dossier
    if (dossier) {
      await prisma.email.update({
        where: { id: email.id },
        data: {
          dossierId: dossier.id,
          clientId: client?.id,
          isProcessed: true
        }
      });
    }

    return {
      emailId: email.id,
      clientId: client?.id,
      dossierId: dossier?.id,
      classification,
      action: dossier ? (classification.dossierNumero ? 'linked' : 'created') : 'pending'
    };
  }
}

export const emailMonitor = new EmailMonitorService();
