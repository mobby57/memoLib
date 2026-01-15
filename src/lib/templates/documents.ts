/**
 * TEMPLATES DE DOCUMENTS PRÉ-VALIDÉS
 * Basé sur CHARTE_IA_JURIDIQUE.md - Section 2.5
 * 
 * Ces templates sont utilisés par l'IA pour générer des documents
 * selon des structures pré-approuvées.
 */

import { DocumentType } from '@/types';

export interface TemplateVariable {
  name: string;
  type: 'text' | 'date' | 'number' | 'list';
  required: boolean;
  description: string;
  example?: string;
}

export interface DocumentTemplate {
  id: string;
  type: DocumentType;
  name: string;
  description: string;
  
  /** Niveau d'autonomie requis pour utiliser ce template */
  autonomyLevel: 'GREEN' | 'ORANGE' | 'RED';
  
  /** Validation requise ? */
  requiresValidation: boolean;
  
  /** Variables nécessaires */
  variables: TemplateVariable[];
  
  /** Fonction de génération du contenu */
  generate: (variables: Record<string, any>) => string;
  
  /** Objet email (si applicable) */
  subject?: (variables: Record<string, any>) => string;
}

// ============================================
// TEMPLATES NIVEAU GREEN (Automatiques)
// ============================================

/**
 * Template: Accusé de réception automatique
 */
export const TEMPLATE_ACKNOWLEDGMENT: DocumentTemplate = {
  id: 'acknowledgment_auto',
  type: DocumentType.ACKNOWLEDGMENT,
  name: 'Accusé de réception automatique',
  description: 'Confirmation automatique de réception d\'un message',
  autonomyLevel: 'GREEN',
  requiresValidation: false,
  
  variables: [
    {
      name: 'clientName',
      type: 'text',
      required: true,
      description: 'Nom du client',
      example: 'M. Dupont'
    },
    {
      name: 'messageDate',
      type: 'date',
      required: true,
      description: 'Date du message reçu',
      example: '01/01/2026'
    },
    {
      name: 'messageSubject',
      type: 'text',
      required: true,
      description: 'Objet du message',
      example: 'Demande de titre de séjour'
    },
    {
      name: 'dossierRef',
      type: 'text',
      required: true,
      description: 'Référence du dossier',
      example: 'DOS-2026-0123'
    },
    {
      name: 'responseDelay',
      type: 'text',
      required: false,
      description: 'Délai de réponse estimé',
      example: '48 heures'
    }
  ],
  
  subject: (vars) => `Accusé de réception - ${vars.dossierRef}`,
  
  generate: (vars) => `
Bonjour ${vars.clientName},

Nous accusons réception de votre message du ${vars.messageDate} concernant ${vars.messageSubject}.

Votre demande a été enregistrée sous la référence **${vars.dossierRef}**.

${vars.responseDelay 
  ? `Nous reviendrons vers vous sous ${vars.responseDelay} pour vous informer de la suite donnée à votre dossier.` 
  : 'Nous reviendrons vers vous prochainement pour vous informer de la suite donnée à votre dossier.'}

En attendant, si vous avez des documents complémentaires à nous transmettre, n'hésitez pas à répondre directement à cet email.

Cordialement,

L'équipe
  `.trim()
};

/**
 * Template: Confirmation de rendez-vous
 */
export const TEMPLATE_APPOINTMENT_CONFIRMATION: DocumentTemplate = {
  id: 'appointment_confirmation',
  type: DocumentType.APPOINTMENT_CONFIRMATION,
  name: 'Confirmation de rendez-vous',
  description: 'Confirmation automatique d\'un rendez-vous',
  autonomyLevel: 'GREEN',
  requiresValidation: false,
  
  variables: [
    {
      name: 'clientName',
      type: 'text',
      required: true,
      description: 'Nom du client'
    },
    {
      name: 'appointmentDate',
      type: 'date',
      required: true,
      description: 'Date du rendez-vous'
    },
    {
      name: 'appointmentTime',
      type: 'text',
      required: true,
      description: 'Heure du rendez-vous',
      example: '14h30'
    },
    {
      name: 'appointmentType',
      type: 'text',
      required: true,
      description: 'Type de rendez-vous',
      example: 'Consultation initiale'
    },
    {
      name: 'location',
      type: 'text',
      required: false,
      description: 'Lieu du rendez-vous'
    },
    {
      name: 'visioLink',
      type: 'text',
      required: false,
      description: 'Lien de visioconférence'
    },
    {
      name: 'documentsTobring',
      type: 'list',
      required: false,
      description: 'Documents à apporter'
    }
  ],
  
  subject: (vars) => `Confirmation de rendez-vous - ${vars.appointmentDate} à ${vars.appointmentTime}`,
  
  generate: (vars) => `
Bonjour ${vars.clientName},

Nous vous confirmons votre rendez-vous pour **${vars.appointmentType}** :

📅 **Date :** ${vars.appointmentDate}  
🕐 **Heure :** ${vars.appointmentTime}  
${vars.location ? `📍 **Lieu :** ${vars.location}` : ''}
${vars.visioLink ? `💻 **Lien visio :** ${vars.visioLink}` : ''}

${vars.documentsToBring && vars.documentsToBring.length > 0 
  ? `
**Documents à apporter :**
${vars.documentsToBring.map((doc: string) => `- ${doc}`).join('\n')}
` 
  : ''}

Si vous avez un empêchement, merci de nous prévenir au moins 24 heures à l'avance.

À très bientôt,

L'équipe
  `.trim()
};

// ============================================
// TEMPLATES NIVEAU ORANGE (Semi-automatiques)
// ============================================

/**
 * Template: Demande de pièces
 */
export const TEMPLATE_DOCUMENT_REQUEST: DocumentTemplate = {
  id: 'document_request',
  type: DocumentType.DOCUMENT_REQUEST,
  name: 'Demande de pièces',
  description: 'Demande de documents complémentaires',
  autonomyLevel: 'ORANGE',
  requiresValidation: true,
  
  variables: [
    {
      name: 'clientName',
      type: 'text',
      required: true,
      description: 'Nom du client'
    },
    {
      name: 'dossierRef',
      type: 'text',
      required: true,
      description: 'Référence du dossier'
    },
    {
      name: 'caseType',
      type: 'text',
      required: true,
      description: 'Type de dossier',
      example: 'Demande de titre de séjour'
    },
    {
      name: 'documents',
      type: 'list',
      required: true,
      description: 'Liste des documents requis avec justifications'
    },
    {
      name: 'deadline',
      type: 'date',
      required: false,
      description: 'Date limite de transmission'
    },
    {
      name: 'transmissionMethod',
      type: 'text',
      required: false,
      description: 'Moyen de transmission',
      example: 'email, portail client, courrier'
    }
  ],
  
  subject: (vars) => `Dossier ${vars.dossierRef} - Documents à transmettre`,
  
  generate: (vars) => `
Bonjour ${vars.clientName},

Dans le cadre de votre dossier **${vars.caseType}** (réf. ${vars.dossierRef}), nous avons besoin des documents suivants pour pouvoir avancer :

${vars.documents.map((doc: any) => `
**${doc.name}**  
${doc.reason ? `_Nécessaire pour :_ ${doc.reason}` : ''}
${doc.format ? `_Format accepté :_ ${doc.format}` : ''}
`).join('\n')}

${vars.deadline 
  ? `⏰ **Merci de nous transmettre ces documents avant le ${vars.deadline}.**` 
  : ''}

${vars.transmissionMethod 
  ? `📤 **Comment transmettre :** ${vars.transmissionMethod}` 
  : `📤 **Comment transmettre :** Vous pouvez nous envoyer ces documents en répondant directement à cet email.`}

Si vous avez des questions ou rencontrez des difficultés pour obtenir certains documents, n'hésitez pas à nous contacter.

Cordialement,

L'équipe
  `.trim()
};

/**
 * Template: Courrier simple
 */
export const TEMPLATE_SIMPLE_LETTER: DocumentTemplate = {
  id: 'simple_letter',
  type: DocumentType.SIMPLE_LETTER,
  name: 'Courrier simple',
  description: 'Lettre de réponse ou d\'information simple',
  autonomyLevel: 'ORANGE',
  requiresValidation: true,
  
  variables: [
    {
      name: 'clientName',
      type: 'text',
      required: true,
      description: 'Nom du client'
    },
    {
      name: 'dossierRef',
      type: 'text',
      required: true,
      description: 'Référence du dossier'
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
      description: 'Objet du courrier'
    },
    {
      name: 'context',
      type: 'text',
      required: false,
      description: 'Contexte / Rappel'
    },
    {
      name: 'mainMessage',
      type: 'text',
      required: true,
      description: 'Message principal'
    },
    {
      name: 'nextSteps',
      type: 'list',
      required: false,
      description: 'Prochaines étapes'
    },
    {
      name: 'attachments',
      type: 'list',
      required: false,
      description: 'Pièces jointes'
    }
  ],
  
  subject: (vars) => `${vars.dossierRef} - ${vars.subject}`,
  
  generate: (vars) => `
Bonjour ${vars.clientName},

${vars.context ? `${vars.context}\n\n` : ''}

${vars.mainMessage}

${vars.nextSteps && vars.nextSteps.length > 0 
  ? `
**Prochaines étapes :**
${vars.nextSteps.map((step: string, idx: number) => `${idx + 1}. ${step}`).join('\n')}
` 
  : ''}

${vars.attachments && vars.attachments.length > 0 
  ? `
**Pièces jointes :**
${vars.attachments.map((att: string) => `- ${att}`).join('\n')}
` 
  : ''}

Nous restons à votre disposition pour toute question.

Cordialement,

L'équipe

---
_Référence : ${vars.dossierRef}_
  `.trim()
};

/**
 * Template: Récapitulatif de dossier
 */
export const TEMPLATE_CASE_SUMMARY: DocumentTemplate = {
  id: 'case_summary',
  type: DocumentType.CASE_SUMMARY,
  name: 'Récapitulatif de dossier',
  description: 'Synthèse de l\'état d\'avancement d\'un dossier',
  autonomyLevel: 'ORANGE',
  requiresValidation: true,
  
  variables: [
    {
      name: 'clientName',
      type: 'text',
      required: true,
      description: 'Nom du client'
    },
    {
      name: 'dossierRef',
      type: 'text',
      required: true,
      description: 'Référence du dossier'
    },
    {
      name: 'caseType',
      type: 'text',
      required: true,
      description: 'Type de dossier'
    },
    {
      name: 'openingDate',
      type: 'date',
      required: true,
      description: 'Date d\'ouverture'
    },
    {
      name: 'currentStatus',
      type: 'text',
      required: true,
      description: 'Statut actuel'
    },
    {
      name: 'timeline',
      type: 'list',
      required: false,
      description: 'Chronologie des événements'
    },
    {
      name: 'documentsReceived',
      type: 'list',
      required: false,
      description: 'Documents reçus'
    },
    {
      name: 'documentsPending',
      type: 'list',
      required: false,
      description: 'Documents en attente'
    },
    {
      name: 'nextDeadline',
      type: 'date',
      required: false,
      description: 'Prochaine échéance'
    }
  ],
  
  subject: (vars) => `${vars.dossierRef} - Récapitulatif de votre dossier`,
  
  generate: (vars) => `
Bonjour ${vars.clientName},

Voici un récapitulatif de l'état d'avancement de votre dossier **${vars.caseType}** (réf. ${vars.dossierRef}).

## 📋 Informations générales

- **Référence :** ${vars.dossierRef}
- **Type de dossier :** ${vars.caseType}
- **Date d'ouverture :** ${vars.openingDate}
- **Statut actuel :** ${vars.currentStatus}
${vars.nextDeadline ? `- **Prochaine échéance :** ${vars.nextDeadline}` : ''}

${vars.timeline && vars.timeline.length > 0 
  ? `
## 📅 Chronologie

${vars.timeline.map((event: any) => `- **${event.date}** : ${event.description}`).join('\n')}
` 
  : ''}

${vars.documentsReceived && vars.documentsReceived.length > 0 
  ? `
## ✅ Documents reçus

${vars.documentsReceived.map((doc: string) => `- ${doc}`).join('\n')}
` 
  : ''}

${vars.documentsPending && vars.documentsPending.length > 0 
  ? `
## ⏳ Documents en attente

${vars.documentsPending.map((doc: string) => `- ${doc}`).join('\n')}
` 
  : ''}

Si vous avez des questions sur ce récapitulatif, n'hésitez pas à nous contacter.

Cordialement,

L'équipe

---
_Document généré le ${new Date().toLocaleDateString('fr-FR')}_
  `.trim()
};

/**
 * Template: Relance automatique
 */
export const TEMPLATE_REMINDER: DocumentTemplate = {
  id: 'reminder_auto',
  type: DocumentType.REMINDER,
  name: 'Relance automatique',
  description: 'Relance pour documents ou informations manquantes',
  autonomyLevel: 'ORANGE',
  requiresValidation: false,
  
  variables: [
    {
      name: 'clientName',
      type: 'text',
      required: true,
      description: 'Nom du client'
    },
    {
      name: 'dossierRef',
      type: 'text',
      required: true,
      description: 'Référence du dossier'
    },
    {
      name: 'initialRequestDate',
      type: 'date',
      required: true,
      description: 'Date de la demande initiale'
    },
    {
      name: 'pendingItems',
      type: 'list',
      required: true,
      description: 'Éléments en attente'
    },
    {
      name: 'attemptNumber',
      type: 'number',
      required: true,
      description: 'Numéro de la relance (1, 2 ou 3)'
    }
  ],
  
  subject: (vars) => `${vars.dossierRef} - Relance : documents en attente`,
  
  generate: (vars) => {
    const tone = vars.attemptNumber === 1 
      ? 'douce' 
      : vars.attemptNumber === 2 
        ? 'rappel' 
        : 'dernière';
    
    const greeting = vars.attemptNumber === 1
      ? 'Bonjour'
      : vars.attemptNumber === 2
        ? 'Bonjour'
        : 'Bonjour';
    
    const message = vars.attemptNumber === 1
      ? `Nous n'avons pas encore reçu les informations demandées le ${vars.initialRequestDate}.`
      : vars.attemptNumber === 2
        ? `Nous vous rappelons que nous sommes toujours en attente des éléments demandés le ${vars.initialRequestDate}.`
        : `Malgré nos précédentes relances, nous n'avons toujours pas reçu les éléments demandés le ${vars.initialRequestDate}.`;
    
    return `
${greeting} ${vars.clientName},

${message}

**Éléments en attente :**
${vars.pendingItems.map((item: string) => `- ${item}`).join('\n')}

Afin que nous puissions avancer sur votre dossier (réf. ${vars.dossierRef}), pourriez-vous nous transmettre ces éléments dans les meilleurs délais ?

${vars.attemptNumber === 3 
  ? `⚠️ **Attention :** Sans ces éléments, nous ne pourrons malheureusement pas progresser sur votre dossier.` 
  : ''}

Merci de votre compréhension.

Cordialement,

L'équipe
    `.trim();
  }
};

// ============================================
// EXPORT DE TOUS LES TEMPLATES
// ============================================

export const DOCUMENT_TEMPLATES: Record<string, DocumentTemplate> = {
  acknowledgment_auto: TEMPLATE_ACKNOWLEDGMENT,
  appointment_confirmation: TEMPLATE_APPOINTMENT_CONFIRMATION,
  document_request: TEMPLATE_DOCUMENT_REQUEST,
  simple_letter: TEMPLATE_SIMPLE_LETTER,
  case_summary: TEMPLATE_CASE_SUMMARY,
  reminder_auto: TEMPLATE_REMINDER
};

/**
 * Récupère un template par son ID
 */
export function getTemplate(templateId: string): DocumentTemplate | null {
  return DOCUMENT_TEMPLATES[templateId] || null;
}

/**
 * Récupère tous les templates d'un certain niveau d'autonomie
 */
export function getTemplatesByLevel(level: 'GREEN' | 'ORANGE' | 'RED'): DocumentTemplate[] {
  return Object.values(DOCUMENT_TEMPLATES).filter(
    template => template.autonomyLevel === level
  );
}

/**
 * Récupère tous les templates d'un certain type
 */
export function getTemplatesByType(type: DocumentType): DocumentTemplate[] {
  return Object.values(DOCUMENT_TEMPLATES).filter(
    template => template.type === type
  );
}

/**
 * Génère un document à partir d'un template
 */
export function generateDocument(
  templateId: string,
  variables: Record<string, any>
): { success: boolean; content?: string; subject?: string; error?: string } {
  const template = getTemplate(templateId);
  
  if (!template) {
    return { success: false, error: 'Template non trouvé' };
  }
  
  // Vérifier les variables requises
  const missingVars = template.variables
    .filter(v => v.required && !variables[v.name])
    .map(v => v.name);
  
  if (missingVars.length > 0) {
    return { 
      success: false, 
      error: `Variables manquantes : ${missingVars.join(', ')}` 
    };
  }
  
  try {
    const content = template.generate(variables);
    const subject = template.subject ? template.subject(variables) : undefined;
    
    return { success: true, content, subject };
  } catch (error) {
    return { 
      success: false, 
      error: `Erreur de génération : ${error}` 
    };
  }
}
