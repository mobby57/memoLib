/**
 * 🤖 Système d'Intelligence Email
 * Analyse automatique des emails et génération de workflows contextuels
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
 * Analyse un email avec l'IA et détermine le workflow approprié
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
  
  // Extraire les entités
  const entities = extractEntities(emailContent.body);
  
  // Détecter l'urgence
  const urgency = detectUrgency(emailContent, aiAnalysis);
  
  // Catégoriser l'email
  const category = categorizeEmail(emailContent, aiAnalysis);
  
  // Générer les questions pertinentes
  const questions = generateContextualQuestions(category, emailContent, aiAnalysis);
  
  // Suggérer les actions
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
1. Catégorie (client-urgent, new-case, deadline-reminder, invoice, legal-question, etc.)
2. Niveau d'urgence (low, medium, high, critical)
3. Sentiment (positive, neutral, negative)
4. Questions clés à poser pour traiter cette demande (3-5 questions)
5. Informations manquantes nécessaires
6. Actions recommandées

Fournis une réponse structurée JSON.`;

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
 * Détecte l'urgence de l'email
 */
function detectUrgency(email: any, aiAnalysis: any): 'low' | 'medium' | 'high' | 'critical' {
  const urgentWords = ['urgent', 'immédiat', 'asap', 'rapidement', 'aujourd\'hui', 'critique'];
  const text = `${email.subject} ${email.body}`.toLowerCase();
  
  // Urgence basée sur mots-clés
  const urgentWordCount = urgentWords.filter(word => text.includes(word)).length;
  
  // Urgence basée sur IA
  if (aiAnalysis.urgency) return aiAnalysis.urgency;
  
  // Heuristique
  if (urgentWordCount >= 3) return 'critical';
  if (urgentWordCount >= 2) return 'high';
  if (urgentWordCount >= 1) return 'medium';
  
  return 'low';
}

/**
 * Catégorise l'email
 */
function categorizeEmail(email: any, aiAnalysis: any): EmailCategory {
  if (aiAnalysis.category) return aiAnalysis.category;
  
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();
  
  if (subject.includes('facture') || subject.includes('invoice')) return 'invoice';
  if (subject.includes('rendez-vous') || subject.includes('appointment')) return 'appointment-request';
  if (subject.includes('urgent') || subject.includes('plainte')) return 'client-urgent';
  if (subject.includes('nouveau dossier') || subject.includes('new case')) return 'new-case';
  if (subject.includes('délai') || subject.includes('deadline')) return 'deadline-reminder';
  if (subject.includes('question') || body.includes('question')) return 'legal-question';
  if (subject.includes('tribunal') || subject.includes('court')) return 'court-document';
  
  return 'general-inquiry';
}

/**
 * Génère des questions contextuelles
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
  
  // Questions par défaut selon la catégorie
  const questionsByCategory: Record<EmailCategory, string[]> = {
    'client-urgent': [
      'Quelle est la nature exacte de l\'urgence?',
      'Quel est le délai pour agir?',
      'Y a-t-il des parties adverses impliquées?',
      'Avez-vous des documents à fournir?',
    ],
    'new-case': [
      'Quel type de dossier juridique s\'agit-il?',
      'Qui sont les parties impliquées?',
      'Quelle est la date de début souhaitée?',
      'Quel est votre budget estimé?',
    ],
    'deadline-reminder': [
      'Quelle est la date limite exacte?',
      'Quel document doit être produit?',
      'Qui doit valider avant soumission?',
      'Y a-t-il des conséquences si dépassement?',
    ],
    'invoice': [
      'Le montant correspond-il aux services rendus?',
      'Quel est le mode de paiement préféré?',
      'Faut-il émettre un avoir?',
      'Y a-t-il des conditions de paiement spécifiques?',
    ],
    'legal-question': [
      'Dans quel domaine juridique se situe la question?',
      'Y a-t-il un contexte factuel particulier?',
      'Avez-vous consulté d\'autres sources?',
      'Quelle est l\'échéance pour la réponse?',
    ],
    'court-document': [
      'De quelle juridiction émane le document?',
      'Y a-t-il une date d\'audience?',
      'Faut-il préparer des pièces en réponse?',
      'Qui sont les avocats adverses?',
    ],
    'client-complaint': [
      'Quelle est la nature de la plainte?',
      'Depuis quand le problème existe-t-il?',
      'Quelle solution attendez-vous?',
      'Y a-t-il eu des échanges préalables?',
    ],
    'document-request': [
      'Quels documents sont demandés exactement?',
      'Quel est le format souhaité?',
      'Y a-t-il une échéance pour transmission?',
      'À qui doivent être adressés les documents?',
    ],
    'appointment-request': [
      'Quel est l\'objet du rendez-vous?',
      'Quelle est votre disponibilité?',
      'Rendez-vous en personne ou visio?',
      'Combien de temps estimez-vous nécessaire?',
    ],
    'general-inquiry': [
      'Pouvez-vous préciser votre demande?',
      'Y a-t-il un contexte particulier?',
      'Quelle est l\'urgence de votre demande?',
      'Souhaitez-vous un suivi téléphonique?',
    ],
  };
  
  return questionsByCategory[category] || questionsByCategory['general-inquiry'];
}

/**
 * Génère les actions suggérées
 */
function generateActions(
  category: EmailCategory,
  urgency: string,
  entities: any
): Action[] {
  const actions: Action[] = [];
  
  // Action 1: Toujours créer un formulaire contextuel
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
  
  // Action 2: Si urgent, créer une alerte
  if (urgency === 'high' || urgency === 'critical') {
    actions.push({
      type: 'alert',
      priority: 1,
      description: 'Traitement urgent requis',
      data: { severity: urgency },
    });
  }
  
  // Action 3: Si rendez-vous, intégrer calendrier
  if (category === 'appointment-request' || entities.dates.length > 0) {
    actions.push({
      type: 'calendar',
      priority: 2,
      description: 'Planifier dans le calendrier',
      data: { suggestedDates: entities.dates },
    });
  }
  
  // Action 4: Si nouveau dossier, créer tâches
  if (category === 'new-case') {
    actions.push({
      type: 'task',
      priority: 2,
      description: 'Créer les tâches d\'ouverture de dossier',
      data: { workflow: 'new-case-intake' },
    });
  }
  
  // Action 5: Préparer réponse automatique
  actions.push({
    type: 'email',
    priority: 3,
    description: 'Générer un brouillon de réponse',
    data: { autoReply: true },
  });
  
  return actions.sort((a, b) => a.priority - b.priority);
}

/**
 * Extrait les entités du texte
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
  
  // Extraction des dates (formats français)
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
