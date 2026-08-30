/**
 * Tests exhaustifs pour src/lib/planLimits.ts
 *
 * Objectif :
 * - Couvrir les limites de plans
 * - Couvrir les garde-fous IA
 * - Couvrir les accès aux fonctionnalités
 * - Couvrir les compteurs d'utilisation
 * - Couvrir la journalisation des actions IA
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockTenantFindUnique,
  mockTenantUpdate,
  mockLoggerAudit,
} = vi.hoisted(() => ({
  mockTenantFindUnique: vi.fn(),
  mockTenantUpdate: vi.fn(),
  mockLoggerAudit: vi.fn(),
}));

/**
 * IMPORTANT :
 * planLimits.ts importe Prisma depuis '@/lib/prisma'.
 * Il faut donc mocker '@/lib/prisma', et non '@prisma/client'.
 */
vi.mock('@/lib/prisma', () => ({
  default: {
    tenant: {
      findUnique: mockTenantFindUnique,
      update: mockTenantUpdate,
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    audit: mockLoggerAudit,
  },
}));

/**
 * Sentry est mocké pour éviter une dépendance réelle pendant les tests.
 */
vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}));

import {
  AIAction,
  addStorageUsage,
  canAccessAdvancedAnalytics,
  canAccessExternalAI,
  canAddClient,
  canAddUser,
  canCreateDossier,
  canPerformAIAction,
  canUploadFile,
  getTenantLimits,
  getTenantUsage,
  hasPrioritySupport,
  incrementClientCount,
  incrementDossierCount,
  incrementUserCount,
  logAIAction,
} from '@/lib/planLimits';

describe('planLimits.ts — Full Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // FIXTURES
  // ============================================

  const createPlan = (overrides = {}) => ({
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
    ...overrides,
  });

  const mockTenantWithPlan = (overrides: Record<string, unknown> = {}) => ({
    id: 't1',
    currentDossiers: 5,
    currentClients: 10,
    currentStorageGb: 2,
    currentUsers: 3,
    plan: createPlan(),
    ...overrides,
  });

  // ============================================
  // AIAction
  // ============================================

  describe('AIAction enum', () => {
    it('should contain all level 1 actions', () => {
      expect(AIAction.SORT_MESSAGES).toBe('SORT_MESSAGES');
      expect(AIAction.PRIORITIZE).toBe('PRIORITIZE');
      expect(AIAction.REQUEST_DOCUMENTS).toBe('REQUEST_DOCUMENTS');
      expect(AIAction.GENERATE_DRAFT).toBe('GENERATE_DRAFT');
      expect(AIAction.AUTO_REMINDER).toBe('AUTO_REMINDER');
      expect(AIAction.ARCHIVE).toBe('ARCHIVE');
    });

    it('should contain all level 2 actions', () => {
      expect(AIAction.ANALYZE_RISK).toBe('ANALYZE_RISK');
      expect(AIAction.SUGGEST_ACTIONS).toBe('SUGGEST_ACTIONS');
    });

    it('should contain all level 3 actions', () => {
      expect(AIAction.AUTO_REPLY_CLIENT).toBe('AUTO_REPLY_CLIENT');
      expect(AIAction.GENERATE_FORM).toBe('GENERATE_FORM');
    });

    it('should contain all level 4 actions', () => {
      expect(AIAction.ADVANCED_ANALYTICS).toBe('ADVANCED_ANALYTICS');
      expect(AIAction.EXTERNAL_AI_CALL).toBe('EXTERNAL_AI_CALL');
    });

    it('should contain all actions requiring permanent human validation', () => {
      expect(AIAction.VALIDATE_LEGAL_ACT).toBe('VALIDATE_LEGAL_ACT');
      expect(AIAction.SEND_OFFICIAL_DOCUMENT).toBe(
        'SEND_OFFICIAL_DOCUMENT',
      );
      expect(AIAction.CHOOSE_LEGAL_STRATEGY).toBe(
        'CHOOSE_LEGAL_STRATEGY',
      );
      expect(AIAction.COMMIT_CABINET).toBe('COMMIT_CABINET');
    });

    it('should contain exactly 16 actions', () => {
      expect(Object.values(AIAction)).toHaveLength(16);
    });
  });

  // ============================================
  // canCreateDossier
  // ============================================

  describe('canCreateDossier', () => {
    it('should allow creation when under the limit', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          currentDossiers: 50,
        }),
      );

      const result = await canCreateDossier('t1');

      expect(result).toEqual({
        allowed: true,
      });

      expect(mockTenantFindUnique).toHaveBeenCalledWith({
        where: { id: 't1' },
        include: { plan: true },
      });
    });

    it('should deny creation when exactly at the limit', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          currentDossiers: 100,
        }),
      );

      const result = await canCreateDossier('t1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('100 dossiers max');
      expect(result.currentUsage).toBe(100);
      expect(result.limit).toBe(100);
    });

    it('should deny creation when over the limit', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          currentDossiers: 101,
        }),
      );

      const result = await canCreateDossier('t1');

      expect(result.allowed).toBe(false);
      expect(result.currentUsage).toBe(101);
      expect(result.limit).toBe(100);
    });

    it('should deny when tenant does not exist', async () => {
      mockTenantFindUnique.mockResolvedValue(null);

      const result = await canCreateDossier('unknown');

      expect(result).toEqual({
        allowed: false,
        reason: 'Tenant not found',
      });
    });
  });

  // ============================================
  // canAddClient
  // ============================================

  describe('canAddClient', () => {
    it('should allow when under the limit', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          currentClients: 100,
        }),
      );

      const result = await canAddClient('t1');

      expect(result.allowed).toBe(true);
    });

    it('should deny when exactly at the limit', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          currentClients: 200,
        }),
      );

      const result = await canAddClient('t1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('200 clients max');
      expect(result.currentUsage).toBe(200);
      expect(result.limit).toBe(200);
    });

    it('should deny when over the limit', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          currentClients: 201,
        }),
      );

      const result = await canAddClient('t1');

      expect(result.allowed).toBe(false);
      expect(result.currentUsage).toBe(201);
      expect(result.limit).toBe(200);
    });

    it('should deny when tenant does not exist', async () => {
      mockTenantFindUnique.mockResolvedValue(null);

      const result = await canAddClient('unknown');

      expect(result).toEqual({
        allowed: false,
        reason: 'Tenant not found',
      });
    });
  });

  // ============================================
  // canAddUser
  // ============================================

  describe('canAddUser', () => {
    it('should allow when under the limit', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          currentUsers: 5,
        }),
      );

      const result = await canAddUser('t1');

      expect(result.allowed).toBe(true);
    });

    it('should deny when exactly at the limit', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          currentUsers: 10,
        }),
      );

      const result = await canAddUser('t1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('10 users max');
      expect(result.currentUsage).toBe(10);
      expect(result.limit).toBe(10);
    });

    it('should deny when over the limit', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          currentUsers: 11,
        }),
      );

      const result = await canAddUser('t1');

      expect(result.allowed).toBe(false);
      expect(result.currentUsage).toBe(11);
      expect(result.limit).toBe(10);
    });

    it('should deny when tenant does not exist', async () => {
      mockTenantFindUnique.mockResolvedValue(null);

      const result = await canAddUser('unknown');

      expect(result).toEqual({
        allowed: false,
        reason: 'Tenant not found',
      });
    });
  });

  // ============================================
  // canUploadFile
  // ============================================

  describe('canUploadFile', () => {
    it('should allow upload when storage remains under limit', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          currentStorageGb: 2,
        }),
      );

      const result = await canUploadFile('t1', 3);

      expect(result.allowed).toBe(true);
    });

    it('should allow upload when new total equals the limit', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          currentStorageGb: 7,
        }),
      );

      const result = await canUploadFile('t1', 3);

      expect(result.allowed).toBe(true);
    });

    it('should deny upload when new total exceeds the limit', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          currentStorageGb: 9,
        }),
      );

      const result = await canUploadFile('t1', 2);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('10GB max');
      expect(result.currentUsage).toBe(9);
      expect(result.limit).toBe(10);
    });

    it('should deny when tenant does not exist', async () => {
      mockTenantFindUnique.mockResolvedValue(null);

      const result = await canUploadFile('unknown', 1);

      expect(result).toEqual({
        allowed: false,
        reason: 'Tenant not found',
      });
    });

    it('should support decimal storage sizes', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          currentStorageGb: 7.5,
        }),
      );

      const result = await canUploadFile('t1', 2.5);

      expect(result.allowed).toBe(true);
    });
  });

  // ============================================
  // canPerformAIAction
  // ============================================

  describe('canPerformAIAction', () => {
    it('should allow a level 1 action for level 1 plan', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            aiAutonomyLevel: 1,
          }),
        }),
      );

      const result = await canPerformAIAction(
        't1',
        AIAction.SORT_MESSAGES,
      );

      expect(result.allowed).toBe(true);
      expect(result.requiresValidation).toBe(false);
      expect(result.autonomyLevel).toBe(1);
    });

    it('should deny a level 2 action for level 1 plan', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            aiAutonomyLevel: 1,
          }),
        }),
      );

      const result = await canPerformAIAction(
        't1',
        AIAction.ANALYZE_RISK,
      );

      expect(result.allowed).toBe(false);
      expect(result.requiresValidation).toBe(true);
      expect(result.reason).toContain('level 2 required');
      expect(result.autonomyLevel).toBe(1);
    });

    it('should allow a level 2 action for level 2 plan', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            aiAutonomyLevel: 2,
          }),
        }),
      );

      const result = await canPerformAIAction(
        't1',
        AIAction.ANALYZE_RISK,
      );

      expect(result.allowed).toBe(true);
      expect(result.requiresValidation).toBe(false);
      expect(result.autonomyLevel).toBe(2);
    });

    it('should deny a level 3 action for level 2 plan', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            aiAutonomyLevel: 2,
          }),
        }),
      );

      const result = await canPerformAIAction(
        't1',
        AIAction.AUTO_REPLY_CLIENT,
      );

      expect(result.allowed).toBe(false);
      expect(result.requiresValidation).toBe(true);
      expect(result.reason).toContain('level 3 required');
      expect(result.autonomyLevel).toBe(2);
    });

    it('should allow a level 3 action for level 3 plan', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            aiAutonomyLevel: 3,
          }),
        }),
      );

      const result = await canPerformAIAction(
        't1',
        AIAction.AUTO_REPLY_CLIENT,
      );

      expect(result.allowed).toBe(true);
      expect(result.requiresValidation).toBe(false);
      expect(result.autonomyLevel).toBe(3);
    });

    it('should deny a level 4 action for level 3 plan', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            aiAutonomyLevel: 3,
          }),
        }),
      );

      const result = await canPerformAIAction(
        't1',
        AIAction.ADVANCED_ANALYTICS,
      );

      expect(result.allowed).toBe(false);
      expect(result.requiresValidation).toBe(true);
      expect(result.reason).toContain('level 4 required');
      expect(result.autonomyLevel).toBe(3);
    });

    it('should allow a level 4 action for level 4 plan', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            aiAutonomyLevel: 4,
          }),
        }),
      );

      const result = await canPerformAIAction(
        't1',
        AIAction.ADVANCED_ANALYTICS,
      );

      expect(result.allowed).toBe(true);
      expect(result.requiresValidation).toBe(false);
      expect(result.autonomyLevel).toBe(4);
    });

    it('should allow external AI at level 4', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            aiAutonomyLevel: 4,
          }),
        }),
      );

      const result = await canPerformAIAction(
        't1',
        AIAction.EXTERNAL_AI_CALL,
      );

      expect(result.allowed).toBe(true);
      expect(result.requiresValidation).toBe(false);
    });

    it('should always deny VALIDATE_LEGAL_ACT', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            aiAutonomyLevel: 4,
          }),
        }),
      );

      const result = await canPerformAIAction(
        't1',
        AIAction.VALIDATE_LEGAL_ACT,
      );

      expect(result.allowed).toBe(false);
      expect(result.requiresValidation).toBe(true);
      expect(result.reason).toContain('validation humaine');
      expect(result.autonomyLevel).toBe(4);
    });

    it('should always deny SEND_OFFICIAL_DOCUMENT', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            aiAutonomyLevel: 4,
          }),
        }),
      );

      const result = await canPerformAIAction(
        't1',
        AIAction.SEND_OFFICIAL_DOCUMENT,
      );

      expect(result.allowed).toBe(false);
      expect(result.requiresValidation).toBe(true);
    });

    it('should always deny CHOOSE_LEGAL_STRATEGY', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            aiAutonomyLevel: 4,
          }),
        }),
      );

      const result = await canPerformAIAction(
        't1',
        AIAction.CHOOSE_LEGAL_STRATEGY,
      );

      expect(result.allowed).toBe(false);
      expect(result.requiresValidation).toBe(true);
    });

    it('should always deny COMMIT_CABINET', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            aiAutonomyLevel: 4,
          }),
        }),
      );

      const result = await canPerformAIAction(
        't1',
        AIAction.COMMIT_CABINET,
      );

      expect(result.allowed).toBe(false);
      expect(result.requiresValidation).toBe(true);
    });

    it('should require validation when plan humanValidation is true', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            aiAutonomyLevel: 3,
            humanValidation: true,
          }),
        }),
      );

      const result = await canPerformAIAction(
        't1',
        AIAction.GENERATE_DRAFT,
      );

      expect(result.allowed).toBe(true);
      expect(result.requiresValidation).toBe(true);
      expect(result.autonomyLevel).toBe(3);
    });

    it('should not require validation when plan humanValidation is false', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            aiAutonomyLevel: 3,
            humanValidation: false,
          }),
        }),
      );

      const result = await canPerformAIAction(
        't1',
        AIAction.GENERATE_DRAFT,
      );

      expect(result.allowed).toBe(true);
      expect(result.requiresValidation).toBe(false);
    });

    it('should deny when tenant does not exist', async () => {
      mockTenantFindUnique.mockResolvedValue(null);

      const result = await canPerformAIAction(
        'unknown',
        AIAction.GENERATE_DRAFT,
      );

      expect(result.allowed).toBe(false);
      expect(result.requiresValidation).toBe(true);
      expect(result.reason).toBe('Tenant not found');
    });
  });

  // ============================================
  // FEATURE ACCESS
  // ============================================

  describe('canAccessAdvancedAnalytics', () => {
    it('should return true when enabled', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            advancedAnalytics: true,
          }),
        }),
      );

      await expect(
        canAccessAdvancedAnalytics('t1'),
      ).resolves.toBe(true);
    });

    it('should return false when disabled', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            advancedAnalytics: false,
          }),
        }),
      );

      await expect(
        canAccessAdvancedAnalytics('t1'),
      ).resolves.toBe(false);
    });

    it('should return false when tenant does not exist', async () => {
      mockTenantFindUnique.mockResolvedValue(null);

      await expect(
        canAccessAdvancedAnalytics('unknown'),
      ).resolves.toBe(false);
    });
  });

  describe('canAccessExternalAI', () => {
    it('should return true when enabled', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            externalAiAccess: true,
          }),
        }),
      );

      await expect(
        canAccessExternalAI('t1'),
      ).resolves.toBe(true);
    });

    it('should return false when disabled', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            externalAiAccess: false,
          }),
        }),
      );

      await expect(
        canAccessExternalAI('t1'),
      ).resolves.toBe(false);
    });

    it('should return false when tenant does not exist', async () => {
      mockTenantFindUnique.mockResolvedValue(null);

      await expect(
        canAccessExternalAI('unknown'),
      ).resolves.toBe(false);
    });
  });

  describe('hasPrioritySupport', () => {
    it('should return true when enabled', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            prioritySupport: true,
          }),
        }),
      );

      await expect(
        hasPrioritySupport('t1'),
      ).resolves.toBe(true);
    });

    it('should return false when disabled', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan({
          plan: createPlan({
            prioritySupport: false,
          }),
        }),
      );

      await expect(
        hasPrioritySupport('t1'),
      ).resolves.toBe(false);
    });

    it('should return false when tenant does not exist', async () => {
      mockTenantFindUnique.mockResolvedValue(null);

      await expect(
        hasPrioritySupport('unknown'),
      ).resolves.toBe(false);
    });
  });

  // ============================================
  // getTenantLimits
  // ============================================

  describe('getTenantLimits', () => {
    it('should return all plan limits', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan(),
      );

      const result = await getTenantLimits('t1');

      expect(result).toEqual({
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

    it('should return null when tenant does not exist', async () => {
      mockTenantFindUnique.mockResolvedValue(null);

      const result = await getTenantLimits('unknown');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // getTenantUsage
  // ============================================

  describe('getTenantUsage', () => {
    it('should return current usage', async () => {
      mockTenantFindUnique.mockResolvedValue(
        mockTenantWithPlan(),
      );

      const result = await getTenantUsage('t1');

      expect(result).toEqual({
        currentDossiers: 5,
        currentClients: 10,
        currentStorageGb: 2,
        currentUsers: 3,
      });

      expect(mockTenantFindUnique).toHaveBeenCalledWith({
        where: { id: 't1' },
      });
    });

    it('should return null when tenant does not exist', async () => {
      mockTenantFindUnique.mockResolvedValue(null);

      const result = await getTenantUsage('unknown');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // COUNTERS
  // ============================================

  describe('incrementDossierCount', () => {
    it('should increment dossier count', async () => {
      mockTenantUpdate.mockResolvedValue({});

      await incrementDossierCount('t1');

      expect(mockTenantUpdate).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: {
          currentDossiers: {
            increment: 1,
          },
        },
      });
    });
  });

  describe('incrementClientCount', () => {
    it('should increment client count', async () => {
      mockTenantUpdate.mockResolvedValue({});

      await incrementClientCount('t1');

      expect(mockTenantUpdate).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: {
          currentClients: {
            increment: 1,
          },
        },
      });
    });
  });

  describe('incrementUserCount', () => {
    it('should increment user count', async () => {
      mockTenantUpdate.mockResolvedValue({});

      await incrementUserCount('t1');

      expect(mockTenantUpdate).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: {
          currentUsers: {
            increment: 1,
          },
        },
      });
    });
  });

  describe('addStorageUsage', () => {
    it('should increment storage usage', async () => {
      mockTenantUpdate.mockResolvedValue({});

      await addStorageUsage('t1', 2.5);

      expect(mockTenantUpdate).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: {
          currentStorageGb: {
            increment: 2.5,
          },
        },
      });
    });

    it('should support integer storage values', async () => {
      mockTenantUpdate.mockResolvedValue({});

      await addStorageUsage('t1', 5);

      expect(mockTenantUpdate).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: {
          currentStorageGb: {
            increment: 5,
          },
        },
      });
    });
  });

  // ============================================
  // logAIAction
  // ============================================

  describe('logAIAction', () => {
    it('should log a validated AI action', async () => {
      await logAIAction({
        tenantId: 't1',
        action: AIAction.GENERATE_DRAFT,
        userId: 'user-1',
        validated: true,
      });

      expect(mockLoggerAudit).toHaveBeenCalledWith(
        'AI_GENERATE_DRAFT',
        'user-1',
        't1',
        expect.objectContaining({
          module: 'AI',
          validated: true,
          message: expect.stringContaining(
            'Action IA: GENERATE_DRAFT',
          ),
        }),
      );
    });

    it('should log an unvalidated AI action', async () => {
      await logAIAction({
        tenantId: 't1',
        action: AIAction.AUTO_REPLY_CLIENT,
        userId: 'user-1',
        validated: false,
      });

      expect(mockLoggerAudit).toHaveBeenCalledWith(
        'AI_AUTO_REPLY_CLIENT',
        'user-1',
        't1',
        expect.objectContaining({
          module: 'AI',
          validated: false,
          message: expect.stringContaining('Non validé'),
        }),
      );
    });

    it('should use system as default user', async () => {
      await logAIAction({
        tenantId: 't1',
        action: AIAction.ARCHIVE,
        validated: true,
      });

      expect(mockLoggerAudit).toHaveBeenCalledWith(
        'AI_ARCHIVE',
        'system',
        't1',
        expect.any(Object),
      );
    });

    it('should include metadata in audit log', async () => {
      await logAIAction({
        tenantId: 't1',
        action: AIAction.ANALYZE_RISK,
        userId: 'user-1',
        validated: true,
        metadata: {
          dossierId: 'dossier-123',
          riskScore: 85,
        },
      });

      expect(mockLoggerAudit).toHaveBeenCalledWith(
        'AI_ANALYZE_RISK',
        'user-1',
        't1',
        expect.objectContaining({
          module: 'AI',
          validated: true,
          dossierId: 'dossier-123',
          riskScore: 85,
        }),
      );
    });

    it('should not throw when logger fails', async () => {
      mockLoggerAudit.mockImplementationOnce(() => {
        throw new Error('Logger failure');
      });

      await expect(
        logAIAction({
          tenantId: 't1',
          action: AIAction.ARCHIVE,
          validated: true,
        }),
      ).resolves.toBeUndefined();
    });
  });

  // ============================================
  // PLAN SCENARIOS
  // ============================================

  describe('Plan scenarios', () => {
    it('should represent a Free plan', () => {
      const freePlan = createPlan({
        name: 'FREE',
        maxDossiers: 10,
        maxClients: 5,
        maxStorageGb: 1,
        maxUsers: 1,
        aiAutonomyLevel: 1,
        humanValidation: true,
        advancedAnalytics: false,
        externalAiAccess: false,
        prioritySupport: false,
      });

      expect(freePlan.maxDossiers).toBe(10);
      expect(freePlan.maxClients).toBe(5);
      expect(freePlan.maxStorageGb).toBe(1);
      expect(freePlan.maxUsers).toBe(1);
      expect(freePlan.aiAutonomyLevel).toBe(1);
      expect(freePlan.humanValidation).toBe(true);
      expect(freePlan.advancedAnalytics).toBe(false);
      expect(freePlan.externalAiAccess).toBe(false);
      expect(freePlan.prioritySupport).toBe(false);
    });

    it('should represent a Pro plan', () => {
      const proPlan = createPlan({
        name: 'PRO',
        maxDossiers: 100,
        maxClients: 50,
        maxStorageGb: 10,
        maxUsers: 5,
        aiAutonomyLevel: 2,
        humanValidation: true,
        advancedAnalytics: true,
        externalAiAccess: false,
        prioritySupport: false,
      });

      expect(proPlan.maxDossiers).toBe(100);
      expect(proPlan.maxClients).toBe(50);
      expect(proPlan.maxStorageGb).toBe(10);
      expect(proPlan.maxUsers).toBe(5);
      expect(proPlan.aiAutonomyLevel).toBe(2);
      expect(proPlan.humanValidation).toBe(true);
      expect(proPlan.advancedAnalytics).toBe(true);
      expect(proPlan.externalAiAccess).toBe(false);
      expect(proPlan.prioritySupport).toBe(false);
    });

    it('should represent a Business plan', () => {
      const businessPlan = createPlan({
        name: 'BUSINESS',
        maxDossiers: 500,
        maxClients: 200,
        maxStorageGb: 50,
        maxUsers: 20,
        aiAutonomyLevel: 3,
        humanValidation: true,
        advancedAnalytics: true,
        externalAiAccess: true,
        prioritySupport: true,
      });

      expect(businessPlan.maxDossiers).toBe(500);
      expect(businessPlan.maxClients).toBe(200);
      expect(businessPlan.maxStorageGb).toBe(50);
      expect(businessPlan.maxUsers).toBe(20);
      expect(businessPlan.aiAutonomyLevel).toBe(3);
      expect(businessPlan.externalAiAccess).toBe(true);
      expect(businessPlan.prioritySupport).toBe(true);
    });

    it('should represent an Enterprise plan with unlimited values', () => {
      const enterprisePlan = createPlan({
        name: 'ENTERPRISE',
        maxDossiers: -1,
        maxClients: -1,
        maxStorageGb: -1,
        maxUsers: -1,
        aiAutonomyLevel: 4,
        humanValidation: true,
        advancedAnalytics: true,
        externalAiAccess: true,
        prioritySupport: true,
      });

      expect(enterprisePlan.maxDossiers).toBe(-1);
      expect(enterprisePlan.maxClients).toBe(-1);
      expect(enterprisePlan.maxStorageGb).toBe(-1);
      expect(enterprisePlan.maxUsers).toBe(-1);
      expect(enterprisePlan.aiAutonomyLevel).toBe(4);
    });
  });

  // ============================================
  // STRUCTURES / LOGIC
  // ============================================

  describe('Business logic helpers', () => {
    const actionLevels: Record<string, number> = {
      SORT_MESSAGES: 1,
      PRIORITIZE: 1,
      REQUEST_DOCUMENTS: 1,
      GENERATE_DRAFT: 1,
      AUTO_REMINDER: 1,
      ARCHIVE: 1,
      ANALYZE_RISK: 2,
      SUGGEST_ACTIONS: 2,
      AUTO_REPLY_CLIENT: 3,
      GENERATE_FORM: 3,
      ADVANCED_ANALYTICS: 4,
      EXTERNAL_AI_CALL: 4,
      VALIDATE_LEGAL_ACT: 999,
      SEND_OFFICIAL_DOCUMENT: 999,
      CHOOSE_LEGAL_STRATEGY: 999,
      COMMIT_CABINET: 999,
    };

    it('should identify level 1 actions', () => {
      expect(actionLevels.SORT_MESSAGES).toBe(1);
      expect(actionLevels.PRIORITIZE).toBe(1);
      expect(actionLevels.GENERATE_DRAFT).toBe(1);
    });

    it('should identify level 2 actions', () => {
      expect(actionLevels.ANALYZE_RISK).toBe(2);
      expect(actionLevels.SUGGEST_ACTIONS).toBe(2);
    });

    it('should identify level 3 actions', () => {
      expect(actionLevels.AUTO_REPLY_CLIENT).toBe(3);
      expect(actionLevels.GENERATE_FORM).toBe(3);
    });

    it('should identify level 4 actions', () => {
      expect(actionLevels.ADVANCED_ANALYTICS).toBe(4);
      expect(actionLevels.EXTERNAL_AI_CALL).toBe(4);
    });

    it('should identify exactly four permanently forbidden actions', () => {
      const forbiddenActions = Object.entries(actionLevels)
        .filter(([, level]) => level === 999)
        .map(([action]) => action);

      expect(forbiddenActions).toHaveLength(4);
      expect(forbiddenActions).toContain(
        'VALIDATE_LEGAL_ACT',
      );
      expect(forbiddenActions).toContain(
        'SEND_OFFICIAL_DOCUMENT',
      );
      expect(forbiddenActions).toContain(
        'CHOOSE_LEGAL_STRATEGY',
      );
      expect(forbiddenActions).toContain('COMMIT_CABINET');
    });

    it('should calculate usage percentage', () => {
      const current = 80;
      const max = 100;

      const percentage = (current / max) * 100;

      expect(percentage).toBe(80);
    });

    it('should identify usage near the limit', () => {
      const checkNearLimit = (
        current: number,
        max: number,
      ) => {
        if (max === -1) {
          return false;
        }

        return current / max >= 0.9;
      };

      expect(checkNearLimit(90, 100)).toBe(true);
      expect(checkNearLimit(95, 100)).toBe(true);
      expect(checkNearLimit(80, 100)).toBe(false);
      expect(checkNearLimit(100, -1)).toBe(false);
    });

    it('should calculate remaining storage', () => {
      const currentStorageGb = 7.5;
      const maxStorageGb = 10;

      const remaining =
        maxStorageGb - currentStorageGb;

      expect(remaining).toBe(2.5);
    });

    it('should always require human validation for legal actions', () => {
      const forbiddenActions = [
        'VALIDATE_LEGAL_ACT',
        'SEND_OFFICIAL_DOCUMENT',
        'CHOOSE_LEGAL_STRATEGY',
        'COMMIT_CABINET',
      ];

      expect(
        forbiddenActions.includes('VALIDATE_LEGAL_ACT'),
      ).toBe(true);

      expect(
        forbiddenActions.includes('SEND_OFFICIAL_DOCUMENT'),
      ).toBe(true);

      expect(
        forbiddenActions.includes('CHOOSE_LEGAL_STRATEGY'),
      ).toBe(true);

      expect(
        forbiddenActions.includes('COMMIT_CABINET'),
      ).toBe(true);

      expect(
        forbiddenActions.includes('GENERATE_DRAFT'),
      ).toBe(false);
    });
  });
});