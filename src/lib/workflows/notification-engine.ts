/**
 * 🔔 Moteur de Notifications Contextuelles
 * Génère des notifications interactives obligatoires avec actions
 */

import { prisma } from '@/lib/prisma';
import { EmailAnalysis } from './email-intelligence';

export interface ContextualNotification {
  id: string;
  type: 'email-action-required' | 'form-required' | 'approval-needed' | 'deadline-alert';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  emailContext: EmailAnalysis;
  requiresAction: boolean;
  actions: NotificationAction[];
  dismissible: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'open-form' | 'schedule' | 'reply' | 'delegate' | 'archive';
  formConfig?: DynamicFormConfig;
  calendarConfig?: CalendarConfig;
  emailConfig?: EmailConfig;
  primary: boolean;
}

export interface DynamicFormConfig {
  formId: string;
  title: string;
  fields: FormField[];
  onSubmit: {
    action: 'schedule' | 'reply' | 'create-task' | 'update-dossier';
    config: any;
  };
}

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'time' | 'checkbox' | 'radio' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: any;
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'contains' | 'greaterThan';
  };
}

export interface CalendarConfig {
  title: string;
  description: string;
  duration: number; // minutes
  suggestedDates: Date[];
  attendees: string[];
  location?: string;
  type: 'meeting' | 'deadline' | 'reminder';
}

export interface EmailConfig {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
  attachments?: string[];
}

/**
 * Crée une notification contextuelle basée sur l'analyse email
 */
export async function createContextualNotification(
  emailAnalysis: EmailAnalysis,
  userId: string
): Promise<ContextualNotification> {
  
  const severity = mapUrgencyToSeverity(emailAnalysis.urgency);
  const actions = await generateNotificationActions(emailAnalysis);
  
  const notification: ContextualNotification = {
    id: generateNotificationId(),
    type: 'email-action-required',
    severity,
    title: generateNotificationTitle(emailAnalysis),
    message: generateNotificationMessage(emailAnalysis),
    emailContext: emailAnalysis,
    requiresAction: true,
    actions,
    dismissible: emailAnalysis.urgency === 'low',
    expiresAt: calculateExpiration(emailAnalysis),
    createdAt: new Date(),
  };
  
  // Sauvegarder dans la base de données
  await saveNotification(notification, userId);
  
  return notification;
}

/**
 * Génère les actions de la notification
 */
async function generateNotificationActions(
  emailAnalysis: EmailAnalysis
): Promise<NotificationAction[]> {
  const actions: NotificationAction[] = [];
  
  // Action principale: Ouvrir le formulaire contextuel
  const formConfig = await generateDynamicForm(emailAnalysis);
  actions.push({
    id: 'action_form',
    label: 'Traiter la Demande',
    type: 'open-form',
    formConfig,
    primary: true,
  });
  
  // Si rendez-vous suggéré
  if (emailAnalysis.category === 'appointment-request' || 
      emailAnalysis.entities.dates.length > 0) {
    actions.push({
      id: 'action_schedule',
      label: 'Planifier Rendez-vous',
      type: 'schedule',
      calendarConfig: generateCalendarConfig(emailAnalysis),
      primary: false,
    });
  }
  
  // Si réponse automatique possible
  actions.push({
    id: 'action_reply',
    label: 'Répondre',
    type: 'reply',
    emailConfig: await generateEmailConfig(emailAnalysis),
    primary: false,
  });
  
  // Si délégation possible
  if (emailAnalysis.urgency !== 'critical') {
    actions.push({
      id: 'action_delegate',
      label: 'Déléguer',
      type: 'delegate',
      primary: false,
    });
  }
  
  return actions;
}

/**
 * Génère un formulaire dynamique adapté au contexte
 */
async function generateDynamicForm(
  emailAnalysis: EmailAnalysis
): Promise<DynamicFormConfig> {
  
  const formsByCategory: Record<string, DynamicFormConfig> = {
    'client-urgent': {
      formId: 'client-urgent-intake',
      title: 'Traitement Demande Urgente',
      fields: [
        {
          id: 'urgencyLevel',
          type: 'select',
          label: 'Niveau d\'urgence réel',
          required: true,
          options: ['Critique (< 24h)', 'Élevé (< 48h)', 'Moyen (< 1 semaine)', 'Faible'],
        },
        {
          id: 'issueType',
          type: 'select',
          label: 'Type de problème',
          required: true,
          options: ['Juridique', 'Administratif', 'Relationnel', 'Financier', 'Autre'],
        },
        {
          id: 'actionNeeded',
          type: 'textarea',
          label: 'Action requise',
          required: true,
          placeholder: 'Décrivez l\'action à entreprendre...',
        },
        {
          id: 'assignTo',
          type: 'select',
          label: 'Assigner à',
          required: true,
          options: ['Moi-même', 'Avocat Senior', 'Paralegal', 'Assistant'],
        },
        {
          id: 'scheduleMeeting',
          type: 'checkbox',
          label: 'Planifier une réunion avec le client',
          required: false,
        },
        {
          id: 'meetingDate',
          type: 'date',
          label: 'Date de réunion',
          required: false,
          conditional: {
            field: 'scheduleMeeting',
            value: true,
            operator: 'equals',
          },
        },
        {
          id: 'responseTemplate',
          type: 'select',
          label: 'Modèle de réponse',
          required: true,
          options: [
            'Accusé réception urgent',
            'Demande informations complémentaires',
            'Proposition rendez-vous',
            'Réponse personnalisée',
          ],
        },
      ],
      onSubmit: {
        action: 'schedule',
        config: {
          createTask: true,
          sendEmail: true,
          updateDossier: true,
        },
      },
    },
    
    'new-case': {
      formId: 'new-case-intake',
      title: 'Ouverture Nouveau Dossier',
      fields: [
        {
          id: 'caseType',
          type: 'select',
          label: 'Type de dossier',
          required: true,
          options: ['Civil', 'Pénal', 'Commercial', 'Famille', 'Travail', 'Administratif'],
        },
        {
          id: 'clientName',
          type: 'text',
          label: 'Nom du client',
          required: true,
        },
        {
          id: 'opposingParty',
          type: 'text',
          label: 'Partie adverse',
          required: false,
        },
        {
          id: 'estimatedValue',
          type: 'text',
          label: 'Montant en jeu (€)',
          required: false,
        },
        {
          id: 'complexity',
          type: 'select',
          label: 'Complexité',
          required: true,
          options: ['Simple', 'Moyenne', 'Complexe', 'Très complexe'],
        },
        {
          id: 'startDate',
          type: 'date',
          label: 'Date de début souhaitée',
          required: true,
        },
        {
          id: 'firstMeeting',
          type: 'date',
          label: 'Premier rendez-vous',
          required: true,
        },
        {
          id: 'documentsNeeded',
          type: 'checkbox',
          label: 'Documents clients nécessaires',
          required: false,
        },
      ],
      onSubmit: {
        action: 'create-task',
        config: {
          createDossier: true,
          scheduleIntakeMeeting: true,
          sendWelcomeEmail: true,
          createTaskList: true,
        },
      },
    },
    
    'appointment-request': {
      formId: 'appointment-scheduling',
      title: 'Planification Rendez-vous',
      fields: [
        {
          id: 'meetingType',
          type: 'select',
          label: 'Type de rendez-vous',
          required: true,
          options: ['Première consultation', 'Suivi dossier', 'Signature', 'Visio', 'Téléphone'],
        },
        {
          id: 'duration',
          type: 'select',
          label: 'Durée estimée',
          required: true,
          options: ['30 minutes', '1 heure', '2 heures', '3+ heures'],
        },
        {
          id: 'preferredDate',
          type: 'date',
          label: 'Date souhaitée',
          required: true,
        },
        {
          id: 'preferredTime',
          type: 'time',
          label: 'Heure préférée',
          required: true,
        },
        {
          id: 'location',
          type: 'select',
          label: 'Lieu',
          required: true,
          options: ['Cabinet', 'Visioconférence', 'Téléphone', 'Chez le client'],
        },
        {
          id: 'agenda',
          type: 'textarea',
          label: 'Ordre du jour',
          required: false,
          placeholder: 'Points à aborder...',
        },
      ],
      onSubmit: {
        action: 'schedule',
        config: {
          addToCalendar: true,
          sendInvitation: true,
          createReminder: true,
        },
      },
    },
    
    'legal-question': {
      formId: 'legal-question-response',
      title: 'Réponse Question Juridique',
      fields: [
        {
          id: 'questionArea',
          type: 'select',
          label: 'Domaine juridique',
          required: true,
          options: ['Droit civil', 'Droit pénal', 'Droit commercial', 'Droit du travail', 'Autre'],
        },
        {
          id: 'complexity',
          type: 'select',
          label: 'Complexité de la réponse',
          required: true,
          options: ['Simple (< 30min)', 'Moyenne (< 2h)', 'Complexe (> 2h)', 'Recherche approfondie'],
        },
        {
          id: 'researchNeeded',
          type: 'checkbox',
          label: 'Recherche juridique nécessaire',
          required: false,
        },
        {
          id: 'responseDeadline',
          type: 'date',
          label: 'Échéance réponse',
          required: true,
        },
        {
          id: 'aiDraftResponse',
          type: 'textarea',
          label: 'Brouillon IA (à réviser)',
          required: false,
          placeholder: 'Réponse générée par l\'IA...',
        },
      ],
      onSubmit: {
        action: 'reply',
        config: {
          generateAIDraft: true,
          scheduleReview: true,
          sendResponse: true,
        },
      },
    },
  };
  
  return formsByCategory[emailAnalysis.category] || formsByCategory['client-urgent'];
}

/**
 * Génère la configuration calendrier
 */
function generateCalendarConfig(emailAnalysis: EmailAnalysis): CalendarConfig {
  return {
    title: `Rendez-vous: ${emailAnalysis.subject}`,
    description: `Email de: ${emailAnalysis.from}`,
    duration: 60,
    suggestedDates: emailAnalysis.entities.dates.length > 0 
      ? emailAnalysis.entities.dates 
      : [new Date(Date.now() + 24 * 60 * 60 * 1000)],
    attendees: [emailAnalysis.from],
    type: 'meeting',
  };
}

/**
 * Génère la configuration email de réponse
 */
async function generateEmailConfig(emailAnalysis: EmailAnalysis): Promise<EmailConfig> {
  // Générer un brouillon avec l'IA
  const draft = await generateAIDraftResponse(emailAnalysis);
  
  return {
    to: emailAnalysis.from,
    subject: `Re: ${emailAnalysis.subject}`,
    template: 'contextual-response',
    variables: {
      recipientName: emailAnalysis.from.split('@')[0],
      originalSubject: emailAnalysis.subject,
      draftContent: draft,
      category: emailAnalysis.category,
    },
  };
}

/**
 * Génère un brouillon de réponse avec l'IA
 */
async function generateAIDraftResponse(emailAnalysis: EmailAnalysis): Promise<string> {
  try {
    const prompt = `En tant qu'avocat professionnel, rédige une réponse courtoise à cet email:

CATÉGORIE: ${emailAnalysis.category}
URGENCE: ${emailAnalysis.urgency}
SUJET: ${emailAnalysis.subject}
DE: ${emailAnalysis.from}

QUESTIONS À TRAITER:
${emailAnalysis.questions.join('\n')}

Rédige une réponse professionnelle, courtoise et structurée. Accuse réception, réponds aux points principaux, et propose des prochaines étapes.`;

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
      return data.response;
    }
  } catch (error) {
    console.error('Erreur génération brouillon:', error);
  }

  return `Madame, Monsieur,

Nous accusons bonne réception de votre email concernant ${emailAnalysis.subject}.

Nous reviendrons vers vous dans les meilleurs délais pour traiter votre demande.

Cordialement,`;
}

function mapUrgencyToSeverity(urgency: string): 'info' | 'warning' | 'critical' {
  if (urgency === 'critical') return 'critical';
  if (urgency === 'high') return 'warning';
  return 'info';
}

function generateNotificationTitle(emailAnalysis: EmailAnalysis): string {
  const titles: Record<string, string> = {
    'client-urgent': '🚨 Demande Client Urgente',
    'new-case': '📁 Nouveau Dossier à Traiter',
    'deadline-reminder': '⏰ Rappel de Délai',
    'invoice': '💰 Facture Reçue',
    'legal-question': '❓ Question Juridique',
    'appointment-request': '📅 Demande de Rendez-vous',
    'court-document': '⚖️ Document Tribunal',
    'client-complaint': '⚠️ Réclamation Client',
  };
  
  return titles[emailAnalysis.category] || '📧 Email Nécessite Action';
}

function generateNotificationMessage(emailAnalysis: EmailAnalysis): string {
  return `Email de ${emailAnalysis.from}: "${emailAnalysis.subject}". 
Urgence: ${emailAnalysis.urgency.toUpperCase()}. 
Action requise pour traitement.`;
}

function calculateExpiration(emailAnalysis: EmailAnalysis): Date | undefined {
  if (emailAnalysis.deadline) return emailAnalysis.deadline;
  
  const hoursToExpire = {
    'critical': 4,
    'high': 24,
    'medium': 72,
    'low': 168,
  };
  
  const hours = hoursToExpire[emailAnalysis.urgency as keyof typeof hoursToExpire] || 168;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function saveNotification(notification: ContextualNotification, userId: string): Promise<void> {
  await prisma.systemAlert.create({
    data: {
      type: notification.type,
      severity: notification.severity,
      title: notification.title,
      description: notification.message,
      status: 'active',
      targetEmail: userId,
      actionUrl: `/lawyer/notifications/${notification.id}`,
    },
  });
}

function generateNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
