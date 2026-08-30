/**
 * Tests pour src/lib/workflows/workflow-config.ts
 */
import { vi, describe, it, expect } from 'vitest';

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    tenant = {
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
    };
    $disconnect = vi.fn();
  },
}));

import {
  DEFAULT_WORKFLOW_CONFIG,
  PRESET_CONFIGS,
  loadWorkflowConfig,
  saveWorkflowConfig,
  validateWorkflowConfig,
  mergeConfigs,
} from '@/lib/workflows/workflow-config';

describe('workflow-config.ts — Full Coverage', () => {
  describe('DEFAULT_WORKFLOW_CONFIG', () => {
    it('should be enabled with autoTrigger', () => {
      expect(DEFAULT_WORKFLOW_CONFIG.enabled).toBe(true);
      expect(DEFAULT_WORKFLOW_CONFIG.autoTrigger).toBe(true);
    });

    it('should have AI config with ollama', () => {
      expect(DEFAULT_WORKFLOW_CONFIG.ai.provider).toBe('ollama');
      expect(DEFAULT_WORKFLOW_CONFIG.ai.model).toBe('llama3.2:latest');
      expect(DEFAULT_WORKFLOW_CONFIG.ai.temperature).toBe(0.7);
      expect(DEFAULT_WORKFLOW_CONFIG.ai.confidenceThreshold).toBe(0.7);
    });

    it('should have notifications config', () => {
      expect(DEFAULT_WORKFLOW_CONFIG.notifications.enabled).toBe(true);
      expect(DEFAULT_WORKFLOW_CONFIG.notifications.channels).toContain('web');
      expect(DEFAULT_WORKFLOW_CONFIG.notifications.channels).toContain('email');
      expect(DEFAULT_WORKFLOW_CONFIG.notifications.quietHours.enabled).toBe(true);
    });

    it('should have calendar config with working hours', () => {
      expect(DEFAULT_WORKFLOW_CONFIG.calendar.provider).toBe('internal');
      expect(DEFAULT_WORKFLOW_CONFIG.calendar.workingHours.daysOfWeek).toEqual([1, 2, 3, 4, 5]);
      expect(DEFAULT_WORKFLOW_CONFIG.calendar.defaultDuration).toBe(60);
    });

    it('should have security config', () => {
      expect(DEFAULT_WORKFLOW_CONFIG.security.encryptData).toBe(true);
      expect(DEFAULT_WORKFLOW_CONFIG.security.auditLog).toBe(true);
      expect(DEFAULT_WORKFLOW_CONFIG.security.dataRetentionDays).toBe(365);
    });

    it('should have performance config', () => {
      expect(DEFAULT_WORKFLOW_CONFIG.performance.maxConcurrentWorkflows).toBe(10);
      expect(DEFAULT_WORKFLOW_CONFIG.performance.retryAttempts).toBe(3);
    });
  });

  describe('PRESET_CONFIGS', () => {
    it('PERFORMANCE should optimize for speed', () => {
      const perf = PRESET_CONFIGS.PERFORMANCE;
      expect(perf.ai.analysisDepth).toBe('quick');
      expect(perf.ai.temperature).toBe(0.5);
      expect(perf.performance.maxConcurrentWorkflows).toBe(50);
      expect(perf.forms.validationLevel).toBe('basic');
    });

    it('SECURITY should maximize controls', () => {
      const sec = PRESET_CONFIGS.SECURITY;
      expect(sec.ai.analysisDepth).toBe('deep');
      expect(sec.ai.confidenceThreshold).toBe(0.9);
      expect(sec.security.requireTwoFactor).toBe(true);
      expect(sec.security.dataRetentionDays).toBe(730);
      expect(sec.forms.requiredFields).toBe('strict');
    });

    it('AUTOMATED should maximize automation', () => {
      const auto = PRESET_CONFIGS.AUTOMATED;
      expect(auto.autoTrigger).toBe(true);
      expect(auto.email.autoReply).toBe(true);
      expect(auto.email.requireApproval).toBe(false);
      expect(auto.calendar.autoSchedule).toBe(true);
      expect(auto.routing.loadBalancing).toBe('least-busy');
    });

    it('LAW_FIRM should be optimized for legal', () => {
      const law = PRESET_CONFIGS.LAW_FIRM;
      expect(law.ai.temperature).toBe(0.3);
      expect(law.ai.confidenceThreshold).toBe(0.85);
      expect(law.calendar.defaultDuration).toBe(90);
      expect(law.security.dataRetentionDays).toBe(2555); // 7 years
      expect(law.notifications.channels).toContain('sms');
    });
  });

  describe('loadWorkflowConfig', () => {
    it('should return default config when no tenantId', async () => {
      const config = await loadWorkflowConfig();
      expect(config).toEqual(DEFAULT_WORKFLOW_CONFIG);
    });

    it('should return default config when tenant not found', async () => {
      const config = await loadWorkflowConfig('unknown-tenant');
      expect(config).toEqual(DEFAULT_WORKFLOW_CONFIG);
    });

    it('should return default config on error', async () => {
      const config = await loadWorkflowConfig('error-tenant');
      expect(config).toEqual(DEFAULT_WORKFLOW_CONFIG);
    });
  });

  describe('saveWorkflowConfig', () => {
    it('should warn when no tenantId', async () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await saveWorkflowConfig({ enabled: false });
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('tenantId requis'));
      spy.mockRestore();
    });

    it('should attempt to save with tenantId', async () => {
      // Will use the mocked PrismaClient
      await expect(saveWorkflowConfig({ enabled: false }, 'tenant-1')).resolves.toBeUndefined();
    });
  });

  describe('validateWorkflowConfig', () => {
    it('should accept valid config', () => {
      const result = validateWorkflowConfig({
        ai: { temperature: 0.5 } as any,
        performance: { maxConcurrentWorkflows: 10 } as any,
        security: { dataRetentionDays: 365 } as any,
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject temperature > 1', () => {
      const result = validateWorkflowConfig({
        ai: { temperature: 1.5 } as any,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('AI temperature doit etre entre 0 et 1');
    });

    it('should reject temperature < 0', () => {
      const result = validateWorkflowConfig({
        ai: { temperature: -0.1 } as any,
      });
      expect(result.valid).toBe(false);
    });

    it('should reject maxConcurrentWorkflows < 1', () => {
      const result = validateWorkflowConfig({
        performance: { maxConcurrentWorkflows: -1 } as any,
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('maxConcurrentWorkflows');
    });

    it('should reject dataRetentionDays < 30', () => {
      const result = validateWorkflowConfig({
        security: { dataRetentionDays: 7 } as any,
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('dataRetentionDays');
    });

    it('should accept empty config', () => {
      const result = validateWorkflowConfig({});
      expect(result.valid).toBe(true);
    });
  });

  describe('mergeConfigs', () => {
    it('should merge all sections', () => {
      const merged = mergeConfigs(DEFAULT_WORKFLOW_CONFIG, {
        enabled: false,
        ai: { temperature: 0.3 } as any,
        security: { requireTwoFactor: true } as any,
      });
      expect(merged.enabled).toBe(false);
      expect(merged.ai.temperature).toBe(0.3);
      expect(merged.ai.provider).toBe('ollama'); // From base
      expect(merged.security.requireTwoFactor).toBe(true);
      expect(merged.security.encryptData).toBe(true); // From base
    });

    it('should preserve base values for non-overridden fields', () => {
      const merged = mergeConfigs(DEFAULT_WORKFLOW_CONFIG, { autoTrigger: false });
      expect(merged.autoTrigger).toBe(false);
      expect(merged.ai).toEqual(DEFAULT_WORKFLOW_CONFIG.ai);
      expect(merged.notifications).toEqual(DEFAULT_WORKFLOW_CONFIG.notifications);
    });
  });
});
