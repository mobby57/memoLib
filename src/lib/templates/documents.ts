/**
 * TEMPLATES DE DOCUMENTS PRe-VALIDeS
 * Base sur CHARTE_IA_JURIDIQUE.md - Section 2.5
 * 
 * Ces templates sont utilises par l'IA pour generer des documents
 * selon des structures pre-approuvees.
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
  
  /** Variables necessaires */
  variables: TemplateVariable[];
  
  /** Fonction de generation du contenu */
  generate: (variables: Record<string, any>) => string;
  
  /** Objet email (si applicable) */
  subject?: (variables: Record<string, any>) => string;
}

// ============================================
// TEMPLATES NIVEAU GREEN (Automatiques)
// ============================================

/**
 * Template: Accuse de reception automatique
 */
export const TEMPLATE_ACKNOWLEDGMENT: DocumentTemplate = {
  id: 'acknowledgment_auto',
  type: DocumentType.ACKNOWLEDGMENT,
  name: 'Accuse de reception automatique',
  description: 'Confirmation automatique de reception d\'un message',
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
      description: 'Date du message recu',
      example: '01/01/2026'
    },
    {
      name: 'messageSubject',
      type: 'text',
      required: true,
      description: 'Objet du message',
      example: 'Demande de titre de sejour'
    },
    {
      name: 'dossierRef',
      type: 'text',
      required: true,
      description: 'Reference du dossier',
      example: 'DOS-2026-0123'
    },
    {
      name: 'responseDelay',
      type: 'text',
      required: false,
      description: 'Delai de reponse estime',
      example: '48 heures'
    }
  ],
  
  subject: (vars) => `Accuse de reception - ${vars.dossierRef}`,
  
  generate: (vars) => `
Bonjour ${vars.clientName},

Nous accusons reception de votre message du ${vars.messageDate} concernant ${vars.messageSubject}.

Votre demande a ete enregistree sous la reference **${vars.dossierRef}**.

${vars.responseDelay 
  ? `Nous reviendrons vers vous sous ${vars.responseDelay} pour vous informer de la suite donnee a votre dossier.` 
  : 'Nous reviendrons vers vous prochainement pour vous informer de la suite donnee a votre dossier.'}

En attendant, si vous avez des documents complementaires a nous transmettre, n'hesitez pas a repondre directement a cet email.

Cordialement,

L'equipe
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
      description: 'Lien de visioconference'
    },
    {
      name: 'documentsTobring',
      type: 'list',
      required: false,
      description: 'Documents a apporter'
    }
  ],
  
  subject: (vars) => `Confirmation de rendez-vous - ${vars.appointmentDate} a ${vars.appointmentTime}`,
  
  generate: (vars) => `
Bonjour ${vars.clientName},

Nous vous confirmons votre rendez-vous pour **${vars.appointmentType}** :

[emoji] **Date :** ${vars.appointmentDate}  
[emoji] **Heure :** ${vars.appointmentTime}  
${vars.location ? `[emoji] **Lieu :** ${vars.location}` : ''}
${vars.visioLink ? `[emoji] **Lien visio :** ${vars.visioLink}` : ''}

${vars.documentsToBring && vars.documentsToBring.length > 0 
  ? `
**Documents a apporter :**
${vars.documentsToBring.map((doc: string) => `- ${doc}`).join('\n')}
` 
  : ''}

Si vous avez un empechement, merci de nous prevenir au moins 24 heures a l'avance.

a tres bientot,

L'equipe
  `.trim()
};

// ============================================
// TEMPLATES NIVEAU ORANGE (Semi-automatiques)
// ============================================

/**
 * Template: Demande de pieces
 */
export const TEMPLATE_DOCUMENT_REQUEST: DocumentTemplate = {
  id: 'document_request',
  type: DocumentType.DOCUMENT_REQUEST,
  name: 'Demande de pieces',
  description: 'Demande de documents complementaires',
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
      description: 'Reference du dossier'
    },
    {
      name: 'caseType',
      type: 'text',
      required: true,
      description: 'Type de dossier',
      example: 'Demande de titre de sejour'
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
  
  subject: (vars) => `Dossier ${vars.dossierRef} - Documents a transmettre`,
  
  generate: (vars) => `
Bonjour ${vars.clientName},

Dans le cadre de votre dossier **${vars.caseType}** (ref. ${vars.dossierRef}), nous avons besoin des documents suivants pour pouvoir avancer :

${vars.documents.map((doc: any) => `
**${doc.name}**  
${doc.reason ? `_Necessaire pour :_ ${doc.reason}` : ''}
${doc.format ? `_Format accepte :_ ${doc.format}` : ''}
`).join('\n')}

${vars.deadline 
  ? ` **Merci de nous transmettre ces documents avant le ${vars.deadline}.**` 
  : ''}

${vars.transmissionMethod 
  ? `[emoji] **Comment transmettre :** ${vars.transmissionMethod}` 
  : `[emoji] **Comment transmettre :** Vous pouvez nous envoyer ces documents en repondant directement a cet email.`}

Si vous avez des questions ou rencontrez des difficultes pour obtenir certains documents, n'hesitez pas a nous contacter.

Cordialement,

L'equipe
  `.trim()
};

/**
 * Template: Courrier simple
 */
export const TEMPLATE_SIMPLE_LETTER: DocumentTemplate = {
  id: 'simple_letter',
  type: DocumentType.SIMPLE_LETTER,
  name: 'Courrier simple',
  description: 'Lettre de reponse ou d\'information simple',
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
      description: 'Reference du dossier'
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
      description: 'Prochaines etapes'
    },
    {
      name: 'attachments',
      type: 'list',
      required: false,
      description: 'Pieces jointes'
    }
  ],
  
  subject: (vars) => `${vars.dossierRef} - ${vars.subject}`,
  
  generate: (vars) => `
Bonjour ${vars.clientName},

${vars.context ? `${vars.context}\n\n` : ''}

${vars.mainMessage}

${vars.nextSteps && vars.nextSteps.length > 0 
  ? `
**Prochaines etapes :**
${vars.nextSteps.map((step: string, idx: number) => `${idx + 1}. ${step}`).join('\n')}
` 
  : ''}

${vars.attachments && vars.attachments.length > 0 
  ? `
**Pieces jointes :**
${vars.attachments.map((att: string) => `- ${att}`).join('\n')}
` 
  : ''}

Nous restons a votre disposition pour toute question.

Cordialement,

L'equipe

---
_Reference : ${vars.dossierRef}_
  `.trim()
};

/**
 * Template: Recapitulatif de dossier
 */
export const TEMPLATE_CASE_SUMMARY: DocumentTemplate = {
  id: 'case_summary',
  type: DocumentType.CASE_SUMMARY,
  name: 'Recapitulatif de dossier',
  description: 'Synthese de l\'etat d\'avancement d\'un dossier',
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
      description: 'Reference du dossier'
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
      description: 'Chronologie des evenements'
    },
    {
      name: 'documentsReceived',
      type: 'list',
      required: false,
      description: 'Documents recus'
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
      description: 'Prochaine echeance'
    }
  ],
  
  subject: (vars) => `${vars.dossierRef} - Recapitulatif de votre dossier`,
  
  generate: (vars) => `
Bonjour ${vars.clientName},

Voici un recapitulatif de l'etat d'avancement de votre dossier **${vars.caseType}** (ref. ${vars.dossierRef}).

## [emoji] Informations generales

- **Reference :** ${vars.dossierRef}
- **Type de dossier :** ${vars.caseType}
- **Date d'ouverture :** ${vars.openingDate}
- **Statut actuel :** ${vars.currentStatus}
${vars.nextDeadline ? `- **Prochaine echeance :** ${vars.nextDeadline}` : ''}

${vars.timeline && vars.timeline.length > 0 
  ? `
## [emoji] Chronologie

${vars.timeline.map((event: any) => `- **${event.date}** : ${event.description}`).join('\n')}
` 
  : ''}

${vars.documentsReceived && vars.documentsReceived.length > 0 
  ? `
##  Documents recus

${vars.documentsReceived.map((doc: string) => `- ${doc}`).join('\n')}
` 
  : ''}

${vars.documentsPending && vars.documentsPending.length > 0 
  ? `
##  Documents en attente

${vars.documentsPending.map((doc: string) => `- ${doc}`).join('\n')}
` 
  : ''}

Si vous avez des questions sur ce recapitulatif, n'hesitez pas a nous contacter.

Cordialement,

L'equipe

---
_Document genere le ${new Date().toLocaleDateString('fr-FR')}_
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
      description: 'Reference du dossier'
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
      description: 'elements en attente'
    },
    {
      name: 'attemptNumber',
      type: 'number',
      required: true,
      description: 'Numero de la relance (1, 2 ou 3)'
    }
  ],
  
  subject: (vars) => `${vars.dossierRef} - Relance : documents en attente`,
  
  generate: (vars) => {
    const tone = vars.attemptNumber === 1 
      ? 'douce' 
      : vars.attemptNumber === 2 
        ? 'rappel' 
        : 'derniere';
    
    const greeting = vars.attemptNumber === 1
      ? 'Bonjour'
      : vars.attemptNumber === 2
        ? 'Bonjour'
        : 'Bonjour';
    
    const message = vars.attemptNumber === 1
      ? `Nous n'avons pas encore recu les informations demandees le ${vars.initialRequestDate}.`
      : vars.attemptNumber === 2
        ? `Nous vous rappelons que nous sommes toujours en attente des elements demandes le ${vars.initialRequestDate}.`
        : `Malgre nos precedentes relances, nous n'avons toujours pas recu les elements demandes le ${vars.initialRequestDate}.`;
    
    return `
${greeting} ${vars.clientName},

${message}

**elements en attente :**
${vars.pendingItems.map((item: string) => `- ${item}`).join('\n')}

Afin que nous puissions avancer sur votre dossier (ref. ${vars.dossierRef}), pourriez-vous nous transmettre ces elements dans les meilleurs delais ?

${vars.attemptNumber === 3 
  ? `️ **Attention :** Sans ces elements, nous ne pourrons malheureusement pas progresser sur votre dossier.` 
  : ''}

Merci de votre comprehension.

Cordialement,

L'equipe
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
 * Recupere un template par son ID
 */
export function getTemplate(templateId: string): DocumentTemplate | null {
  return DOCUMENT_TEMPLATES[templateId] || null;
}

/**
 * Recupere tous les templates d'un certain niveau d'autonomie
 */
export function getTemplatesByLevel(level: 'GREEN' | 'ORANGE' | 'RED'): DocumentTemplate[] {
  return Object.values(DOCUMENT_TEMPLATES).filter(
    template => template.autonomyLevel === level
  );
}

/**
 * Recupere tous les templates d'un certain type
 */
export function getTemplatesByType(type: DocumentType): DocumentTemplate[] {
  return Object.values(DOCUMENT_TEMPLATES).filter(
    template => template.type === type
  );
}

/**
 * Genere un document a partir d'un template
 */
export function generateDocument(
  templateId: string,
  variables: Record<string, any>
): { success: boolean; content?: string; subject?: string; error?: string } {
  const template = getTemplate(templateId);
  
  if (!template) {
    return { success: false, error: 'Template non trouve' };
  }
  
  // Verifier les variables requises
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
      error: `Erreur de generation : ${error}` 
    };
  }
}
