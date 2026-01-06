/**
 * ⚙️ Moteur de Workflows Intelligents
 * Orchestration des workflows automatisés contextuels
 */

import { EmailAnalysis } from './email-intelligence';
import { ContextualNotification } from './notification-engine';
import { prisma } from '@/lib/prisma';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  status: 'active' | 'paused' | 'completed' | 'failed';
}

export interface WorkflowTrigger {
  type: 'email' | 'form' | 'calendar' | 'deadline' | 'manual';
  condition: any;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'analysis' | 'notification' | 'form' | 'schedule' | 'email' | 'task' | 'decision';
  action: any;
  nextSteps: string[];
  timeout?: number;
}

/**
 * WORKFLOW 1: Email Urgent → Notification → Formulaire → Planning → Réponse
 */
export const WORKFLOW_URGENT_EMAIL: Workflow = {
  id: 'urgent-email-workflow',
  name: 'Traitement Email Urgent',
  description: 'Email urgent → Analyse IA → Notification obligatoire → Formulaire dynamique → Planning calendrier → Réponse automatique',
  trigger: {
    type: 'email',
    condition: { urgency: ['high', 'critical'] },
  },
  steps: [
    {
      id: 'step1_analysis',
      name: 'Analyse IA de l\'email',
      type: 'analysis',
      action: {
        function: 'analyzeEmail',
        params: { deepAnalysis: true },
      },
      nextSteps: ['step2_notification'],
    },
    {
      id: 'step2_notification',
      name: 'Créer notification urgente',
      type: 'notification',
      action: {
        function: 'createContextualNotification',
        params: { requiresAction: true, dismissible: false },
      },
      nextSteps: ['step3_form'],
      timeout: 3600, // 1 heure max
    },
    {
      id: 'step3_form',
      name: 'Formulaire de traitement',
      type: 'form',
      action: {
        function: 'generateDynamicForm',
        params: { adaptToContext: true },
      },
      nextSteps: ['step4_schedule', 'step5_email'],
    },
    {
      id: 'step4_schedule',
      name: 'Planifier dans calendrier',
      type: 'schedule',
      action: {
        function: 'addToCalendar',
        params: { sendInvites: true, createReminder: true },
      },
      nextSteps: ['step5_email'],
    },
    {
      id: 'step5_email',
      name: 'Envoyer réponse automatique',
      type: 'email',
      action: {
        function: 'sendAIDraftEmail',
        params: { requireApproval: true },
      },
      nextSteps: [],
    },
  ],
  status: 'active',
};

/**
 * WORKFLOW 2: Facture → Validation → Échéance → Confirmation
 */
export const WORKFLOW_INVOICE_PROCESSING: Workflow = {
  id: 'invoice-processing-workflow',
  name: 'Traitement Automatique Factures',
  description: 'Facture reçue → Extraction IA → Formulaire validation → Échéance calendrier → Email confirmation',
  trigger: {
    type: 'email',
    condition: { category: 'invoice', hasAttachment: true },
  },
  steps: [
    {
      id: 'step1_extract',
      name: 'Extraction données facture (OCR + IA)',
      type: 'analysis',
      action: {
        function: 'extractInvoiceData',
        params: { ocrEnabled: true },
      },
      nextSteps: ['step2_notification'],
    },
    {
      id: 'step2_notification',
      name: 'Notification validation requise',
      type: 'notification',
      action: {
        function: 'createInvoiceNotification',
        params: { severity: 'warning' },
      },
      nextSteps: ['step3_form'],
    },
    {
      id: 'step3_form',
      name: 'Formulaire validation facture',
      type: 'form',
      action: {
        function: 'generateInvoiceValidationForm',
        params: {
          fields: ['amount', 'dueDate', 'approver', 'budgetCode'],
        },
      },
      nextSteps: ['step4_schedule', 'step5_task'],
    },
    {
      id: 'step4_schedule',
      name: 'Ajouter échéance paiement',
      type: 'schedule',
      action: {
        function: 'addPaymentDeadline',
        params: { reminderDays: [7, 3, 1] },
      },
      nextSteps: ['step6_email'],
    },
    {
      id: 'step5_task',
      name: 'Créer tâche approbation',
      type: 'task',
      action: {
        function: 'createApprovalTask',
        params: { workflow: 'invoice-approval' },
      },
      nextSteps: ['step6_email'],
    },
    {
      id: 'step6_email',
      name: 'Confirmation traitement',
      type: 'email',
      action: {
        function: 'sendInvoiceConfirmation',
        params: { includeReceipt: true },
      },
      nextSteps: [],
    },
  ],
  status: 'active',
};

/**
 * WORKFLOW 3: Nouveau Dossier → Intake → Planning → Accusé Réception
 */
export const WORKFLOW_NEW_CASE_INTAKE: Workflow = {
  id: 'new-case-intake-workflow',
  name: 'Ouverture Nouveau Dossier',
  description: 'Email nouveau dossier → Formulaire intake → Planning tâches → Email bienvenue',
  trigger: {
    type: 'email',
    condition: { category: 'new-case' },
  },
  steps: [
    {
      id: 'step1_analysis',
      name: 'Analyse type de dossier',
      type: 'analysis',
      action: {
        function: 'analyzeCaseType',
        params: { suggestCategory: true },
      },
      nextSteps: ['step2_notification'],
    },
    {
      id: 'step2_notification',
      name: 'Notification nouveau dossier',
      type: 'notification',
      action: {
        function: 'createNewCaseNotification',
        params: { assignTo: 'auto' },
      },
      nextSteps: ['step3_form'],
    },
    {
      id: 'step3_form',
      name: 'Formulaire intake client',
      type: 'form',
      action: {
        function: 'generateIntakeForm',
        params: { collectDocuments: true },
      },
      nextSteps: ['step4_dossier', 'step5_schedule'],
    },
    {
      id: 'step4_dossier',
      name: 'Créer dossier système',
      type: 'task',
      action: {
        function: 'createDossier',
        params: { autoNumber: true, template: 'default' },
      },
      nextSteps: ['step6_tasks'],
    },
    {
      id: 'step5_schedule',
      name: 'Planifier première consultation',
      type: 'schedule',
      action: {
        function: 'scheduleIntakeMeeting',
        params: { duration: 60, location: 'cabinet' },
      },
      nextSteps: ['step7_email'],
    },
    {
      id: 'step6_tasks',
      name: 'Générer tâches ouverture',
      type: 'task',
      action: {
        function: 'generateCaseOpeningTasks',
        params: { tasks: ['check-conflicts', 'collect-docs', 'create-budget'] },
      },
      nextSteps: ['step7_email'],
    },
    {
      id: 'step7_email',
      name: 'Email bienvenue client',
      type: 'email',
      action: {
        function: 'sendWelcomeEmail',
        params: { includeIntakeForm: true, attachContract: true },
      },
      nextSteps: [],
    },
  ],
  status: 'active',
};

/**
 * WORKFLOW 4: Question Juridique → Recherche IA → Brouillon → Révision
 */
export const WORKFLOW_LEGAL_QUESTION_RESPONSE: Workflow = {
  id: 'legal-question-workflow',
  name: 'Réponse Question Juridique',
  description: 'Question reçue → Recherche IA → Brouillon réponse → Révision avocat → Envoi',
  trigger: {
    type: 'email',
    condition: { category: 'legal-question' },
  },
  steps: [
    {
      id: 'step1_categorize',
      name: 'Catégoriser question juridique',
      type: 'analysis',
      action: {
        function: 'categorizeLegalQuestion',
        params: { legalAreas: true, complexity: true },
      },
      nextSteps: ['step2_research'],
    },
    {
      id: 'step2_research',
      name: 'Recherche IA jurisprudence',
      type: 'analysis',
      action: {
        function: 'searchLegalDatabase',
        params: { sources: ['legifrance', 'jurisprudence', 'doctrine'] },
      },
      nextSteps: ['step3_draft'],
    },
    {
      id: 'step3_draft',
      name: 'Générer brouillon réponse IA',
      type: 'analysis',
      action: {
        function: 'generateLegalResponse',
        params: { includeCitations: true, tone: 'professional' },
      },
      nextSteps: ['step4_notification'],
    },
    {
      id: 'step4_notification',
      name: 'Notification révision requise',
      type: 'notification',
      action: {
        function: 'createReviewNotification',
        params: { assignTo: 'senior-lawyer' },
      },
      nextSteps: ['step5_form'],
    },
    {
      id: 'step5_form',
      name: 'Formulaire révision',
      type: 'form',
      action: {
        function: 'generateReviewForm',
        params: { showDraft: true, allowEdit: true },
      },
      nextSteps: ['step6_decision'],
    },
    {
      id: 'step6_decision',
      name: 'Décision: Approuver ou Modifier',
      type: 'decision',
      action: {
        function: 'reviewDecision',
        params: { options: ['approve', 'modify', 'reject'] },
      },
      nextSteps: ['step7_email'],
    },
    {
      id: 'step7_email',
      name: 'Envoyer réponse finale',
      type: 'email',
      action: {
        function: 'sendLegalResponse',
        params: { logInDossier: true },
      },
      nextSteps: [],
    },
  ],
  status: 'active',
};

/**
 * WORKFLOW 5: Délai Approche → Impact → Mise à Jour → Notifications
 */
export const WORKFLOW_DEADLINE_MANAGEMENT: Workflow = {
  id: 'deadline-management-workflow',
  name: 'Gestion Délais Critiques',
  description: 'Email délai → Évaluation impact → Mise à jour planning → Notifications multiples',
  trigger: {
    type: 'email',
    condition: { category: 'deadline-reminder' },
  },
  steps: [
    {
      id: 'step1_extract',
      name: 'Extraire informations délai',
      type: 'analysis',
      action: {
        function: 'extractDeadlineInfo',
        params: { parseNaturalLanguage: true },
      },
      nextSteps: ['step2_impact'],
    },
    {
      id: 'step2_impact',
      name: 'Évaluer impact délai',
      type: 'analysis',
      action: {
        function: 'assessDeadlineImpact',
        params: { checkConflicts: true, calculateRisk: true },
      },
      nextSteps: ['step3_notification'],
    },
    {
      id: 'step3_notification',
      name: 'Alerte urgence délai',
      type: 'notification',
      action: {
        function: 'createDeadlineAlert',
        params: { severity: 'critical', soundAlert: true },
      },
      nextSteps: ['step4_form'],
    },
    {
      id: 'step4_form',
      name: 'Formulaire gestion délai',
      type: 'form',
      action: {
        function: 'generateDeadlineForm',
        params: {
          fields: ['action-plan', 'responsible', 'milestones', 'contingency'],
        },
      },
      nextSteps: ['step5_schedule', 'step6_tasks'],
    },
    {
      id: 'step5_schedule',
      name: 'Mettre à jour calendrier',
      type: 'schedule',
      action: {
        function: 'updateDeadlineCalendar',
        params: { addMilestones: true, createCountdown: true },
      },
      nextSteps: ['step7_emails'],
    },
    {
      id: 'step6_tasks',
      name: 'Créer tâches préparation',
      type: 'task',
      action: {
        function: 'generatePreparationTasks',
        params: { backwardPlanning: true },
      },
      nextSteps: ['step7_emails'],
    },
    {
      id: 'step7_emails',
      name: 'Notifier toutes parties',
      type: 'email',
      action: {
        function: 'sendDeadlineNotifications',
        params: {
          recipients: ['client', 'team', 'opposing-counsel'],
          includeAction: true,
        },
      },
      nextSteps: [],
    },
  ],
  status: 'active',
};

/**
 * WORKFLOW 6: Document Tribunal → OCR → Analyse → Action Urgente
 */
export const WORKFLOW_COURT_DOCUMENT: Workflow = {
  id: 'court-document-workflow',
  name: 'Traitement Document Tribunal',
  description: 'Document reçu → OCR + IA → Extraction dates → Action urgente → Préparation réponse',
  trigger: {
    type: 'email',
    condition: { category: 'court-document', hasAttachment: true },
  },
  steps: [
    {
      id: 'step1_ocr',
      name: 'OCR + Extraction IA',
      type: 'analysis',
      action: {
        function: 'extractCourtDocumentData',
        params: { ocr: true, findDates: true, findParties: true },
      },
      nextSteps: ['step2_analysis'],
    },
    {
      id: 'step2_analysis',
      name: 'Analyser implications juridiques',
      type: 'analysis',
      action: {
        function: 'analyzeCourtDocument',
        params: { identifyObligations: true, calculateDeadlines: true },
      },
      nextSteps: ['step3_notification'],
    },
    {
      id: 'step3_notification',
      name: 'Alerte document tribunal',
      type: 'notification',
      action: {
        function: 'createCourtDocAlert',
        params: { severity: 'critical', vibrate: true },
      },
      nextSteps: ['step4_form'],
    },
    {
      id: 'step4_form',
      name: 'Formulaire plan d\'action',
      type: 'form',
      action: {
        function: 'generateCourtResponseForm',
        params: { suggestStrategy: true },
      },
      nextSteps: ['step5_schedule', 'step6_tasks'],
    },
    {
      id: 'step5_schedule',
      name: 'Bloquer dates audiences',
      type: 'schedule',
      action: {
        function: 'blockCourtDates',
        params: { includePrep: true, travelTime: true },
      },
      nextSteps: ['step7_email'],
    },
    {
      id: 'step6_tasks',
      name: 'Créer checklist préparation',
      type: 'task',
      action: {
        function: 'generateCourtPrepTasks',
        params: { includeResearch: true, includeDrafting: true },
      },
      nextSteps: ['step7_email'],
    },
    {
      id: 'step7_email',
      name: 'Accusé réception + Prochaines étapes',
      type: 'email',
      action: {
        function: 'sendCourtDocConfirmation',
        params: { toClient: true, toTeam: true },
      },
      nextSteps: [],
    },
  ],
  status: 'active',
};

/**
 * Exécute un workflow complet
 */
export async function executeWorkflow(
  workflow: Workflow,
  context: any
): Promise<{ success: boolean; results: any[] }> {
  const results = [];
  let currentSteps = [workflow.steps[0]];
  
  try {
    while (currentSteps.length > 0) {
      const nextSteps = [];
      
      for (const step of currentSteps) {
        console.log(`Exécution step: ${step.name}`);
        
        const result = await executeWorkflowStep(step, context);
        results.push({ step: step.id, result });
        
        // Ajouter les prochaines étapes
        for (const nextStepId of step.nextSteps) {
          const nextStep = workflow.steps.find(s => s.id === nextStepId);
          if (nextStep) nextSteps.push(nextStep);
        }
      }
      
      currentSteps = nextSteps;
    }
    
    return { success: true, results };
  } catch (error) {
    console.error('Erreur workflow:', error);
    return { success: false, results };
  }
}

async function executeWorkflowStep(step: WorkflowStep, context: any): Promise<any> {
  // Simuler l'exécution de l'étape
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    stepId: step.id,
    status: 'completed',
    timestamp: new Date(),
    context,
  };
}

/**
 * Liste de tous les workflows disponibles
 */
export const ALL_WORKFLOWS = [
  WORKFLOW_URGENT_EMAIL,
  WORKFLOW_INVOICE_PROCESSING,
  WORKFLOW_NEW_CASE_INTAKE,
  WORKFLOW_LEGAL_QUESTION_RESPONSE,
  WORKFLOW_DEADLINE_MANAGEMENT,
  WORKFLOW_COURT_DOCUMENT,
];
