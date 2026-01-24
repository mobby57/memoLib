/**
 * Tests unitaires pour WorkflowService
 * Service d'automatisation des workflows
 */

import {
  DEFAULT_WORKFLOWS,
  type Workflow,
  type WorkflowAction,
  type WorkflowCondition,
  type WorkflowExecution,
  type TriggerType,
  type ActionType,
} from '@/lib/services/workflowService';

// Mock localStorage
jest.mock('@/lib/localStorage', () => ({
  safeLocalStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

// Mock du logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('WorkflowService', () => {
  describe('TriggerType', () => {
    it('contient tous les types de déclencheurs', () => {
      const triggers: TriggerType[] = [
        'dossier_created',
        'dossier_status_changed',
        'facture_created',
        'facture_overdue',
        'echeance_approaching',
        'document_uploaded',
        'client_created',
        'scheduled',
      ];

      triggers.forEach((trigger) => {
        expect(typeof trigger).toBe('string');
      });

      expect(triggers).toHaveLength(8);
    });
  });

  describe('ActionType', () => {
    it('contient tous les types d\'actions', () => {
      const actions: ActionType[] = [
        'send_email',
        'create_task',
        'update_status',
        'assign_to_user',
        'generate_document',
        'create_notification',
        'webhook',
        'run_script',
      ];

      actions.forEach((action) => {
        expect(typeof action).toBe('string');
      });

      expect(actions).toHaveLength(8);
    });
  });

  describe('WorkflowCondition', () => {
    it('supporte les opérateurs de comparaison', () => {
      const conditions: WorkflowCondition[] = [
        { field: 'status', operator: 'equals', value: 'active' },
        { field: 'status', operator: 'not_equals', value: 'archived' },
        { field: 'name', operator: 'contains', value: 'OQTF' },
        { field: 'amount', operator: 'greater_than', value: 1000 },
        { field: 'amount', operator: 'less_than', value: 5000 },
        { field: 'type', operator: 'in', value: ['OQTF', 'IRTF'] },
        { field: 'type', operator: 'not_in', value: ['AUTRE'] },
      ];

      expect(conditions).toHaveLength(7);
      conditions.forEach((cond) => {
        expect(cond).toHaveProperty('field');
        expect(cond).toHaveProperty('operator');
        expect(cond).toHaveProperty('value');
      });
    });
  });

  describe('WorkflowAction', () => {
    it('peut avoir un délai optionnel', () => {
      const actionWithDelay: WorkflowAction = {
        type: 'send_email',
        params: { template: 'reminder', to: 'test@example.com' },
        delay: 60, // 60 minutes
      };

      const actionWithoutDelay: WorkflowAction = {
        type: 'create_notification',
        params: { message: 'Test' },
      };

      expect(actionWithDelay.delay).toBe(60);
      expect(actionWithoutDelay.delay).toBeUndefined();
    });
  });

  describe('DEFAULT_WORKFLOWS', () => {
    it('contient des workflows prédéfinis', () => {
      expect(DEFAULT_WORKFLOWS).toBeDefined();
      expect(Array.isArray(DEFAULT_WORKFLOWS)).toBe(true);
      expect(DEFAULT_WORKFLOWS.length).toBeGreaterThan(0);
    });

    it('chaque workflow a un nom et une description', () => {
      DEFAULT_WORKFLOWS.forEach((workflow) => {
        expect(workflow.name).toBeDefined();
        expect(workflow.description).toBeDefined();
        expect(typeof workflow.name).toBe('string');
        expect(typeof workflow.description).toBe('string');
      });
    });

    it('chaque workflow a un trigger valide', () => {
      DEFAULT_WORKFLOWS.forEach((workflow) => {
        expect(workflow.trigger).toBeDefined();
        expect(workflow.trigger.type).toBeDefined();
        expect(Array.isArray(workflow.trigger.conditions)).toBe(true);
      });
    });

    it('chaque workflow a au moins une action', () => {
      DEFAULT_WORKFLOWS.forEach((workflow) => {
        expect(workflow.actions).toBeDefined();
        expect(Array.isArray(workflow.actions)).toBe(true);
        expect(workflow.actions.length).toBeGreaterThan(0);
      });
    });

    it('contient le workflow de relance facture', () => {
      const relanceWorkflow = DEFAULT_WORKFLOWS.find(
        (w) => w.name.includes('Relance facture')
      );
      expect(relanceWorkflow).toBeDefined();
      expect(relanceWorkflow?.trigger.type).toBe('facture_overdue');
    });
  });

  describe('Workflow Structure', () => {
    it('accepte une structure de workflow complète', () => {
      const workflow: Workflow = {
        id: 'wf_001',
        name: 'Test Workflow',
        description: 'Workflow de test',
        enabled: true,
        trigger: {
          type: 'dossier_created',
          conditions: [
            { field: 'typeDossier', operator: 'equals', value: 'OQTF' },
          ],
        },
        actions: [
          {
            type: 'send_email',
            params: {
              template: 'nouveau_dossier_oqtf',
              to: '{{avocat.email}}',
            },
          },
          {
            type: 'create_task',
            params: {
              title: 'Vérifier les pièces du dossier OQTF',
              priority: 'high',
            },
            delay: 30,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0,
      };

      expect(workflow.id).toBe('wf_001');
      expect(workflow.enabled).toBe(true);
      expect(workflow.actions).toHaveLength(2);
    });
  });

  describe('WorkflowExecution', () => {
    it('suit l\'état d\'exécution d\'un workflow', () => {
      const execution: WorkflowExecution = {
        id: 'exec_001',
        workflowId: 'wf_001',
        triggeredAt: new Date(),
        status: 'running',
        context: {
          dossierId: 'dos_123',
          clientId: 'cli_456',
        },
        results: [],
      };

      expect(execution.status).toBe('running');
      expect(execution.context).toBeDefined();
    });

    it('enregistre les résultats des actions', () => {
      const execution: WorkflowExecution = {
        id: 'exec_002',
        workflowId: 'wf_001',
        triggeredAt: new Date('2026-01-24T10:00:00'),
        completedAt: new Date('2026-01-24T10:00:05'),
        status: 'completed',
        context: {},
        results: [
          {
            action: { type: 'send_email', params: {} },
            status: 'success',
            result: { messageId: 'msg_123' },
          },
          {
            action: { type: 'create_task', params: {} },
            status: 'error',
            error: 'Task creation failed',
          },
        ],
      };

      expect(execution.status).toBe('completed');
      expect(execution.results).toHaveLength(2);
      expect(execution.results[0].status).toBe('success');
      expect(execution.results[1].status).toBe('error');
    });

    it('gère les erreurs d\'exécution', () => {
      const failedExecution: WorkflowExecution = {
        id: 'exec_003',
        workflowId: 'wf_001',
        triggeredAt: new Date(),
        status: 'failed',
        error: 'Trigger conditions not met',
        context: {},
        results: [],
      };

      expect(failedExecution.status).toBe('failed');
      expect(failedExecution.error).toBeDefined();
    });
  });
});
