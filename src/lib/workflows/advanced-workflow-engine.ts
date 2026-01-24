/**
 * [emoji] MOTEUR DE WORKFLOW CONDITIONNEL AVANCe
 * 
 * Systeme complet de workflows avec declenchements en cascade :
 * - Event [Next] Trigger [Next] Conditions [Next] Actions [Next] Cascade
 * - Validation IA avec niveaux d'autonomie
 * - Tracabilite complete (audit log)
 * - Gestion d'erreurs et rollback
 * - Workflows paralleles et sequentiels
 * 
 * @version 2.0.0
 * @author IA Poste Manager
 */

import { prisma } from '@/lib/prisma';
import { logger, logDossierAction, logIAUsage } from '@/lib/logger';
import { ollama } from '../../../lib/ai/ollama-client';
import { AutonomyLevel, ValidationLevel, AIActionType } from '@/types';

// ============================================
// TYPES & INTERFACES
// ============================================

export type WorkflowEventType =
  // Workspace & Client
  | 'workspace:created'
  | 'workspace:updated'
  | 'workspace:archived'
  | 'client:created'
  | 'client:updated'
  | 'client:status_changed'
  
  // Emails & Messages
  | 'email:received'
  | 'email:classified'
  | 'email:urgent'
  | 'message:created'
  | 'message:sent'
  
  // Procedures & Dossiers
  | 'procedure:created'
  | 'procedure:updated'
  | 'procedure:status_changed'
  | 'procedure:closed'
  | 'dossier:created'
  | 'dossier:updated'
  
  // Documents
  | 'document:uploaded'
  | 'document:verified'
  | 'document:missing'
  | 'document:expired'
  
  // echeances & Alertes
  | 'deadline:created'
  | 'deadline:approaching'
  | 'deadline:critical'
  | 'deadline:missed'
  | 'alert:created'
  | 'alert:critical'
  
  // Factures & Paiements
  | 'facture:created'
  | 'facture:sent'
  | 'facture:paid'
  | 'facture:overdue'
  
  // IA & Validation
  | 'ai:suggestion'
  | 'ai:analysis_complete'
  | 'ai:validation_required'
  | 'validation:approved'
  | 'validation:rejected'
  
  // Systeme
  | 'system:scheduled'
  | 'system:error'
  | 'system:maintenance';

export type WorkflowActionType =
  // Communication
  | 'send_email'
  | 'send_notification'
  | 'send_sms'
  | 'create_message'
  
  // Creation d'entites
  | 'create_workspace'
  | 'create_procedure'
  | 'create_task'
  | 'create_alert'
  | 'create_deadline'
  | 'create_note'
  
  // Mise a jour
  | 'update_status'
  | 'update_priority'
  | 'assign_user'
  | 'add_tag'
  | 'set_property'
  
  // Documents & IA
  | 'generate_document'
  | 'analyze_with_ai'
  | 'extract_data'
  | 'classify_content'
  
  // Workflow & Cascade
  | 'trigger_workflow'
  | 'wait'
  | 'branch'
  | 'loop'
  
  // Validation
  | 'request_validation'
  | 'auto_approve'
  
  // Integrations
  | 'webhook_call'
  | 'api_call'
  | 'run_script'
  
  // Systeme
  | 'log_event'
  | 'audit_trail'
  | 'rollback';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'in'
  | 'not_in'
  | 'matches_regex'
  | 'is_empty'
  | 'is_not_empty'
  | 'exists'
  | 'not_exists';

export type WorkflowExecutionMode = 'sequential' | 'parallel' | 'conditional';

export interface WorkflowEvent {
  id: string;
  type: WorkflowEventType;
  timestamp: Date;
  tenantId: string;
  userId?: string;
  
  // Payload de l'evenement
  payload: Record<string, any>;
  
  // Source
  source: {
    type: 'user' | 'system' | 'ai' | 'external';
    id?: string;
  };
  
  // Contexte
  context?: {
    workspaceId?: string;
    procedureId?: string;
    clientId?: string;
    dossierId?: string;
  };
}

export interface WorkflowCondition {
  id: string;
  field: string; // Chemin dans le payload (ex: "payload.priority")
  operator: ConditionOperator;
  value: any;
  
  // Conditions imbriquees (AND/OR)
  logicalOperator?: 'AND' | 'OR';
  nested?: WorkflowCondition[];
}

export interface WorkflowAction {
  id: string;
  type: WorkflowActionType;
  name: string;
  description?: string;
  
  // Parametres de l'action
  params: Record<string, any>;
  
  // Variables dynamiques (template)
  template?: Record<string, string>;
  
  // Delai avant execution
  delay?: number; // millisecondes
  
  // Timeout
  timeout?: number; // millisecondes
  
  // Retry policy
  retry?: {
    maxAttempts: number;
    backoff: 'linear' | 'exponential';
    delay: number;
  };
  
  // Validation IA
  aiValidation?: {
    required: boolean;
    autonomyLevel: AutonomyLevel;
    validationLevel: ValidationLevel;
    confidence?: number;
  };
  
  // Actions en cascade
  onSuccess?: WorkflowAction[];
  onFailure?: WorkflowAction[];
  onTimeout?: WorkflowAction[];
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number; // Plus eleve = plus prioritaire
  
  // Trigger
  trigger: {
    events: WorkflowEventType[];
    conditions?: WorkflowCondition[];
  };
  
  // Actions
  actions: WorkflowAction[];
  executionMode: WorkflowExecutionMode;
  
  // Limites
  limits?: {
    maxExecutionsPerDay?: number;
    maxExecutionsPerHour?: number;
    cooldownMinutes?: number;
  };
  
  // Metadonnees
  tenantId?: string; // null = global
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
  executionCount: number;
  successCount: number;
  failureCount: number;
}

export interface WorkflowExecution {
  id: string;
  ruleId: string;
  event: WorkflowEvent;
  
  // etat
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // millisecondes
  
  // Resultats
  results: WorkflowActionResult[];
  
  // Erreurs
  error?: {
    message: string;
    stack?: string;
    action?: string;
  };
  
  // Contexte
  context: Record<string, any>;
  
  // Cascade
  triggeredWorkflows: string[]; // IDs des workflows declenches
}

export interface WorkflowActionResult {
  actionId: string;
  actionType: WorkflowActionType;
  status: 'success' | 'failed' | 'skipped' | 'timeout';
  startedAt: Date;
  completedAt: Date;
  duration: number;
  result?: any;
  error?: string;
  
  // Cascade
  triggeredActions?: string[];
}

// ============================================
// MOTEUR DE WORKFLOW
// ============================================

export class AdvancedWorkflowEngine {
  private rules: Map<string, WorkflowRule> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  
  constructor() {
    this.loadRules();
  }
  
  // ============================================
  // GESTION DES ReGLES
  // ============================================
  
  /**
   * Charge les regles de workflow depuis la base
   */
  private async loadRules(): Promise<void> {
    // TODO: Charger depuis DB/Redis
    logger.info('Chargement des regles de workflow');
    
    // Pour l'instant, charger les regles pre-definies
    this.registerDefaultRules();
  }
  
  /**
   * Enregistre une nouvelle regle
   */
  public registerRule(rule: WorkflowRule): void {
    this.rules.set(rule.id, rule);
    logger.info(`Regle workflow enregistree: ${rule.name}`, { ruleId: rule.id });
  }
  
  /**
   * Active/desactive une regle
   */
  public toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      logger.info(`Regle ${enabled ? 'activee' : 'desactivee'}: ${rule.name}`);
    }
  }
  
  /**
   * Supprime une regle
   */
  public deleteRule(ruleId: string): void {
    this.rules.delete(ruleId);
    logger.info(`Regle supprimee: ${ruleId}`);
  }
  
  // ============================================
  // TRAITEMENT DES eVeNEMENTS
  // ============================================
  
  /**
   * Point d'entree principal : traite un evenement
   */
  public async processEvent(event: WorkflowEvent): Promise<WorkflowExecution[]> {
    logger.info(`[emoji] evenement recu: ${event.type}`, { 
      eventId: event.id, 
      tenantId: event.tenantId 
    });
    
    // Trouver les regles correspondantes
    const matchingRules = this.findMatchingRules(event);
    
    if (matchingRules.length === 0) {
      logger.debug(`Aucune regle ne correspond a l'evenement ${event.type}`);
      return [];
    }
    
    logger.info(` ${matchingRules.length} regle(s) correspondent`, {
      rules: matchingRules.map(r => r.name)
    });
    
    // Executer les workflows
    const executions: WorkflowExecution[] = [];
    
    for (const rule of matchingRules) {
      try {
        const execution = await this.executeWorkflow(rule, event);
        executions.push(execution);
      } catch (error) {
        logger.error(`Erreur execution workflow ${rule.name}`, error);
      }
    }
    
    return executions;
  }
  
  /**
   * Trouve les regles correspondant a un evenement
   */
  private findMatchingRules(event: WorkflowEvent): WorkflowRule[] {
    const matching: WorkflowRule[] = [];
    
    for (const rule of this.rules.values()) {
      // Verifier si active
      if (!rule.enabled) continue;
      
      // Verifier tenant
      if (rule.tenantId && rule.tenantId !== event.tenantId) continue;
      
      // Verifier type d'evenement
      if (!rule.trigger.events.includes(event.type)) continue;
      
      // Verifier limites d'execution
      if (!this.checkExecutionLimits(rule)) continue;
      
      // Verifier conditions
      if (rule.trigger.conditions) {
        if (!this.evaluateConditions(rule.trigger.conditions, event)) {
          continue;
        }
      }
      
      matching.push(rule);
    }
    
    // Trier par priorite (desc)
    return matching.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * evalue les conditions d'une regle
   */
  private evaluateConditions(
    conditions: WorkflowCondition[],
    event: WorkflowEvent
  ): boolean {
    for (const condition of conditions) {
      const result = this.evaluateCondition(condition, event);
      
      // Si nested conditions
      if (condition.nested && condition.nested.length > 0) {
        const nestedResult = this.evaluateConditions(condition.nested, event);
        
        if (condition.logicalOperator === 'AND') {
          if (!result || !nestedResult) return false;
        } else if (condition.logicalOperator === 'OR') {
          if (!result && !nestedResult) return false;
        }
      } else {
        if (!result) return false;
      }
    }
    
    return true;
  }
  
  /**
   * evalue une condition individuelle
   */
  private evaluateCondition(
    condition: WorkflowCondition,
    event: WorkflowEvent
  ): boolean {
    // Recuperer la valeur du champ
    const actualValue = this.getFieldValue(condition.field, event);
    const expectedValue = condition.value;
    
    // evaluer selon l'operateur
    switch (condition.operator) {
      case 'equals':
        return actualValue === expectedValue;
      
      case 'not_equals':
        return actualValue !== expectedValue;
      
      case 'contains':
        return typeof actualValue === 'string' && actualValue.includes(expectedValue);
      
      case 'not_contains':
        return typeof actualValue === 'string' && !actualValue.includes(expectedValue);
      
      case 'greater_than':
        return Number(actualValue) > Number(expectedValue);
      
      case 'less_than':
        return Number(actualValue) < Number(expectedValue);
      
      case 'greater_or_equal':
        return Number(actualValue) >= Number(expectedValue);
      
      case 'less_or_equal':
        return Number(actualValue) <= Number(expectedValue);
      
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
      
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(actualValue);
      
      case 'matches_regex':
        return new RegExp(expectedValue).test(String(actualValue));
      
      case 'is_empty':
        return !actualValue || actualValue === '' || (Array.isArray(actualValue) && actualValue.length === 0);
      
      case 'is_not_empty':
        return !!actualValue && actualValue !== '' && (!Array.isArray(actualValue) || actualValue.length > 0);
      
      case 'exists':
        return actualValue !== undefined && actualValue !== null;
      
      case 'not_exists':
        return actualValue === undefined || actualValue === null;
      
      default:
        logger.warn(`Operateur non supporte: ${condition.operator}`);
        return false;
    }
  }
  
  /**
   * Recupere la valeur d'un champ depuis l'evenement
   */
  private getFieldValue(fieldPath: string, event: WorkflowEvent): any {
    const parts = fieldPath.split('.');
    let value: any = event;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
  
  /**
   * Verifie les limites d'execution
   */
  private checkExecutionLimits(rule: WorkflowRule): boolean {
    if (!rule.limits) return true;
    
    // TODO: Implementer verification limites depuis Redis/DB
    // - maxExecutionsPerDay
    // - maxExecutionsPerHour
    // - cooldownMinutes
    
    return true;
  }
  
  // ============================================
  // EXeCUTION DE WORKFLOW
  // ============================================
  
  /**
   * Execute un workflow complet
   */
  private async executeWorkflow(
    rule: WorkflowRule,
    event: WorkflowEvent
  ): Promise<WorkflowExecution> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: WorkflowExecution = {
      id: executionId,
      ruleId: rule.id,
      event,
      status: 'running',
      startedAt: new Date(),
      results: [],
      context: {},
      triggeredWorkflows: [],
    };
    
    this.executions.set(executionId, execution);
    
    logger.info(`️  Execution workflow: ${rule.name}`, { executionId });
    
    try {
      // Executer les actions
      if (rule.executionMode === 'sequential') {
        await this.executeActionsSequential(rule.actions, execution);
      } else if (rule.executionMode === 'parallel') {
        await this.executeActionsParallel(rule.actions, execution);
      } else {
        await this.executeActionsConditional(rule.actions, execution);
      }
      
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      
      // Mettre a jour stats regle
      rule.lastExecuted = new Date();
      rule.executionCount++;
      rule.successCount++;
      
      logger.info(` Workflow complete: ${rule.name}`, {
        executionId,
        duration: `${execution.duration}ms`,
        actionsCount: execution.results.length,
      });
      
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.error = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
      
      rule.failureCount++;
      
      logger.error(` Workflow echoue: ${rule.name}`, error, { executionId });
    }
    
    // Audit log
    await this.logExecution(execution);
    
    return execution;
  }
  
  /**
   * Execute les actions en sequentiel
   */
  private async executeActionsSequential(
    actions: WorkflowAction[],
    execution: WorkflowExecution
  ): Promise<void> {
    for (const action of actions) {
      const result = await this.executeAction(action, execution);
      execution.results.push(result);
      
      // Si echec et pas de onFailure, arreter
      if (result.status === 'failed' && !action.onFailure) {
        throw new Error(`Action ${action.name} a echoue`);
      }
      
      // Executer cascade onSuccess
      if (result.status === 'success' && action.onSuccess) {
        await this.executeActionsSequential(action.onSuccess, execution);
      }
      
      // Executer cascade onFailure
      if (result.status === 'failed' && action.onFailure) {
        await this.executeActionsSequential(action.onFailure, execution);
      }
    }
  }
  
  /**
   * Execute les actions en parallele
   */
  private async executeActionsParallel(
    actions: WorkflowAction[],
    execution: WorkflowExecution
  ): Promise<void> {
    const promises = actions.map(action => this.executeAction(action, execution));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        execution.results.push(result.value);
      } else {
        execution.results.push({
          actionId: actions[index].id,
          actionType: actions[index].type,
          status: 'failed',
          startedAt: new Date(),
          completedAt: new Date(),
          duration: 0,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    });
  }
  
  /**
   * Execute les actions conditionnellement
   */
  private async executeActionsConditional(
    actions: WorkflowAction[],
    execution: WorkflowExecution
  ): Promise<void> {
    // Pour l'instant, identique au sequentiel
    // TODO: Implementer branchement conditionnel
    await this.executeActionsSequential(actions, execution);
  }
  
  /**
   * Execute une action individuelle
   */
  private async executeAction(
    action: WorkflowAction,
    execution: WorkflowExecution
  ): Promise<WorkflowActionResult> {
    const startedAt = new Date();
    
    logger.debug(`[emoji] Execution action: ${action.name} (${action.type})`);
    
    // Delai si specifie
    if (action.delay && action.delay > 0) {
      await this.sleep(action.delay);
    }
    
    // Resoudre les templates
    const resolvedParams = this.resolveTemplates(action.params, execution);
    
    try {
      // Validation IA si requise
      if (action.aiValidation?.required) {
        const approved = await this.requestAIValidation(action, execution);
        if (!approved) {
          return {
            actionId: action.id,
            actionType: action.type,
            status: 'skipped',
            startedAt,
            completedAt: new Date(),
            duration: new Date().getTime() - startedAt.getTime(),
            error: 'Validation IA refusee',
          };
        }
      }
      
      // Executer avec timeout
      const result = await this.executeWithTimeout(
        () => this.executeActionByType(action.type, resolvedParams, execution),
        action.timeout || 30000
      );
      
      const completedAt = new Date();
      
      return {
        actionId: action.id,
        actionType: action.type,
        status: 'success',
        startedAt,
        completedAt,
        duration: completedAt.getTime() - startedAt.getTime(),
        result,
      };
      
    } catch (error) {
      const completedAt = new Date();
      
      logger.error(`Action ${action.name} echouee`, error);
      
      return {
        actionId: action.id,
        actionType: action.type,
        status: 'failed',
        startedAt,
        completedAt,
        duration: completedAt.getTime() - startedAt.getTime(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * Execute une action selon son type
   */
  private async executeActionByType(
    type: WorkflowActionType,
    params: Record<string, any>,
    execution: WorkflowExecution
  ): Promise<any> {
    switch (type) {
      // Communication
      case 'send_email':
        return await this.sendEmail(params);
      
      case 'send_notification':
        return await this.sendNotification(params);
      
      case 'create_message':
        return await this.createMessage(params);
      
      // Creation d'entites
      case 'create_workspace':
        return await this.createWorkspace(params);
      
      case 'create_procedure':
        return await this.createProcedure(params);
      
      case 'create_task':
        return await this.createTask(params);
      
      case 'create_alert':
        return await this.createAlert(params);
      
      case 'create_deadline':
        return await this.createDeadline(params);
      
      // Mise a jour
      case 'update_status':
        return await this.updateStatus(params);
      
      case 'assign_user':
        return await this.assignUser(params);
      
      // IA
      case 'analyze_with_ai':
        return await this.analyzeWithAI(params);
      
      case 'extract_data':
        return await this.extractData(params);
      
      case 'classify_content':
        return await this.classifyContent(params);
      
      // Cascade
      case 'trigger_workflow':
        return await this.triggerCascadeWorkflow(params, execution);
      
      case 'wait':
        return await this.sleep(params.duration || 1000);
      
      // Validation
      case 'request_validation':
        return await this.requestValidation(params);
      
      // Systeme
      case 'log_event':
        logger.info(params.message, params.data);
        return { logged: true };
      
      case 'audit_trail':
        return await this.createAuditLog(params);
      
      default:
        logger.warn(`Type d'action non supporte: ${type}`);
        return { skipped: true, reason: 'Type non supporte' };
    }
  }
  
  // ============================================
  // IMPLeMENTATION DES ACTIONS
  // ============================================
  
  private async sendEmail(params: Record<string, any>): Promise<any> {
    logger.info('[emoji] Envoi email', { to: params.to, subject: params.subject });
    // TODO: Implementer envoi email reel
    return { sent: true, to: params.to };
  }
  
  private async sendNotification(params: Record<string, any>): Promise<any> {
    logger.info('[emoji] Envoi notification', { userId: params.userId, message: params.message });
    // TODO: Implementer via WebSocket
    return { sent: true, userId: params.userId };
  }
  
  private async createMessage(params: Record<string, any>): Promise<any> {
    if (!params.workspaceId || !params.content) {
      throw new Error('workspaceId et content requis');
    }
    
    const message = await prisma.workspaceMessage.create({
      data: {
        workspaceId: params.workspaceId,
        type: params.type || 'internal_note',
        senderId: params.senderId || 'system',
        senderName: params.senderName || 'Systeme',
        senderType: params.senderType || 'system',
        subject: params.subject,
        content: params.content,
        priority: params.priority || 'normal',
        visibility: params.visibility || 'team',
      },
    });
    
    logger.info('[emoji] Message cree', { messageId: message.id, workspaceId: params.workspaceId });
    return message;
  }
  
  private async createWorkspace(params: Record<string, any>): Promise<any> {
    if (!params.clientId || !params.tenantId) {
      throw new Error('clientId et tenantId requis');
    }
    
    const workspace = await prisma.workspace.create({
      data: {
        tenantId: params.tenantId,
        clientId: params.clientId,
        title: params.title || `Espace Client ${params.clientId}`,
        description: params.description,
        status: params.status || 'active',
        createdById: params.createdById || 'system',
      },
    });
    
    logger.info('[emoji] Workspace cree', { workspaceId: workspace.id, clientId: params.clientId });
    return workspace;
  }
  
  private async createProcedure(params: Record<string, any>): Promise<any> {
    if (!params.workspaceId || !params.procedureType) {
      throw new Error('workspaceId et procedureType requis');
    }
    
    const procedure = await prisma.procedure.create({
      data: {
        workspaceId: params.workspaceId,
        procedureType: params.procedureType,
        title: params.title || `Procedure ${params.procedureType}`,
        description: params.description,
        status: params.status || 'active',
        urgencyLevel: params.urgencyLevel || 'moyen',
      },
    });
    
    logger.info('️  Procedure creee', { procedureId: procedure.id, type: params.procedureType });
    return procedure;
  }
  
  private async createTask(params: Record<string, any>): Promise<any> {
    logger.info(' Creation tache', { title: params.title });
    // TODO: Implementer creation tache reelle
    return { created: true, title: params.title };
  }
  
  private async createAlert(params: Record<string, any>): Promise<any> {
    if (!params.workspaceId) {
      throw new Error('workspaceId requis');
    }
    
    const alert = await prisma.workspaceAlert.create({
      data: {
        workspaceId: params.workspaceId,
        alertType: params.alertType || 'deadline_critical',
        level: params.level || 'warning',
        title: params.title || 'Alerte',
        message: params.message || '',
      },
    });
    
    logger.info('️  Alerte creee', { alertId: alert.id, level: params.level });
    return alert;
  }
  
  private async createDeadline(params: Record<string, any>): Promise<any> {
    if (!params.tenantId || !params.dossierId) {
      throw new Error('tenantId et dossierId requis');
    }
    
    const deadline = await prisma.echeance.create({
      data: {
        tenantId: params.tenantId,
        dossierId: params.dossierId,
        type: params.type || 'autre',
        titre: params.titre || 'echeance',
        description: params.description,
        dateEcheance: new Date(params.dateEcheance),
        priorite: params.priorite || 'normale',
        source: params.source || 'system',
        createdBy: params.createdBy || 'system',
      },
    });
    
    logger.info(' echeance creee', { deadlineId: deadline.id, date: params.dateEcheance });
    return deadline;
  }
  
  private async updateStatus(params: Record<string, any>): Promise<any> {
    logger.info('[emoji] Mise a jour statut', { entityType: params.entityType, newStatus: params.status });
    // TODO: Implementer update statut selon entityType
    return { updated: true, status: params.status };
  }
  
  private async assignUser(params: Record<string, any>): Promise<any> {
    logger.info('[emoji] Assignation utilisateur', { userId: params.userId, entityId: params.entityId });
    // TODO: Implementer assignation
    return { assigned: true, userId: params.userId };
  }
  
  private async analyzeWithAI(params: Record<string, any>): Promise<any> {
    const available = await this.ollama.isAvailable();
    if (!available) {
      logger.warn('Ollama non disponible, analyse IA ignoree');
      return { analyzed: false, reason: 'Ollama indisponible' };
    }
    
    const prompt = params.prompt || 'Analyser le contenu suivant';
    const content = params.content || '';
    
    const analysis = await this.ollama.generate(`${prompt}\n\n${content}`);
    
    logger.info('[emoji] Analyse IA effectuee', { length: analysis.length });
    return { analyzed: true, result: analysis };
  }
  
  private async extractData(params: Record<string, any>): Promise<any> {
    logger.info('[emoji] Extraction de donnees', { source: params.source });
    // TODO: Implementer extraction selon le type
    return { extracted: true };
  }
  
  private async classifyContent(params: Record<string, any>): Promise<any> {
    const available = await this.ollama.isAvailable();
    if (!available) {
      return { classified: false, reason: 'Ollama indisponible' };
    }
    
    const prompt = `Classifier le contenu suivant dans une de ces categories : ${params.categories.join(', ')}
    
Contenu :
${params.content}

Reponds uniquement avec la categorie.`;
    
    const category = await this.ollama.generate(prompt);
    
    logger.info('🏷️  Contenu classifie', { category: category.trim() });
    return { classified: true, category: category.trim() };
  }
  
  private async triggerCascadeWorkflow(
    params: Record<string, any>,
    execution: WorkflowExecution
  ): Promise<any> {
    logger.info('[emoji] Declenchement workflow en cascade', { targetWorkflow: params.workflowId });
    
    // Creer un nouvel evenement
    const cascadeEvent: WorkflowEvent = {
      id: `cascade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: params.eventType || 'system:scheduled',
      timestamp: new Date(),
      tenantId: execution.event.tenantId,
      userId: execution.event.userId,
      payload: params.payload || {},
      source: {
        type: 'system',
        id: execution.id,
      },
      context: execution.event.context,
    };
    
    // Traiter l'evenement (recursif)
    const cascadeExecutions = await this.processEvent(cascadeEvent);
    
    // Enregistrer les workflows declenches
    execution.triggeredWorkflows.push(...cascadeExecutions.map(e => e.id));
    
    return { triggered: true, executionIds: cascadeExecutions.map(e => e.id) };
  }
  
  private async requestValidation(params: Record<string, any>): Promise<any> {
    logger.info(' Demande de validation humaine', { entityId: params.entityId });
    // TODO: Creer tache de validation dans la DB
    return { validationRequested: true, pending: true };
  }
  
  private async createAuditLog(params: Record<string, any>): Promise<any> {
    // TODO: Creer entree dans AuditLog
    logger.audit(
      params.action || 'WORKFLOW_ACTION',
      params.userId || 'system',
      params.tenantId || 'global',
      params.details || {}
    );
    return { logged: true };
  }
  
  // ============================================
  // VALIDATION IA
  // ============================================
  
  private async requestAIValidation(
    action: WorkflowAction,
    execution: WorkflowExecution
  ): Promise<boolean> {
    const validation = action.aiValidation;
    if (!validation) return true;
    
    // Si confiance suffisante et niveau GREEN, auto-approuver
    if (validation.autonomyLevel === AutonomyLevel.GREEN && 
        validation.confidence && 
        validation.confidence >= 0.8) {
      logger.info(' Auto-approbation IA (niveau GREEN, confiance haute)');
      return true;
    }
    
    // Si niveau RED, toujours requerir validation humaine
    if (validation.autonomyLevel === AutonomyLevel.RED) {
      logger.warn(' Validation humaine obligatoire (niveau RED)');
      // TODO: Creer demande de validation
      return false;
    }
    
    // Niveau ORANGE : demander analyse IA
    const available = await this.ollama.isAvailable();
    if (!available) {
      logger.warn('Ollama indisponible, action bloquee');
      return false;
    }
    
    const prompt = `Analyser si cette action doit etre approuvee automatiquement :
    
Action : ${action.name}
Type : ${action.type}
Parametres : ${JSON.stringify(action.params, null, 2)}
Contexte : ${JSON.stringify(execution.event.payload, null, 2)}

Reponds par OUI ou NON avec une justification breve.`;
    
    const response = await this.ollama.generate(prompt);
    const approved = response.toLowerCase().includes('oui');
    
    logger.info(`[emoji] Decision IA: ${approved ? 'APPROUVe' : 'REFUSe'}`, { response });
    
    return approved;
  }
  
  // ============================================
  // UTILITAIRES
  // ============================================
  
  private resolveTemplates(
    params: Record<string, any>,
    execution: WorkflowExecution
  ): Record<string, any> {
    const resolved: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.includes('{{')) {
        // Template a resoudre
        resolved[key] = this.resolveTemplate(value, execution);
      } else {
        resolved[key] = value;
      }
    }
    
    return resolved;
  }
  
  private resolveTemplate(template: string, execution: WorkflowExecution): string {
    let result = template;
    
    // Remplacer {{event.xxx}}
    result = result.replace(/\{\{event\.(\w+)\}\}/g, (_, field) => {
      return String(execution.event[field as keyof WorkflowEvent] || '');
    });
    
    // Remplacer {{payload.xxx}}
    result = result.replace(/\{\{payload\.(\w+)\}\}/g, (_, field) => {
      return String(execution.event.payload[field] || '');
    });
    
    // Remplacer {{context.xxx}}
    result = result.replace(/\{\{context\.(\w+)\}\}/g, (_, field) => {
      return String(execution.context[field] || '');
    });
    
    return result;
  }
  
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      ),
    ]);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private async logExecution(execution: WorkflowExecution): Promise<void> {
    // TODO: Persister dans DB
    logger.info('[emoji] Execution enregistree', {
      executionId: execution.id,
      status: execution.status,
      duration: execution.duration,
    });
  }
  
  // ============================================
  // ReGLES PRe-DeFINIES
  // ============================================
  
  private registerDefaultRules(): void {
    // ReGLE 1: Email urgent [Next] Workspace [Next] Procedure [Next] Alert en cascade
    this.registerRule({
      id: 'rule_urgent_email_cascade',
      name: '[emoji] Email Urgent [Next] Cascade Complete',
      description: 'Email urgent declenche creation workspace, procedure et alertes en cascade',
      enabled: true,
      priority: 100,
      trigger: {
        events: ['email:urgent'],
        conditions: [
          {
            id: 'cond1',
            field: 'payload.classification',
            operator: 'in',
            value: ['ceseda', 'urgent', 'client-urgent'],
          },
        ],
      },
      actions: [
        {
          id: 'action1',
          type: 'create_workspace',
          name: 'Creer workspace client',
          params: {
            tenantId: '{{event.tenantId}}',
            clientId: '{{payload.clientId}}',
            title: 'Espace {{payload.clientName}}',
            createdById: '{{event.userId}}',
          },
          onSuccess: [
            {
              id: 'action1_1',
              type: 'create_procedure',
              name: 'Creer procedure OQTF',
              params: {
                workspaceId: '{{context.workspaceId}}',
                procedureType: 'OQTF',
                title: 'OQTF - Recours urgent',
                urgencyLevel: 'critique',
              },
              onSuccess: [
                {
                  id: 'action1_1_1',
                  type: 'create_alert',
                  name: 'Alerte delai critique',
                  params: {
                    workspaceId: '{{context.workspaceId}}',
                    alertType: 'deadline_critical',
                    level: 'critical',
                    title: 'Delai OQTF critique',
                    message: 'Action requise dans les 48h',
                  },
                  onSuccess: [
                    {
                      id: 'action1_1_1_1',
                      type: 'send_notification',
                      name: 'Notifier avocat',
                      params: {
                        userId: '{{event.userId}}',
                        title: '[emoji] Email urgent recu',
                        message: 'Workspace et procedure OQTF crees automatiquement',
                        priority: 'critical',
                      },
                    },
                  ],
                },
              ],
            },
            {
              id: 'action1_2',
              type: 'create_message',
              name: 'Note interne',
              params: {
                workspaceId: '{{context.workspaceId}}',
                type: 'internal_note',
                senderId: 'system',
                senderName: 'IA Poste Manager',
                senderType: 'system',
                content: 'Workspace cree automatiquement suite a email urgent. Procedure OQTF initiee.',
                priority: 'high',
              },
            },
          ],
        },
      ],
      executionMode: 'sequential',
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
    });
    
    // ReGLE 2: Document uploade [Next] Extraction IA [Next] Classification [Next] Alerte si manquant
    this.registerRule({
      id: 'rule_document_processing',
      name: '[emoji] Document [Next] Extraction IA [Next] Classification',
      description: 'Document uploade declenche analyse IA et classification automatique',
      enabled: true,
      priority: 80,
      trigger: {
        events: ['document:uploaded'],
      },
      actions: [
        {
          id: 'action2_1',
          type: 'analyze_with_ai',
          name: 'Analyser document avec IA',
          params: {
            prompt: 'Extraire les informations cles du document',
            content: '{{payload.documentContent}}',
          },
          aiValidation: {
            required: true,
            autonomyLevel: AutonomyLevel.ORANGE,
            validationLevel: ValidationLevel.QUICK,
          },
          onSuccess: [
            {
              id: 'action2_1_1',
              type: 'classify_content',
              name: 'Classifier le document',
              params: {
                content: '{{payload.documentContent}}',
                categories: [
                  'passeport',
                  'titre_sejour',
                  'justificatif_domicile',
                  'decision_administrative',
                  'autre',
                ],
              },
              onSuccess: [
                {
                  id: 'action2_1_1_1',
                  type: 'log_event',
                  name: 'Logger classification',
                  params: {
                    message: 'Document classifie',
                    data: {
                      documentId: '{{payload.documentId}}',
                      category: '{{context.category}}',
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
      executionMode: 'sequential',
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
    });
    
    // ReGLE 3: Deadline approchante [Next] Alert [Next] Email [Next] Rappel
    this.registerRule({
      id: 'rule_deadline_reminder',
      name: ' Deadline [Next] Alertes en cascade',
      description: 'echeance approchante declenche alertes multiples',
      enabled: true,
      priority: 90,
      trigger: {
        events: ['deadline:approaching'],
        conditions: [
          {
            id: 'cond3',
            field: 'payload.daysRemaining',
            operator: 'less_or_equal',
            value: 7,
          },
        ],
      },
      actions: [
        {
          id: 'action3_1',
          type: 'create_alert',
          name: 'Creer alerte',
          params: {
            workspaceId: '{{payload.workspaceId}}',
            alertType: 'deadline_approaching',
            level: '{{payload.daysRemaining <= 3 ? "critical" : "warning"}}',
            title: 'echeance dans {{payload.daysRemaining}} jours',
            message: '{{payload.deadlineTitle}}',
          },
          onSuccess: [
            {
              id: 'action3_1_1',
              type: 'send_email',
              name: 'Envoyer email de rappel',
              params: {
                to: '{{payload.responsableEmail}}',
                subject: ' Rappel : echeance {{payload.deadlineTitle}}',
                template: 'deadline_reminder',
              },
              delay: 60000, // 1 minute de delai
            },
            {
              id: 'action3_1_2',
              type: 'send_notification',
              name: 'Notification immediate',
              params: {
                userId: '{{payload.responsableId}}',
                title: ' echeance approchante',
                message: '{{payload.deadlineTitle}} - {{payload.daysRemaining}} jours restants',
                priority: '{{payload.daysRemaining <= 3 ? "critical" : "high"}}',
              },
            },
          ],
        },
      ],
      executionMode: 'sequential',
      limits: {
        maxExecutionsPerDay: 10,
        cooldownMinutes: 60,
      },
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
    });
    
    logger.info(` ${this.rules.size} regles de workflow pre-definies chargees`);
  }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

export const workflowEngine = new AdvancedWorkflowEngine();

// ============================================
// HELPERS
// ============================================

/**
 * Declenche un evenement workflow
 */
export async function triggerWorkflowEvent(
  eventType: WorkflowEventType,
  tenantId: string,
  payload: Record<string, any>,
  context?: {
    workspaceId?: string;
    procedureId?: string;
    clientId?: string;
    dossierId?: string;
  }
): Promise<WorkflowExecution[]> {
  const event: WorkflowEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: eventType,
    timestamp: new Date(),
    tenantId,
    payload,
    source: {
      type: 'system',
    },
    context,
  };
  
  return await workflowEngine.processEvent(event);
}
