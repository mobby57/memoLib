import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Service IA Local avec Ollama pour la génération de réponses
 * Garantit la confidentialité totale des données juridiques
 */
class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.2:latest';
  }

  async chat(systemPrompt: string, userPrompt: string, maxTokens: number = 1024): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: maxTokens,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || '';

    } catch (error: any) {
      console.error('❌ Erreur Ollama:', error.message);
      throw error;
    }
  }

  async getSettings(tenantId: string) {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId }
    });
    
    if (settings?.ollamaEnabled) {
      this.baseUrl = settings.ollamaUrl;
      this.model = settings.ollamaModel;
    }
    
    return settings;
  }
}

const ollama = new OllamaService();

interface ResponseTemplate {
  type: string;
  template: string;
  variables: string[];
}

const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  {
    type: 'nouveau_client',
    template: `Madame, Monsieur,

Je vous remercie pour votre prise de contact concernant votre situation.

Après lecture de votre message, je souhaiterais convenir d'un premier rendez-vous afin d'étudier votre dossier plus en détail.

Seriez-vous disponible pour un entretien {date_options}?

Dans l'attente de votre retour, je reste à votre disposition pour tout complément d'information.

Cordialement,`,
    variables: ['date_options']
  },
  {
    type: 'ceseda',
    template: `Madame, Monsieur,

Suite à votre message concernant {objet_ceseda}, je tiens à vous informer de l'urgence de traiter ce dossier compte tenu des délais légaux.

Les démarches à entreprendre en priorité sont:
{actions_prioritaires}

Je vous propose un rendez-vous en urgence pour faire le point sur votre situation et préparer les recours nécessaires.

Cordialement,`,
    variables: ['objet_ceseda', 'actions_prioritaires']
  },
  {
    type: 'suivi_dossier',
    template: `Madame, Monsieur,

Suite à votre message, voici un point d'étape sur l'avancement de votre dossier {numero_dossier}:

{etat_avancement}

{prochaines_etapes}

Je reste à votre disposition pour toute question complémentaire.

Cordialement,`,
    variables: ['numero_dossier', 'etat_avancement', 'prochaines_etapes']
  }
];

export class AIResponseService {
  
  /**
   * Générer un brouillon de réponse avec Claude AI
   */
  async generateResponse(emailId: string, context?: {
    clientHistory?: string;
    dossierInfo?: string;
    urgencyLevel?: string;
  }): Promise<string> {
    try {
      // Récupérer l'email
      const email = await prisma.email.findUnique({
        where: { id: emailId },
        include: {
          classification: true,
          client: {
            include: {
              dossiers: {
                select: {
                  numero: true,
                  objet: true,
                  statut: true,
                  typeDossier: true
                }
              }
            }
          },
          dossier: true,
          tenant: true
        }
      });

      if (!email) {
        throw new Error('Email non trouvé');
      }

      // Configurer Ollama selon les paramètres du tenant
      if (email.tenantId) {
        await ollama.getSettings(email.tenantId);
      }

      // Construire le contexte pour l'IA locale
      const systemPrompt = `Tu es un assistant juridique spécialisé en droit des étrangers (CESEDA).
Ton rôle est de générer des brouillons de réponses professionnelles aux emails des clients.

Règles importantes:
- Ton professionnel et respectueux
- Concis et clair
- Adapté au contexte juridique français
- Respecter les délais et urgences CESEDA
- Proposer des actions concrètes
- Ne jamais donner de conseils juridiques définitifs sans consultation préalable
- Respecter la confidentialité absolue (données traitées localement)`;

      const clientInfo = email.client ? `
Client: ${email.client.firstName} ${email.client.lastName}
Email: ${email.client.email}
Statut: ${email.client.status}
Dossiers actifs: ${email.client.dossiers.length}
${email.client.dossiers.map(d => `- ${d.numero}: ${d.objet || 'Sans objet'} (${d.typeDossier}) - ${d.statut}`).join('\n')}
` : 'Nouveau contact (pas encore de dossier client)';

      const emailContent = `
De: ${email.from}
Sujet: ${email.subject}
Date: ${email.receivedDate.toLocaleDateString('fr-FR')}

Message:
${email.bodyText}

Classification IA automatique:
- Type: ${email.classification?.type}
- Priorité: ${email.classification?.priority}
- Confiance: ${email.classification?.confidence}
- Action suggérée: ${email.classification?.suggestedAction}
- Tags: ${email.classification?.tags}
`;

      const userPrompt = `Génère un brouillon de réponse professionnelle pour cet email:

${emailContent}

Informations contextuelles:
${clientInfo}

${context?.dossierInfo || ''}
${context?.urgencyLevel ? `Niveau d'urgence: ${context.urgencyLevel}` : ''}
${context?.clientHistory || ''}

Instructions:
1. Analyse le contexte et la demande du client
2. Utilise un ton professionnel adapté à un cabinet d'avocat spécialisé en CESEDA
3. Propose des actions concrètes et un rendez-vous si nécessaire
4. Si c'est urgent (CESEDA, OQTF, délais), mentionne-le clairement et propose une action rapide
5. Termine par une ouverture au dialogue
6. Signe avec "Cordialement," (la signature sera ajoutée automatiquement)

La réponse doit être directement utilisable, sans placeholder ni commentaire entre crochets.`;

      console.log('🤖 Génération avec IA locale Ollama...');
      const response = await ollama.chat(systemPrompt, userPrompt, 1024);

      // Sauvegarder le brouillon
      await prisma.email.update({
        where: { id: emailId },
        data: {
          responseDraft: response,
          responseGenerated: true,
          needsResponse: true
        }
      });

      console.log(`✅ Brouillon généré localement pour email ${emailId}`);

      return response;

    } catch (error: any) {
      console.error('❌ Erreur génération réponse:', error.message);
      throw error;
    }
  }

  /**
   * Améliorer un brouillon existant avec des instructions
   */
  async improveResponse(emailId: string, currentDraft: string, instructions: string): Promise<string> {
    try {
      const email = await prisma.email.findUnique({
        where: { id: emailId },
        include: { 
          classification: true,
          tenant: true
        }
      });

      if (!email) throw new Error('Email non trouvé');

      // Configurer Ollama
      if (email.tenantId) {
        await ollama.getSettings(email.tenantId);
      }

      const systemPrompt = 'Tu es un assistant juridique. Améliore les réponses tout en gardant un ton professionnel et conforme au droit français.';
      
      const userPrompt = `Améliore ce brouillon de réponse selon les instructions:

Brouillon actuel:
${currentDraft}

Instructions d'amélioration:
${instructions}

Email original:
De: ${email.from}
Sujet: ${email.subject}

Génère une version améliorée en suivant les instructions. Garde un ton professionnel.`;

      console.log('🤖 Amélioration avec IA locale...');
      const improved = await ollama.chat(systemPrompt, userPrompt, 1024);

      await prisma.email.update({
        where: { id: emailId },
        data: { responseDraft: improved }
      });

      console.log(`✅ Brouillon amélioré localement`);
      return improved;

    } catch (error: any) {
      console.error('❌ Erreur amélioration réponse:', error.message);
      throw error;
    }
  }

  /**
   * Extraire informations structurées depuis un email
   */
  async extractStructuredData(emailId: string): Promise<{
    dates?: string[];
    phones?: string[];
    addresses?: string[];
    documentTypes?: string[];
    urgencyMarkers?: string[];
  }> {
    try {
      const email = await prisma.email.findUnique({
        where: { id: emailId },
        include: { tenant: true }
      });

      if (!email) throw new Error('Email non trouvé');

      // Configurer Ollama
      if (email.tenantId) {
        await ollama.getSettings(email.tenantId);
      }

      const systemPrompt = `Tu es un extracteur d'informations. Retourne uniquement du JSON valide, sans commentaire.`;
      
      const userPrompt = `Extrais les informations structurées de cet email et retourne-les en JSON strict:

${email.bodyText}

Extrais UNIQUEMENT si présent dans le texte:
- dates: toutes les dates mentionnées (format français)
- phones: numéros de téléphone français
- addresses: adresses postales complètes
- documentTypes: types de documents (passeport, titre de séjour, récépissé, OQTF, etc.)
- urgencyMarkers: termes d'urgence (OQTF, délai, expulsion, préfecture, recours, etc.)

Format de réponse STRICT (JSON uniquement):
{
  "dates": ["..."],
  "phones": ["..."],
  "addresses": ["..."],
  "documentTypes": ["..."],
  "urgencyMarkers": ["..."]
}`;

      console.log('🤖 Extraction avec IA locale...');
      const jsonStr = await ollama.chat(systemPrompt, userPrompt, 512);

      // Nettoyer la réponse (enlever markdown si présent)
      const cleanJson = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      let extracted;
      try {
        extracted = JSON.parse(cleanJson);
      } catch (e) {
        console.warn('⚠️ Réponse non-JSON, extraction manuelle...');
        extracted = {};
      }

      // Sauvegarder
      await prisma.email.update({
        where: { id: emailId },
        data: {
          extractedDates: extracted.dates ? JSON.stringify(extracted.dates) : null,
          extractedPhones: extracted.phones ? JSON.stringify(extracted.phones) : null
        }
      });

      console.log(`✅ Données extraites localement`);
      return extracted;

    } catch (error: any) {
      console.error('❌ Erreur extraction données:', error.message);
      return {};
    }
  }

  /**
   * Générer résumé d'email pour notification
   */
  async generateSummary(emailId: string, maxLength: number = 100): Promise<string> {
    try {
      const email = await prisma.email.findUnique({
        where: { id: emailId },
        include: { tenant: true }
      });

      if (!email) throw new Error('Email non trouvé');

      // Configurer Ollama
      if (email.tenantId) {
        await ollama.getSettings(email.tenantId);
      }

      const systemPrompt = 'Tu es un résumeur de texte. Sois concis et factuel.';
      
      const userPrompt = `Résume cet email en maximum ${maxLength} caractères:

Sujet: ${email.subject}

${email.bodyText}

Résumé concis (${maxLength} caractères max):`;

      console.log('🤖 Résumé avec IA locale...');
      const summary = await ollama.chat(systemPrompt, userPrompt, 100);

      return summary.substring(0, maxLength);

    } catch (error: any) {
      console.error('❌ Erreur génération résumé:', error.message);
      
      // Fallback: retourner le sujet tronqué
      try {
        const fallbackEmail = await prisma.email.findUnique({
          where: { id: emailId },
          select: { subject: true }
        });
        return fallbackEmail?.subject?.substring(0, maxLength) || '';
      } catch {
        return '';
      }
    }
  }
}

export const aiResponseService = new AIResponseService();
