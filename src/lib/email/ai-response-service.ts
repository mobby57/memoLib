import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Service IA Local avec Ollama pour la generation de reponses
 * Garantit la confidentialite totale des donnees juridiques
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
      console.error(' Erreur Ollama:', error.message);
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

Apres lecture de votre message, je souhaiterais convenir d'un premier rendez-vous afin d'etudier votre dossier plus en detail.

Seriez-vous disponible pour un entretien {date_options}?

Dans l'attente de votre retour, je reste a votre disposition pour tout complement d'information.

Cordialement,`,
    variables: ['date_options']
  },
  {
    type: 'ceseda',
    template: `Madame, Monsieur,

Suite a votre message concernant {objet_ceseda}, je tiens a vous informer de l'urgence de traiter ce dossier compte tenu des delais legaux.

Les demarches a entreprendre en priorite sont:
{actions_prioritaires}

Je vous propose un rendez-vous en urgence pour faire le point sur votre situation et preparer les recours necessaires.

Cordialement,`,
    variables: ['objet_ceseda', 'actions_prioritaires']
  },
  {
    type: 'suivi_dossier',
    template: `Madame, Monsieur,

Suite a votre message, voici un point d'etape sur l'avancement de votre dossier {numero_dossier}:

{etat_avancement}

{prochaines_etapes}

Je reste a votre disposition pour toute question complementaire.

Cordialement,`,
    variables: ['numero_dossier', 'etat_avancement', 'prochaines_etapes']
  }
];

export class AIResponseService {
  
  /**
   * Generer un brouillon de reponse avec Claude AI
   */
  async generateResponse(emailId: string, context?: {
    clientHistory?: string;
    dossierInfo?: string;
    urgencyLevel?: string;
  }): Promise<string> {
    try {
      // Recuperer l'email
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
        throw new Error('Email non trouve');
      }

      // Configurer Ollama selon les parametres du tenant
      if (email.tenantId) {
        await ollama.getSettings(email.tenantId);
      }

      // Construire le contexte pour l'IA locale
      const systemPrompt = `Tu es un assistant juridique specialise en droit des etrangers (CESEDA).
Ton role est de generer des brouillons de reponses professionnelles aux emails des clients.

Regles importantes:
- Ton professionnel et respectueux
- Concis et clair
- Adapte au contexte juridique francais
- Respecter les delais et urgences CESEDA
- Proposer des actions concretes
- Ne jamais donner de conseils juridiques definitifs sans consultation prealable
- Respecter la confidentialite absolue (donnees traitees localement)`;

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
- Priorite: ${email.classification?.priority}
- Confiance: ${email.classification?.confidence}
- Action suggeree: ${email.classification?.suggestedAction}
- Tags: ${email.classification?.tags}
`;

      const userPrompt = `Genere un brouillon de reponse professionnelle pour cet email:

${emailContent}

Informations contextuelles:
${clientInfo}

${context?.dossierInfo || ''}
${context?.urgencyLevel ? `Niveau d'urgence: ${context.urgencyLevel}` : ''}
${context?.clientHistory || ''}

Instructions:
1. Analyse le contexte et la demande du client
2. Utilise un ton professionnel adapte a un cabinet d'avocat specialise en CESEDA
3. Propose des actions concretes et un rendez-vous si necessaire
4. Si c'est urgent (CESEDA, OQTF, delais), mentionne-le clairement et propose une action rapide
5. Termine par une ouverture au dialogue
6. Signe avec "Cordialement," (la signature sera ajoutee automatiquement)

La reponse doit etre directement utilisable, sans placeholder ni commentaire entre crochets.`;

      console.log(' Generation avec IA locale Ollama...');
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

      console.log(` Brouillon genere localement pour email ${emailId}`);

      return response;

    } catch (error: any) {
      console.error(' Erreur generation reponse:', error.message);
      throw error;
    }
  }

  /**
   * Ameliorer un brouillon existant avec des instructions
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

      if (!email) throw new Error('Email non trouve');

      // Configurer Ollama
      if (email.tenantId) {
        await ollama.getSettings(email.tenantId);
      }

      const systemPrompt = 'Tu es un assistant juridique. Ameliore les reponses tout en gardant un ton professionnel et conforme au droit francais.';
      
      const userPrompt = `Ameliore ce brouillon de reponse selon les instructions:

Brouillon actuel:
${currentDraft}

Instructions d'amelioration:
${instructions}

Email original:
De: ${email.from}
Sujet: ${email.subject}

Genere une version amelioree en suivant les instructions. Garde un ton professionnel.`;

      console.log(' Amelioration avec IA locale...');
      const improved = await ollama.chat(systemPrompt, userPrompt, 1024);

      await prisma.email.update({
        where: { id: emailId },
        data: { responseDraft: improved }
      });

      console.log(` Brouillon ameliore localement`);
      return improved;

    } catch (error: any) {
      console.error(' Erreur amelioration reponse:', error.message);
      throw error;
    }
  }

  /**
   * Extraire informations structurees depuis un email
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

      if (!email) throw new Error('Email non trouve');

      // Configurer Ollama
      if (email.tenantId) {
        await ollama.getSettings(email.tenantId);
      }

      const systemPrompt = `Tu es un extracteur d'informations. Retourne uniquement du JSON valide, sans commentaire.`;
      
      const userPrompt = `Extrais les informations structurees de cet email et retourne-les en JSON strict:

${email.bodyText}

Extrais UNIQUEMENT si present dans le texte:
- dates: toutes les dates mentionnees (format francais)
- phones: numeros de telephone francais
- addresses: adresses postales completes
- documentTypes: types de documents (passeport, titre de sejour, recepisse, OQTF, etc.)
- urgencyMarkers: termes d'urgence (OQTF, delai, expulsion, prefecture, recours, etc.)

Format de reponse STRICT (JSON uniquement):
{
  "dates": ["..."],
  "phones": ["..."],
  "addresses": ["..."],
  "documentTypes": ["..."],
  "urgencyMarkers": ["..."]
}`;

      console.log(' Extraction avec IA locale...');
      const jsonStr = await ollama.chat(systemPrompt, userPrompt, 512);

      // Nettoyer la reponse (enlever markdown si present)
      const cleanJson = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      let extracted;
      try {
        extracted = JSON.parse(cleanJson);
      } catch (e) {
        console.warn('️ Reponse non-JSON, extraction manuelle...');
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

      console.log(` Donnees extraites localement`);
      return extracted;

    } catch (error: any) {
      console.error(' Erreur extraction donnees:', error.message);
      return {};
    }
  }

  /**
   * Generer resume d'email pour notification
   */
  async generateSummary(emailId: string, maxLength: number = 100): Promise<string> {
    try {
      const email = await prisma.email.findUnique({
        where: { id: emailId },
        include: { tenant: true }
      });

      if (!email) throw new Error('Email non trouve');

      // Configurer Ollama
      if (email.tenantId) {
        await ollama.getSettings(email.tenantId);
      }

      const systemPrompt = 'Tu es un resumeur de texte. Sois concis et factuel.';
      
      const userPrompt = `Resume cet email en maximum ${maxLength} caracteres:

Sujet: ${email.subject}

${email.bodyText}

Resume concis (${maxLength} caracteres max):`;

      console.log(' Resume avec IA locale...');
      const summary = await ollama.chat(systemPrompt, userPrompt, 100);

      return summary.substring(0, maxLength);

    } catch (error: any) {
      console.error(' Erreur generation resume:', error.message);
      
      // Fallback: retourner le sujet tronque
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
