/**
 *  Systeme d'Intelligence Email
 * Analyse automatique des emails et generation de workflows contextuels
 */

import { prisma } from '@/lib/prisma';

export interface EmailAnalysis {
  emailId: string;
  subject: string;
  from: string;
  category: EmailCategory;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  sentiment: 'positive' | 'neutral' | 'negative';
  questions: string[];
  suggestedActions: Action[];
  requiredInfo: string[];
  deadline?: Date;
  relatedDossier?: string;
  entities: {
    people: string[];
    organizations: string[];
    dates: Date[];
    amounts: number[];
  };
}

export type EmailCategory = 
  | 'client-urgent'
  | 'new-case'
  | 'deadline-reminder'
  | 'invoice'
  | 'legal-question'
  | 'court-document'
  | 'client-complaint'
  | 'document-request'
  | 'appointment-request'
  | 'general-inquiry';

export interface Action {
  type: 'form' | 'calendar' | 'email' | 'task' | 'alert';
  priority: number;
  description: string;
  data: any;
}

/**
 * Analyse un email avec l'IA et determine le workflow approprie
 */
export async function analyzeEmail(emailContent: {
  subject: string;
  body: string;
  from: string;
  receivedAt: Date;
  attachments?: any[];
}): Promise<EmailAnalysis> {
  
  // Appeler Ollama pour analyse contextuelle
  const aiAnalysis = await callOllamaForEmailAnalysis(emailContent);
  
  // Extraire les entites
  const entities = extractEntities(emailContent.body);
  
  // Detecter l'urgence
  const urgency = detectUrgency(emailContent, aiAnalysis);
  
  // Categoriser l'email
  const category = categorizeEmail(emailContent, aiAnalysis);
  
  // Generer les questions pertinentes
  const questions = generateContextualQuestions(category, emailContent, aiAnalysis);
  
  // Suggerer les actions
  const suggestedActions = generateActions(category, urgency, entities);
  
  return {
    emailId: generateEmailId(),
    subject: emailContent.subject,
    from: emailContent.from,
    category,
    urgency,
    sentiment: aiAnalysis.sentiment || 'neutral',
    questions,
    suggestedActions,
    requiredInfo: aiAnalysis.missingInfo || [],
    deadline: entities.dates[0],
    entities,
  };
}

/**
 * Analyse IA via Ollama
 */
async function callOllamaForEmailAnalysis(email: any): Promise<any> {
  try {
    const prompt = `Analyse cet email professionnel et fournis:

SUJET: ${email.subject}
DE: ${email.from}
CORPS:
${email.body}

Analyse requise:
1. Categorie (client-urgent, new-case, deadline-reminder, invoice, legal-question, etc.)
2. Niveau d'urgence (low, medium, high, critical)
3. Sentiment (positive, neutral, negative)
4. Questions cles a poser pour traiter cette demande (3-5 questions)
5. Informations manquantes necessaires
6. Actions recommandees

Fournis une reponse structuree JSON.`;

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:latest',
        prompt,
        stream: false,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      try {
        return JSON.parse(data.response);
      } catch {
        // Parsing fallback si JSON invalide
        return parseAIResponseFallback(data.response);
      }
    }
  } catch (error) {
    console.error('Erreur analyse IA:', error);
  }

  return {
    sentiment: 'neutral',
    missingInfo: [],
  };
}

/**
 * Detecte l'urgence de l'email
 */
function detectUrgency(email: any, aiAnalysis: any): 'low' | 'medium' | 'high' | 'critical' {
  const urgentWords = ['urgent', 'immediat', 'asap', 'rapidement', 'aujourd\'hui', 'critique'];
  const text = `${email.subject} ${email.body}`.toLowerCase();
  
  // Urgence basee sur mots-cles
  const urgentWordCount = urgentWords.filter(word => text.includes(word)).length;
  
  // Urgence basee sur IA
  if (aiAnalysis.urgency) return aiAnalysis.urgency;
  
  // Heuristique
  if (urgentWordCount >= 3) return 'critical';
  if (urgentWordCount >= 2) return 'high';
  if (urgentWordCount >= 1) return 'medium';
  
  return 'low';
}

/**
 * Categorise l'email
 */
function categorizeEmail(email: any, aiAnalysis: any): EmailCategory {
  if (aiAnalysis.category) return aiAnalysis.category;
  
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();
  
  if (subject.includes('facture') || subject.includes('invoice')) return 'invoice';
  if (subject.includes('rendez-vous') || subject.includes('appointment')) return 'appointment-request';
  if (subject.includes('urgent') || subject.includes('plainte')) return 'client-urgent';
  if (subject.includes('nouveau dossier') || subject.includes('new case')) return 'new-case';
  if (subject.includes('delai') || subject.includes('deadline')) return 'deadline-reminder';
  if (subject.includes('question') || body.includes('question')) return 'legal-question';
  if (subject.includes('tribunal') || subject.includes('court')) return 'court-document';
  
  return 'general-inquiry';
}

/**
 * Genere des questions contextuelles
 */
function generateContextualQuestions(
  category: EmailCategory,
  email: any,
  aiAnalysis: any
): string[] {
  // Utiliser les questions de l'IA si disponibles
  if (aiAnalysis.questions && aiAnalysis.questions.length > 0) {
    return aiAnalysis.questions;
  }
  
  // Questions par defaut selon la categorie
  const questionsByCategory: Record<EmailCategory, string[]> = {
    'client-urgent': [
      'Quelle est la nature exacte de l\'urgence?',
      'Quel est le delai pour agir?',
      'Y a-t-il des parties adverses impliquees?',
      'Avez-vous des documents a fournir?',
    ],
    'new-case': [
      'Quel type de dossier juridique s\'agit-il?',
      'Qui sont les parties impliquees?',
      'Quelle est la date de debut souhaitee?',
      'Quel est votre budget estime?',
    ],
    'deadline-reminder': [
      'Quelle est la date limite exacte?',
      'Quel document doit etre produit?',
      'Qui doit valider avant soumission?',
      'Y a-t-il des consequences si depassement?',
    ],
    'invoice': [
      'Le montant correspond-il aux services rendus?',
      'Quel est le mode de paiement prefere?',
      'Faut-il emettre un avoir?',
      'Y a-t-il des conditions de paiement specifiques?',
    ],
    'legal-question': [
      'Dans quel domaine juridique se situe la question?',
      'Y a-t-il un contexte factuel particulier?',
      'Avez-vous consulte d\'autres sources?',
      'Quelle est l\'echeance pour la reponse?',
    ],
    'court-document': [
      'De quelle juridiction emane le document?',
      'Y a-t-il une date d\'audience?',
      'Faut-il preparer des pieces en reponse?',
      'Qui sont les avocats adverses?',
    ],
    'client-complaint': [
      'Quelle est la nature de la plainte?',
      'Depuis quand le probleme existe-t-il?',
      'Quelle solution attendez-vous?',
      'Y a-t-il eu des echanges prealables?',
    ],
    'document-request': [
      'Quels documents sont demandes exactement?',
      'Quel est le format souhaite?',
      'Y a-t-il une echeance pour transmission?',
      'a qui doivent etre adresses les documents?',
    ],
    'appointment-request': [
      'Quel est l\'objet du rendez-vous?',
      'Quelle est votre disponibilite?',
      'Rendez-vous en personne ou visio?',
      'Combien de temps estimez-vous necessaire?',
    ],
    'general-inquiry': [
      'Pouvez-vous preciser votre demande?',
      'Y a-t-il un contexte particulier?',
      'Quelle est l\'urgence de votre demande?',
      'Souhaitez-vous un suivi telephonique?',
    ],
  };
  
  return questionsByCategory[category] || questionsByCategory['general-inquiry'];
}

/**
 * Genere les actions suggerees
 */
function generateActions(
  category: EmailCategory,
  urgency: string,
  entities: any
): Action[] {
  const actions: Action[] = [];
  
  // Action 1: Toujours creer un formulaire contextuel
  actions.push({
    type: 'form',
    priority: 1,
    description: `Remplir le formulaire de traitement pour ${category}`,
    data: {
      formType: category,
      urgency,
      entities,
    },
  });
  
  // Action 2: Si urgent, creer une alerte
  if (urgency === 'high' || urgency === 'critical') {
    actions.push({
      type: 'alert',
      priority: 1,
      description: 'Traitement urgent requis',
      data: { severity: urgency },
    });
  }
  
  // Action 3: Si rendez-vous, integrer calendrier
  if (category === 'appointment-request' || entities.dates.length > 0) {
    actions.push({
      type: 'calendar',
      priority: 2,
      description: 'Planifier dans le calendrier',
      data: { suggestedDates: entities.dates },
    });
  }
  
  // Action 4: Si nouveau dossier, creer taches
  if (category === 'new-case') {
    actions.push({
      type: 'task',
      priority: 2,
      description: 'Creer les taches d\'ouverture de dossier',
      data: { workflow: 'new-case-intake' },
    });
  }
  
  // Action 5: Preparer reponse automatique
  actions.push({
    type: 'email',
    priority: 3,
    description: 'Generer un brouillon de reponse',
    data: { autoReply: true },
  });
  
  return actions.sort((a, b) => a.priority - b.priority);
}

/**
 * Extrait les entites du texte
 */
function extractEntities(text: string): {
  people: string[];
  organizations: string[];
  dates: Date[];
  amounts: number[];
} {
  const entities = {
    people: [] as string[],
    organizations: [] as string[],
    dates: [] as Date[],
    amounts: [] as number[],
  };
  
  // Extraction des montants (€, EUR, USD, etc.)
  const amountRegex = /(\d+(?:[,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:€|EUR|USD|\$)/gi;
  const amounts = text.match(amountRegex);
  if (amounts) {
    entities.amounts = amounts.map(a => parseFloat(a.replace(/[^\d.,]/g, '').replace(',', '.')));
  }
  
  // Extraction des dates (formats francais)
  const dateRegex = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g;
  const dates = text.match(dateRegex);
  if (dates) {
    entities.dates = dates.map(d => new Date(d)).filter(d => !isNaN(d.getTime()));
  }
  
  return entities;
}

function parseAIResponseFallback(response: string): any {
  return {
    sentiment: response.toLowerCase().includes('urgent') ? 'negative' : 'neutral',
    missingInfo: [],
    questions: [],
  };
}

function generateEmailId(): string {
  return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
