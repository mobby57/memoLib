/**
 * Tests exhaustifs pour src/lib/billing/cost-guard.ts
 * Objectif: couvrir 100% du module
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      tenant: {
        findUnique: vi.fn(),
    aIDecision: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
      },
      aIUsageLog: {
        aggregate: vi.fn(),
        create: vi.fn(),
        groupBy: vi.fn(),
      },
    },
  };
});

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { prisma as mockPrismaImport } from '@/lib/prisma';
const mockPrisma = mockPrismaImport as any;

import {
  AI_COSTS,
  MONTHLY_COST_LIMITS,
  COST_ALERT_THRESHOLDS,
  checkAICostBudget,
  checkAICostLimit,
  recordAIUsage,
  estimateCost,
  selectOptimalProvider,
  getCostDashboard,
  checkTenantProfitability,
} from '@/lib/billing/cost-guard';

describe('cost-guard.ts — Full Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constants', () => {
    it('should define costs for all providers', () => {
      expect(AI_COSTS.ollama.costPer1000Tokens).toBe(0);
      expect(AI_COSTS.cloudflare.costPer1000Tokens).toBeGreaterThan(0);
      expect(AI_COSTS.openai.costPer1000Tokens).toBeGreaterThan(0);
      expect(AI_COSTS.mistral.costPer1000Tokens).toBeGreaterThan(0);
      expect(AI_COSTS.anthropic.costPer1000Tokens).toBeGreaterThan(0);
    });

    it('should define limits for all plans', () => {
      expect(MONTHLY_COST_LIMITS.SOLO).toBe(5);
      expect(MONTHLY_COST_LIMITS.CABINET).toBe(15);
      expect(MONTHLY_COST_LIMITS.ENTERPRISE).toBe(40);
      expect(MONTHLY_COST_LIMITS.FREE).toBe(0.5);
      expect(MONTHLY_COST_LIMITS.DEFAULT).toBe(5);
    });

    it('should define alert thresholds', () => {
      expect(COST_ALERT_THRESHOLDS.WARNING).toBe(70);
      expect(COST_ALERT_THRESHOLDS.CRITICAL).toBe(90);
      expect(COST_ALERT_THRESHOLDS.BLOCKED).toBe(100);
    });
  });

  describe('checkAICostBudget', () => {
    it('should allow demo mode without limits', async () => {
      const result = await checkAICostBudget('demo');
      expect(result.allowed).toBe(true);
      expect(result.alertLevel).toBe('normal');
      expect(result.suggestOllama).toBe(false);
      expect(result.percentage).toBe(0);
    });

    it('should allow empty tenantId (demo mode)', async () => {
      const result = await checkAICostBudget('');
      expect(result.allowed).toBe(true);
      expect(result.alertLevel).toBe('normal');
    });

    it('should block when tenant not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      const result = await checkAICostBudget('unknown-tenant');
      expect(result.allowed).toBe(false);
      expect(result.alertLevel).toBe('blocked');
      expect(result.suggestOllama).toBe(true);
    });

    it('should block when tenant has no plan', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: 't1', plan: null, settings: null });
      const result = await checkAICostBudget('t1');
      expect(result.allowed).toBe(false);
      expect(result.alertLevel).toBe('blocked');
    });

    it('should block when ollamaEnabled is false in settings', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'SOLO' },
        settings: { ollamaEnabled: false },
      });
      const result = await checkAICostBudget('t1');
      expect(result.allowed).toBe(false);
      expect(result.alertLevel).toBe('blocked');
      expect(result.suggestOllama).toBe(true);
    });

    it('should return normal when cost is low', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'SOLO' },
        settings: { ollamaEnabled: true },
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 1 } });

      const result = await checkAICostBudget('t1');
      expect(result.allowed).toBe(true);
      expect(result.alertLevel).toBe('normal');
      expect(result.currentCost).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.percentage).toBe(20);
      expect(result.suggestOllama).toBe(false);
    });

    it('should return warning when cost is at 70%', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'SOLO' },
        settings: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 3.5 } }); // 70% of 5

      const result = await checkAICostBudget('t1');
      expect(result.alertLevel).toBe('warning');
      expect(result.suggestOllama).toBe(true);
      expect(result.allowed).toBe(true);
    });

    it('should return critical when cost is at 90%', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'SOLO' },
        settings: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 4.5 } }); // 90% of 5

      const result = await checkAICostBudget('t1');
      expect(result.alertLevel).toBe('critical');
      expect(result.allowed).toBe(true);
    });

    it('should return blocked when cost is at 100%', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'SOLO' },
        settings: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 5 } }); // 100% of 5

      const result = await checkAICostBudget('t1');
      expect(result.alertLevel).toBe('blocked');
      expect(result.allowed).toBe(false);
    });

    it('should use DEFAULT limit for unknown plans', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'UNKNOWN_PLAN' },
        settings: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 0 } });

      const result = await checkAICostBudget('t1');
      expect(result.limit).toBe(5); // DEFAULT
    });

    it('should handle null costEur sum (no records)', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'SOLO' },
        settings: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: null } });

      const result = await checkAICostBudget('t1');
      expect(result.currentCost).toBe(0);
    });

    it('should handle DB error in getMonthlyAICost gracefully', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'SOLO' },
        settings: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockRejectedValue(new Error('Table not found'));

      const result = await checkAICostBudget('t1');
      expect(result.currentCost).toBe(0);
      expect(result.allowed).toBe(true);
    });
  });

  describe('checkAICostLimit (alias)', () => {
    it('should be an alias for checkAICostBudget', () => {
      expect(checkAICostLimit).toBe(checkAICostBudget);
    });
  });

  describe('recordAIUsage', () => {
    it('should record usage to database', async () => {
      mockPrisma.aIUsageLog.create.mockResolvedValue({});

      await recordAIUsage({
        tenantId: 't1',
        provider: 'cloudflare',
        tokensUsed: 500,
        costEur: 0.005,
        operation: 'summarize',
        timestamp: new Date(),
      });

      expect(mockPrisma.aIUsageLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 't1',
          provider: 'cloudflare',
          tokensUsed: 500,
          costEur: 0.005,
          operation: 'summarize',
        }),
      });
    });

    it('should log significant costs (> 0.01)', async () => {
      const { logger } = await import('@/lib/logger');
      mockPrisma.aIUsageLog.create.mockResolvedValue({});

      await recordAIUsage({
        tenantId: 't1',
        provider: 'cloudflare',
        tokensUsed: 5000,
        costEur: 0.05,
        operation: 'generate',
        timestamp: new Date(),
      });

      expect(logger.info).toHaveBeenCalledWith('AI usage recorded', expect.objectContaining({
        tenantId: 't1',
        cost: '0.0500€',
      }));
    });

    it('should not log insignificant costs (<= 0.01)', async () => {
      const { logger } = await import('@/lib/logger');
      mockPrisma.aIUsageLog.create.mockResolvedValue({});

      await recordAIUsage({
        tenantId: 't1',
        provider: 'ollama',
        tokensUsed: 100,
        costEur: 0.001,
        operation: 'classify',
        timestamp: new Date(),
      });

      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should handle DB error gracefully', async () => {
      const { logger } = await import('@/lib/logger');
      mockPrisma.aIUsageLog.create.mockRejectedValue(new Error('DB down'));

      await recordAIUsage({
        tenantId: 't1',
        provider: 'ollama',
        tokensUsed: 100,
        costEur: 0,
        operation: 'test',
        timestamp: new Date(),
      });

      expect(logger.warn).toHaveBeenCalledWith(
        'Could not record AI usage (table may not exist)',
        expect.anything()
      );
    });
  });

  describe('estimateCost', () => {
    it('should return 0 for ollama', () => {
      expect(estimateCost('ollama', 1000)).toBe(0);
      expect(estimateCost('ollama', 100000)).toBe(0);
    });

    it('should calculate cost for cloudflare', () => {
      const cost = estimateCost('cloudflare', 1000);
      expect(cost).toBe(0.01); // 1000/1000 * 0.01
    });

    it('should scale linearly with tokens', () => {
      const cost1k = estimateCost('cloudflare', 1000);
      const cost5k = estimateCost('cloudflare', 5000);
      expect(cost5k).toBe(cost1k * 5);
    });
  });

  describe('selectOptimalProvider', () => {
    it('should return ollama when budget is tight', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'SOLO' },
        settings: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 4 } }); // 80% -> warning

      const provider = await selectOptimalProvider('t1', 1000);
      expect(provider).toBe('ollama');
    });

    it('should return ollama when budget is blocked', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'SOLO' },
        settings: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 5 } }); // 100%

      const provider = await selectOptimalProvider('t1', 1000);
      expect(provider).toBe('ollama');
    });

    it('should return cloudflare when budget is healthy', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'ENTERPRISE' },
        settings: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 1 } }); // 2.5% of 40

      const provider = await selectOptimalProvider('t1', 1000);
      expect(provider).toBe('cloudflare');
    });

    it('should return ollama when operation cost exceeds 10% of remaining budget', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'FREE' }, // limit: 0.50
        settings: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 0.1 } });
      // remaining = 0.40, 10% of that = 0.04
      // cloudflare cost for 10000 tokens = 0.1 > 0.04

      const provider = await selectOptimalProvider('t1', 10000);
      expect(provider).toBe('ollama');
    });
  });

  describe('getCostDashboard', () => {
    it('should return full dashboard with stats', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'CABINET' },
        settings: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 5 } });
      mockPrisma.aIUsageLog.groupBy.mockResolvedValue([
        { provider: 'ollama', _sum: { costEur: 1 } },
        { provider: 'cloudflare', _sum: { costEur: 4 } },
      ]);

      const dashboard = await getCostDashboard('t1');

      expect(dashboard.currentMonth.cost).toBe(5);
      expect(dashboard.currentMonth.limit).toBe(15);
      expect(dashboard.currentMonth.status).toBeDefined();
      expect(dashboard.byProvider.ollama).toBe(1);
      expect(dashboard.byProvider.cloudflare).toBe(4);
      expect(dashboard.recommendations).toBeInstanceOf(Array);
      expect(dashboard.projectedEndOfMonth).toBeGreaterThan(0);
    });

    it('should handle groupBy error gracefully', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'SOLO' },
        settings: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 0 } });
      mockPrisma.aIUsageLog.groupBy.mockRejectedValue(new Error('Table not found'));

      const dashboard = await getCostDashboard('t1');
      expect(dashboard.byProvider).toEqual({ ollama: 0, cloudflare: 0 });
    });

    it('should generate blocked recommendation', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'FREE' }, // limit: 0.5
        settings: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 0.5 } }); // 100%
      mockPrisma.aIUsageLog.groupBy.mockResolvedValue([]);

      const dashboard = await getCostDashboard('t1');
      expect(dashboard.recommendations.some(r => r.includes('Budget IA épuisé'))).toBe(true);
    });

    it('should recommend Ollama when cloudflare usage > ollama', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'SOLO' },
        settings: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 2 } }); // 40%
      mockPrisma.aIUsageLog.groupBy.mockResolvedValue([
        { provider: 'cloudflare', _sum: { costEur: 1.5 } },
        { provider: 'ollama', _sum: { costEur: 0.5 } },
      ]);

      const dashboard = await getCostDashboard('t1');
      expect(dashboard.recommendations.some(r => r.includes('Ollama localement'))).toBe(true);
    });

    it('should recommend Ollama prioritaire when usage >= 50%', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'SOLO' },
        settings: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 3 } }); // 60%
      mockPrisma.aIUsageLog.groupBy.mockResolvedValue([]);

      const dashboard = await getCostDashboard('t1');
      expect(dashboard.recommendations.some(r => r.includes('Ollama prioritaire'))).toBe(true);
    });

    it('should show positive message when usage < 30%', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'ENTERPRISE' },
        settings: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 2 } }); // 5% of 40
      mockPrisma.aIUsageLog.groupBy.mockResolvedValue([]);

      const dashboard = await getCostDashboard('t1');
      expect(dashboard.recommendations.some(r => r.includes('économique'))).toBe(true);
    });
  });

  describe('checkTenantProfitability', () => {
    it('should return not profitable when tenant not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      const result = await checkTenantProfitability('unknown');
      expect(result.profitable).toBe(false);
      expect(result.revenue).toBe(0);
      expect(result.margin).toBe(0);
    });

    it('should return not profitable when tenant has no plan', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: 't1', plan: null, subscription: null });

      const result = await checkTenantProfitability('t1');
      expect(result.profitable).toBe(false);
    });

    it('should calculate profitability correctly', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'CABINET', priceMonthly: 79 },
        subscription: {},
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 10 } });

      const result = await checkTenantProfitability('t1');
      expect(result.profitable).toBe(true);
      expect(result.revenue).toBe(79);
      expect(result.aiCosts).toBe(10);
      expect(result.margin).toBe(69);
      expect(result.marginPercentage).toBeCloseTo(87.34, 1);
    });

    it('should detect unprofitable tenant', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't1',
        plan: { name: 'FREE', priceMonthly: 0 },
        subscription: null,
      });
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 2 } });

      const result = await checkTenantProfitability('t1');
      expect(result.profitable).toBe(false);
      expect(result.margin).toBe(-2);
      expect(result.marginPercentage).toBe(0); // priceMonthly = 0
    });
  });
});
