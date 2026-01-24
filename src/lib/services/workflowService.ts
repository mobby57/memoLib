"use client"

/**
 * Service d'automatisation des workflows
 * Permet de creer des regles metier automatisees
 */

import { safeLocalStorage } from '@/lib/localStorage'
import { logger } from '@/lib/logger'

export type TriggerType =
  | 'dossier_created'
  | 'dossier_status_changed'
  | 'facture_created'
  | 'facture_overdue'
  | 'echeance_approaching'
  | 'document_uploaded'
  | 'client_created'
  | 'scheduled' // Planifie (cron-like)

export type ActionType =
  | 'send_email'
  | 'create_task'
  | 'update_status'
  | 'assign_to_user'
  | 'generate_document'
  | 'create_notification'
  | 'webhook'
  | 'run_script'

export interface WorkflowCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
}

export interface WorkflowAction {
  type: ActionType
  params: Record<string, any>
  delay?: number // Delai en minutes avant l'execution
}

export interface Workflow {
  id: string
  name: string
  description: string
  enabled: boolean
  trigger: {
    type: TriggerType
    conditions: WorkflowCondition[]
  }
  actions: WorkflowAction[]
  createdAt: Date
  updatedAt: Date
  lastExecuted?: Date
  executionCount: number
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  triggeredAt: Date
  completedAt?: Date
  status: 'pending' | 'running' | 'completed' | 'failed'
  error?: string
  context: Record<string, any>
  results: Array<{
    action: WorkflowAction
    status: 'success' | 'error'
    result?: any
    error?: string
  }>
}

/**
 * Workflows predefinis
 */
export const DEFAULT_WORKFLOWS: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'lastExecuted'>[] = [
  {
    name: 'Relance facture impayee',
    description: 'Envoie automatiquement un email de relance 7 jours apres l\'echeance d\'une facture',
    enabled: true,
    trigger: {
      type: 'facture_overdue',
      conditions: [
        { field: 'daysOverdue', operator: 'equals', value: 7 }
      ]
    },
    actions: [
      {
        type: 'send_email',
        params: {
          template: 'facture_relance',
          to: '{{client.email}}',
          subject: 'Relance facture {{facture.numero}}',
        }
      },
      {
        type: 'create_task',
        params: {
          title: 'Suivre relance facture {{facture.numero}}',
          assignedTo: '{{facture.responsable}}',
          dueDate: '+3 days',
        }
      }
    ]
  },
  {
    name: 'Notification echeance proche',
    description: 'Cree une alerte 3 jours avant une echeance importante',
    enabled: true,
    trigger: {
      type: 'echeance_approaching',
      conditions: [
        { field: 'daysRemaining', operator: 'equals', value: 3 },
        { field: 'urgency', operator: 'in', value: ['ELEVE', 'CRITIQUE'] }
      ]
    },
    actions: [
      {
        type: 'create_notification',
        params: {
          type: 'warning',
          title: 'echeance dans 3 jours',
          message: '{{dossier.titre}} - {{echeance.description}}',
          recipients: ['{{dossier.responsable}}']
        }
      },
      {
        type: 'send_email',
        params: {
          template: 'echeance_reminder',
          to: '{{dossier.responsable}}',
        }
      }
    ]
  },
  {
    name: 'Nouveau dossier - Attribution automatique',
    description: 'Assigne automatiquement un nouveau dossier selon le type',
    enabled: true,
    trigger: {
      type: 'dossier_created',
      conditions: []
    },
    actions: [
      {
        type: 'assign_to_user',
        params: {
          strategy: 'least_busy', // ou 'round_robin', 'by_specialty'
        }
      },
      {
        type: 'create_task',
        params: {
          title: 'Preparer dossier {{dossier.titre}}',
          description: 'Verifier les pieces, creer le planning',
          dueDate: '+2 days',
        }
      },
      {
        type: 'send_email',
        params: {
          template: 'dossier_assigned',
          to: '{{assignee.email}}',
        }
      }
    ]
  },
  {
    name: 'Document uploade - Extraction automatique',
    description: 'Extrait les metadonnees et lance l\'OCR sur les documents uploades',
    enabled: false,
    trigger: {
      type: 'document_uploaded',
      conditions: [
        { field: 'mimeType', operator: 'in', value: ['application/pdf', 'image/jpeg', 'image/png'] }
      ]
    },
    actions: [
      {
        type: 'run_script',
        params: {
          script: 'extract_metadata',
          args: { documentId: '{{document.id}}' }
        }
      },
      {
        type: 'create_notification',
        params: {
          type: 'info',
          title: 'Document traite',
          message: 'Le document {{document.name}} a ete analyse',
        }
      }
    ]
  },
  {
    name: 'Rapport hebdomadaire automatique',
    description: 'Genere et envoie un rapport d\'activite chaque lundi a 9h',
    enabled: true,
    trigger: {
      type: 'scheduled',
      conditions: [
        { field: 'cron', operator: 'equals', value: '0 9 * * 1' } // Lundi 9h
      ]
    },
    actions: [
      {
        type: 'generate_document',
        params: {
          template: 'rapport_hebdomadaire',
          format: 'pdf',
        }
      },
      {
        type: 'send_email',
        params: {
          template: 'weekly_report',
          to: 'direction@cabinet.fr',
          attachments: ['{{generated_document}}']
        }
      }
    ]
  }
]

/**
 * Recupere tous les workflows
 */
export function getWorkflows(): Workflow[] {
  const workflowsJson = safeLocalStorage.getItem('workflows')
  if (!workflowsJson) {
    // Initialiser avec les workflows par defaut
    const workflows: Workflow[] = DEFAULT_WORKFLOWS.map((w, i) => ({
      ...w,
      id: `workflow_${i + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
    }))
    safeLocalStorage.setItem('workflows', JSON.stringify(workflows))
    return workflows
  }

  const workflows = JSON.parse(workflowsJson)
  return workflows.map((w: any) => ({
    ...w,
    createdAt: new Date(w.createdAt),
    updatedAt: new Date(w.updatedAt),
    lastExecuted: w.lastExecuted ? new Date(w.lastExecuted) : undefined,
  }))
}

/**
 * Sauvegarde un workflow
 */
export function saveWorkflow(workflow: Partial<Workflow>): Workflow {
  const workflows = getWorkflows()
  
  if (workflow.id) {
    // Mise a jour
    const index = workflows.findIndex(w => w.id === workflow.id)
    if (index !== -1) {
      workflows[index] = {
        ...workflows[index],
        ...workflow,
        updatedAt: new Date(),
      } as Workflow
      safeLocalStorage.setItem('workflows', JSON.stringify(workflows))
      return workflows[index]
    }
  }

  // Creation
  const newWorkflow: Workflow = {
    id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: workflow.name || 'Nouveau workflow',
    description: workflow.description || '',
    enabled: workflow.enabled ?? true,
    trigger: workflow.trigger || { type: 'dossier_created', conditions: [] },
    actions: workflow.actions || [],
    createdAt: new Date(),
    updatedAt: new Date(),
    executionCount: 0,
  }

  workflows.push(newWorkflow)
  safeLocalStorage.setItem('workflows', JSON.stringify(workflows))
  return newWorkflow
}

/**
 * Supprime un workflow
 */
export function deleteWorkflow(workflowId: string): void {
  const workflows = getWorkflows()
  const filtered = workflows.filter(w => w.id !== workflowId)
  safeLocalStorage.setItem('workflows', JSON.stringify(filtered))
}

/**
 * Active/desactive un workflow
 */
export function toggleWorkflow(workflowId: string): void {
  const workflows = getWorkflows()
  const workflow = workflows.find(w => w.id === workflowId)
  if (workflow) {
    workflow.enabled = !workflow.enabled
    workflow.updatedAt = new Date()
    safeLocalStorage.setItem('workflows', JSON.stringify(workflows))
  }
}

/**
 * Execute un workflow manuellement
 */
export async function executeWorkflow(
  workflowId: string,
  context: Record<string, any>
): Promise<WorkflowExecution> {
  const workflows = getWorkflows()
  const workflow = workflows.find(w => w.id === workflowId)

  if (!workflow) {
    throw new Error('Workflow introuvable')
  }

  const execution: WorkflowExecution = {
    id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    workflowId,
    triggeredAt: new Date(),
    status: 'running',
    context,
    results: [],
  }

  logger.info('Debut execution workflow', { workflowId: workflow.id, workflowName: workflow.name, context })

  try {
    for (const action of workflow.actions) {
      logger.debug('Execution action workflow', { actionType: action.type, params: action.params })

      // Delai si specifie
      if (action.delay && action.delay > 0) {
        const delayMs = action.delay * 60 * 1000
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }

      // Executer l'action (simulation)
      const result = await executeAction(action, context)
      
      execution.results.push({
        action,
        status: 'success',
        result,
      })

      logger.debug('Action workflow reussie', { actionType: action.type, result })
    }

    execution.status = 'completed'
    execution.completedAt = new Date()

    // Mettre a jour les stats du workflow
    workflow.executionCount++
    workflow.lastExecuted = new Date()
    safeLocalStorage.setItem('workflows', JSON.stringify(workflows))

    logger.info('Workflow termine avec succes', { workflowName: workflow.name, resultsCount: execution.results.length })
  } catch (error: any) {
    execution.status = 'failed'
    execution.error = error.message
    execution.completedAt = new Date()
    logger.error('Erreur lors de l\'execution du workflow', error, { workflowName: workflow.name })
  }

  // Sauvegarder l'execution
  const executions = getWorkflowExecutions()
  executions.push(execution)
  safeLocalStorage.setItem('workflow_executions', JSON.stringify(executions))

  return execution
}

/**
 * Execute une action specifique
 */
async function executeAction(
  action: WorkflowAction,
  context: Record<string, any>
): Promise<any> {
  // Remplacer les variables dans les params
  const params = replaceVariables(action.params, context)

  switch (action.type) {
    case 'send_email':
      return simulateEmailSend(params)
    
    case 'create_task':
      return simulateTaskCreation(params)
    
    case 'update_status':
      return simulateStatusUpdate(params)
    
    case 'create_notification':
      return simulateNotificationCreation(params)
    
    case 'generate_document':
      return simulateDocumentGeneration(params)
    
    case 'assign_to_user':
      return simulateUserAssignment(params)
    
    case 'webhook':
      return simulateWebhook(params)
    
    case 'run_script':
      return simulateScriptExecution(params)
    
    default:
      throw new Error(`Type d'action inconnu: ${action.type}`)
  }
}

/**
 * Remplace les variables {{var}} dans un objet
 */
function replaceVariables(obj: any, context: Record<string, any>): any {
  if (typeof obj === 'string') {
    return obj.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = getNestedValue(context, path.trim())
      return value !== undefined ? value : match
    })
  }

  if (Array.isArray(obj)) {
    return obj.map(item => replaceVariables(item, context))
  }

  if (typeof obj === 'object' && obj !== null) {
    const result: any = {}
    for (const key in obj) {
      result[key] = replaceVariables(obj[key], context)
    }
    return result
  }

  return obj
}

/**
 * Recupere une valeur imbriquee (ex: "client.email")
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Recupere les executions de workflows
 */
export function getWorkflowExecutions(workflowId?: string): WorkflowExecution[] {
  const execJson = safeLocalStorage.getItem('workflow_executions')
  if (!execJson) return []

  let executions = JSON.parse(execJson)
  executions = executions.map((e: any) => ({
    ...e,
    triggeredAt: new Date(e.triggeredAt),
    completedAt: e.completedAt ? new Date(e.completedAt) : undefined,
  }))

  if (workflowId) {
    executions = executions.filter((e: WorkflowExecution) => e.workflowId === workflowId)
  }

  return executions.sort((a: WorkflowExecution, b: WorkflowExecution) => 
    b.triggeredAt.getTime() - a.triggeredAt.getTime()
  )
}

// Fonctions de simulation
function simulateEmailSend(params: any) {
  return { sent: true, to: params.to, subject: params.subject }
}

function simulateTaskCreation(params: any) {
  return { taskId: `task_${Date.now()}`, title: params.title }
}

function simulateStatusUpdate(params: any) {
  return { updated: true, newStatus: params.status }
}

function simulateNotificationCreation(params: any) {
  return { notificationId: `notif_${Date.now()}`, title: params.title }
}

function simulateDocumentGeneration(params: any) {
  return { documentId: `doc_${Date.now()}`, template: params.template }
}

function simulateUserAssignment(params: any) {
  return { assigned: true, userId: `user_${Math.floor(Math.random() * 5) + 1}` }
}

function simulateWebhook(params: any) {
  return { webhookCalled: true, url: params.url }
}

function simulateScriptExecution(params: any) {
  return { executed: true, script: params.script }
}
