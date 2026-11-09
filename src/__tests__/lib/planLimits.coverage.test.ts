/**
 * Tests exhaustifs pour src/lib/planLimits.ts
 * Objectif: couvrir 100% du module
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockTenantFindUnique, mockTenantUpdate } = vi.hoisted(() => ({
  mockTenantFindUnique: vi.fn(),
  mockTenantUpdate: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class MockPrismaClient {
    tenant = {
      findUnique: mockTenantFindUnique,
      update: mockTenantUpdate,
    };
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    audit: vi.fn(),
  },
}));

import {
  canCreateDossier,
  canAddClient,
  canAddUser,
  canUploadFile,
  canPerformAIAction,
  canAccessAdvancedAnalytics,
  canAccessExternalAI,
  hasPrioritySupport,
  getTenantLimits,
  getTenantUsage,
  incrementDossierCount,
  incrementClientCount,
  incrementUserCount,
  addStorageUsage,
  logAIAction,
  AIAction,
} from '@/lib/planLimits';

describe('planLimits.ts — Full Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTenantWithPlan = (overrides = {}) => ({
    id: 't1',
    currentDossiers: 5,
    currentClients: 10,
    currentStorageGb: 2,
    currentUsers: 3,
    plan: {
      name: 'CABINET',
      maxDossiers: 100,
      maxClients: 200,
      maxStorageGb: 10,
      maxUsers: 10,
      aiAutonomyLevel: 3,
      humanValidation: false,
      advancedAnalytics: true,
      externalAiAccess: true,
      prioritySupport: true,
    },
    ...overrides,
  });

  describe('canCreateDossier', () => {
    it('should allow when under limit', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan());
      const result = await canCreateDossier('t1');
      expect(result.allowed).toBe(true);
    });

    it('should deny when at limit', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan({ currentDossiers: 100 }));
      const result = await canCreateDossier('t1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('100 dossiers max');
      expect(result.currentUsage).toBe(100);
      expect(result.limit).toBe(100);
    });

    it('should deny when tenant not found', async () => {
      mockTenantFindUnique.mockResolvedValue(null);
      const result = await canCreateDossier('unknown');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Tenant not found');
    });
  });

  describe('canAddClient', () => {
    it('should allow when under limit', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan());
      const result = await canAddClient('t1');
      expect(result.allowed).toBe(true);
    });

    it('should deny when at limit', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan({ currentClients: 200 }));
      const result = await canAddClient('t1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('200 clients max');
    });

    it('should deny when tenant not found', async () => {
      mockTenantFindUnique.mockResolvedValue(null);
      const result = await canAddClient('unknown');
      expect(result.allowed).toBe(false);
    });
  });

  describe('canAddUser', () => {
    it('should allow when under limit', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan());
      const result = await canAddUser('t1');
      expect(result.allowed).toBe(true);
    });

    it('should deny when at limit', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan({ currentUsers: 10 }));
      const result = await canAddUser('t1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('10 users max');
    });

    it('should deny when tenant not found', async () => {
      mockTenantFindUnique.mockResolvedValue(null);
      const result = await canAddUser('unknown');
      expect(result.allowed).toBe(false);
    });
  });

  describe('canUploadFile', () => {
    it('should allow when storage is within limits', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan());
      const result = await canUploadFile('t1', 1);
      expect(result.allowed).toBe(true);
    });

    it('should deny when upload would exceed storage limit', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan({ currentStorageGb: 9 }));
      const result = await canUploadFile('t1', 2); // 9 + 2 = 11 > 10
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('10GB max');
    });

    it('should deny when tenant not found', async () => {
      mockTenantFindUnique.mockResolvedValue(null);
      const result = await canUploadFile('unknown', 0.5);
      expect(result.allowed).toBe(false);
    });
  });

  describe('canPerformAIAction', () => {
    it('should allow level 1 actions for level 3 plan', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan());
      const result = await canPerformAIAction('t1', AIAction.SORT_MESSAGES);
      expect(result.allowed).toBe(true);
      expect(result.requiresValidation).toBe(false);
      expect(result.autonomyLevel).toBe(3);
    });

    it('should allow level 2 actions for level 3 plan', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan());
      const result = await canPerformAIAction('t1', AIAction.ANALYZE_RISK);
      expect(result.allowed).toBe(true);
    });

    it('should allow level 3 actions for level 3 plan', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan());
      const result = await canPerformAIAction('t1', AIAction.AUTO_REPLY_CLIENT);
      expect(result.allowed).toBe(true);
    });

    it('should deny level 4 actions for level 3 plan', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan());
      const result = await canPerformAIAction('t1', AIAction.ADVANCED_ANALYTICS);
      expect(result.allowed).toBe(false);
      expect(result.requiresValidation).toBe(true);
      expect(result.reason).toContain('level 4 required');
    });

    it('should always deny forbidden actions (level 999)', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan({
        plan: { ...mockTenantWithPlan().plan, aiAutonomyLevel: 4 },
      }));
      const result = await canPerformAIAction('t1', AIAction.VALIDATE_LEGAL_ACT);
      expect(result.allowed).toBe(false);
      expect(result.requiresValidation).toBe(true);
      expect(result.reason).toContain('validation humaine');
    });

    it('should deny SEND_OFFICIAL_DOCUMENT', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan());
      const result = await canPerformAIAction('t1', AIAction.SEND_OFFICIAL_DOCUMENT);
      expect(result.allowed).toBe(false);
    });

    it('should deny CHOOSE_LEGAL_STRATEGY', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan());
      const result = await canPerformAIAction('t1', AIAction.CHOOSE_LEGAL_STRATEGY);
      expect(result.allowed).toBe(false);
    });

    it('should deny COMMIT_CABINET', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan());
      const result = await canPerformAIAction('t1', AIAction.COMMIT_CABINET);
      expect(result.allowed).toBe(false);
    });

    it('should require validation when plan forces humanValidation', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan({
        plan: { ...mockTenantWithPlan().plan, humanValidation: true },
      }));
      const result = await canPerformAIAction('t1', AIAction.SORT_MESSAGES);
      expect(result.allowed).toBe(true);
      expect(result.requiresValidation).toBe(true);
    });

    it('should deny when tenant not found', async () => {
      mockTenantFindUnique.mockResolvedValue(null);
      const result = await canPerformAIAction('unknown', AIAction.SORT_MESSAGES);
      expect(result.allowed).toBe(false);
      expect(result.requiresValidation).toBe(true);
    });

    it('should allow all level 1 actions', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan({
        plan: { ...mockTenantWithPlan().plan, aiAutonomyLevel: 1 },
      }));
      
      for (const action of [AIAction.SORT_MESSAGES, AIAction.PRIORITIZE, AIAction.REQUEST_DOCUMENTS, AIAction.GENERATE_DRAFT, AIAction.AUTO_REMINDER, AIAction.ARCHIVE]) {
        const result = await canPerformAIAction('t1', action);
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe('canAccessAdvancedAnalytics', () => {
    it('should return true when plan has analytics', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan());
      const result = await canAccessAdvancedAnalytics('t1');
      expect(result).toBe(true);
    });

    it('should return false when plan lacks analytics', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan({
        plan: { ...mockTenantWithPlan().plan, advancedAnalytics: false },
      }));
      const result = await canAccessAdvancedAnalytics('t1');
      expect(result).toBe(false);
    });

    it('should return false when tenant not found', async () => {
      mockTenantFindUnique.mockResolvedValue(null);
      const result = await canAccessAdvancedAnalytics('unknown');
      expect(result).toBe(false);
    });
  });

  describe('canAccessExternalAI', () => {
    it('should return true when plan has external AI', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan());
      const result = await canAccessExternalAI('t1');
      expect(result).toBe(true);
    });

    it('should return false when plan lacks external AI', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan({
        plan: { ...mockTenantWithPlan().plan, externalAiAccess: false },
      }));
      const result = await canAccessExternalAI('t1');
      expect(result).toBe(false);
    });

    it('should return false when tenant not found', async () => {
      mockTenantFindUnique.mockResolvedValue(null);
      const result = await canAccessExternalAI('unknown');
      expect(result).toBe(false);
    });
  });

  describe('hasPrioritySupport', () => {
    it('should return true when plan has priority support', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan());
      const result = await hasPrioritySupport('t1');
      expect(result).toBe(true);
    });

    it('should return false when plan lacks priority support', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan({
        plan: { ...mockTenantWithPlan().plan, prioritySupport: false },
      }));
      const result = await hasPrioritySupport('t1');
      expect(result).toBe(false);
    });

    it('should return false when tenant not found', async () => {
      mockTenantFindUnique.mockResolvedValue(null);
      const result = await hasPrioritySupport('unknown');
      expect(result).toBe(false);
    });
  });

  describe('getTenantLimits', () => {
    it('should return plan limits', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan());
      const limits = await getTenantLimits('t1');
      expect(limits).toEqual({
        maxDossiers: 100,
        maxClients: 200,
        maxStorageGb: 10,
        maxUsers: 10,
        aiAutonomyLevel: 3,
        humanValidation: false,
        advancedAnalytics: true,
        externalAiAccess: true,
        prioritySupport: true,
      });
    });

    it('should return null when tenant not found', async () => {
      mockTenantFindUnique.mockResolvedValue(null);
      const limits = await getTenantLimits('unknown');
      expect(limits).toBeNull();
    });
  });

  describe('getTenantUsage', () => {
    it('should return current usage', async () => {
      mockTenantFindUnique.mockResolvedValue(mockTenantWithPlan());
      const usage = await getTenantUsage('t1');
      expect(usage).toEqual({
        currentDossiers: 5,
        currentClients: 10,
        currentStorageGb: 2,
        currentUsers: 3,
      });
    });

    it('should return null when tenant not found', async () => {
      mockTenantFindUnique.mockResolvedValue(null);
      const usage = await getTenantUsage('unknown');
      expect(usage).toBeNull();
    });
  });

  describe('increment functions', () => {
    it('incrementDossierCount should call prisma update', async () => {
      mockTenantUpdate.mockResolvedValue({});
      await incrementDossierCount('t1');
      expect(mockTenantUpdate).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { currentDossiers: { increment: 1 } },
      });
    });

    it('incrementClientCount should call prisma update', async () => {
      mockTenantUpdate.mockResolvedValue({});
      await incrementClientCount('t1');
      expect(mockTenantUpdate).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { currentClients: { increment: 1 } },
      });
    });

    it('incrementUserCount should call prisma update', async () => {
      mockTenantUpdate.mockResolvedValue({});
      await incrementUserCount('t1');
      expect(mockTenantUpdate).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { currentUsers: { increment: 1 } },
      });
    });

    it('addStorageUsage should call prisma update with size', async () => {
      mockTenantUpdate.mockResolvedValue({});
      await addStorageUsage('t1', 0.5);
      expect(mockTenantUpdate).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { currentStorageGb: { increment: 0.5 } },
      });
    });
  });

  describe('logAIAction', () => {
    it('should log an AI action without error', async () => {
      await logAIAction({
        tenantId: 't1',
        action: AIAction.SORT_MESSAGES,
        userId: 'user1',
        validated: true,
        metadata: { detail: 'test' },
      });
      // Should not throw
    });

    it('should handle missing userId', async () => {
      await logAIAction({
        tenantId: 't1',
        action: AIAction.ANALYZE_RISK,
        validated: false,
      });
      // Should not throw
    });

    it('should handle errors gracefully', async () => {
      // Even if logger fails, logAIAction should not throw
      vi.mock('@/lib/logger', () => ({
        logger: {
          audit: vi.fn().mockImplementation(() => { throw new Error('fail'); }),
        },
      }));

      await expect(logAIAction({
        tenantId: 't1',
        action: AIAction.ARCHIVE,
        validated: true,
      })).resolves.toBeUndefined();
    });
  });
});
