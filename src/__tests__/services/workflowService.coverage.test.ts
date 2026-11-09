/**
 * Tests exhaustifs pour src/lib/services/workflowService.ts
 * Objectif: couvrir 100% du module
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const mockStorage: Record<string, string> = {};
vi.mock('@/lib/localStorage', () => ({
  safeLocalStorage: {
    getItem: vi.fn((key: string) => mockStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
    removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import {
  getWorkflows,
  saveWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  executeWorkflow,
  getWorkflowExecutions,
  DEFAULT_WORKFLOWS,
  Workflow,
  WorkflowAction,
} from '@/lib/services/workflowService';

describe('workflowService.ts — Full Coverage', () => {
  beforeEach(() => {
    // Clear storage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  });

  describe('getWorkflows', () => {
    it('should initialize with default workflows when storage is empty', () => {
      const workflows = getWorkflows();
      expect(workflows).toHaveLength(DEFAULT_WORKFLOWS.length);
      expect(workflows[0].name).toBe(DEFAULT_WORKFLOWS[0].name);
      expect(workflows[0].id).toBe('workflow_1');
      expect(workflows[0].executionCount).toBe(0);
    });

    it('should return stored workflows and parse dates', () => {
      const stored = [
        {
          id: 'wf1',
          name: 'Test',
          description: 'desc',
          enabled: true,
          trigger: { type: 'dossier_created', conditions: [] },
          actions: [],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
          lastExecuted: '2025-01-03T00:00:00.000Z',
          executionCount: 5,
        },
      ];
      mockStorage['workflows'] = JSON.stringify(stored);

      const workflows = getWorkflows();
      expect(workflows).toHaveLength(1);
      expect(workflows[0].createdAt).toBeInstanceOf(Date);
      expect(workflows[0].updatedAt).toBeInstanceOf(Date);
      expect(workflows[0].lastExecuted).toBeInstanceOf(Date);
    });

    it('should handle workflows without lastExecuted', () => {
      const stored = [
        {
          id: 'wf1',
          name: 'Test',
          description: '',
          enabled: true,
          trigger: { type: 'dossier_created', conditions: [] },
          actions: [],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
          executionCount: 0,
        },
      ];
      mockStorage['workflows'] = JSON.stringify(stored);

      const workflows = getWorkflows();
      expect(workflows[0].lastExecuted).toBeUndefined();
    });
  });

  describe('saveWorkflow', () => {
    it('should create a new workflow', () => {
      // Initialize storage
      getWorkflows();

      const newWorkflow = saveWorkflow({
        name: 'Mon workflow',
        description: 'Description',
        enabled: true,
        trigger: { type: 'client_created', conditions: [] },
        actions: [{ type: 'send_email', params: { to: 'test@test.com' } }],
      });

      expect(newWorkflow.id).toContain('workflow_');
      expect(newWorkflow.name).toBe('Mon workflow');
      expect(newWorkflow.executionCount).toBe(0);
    });

    it('should create workflow with defaults when minimal data provided', () => {
      getWorkflows();

      const workflow = saveWorkflow({});
      expect(workflow.name).toBe('Nouveau workflow');
      expect(workflow.description).toBe('');
      expect(workflow.enabled).toBe(true);
      expect(workflow.trigger.type).toBe('dossier_created');
      expect(workflow.actions).toEqual([]);
    });

    it('should update an existing workflow', () => {
      getWorkflows();
      const workflows = getWorkflows();
      const existing = workflows[0];

      const updated = saveWorkflow({
        id: existing.id,
        name: 'Updated Name',
      });

      expect(updated.id).toBe(existing.id);
      expect(updated.name).toBe('Updated Name');
    });

    it('should create new workflow if id not found', () => {
      getWorkflows();

      const workflow = saveWorkflow({
        id: 'non_existent_id',
        name: 'Will be created',
      });

      // Since id wasn't found in existing, it creates new (without matching index)
      // Actually looking at code: if id is set but not found, falls through to creation
      expect(workflow.name).toBe('Will be created');
    });
  });

  describe('deleteWorkflow', () => {
    it('should remove a workflow by id', () => {
      getWorkflows(); // Init defaults
      const workflows = getWorkflows();
      const initialCount = workflows.length;

      deleteWorkflow(workflows[0].id);

      const remaining = getWorkflows();
      expect(remaining.length).toBe(initialCount - 1);
      expect(remaining.find(w => w.id === workflows[0].id)).toBeUndefined();
    });

    it('should handle deleting non-existent workflow gracefully', () => {
      getWorkflows();
      const before = getWorkflows().length;
      deleteWorkflow('non_existent');
      const after = getWorkflows().length;
      expect(after).toBe(before);
    });
  });

  describe('toggleWorkflow', () => {
    it('should toggle enabled state', () => {
      getWorkflows();
      const workflows = getWorkflows();
      const target = workflows[0];
      const originalState = target.enabled;

      toggleWorkflow(target.id);

      const updated = getWorkflows();
      const toggled = updated.find(w => w.id === target.id);
      expect(toggled!.enabled).toBe(!originalState);
    });

    it('should do nothing for non-existent workflow', () => {
      getWorkflows();
      toggleWorkflow('non_existent');
      // No error thrown
    });
  });

  describe('executeWorkflow', () => {
    it('should execute a workflow with all action types', async () => {
      const stored = [
        {
          id: 'exec_test',
          name: 'Test Execution',
          description: '',
          enabled: true,
          trigger: { type: 'dossier_created', conditions: [] },
          actions: [
            { type: 'send_email', params: { to: 'test@test.com', subject: 'Hello' } },
            { type: 'create_task', params: { title: 'Task 1' } },
            { type: 'update_status', params: { status: 'en_cours' } },
            { type: 'create_notification', params: { title: 'Notif' } },
            { type: 'generate_document', params: { template: 'rapport' } },
            { type: 'assign_to_user', params: { strategy: 'round_robin' } },
            { type: 'webhook', params: { url: 'https://example.com' } },
            { type: 'run_script', params: { script: 'extract_data' } },
          ],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          executionCount: 0,
        },
      ];
      mockStorage['workflows'] = JSON.stringify(stored);

      const execution = await executeWorkflow('exec_test', { dossier: { titre: 'Test' } });

      expect(execution.status).toBe('completed');
      expect(execution.results).toHaveLength(8);
      expect(execution.results.every(r => r.status === 'success')).toBe(true);
      expect(execution.completedAt).toBeInstanceOf(Date);
    });

    it('should throw if workflow not found', async () => {
      mockStorage['workflows'] = JSON.stringify([]);
      await expect(executeWorkflow('nope', {})).rejects.toThrow('Workflow introuvable');
    });

    it('should handle action with delay', async () => {
      vi.useFakeTimers();
      
      const stored = [
        {
          id: 'delay_test',
          name: 'Delay Test',
          description: '',
          enabled: true,
          trigger: { type: 'dossier_created', conditions: [] },
          actions: [
            { type: 'send_email', params: { to: 'a@b.com' }, delay: 0.001 }, // 0.001 min = 60ms
          ],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          executionCount: 0,
        },
      ];
      mockStorage['workflows'] = JSON.stringify(stored);

      const promise = executeWorkflow('delay_test', {});
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.status).toBe('completed');
      vi.useRealTimers();
    });

    it('should handle failed execution and log error', async () => {
      const stored = [
        {
          id: 'fail_test',
          name: 'Fail Test',
          description: '',
          enabled: true,
          trigger: { type: 'dossier_created', conditions: [] },
          actions: [
            { type: 'unknown_action_type' as any, params: {} },
          ],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          executionCount: 0,
        },
      ];
      mockStorage['workflows'] = JSON.stringify(stored);

      const execution = await executeWorkflow('fail_test', {});
      expect(execution.status).toBe('failed');
      expect(execution.error).toContain("Type d'action inconnu");
    });

    it('should replace variables {{path}} in action params', async () => {
      const stored = [
        {
          id: 'var_test',
          name: 'Variable Test',
          description: '',
          enabled: true,
          trigger: { type: 'dossier_created', conditions: [] },
          actions: [
            {
              type: 'send_email',
              params: {
                to: '{{client.email}}',
                subject: 'Dossier {{dossier.titre}} - {{dossier.id}}',
                recipients: ['{{client.email}}', '{{avocat.email}}'],
                nested: { value: '{{dossier.numero}}' },
              },
            },
          ],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          executionCount: 0,
        },
      ];
      mockStorage['workflows'] = JSON.stringify(stored);

      const context = {
        client: { email: 'client@test.fr' },
        dossier: { titre: 'OQTF', id: '123', numero: 'D-2025-001' },
        avocat: { email: 'avocat@cabinet.fr' },
      };

      const execution = await executeWorkflow('var_test', context);
      expect(execution.status).toBe('completed');

      const result = execution.results[0].result;
      expect(result.to).toBe('client@test.fr');
      expect(result.subject).toBe('Dossier OQTF - 123');
    });

    it('should keep unresolved variables unchanged', async () => {
      const stored = [
        {
          id: 'unresolved',
          name: 'Unresolved',
          description: '',
          enabled: true,
          trigger: { type: 'dossier_created', conditions: [] },
          actions: [
            { type: 'send_email', params: { to: '{{unknown.path}}' } },
          ],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          executionCount: 0,
        },
      ];
      mockStorage['workflows'] = JSON.stringify(stored);

      const execution = await executeWorkflow('unresolved', {});
      expect(execution.results[0].result.to).toBe('{{unknown.path}}');
    });

    it('should increment execution count after success', async () => {
      const stored = [
        {
          id: 'count_test',
          name: 'Count',
          description: '',
          enabled: true,
          trigger: { type: 'dossier_created', conditions: [] },
          actions: [{ type: 'create_task', params: { title: 'ok' } }],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          executionCount: 3,
        },
      ];
      mockStorage['workflows'] = JSON.stringify(stored);

      await executeWorkflow('count_test', {});

      const workflows = getWorkflows();
      expect(workflows[0].executionCount).toBe(4);
      expect(workflows[0].lastExecuted).toBeInstanceOf(Date);
    });
  });

  describe('getWorkflowExecutions', () => {
    it('should return empty array when no executions', () => {
      expect(getWorkflowExecutions()).toEqual([]);
    });

    it('should return all executions sorted by date (most recent first)', () => {
      const executions = [
        {
          id: 'e1',
          workflowId: 'w1',
          triggeredAt: '2025-01-01T00:00:00.000Z',
          status: 'completed',
          context: {},
          results: [],
        },
        {
          id: 'e2',
          workflowId: 'w2',
          triggeredAt: '2025-01-03T00:00:00.000Z',
          status: 'completed',
          context: {},
          results: [],
        },
        {
          id: 'e3',
          workflowId: 'w1',
          triggeredAt: '2025-01-02T00:00:00.000Z',
          status: 'failed',
          context: {},
          results: [],
          completedAt: '2025-01-02T00:01:00.000Z',
        },
      ];
      mockStorage['workflow_executions'] = JSON.stringify(executions);

      const all = getWorkflowExecutions();
      expect(all).toHaveLength(3);
      expect(all[0].id).toBe('e2'); // Most recent first
    });

    it('should filter by workflowId', () => {
      const executions = [
        { id: 'e1', workflowId: 'w1', triggeredAt: '2025-01-01T00:00:00.000Z', status: 'completed', context: {}, results: [] },
        { id: 'e2', workflowId: 'w2', triggeredAt: '2025-01-02T00:00:00.000Z', status: 'completed', context: {}, results: [] },
        { id: 'e3', workflowId: 'w1', triggeredAt: '2025-01-03T00:00:00.000Z', status: 'completed', context: {}, results: [] },
      ];
      mockStorage['workflow_executions'] = JSON.stringify(executions);

      const w1Executions = getWorkflowExecutions('w1');
      expect(w1Executions).toHaveLength(2);
      expect(w1Executions.every(e => e.workflowId === 'w1')).toBe(true);
    });

    it('should parse dates correctly', () => {
      const executions = [
        {
          id: 'e1',
          workflowId: 'w1',
          triggeredAt: '2025-06-15T10:30:00.000Z',
          completedAt: '2025-06-15T10:31:00.000Z',
          status: 'completed',
          context: {},
          results: [],
        },
      ];
      mockStorage['workflow_executions'] = JSON.stringify(executions);

      const result = getWorkflowExecutions();
      expect(result[0].triggeredAt).toBeInstanceOf(Date);
      expect(result[0].completedAt).toBeInstanceOf(Date);
    });
  });

  describe('DEFAULT_WORKFLOWS', () => {
    it('should have 5 predefined workflows', () => {
      expect(DEFAULT_WORKFLOWS).toHaveLength(5);
    });

    it('should cover all trigger types', () => {
      const triggers = DEFAULT_WORKFLOWS.map(w => w.trigger.type);
      expect(triggers).toContain('facture_overdue');
      expect(triggers).toContain('echeance_approaching');
      expect(triggers).toContain('dossier_created');
      expect(triggers).toContain('document_uploaded');
      expect(triggers).toContain('scheduled');
    });
  });
});
