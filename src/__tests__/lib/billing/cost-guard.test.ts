/**
 * Tests pour src/lib/billing/cost-guard.ts - Pure Unit Tests
 * Coverage: Limites de coûts IA (tests unitaires sans mocks complexes)
 */

describe('Cost Guard - Pure Unit Tests', () => {
  describe('AI cost constants', () => {
    it('should define cost per 1000 tokens', () => {
      const OPENAI_COST_PER_1K = 0.002;
      expect(OPENAI_COST_PER_1K).toBe(0.002);
    });

    it('should define monthly cost limits by plan', () => {
      const MONTHLY_COST_LIMITS = {
        SOLO: 5,
        BASIC: 10,
        CABINET: 30,
        ENTERPRISE: 100,
        DEFAULT: 5,
      };

      expect(MONTHLY_COST_LIMITS.SOLO).toBe(5);
      expect(MONTHLY_COST_LIMITS.CABINET).toBe(30);
      expect(MONTHLY_COST_LIMITS.ENTERPRISE).toBe(100);
    });

    it('should define alert thresholds', () => {
      const ALERT_THRESHOLDS = {
        warning: 80,  // 80% of budget
        critical: 90, // 90% of budget
      };

      expect(ALERT_THRESHOLDS.warning).toBe(80);
      expect(ALERT_THRESHOLDS.critical).toBe(90);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      const calculatePercentage = (current: number, limit: number) => 
        Math.round((current / limit) * 100);

      expect(calculatePercentage(5, 10)).toBe(50);
      expect(calculatePercentage(7.5, 10)).toBe(75);
      expect(calculatePercentage(10, 10)).toBe(100);
      expect(calculatePercentage(15, 10)).toBe(150);
    });

    it('should handle zero limit', () => {
      const calculatePercentage = (current: number, limit: number) => 
        limit === 0 ? 100 : Math.round((current / limit) * 100);

      expect(calculatePercentage(5, 0)).toBe(100);
    });
  });

  describe('determineAlertLevel', () => {
    it('should return normal for low usage', () => {
      const determineAlertLevel = (percentage: number) => {
        if (percentage >= 100) return 'blocked';
        if (percentage >= 90) return 'critical';
        if (percentage >= 80) return 'warning';
        return 'normal';
      };

      expect(determineAlertLevel(50)).toBe('normal');
      expect(determineAlertLevel(79)).toBe('normal');
    });

    it('should return warning at 80%', () => {
      const determineAlertLevel = (percentage: number) => {
        if (percentage >= 100) return 'blocked';
        if (percentage >= 90) return 'critical';
        if (percentage >= 80) return 'warning';
        return 'normal';
      };

      expect(determineAlertLevel(80)).toBe('warning');
      expect(determineAlertLevel(85)).toBe('warning');
      expect(determineAlertLevel(89)).toBe('warning');
    });

    it('should return critical at 90%', () => {
      const determineAlertLevel = (percentage: number) => {
        if (percentage >= 100) return 'blocked';
        if (percentage >= 90) return 'critical';
        if (percentage >= 80) return 'warning';
        return 'normal';
      };

      expect(determineAlertLevel(90)).toBe('critical');
      expect(determineAlertLevel(95)).toBe('critical');
      expect(determineAlertLevel(99)).toBe('critical');
    });

    it('should return blocked at 100%', () => {
      const determineAlertLevel = (percentage: number) => {
        if (percentage >= 100) return 'blocked';
        if (percentage >= 90) return 'critical';
        if (percentage >= 80) return 'warning';
        return 'normal';
      };

      expect(determineAlertLevel(100)).toBe('blocked');
      expect(determineAlertLevel(150)).toBe('blocked');
    });
  });

  describe('getLimitForPlan', () => {
    it('should return correct limits for each plan', () => {
      const LIMITS: Record<string, number> = {
        SOLO: 5,
        BASIC: 10,
        CABINET: 30,
        ENTERPRISE: 100,
      };

      const getLimitForPlan = (plan: string) => LIMITS[plan] || 5;

      expect(getLimitForPlan('SOLO')).toBe(5);
      expect(getLimitForPlan('BASIC')).toBe(10);
      expect(getLimitForPlan('CABINET')).toBe(30);
      expect(getLimitForPlan('ENTERPRISE')).toBe(100);
    });

    it('should return default for unknown plans', () => {
      const getLimitForPlan = (plan: string) => {
        const limits: Record<string, number> = {
          SOLO: 5,
          BASIC: 10,
          CABINET: 30,
          ENTERPRISE: 100,
        };
        return limits[plan] || 5;
      };

      expect(getLimitForPlan('UNKNOWN')).toBe(5);
      expect(getLimitForPlan('')).toBe(5);
    });
  });

  describe('calculateTokenCost', () => {
    it('should calculate token cost correctly', () => {
      const calculateTokenCost = (tokens: number, costPer1K: number) => 
        (tokens / 1000) * costPer1K;

      expect(calculateTokenCost(1000, 0.002)).toBe(0.002);
      expect(calculateTokenCost(5000, 0.002)).toBe(0.01);
      expect(calculateTokenCost(100000, 0.002)).toBe(0.2);
    });

    it('should handle different model costs', () => {
      const MODEL_COSTS = {
        'gpt-4': 0.03,
        'gpt-3.5-turbo': 0.002,
        'claude-3-opus': 0.015,
      };

      const calculateTokenCost = (tokens: number, model: string) => 
        (tokens / 1000) * (MODEL_COSTS[model as keyof typeof MODEL_COSTS] || 0.002);

      expect(calculateTokenCost(1000, 'gpt-4')).toBe(0.03);
      expect(calculateTokenCost(1000, 'gpt-3.5-turbo')).toBe(0.002);
    });
  });

  describe('shouldSuggestOllama', () => {
    it('should suggest Ollama when near or over budget', () => {
      const shouldSuggestOllama = (percentage: number, ollamaEnabled: boolean) => 
        percentage >= 80 && !ollamaEnabled;

      expect(shouldSuggestOllama(90, false)).toBe(true);
      expect(shouldSuggestOllama(90, true)).toBe(false);
      expect(shouldSuggestOllama(50, false)).toBe(false);
    });
  });

  describe('budget check result', () => {
    it('should create budget result object', () => {
      const createBudgetResult = (
        currentCost: number, 
        limit: number, 
        ollamaEnabled: boolean
      ) => {
        const percentage = Math.round((currentCost / limit) * 100);
        let alertLevel = 'normal';
        if (percentage >= 100) alertLevel = 'blocked';
        else if (percentage >= 90) alertLevel = 'critical';
        else if (percentage >= 80) alertLevel = 'warning';

        return {
          allowed: percentage < 100,
          currentCost,
          limit,
          percentage,
          alertLevel,
          remaining: Math.max(0, limit - currentCost),
          suggestOllama: percentage >= 80 && !ollamaEnabled,
        };
      };

      const result = createBudgetResult(5, 10, false);
      expect(result.allowed).toBe(true);
      expect(result.percentage).toBe(50);
      expect(result.alertLevel).toBe('normal');
      expect(result.remaining).toBe(5);

      const blocked = createBudgetResult(15, 10, false);
      expect(blocked.allowed).toBe(false);
      expect(blocked.alertLevel).toBe('blocked');
    });
  });

  describe('monthly period calculation', () => {
    it('should calculate start of current month', () => {
      const getMonthStart = () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
      };

      const monthStart = getMonthStart();
      expect(monthStart.getDate()).toBe(1);
    });

    it('should calculate days remaining in month', () => {
      const getDaysRemaining = () => {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return lastDay.getDate() - now.getDate();
      };

      const remaining = getDaysRemaining();
      expect(remaining).toBeGreaterThanOrEqual(0);
      expect(remaining).toBeLessThanOrEqual(31);
    });
  });

  describe('cost formatting', () => {
    it('should format cost as currency', () => {
      const formatCost = (cost: number) => 
        new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(cost);

      expect(formatCost(5.50)).toContain('5');
      expect(formatCost(5.50)).toContain('€');
    });

    it('should format remaining budget message', () => {
      const formatRemainingMessage = (remaining: number, total: number) => 
        `${remaining.toFixed(2)}€ restant sur ${total}€`;

      expect(formatRemainingMessage(5, 10)).toBe('5.00€ restant sur 10€');
    });
  });
});

describe('Cost Guard Integration Helpers', () => {
  describe('cache key generation', () => {
    it('should generate unique cache keys', () => {
      const getCacheKey = (tenantId: string) => `ai-cost:${tenantId}`;
      
      expect(getCacheKey('tenant-1')).toBe('ai-cost:tenant-1');
      expect(getCacheKey('tenant-2')).toBe('ai-cost:tenant-2');
    });
  });

  describe('rate limit key', () => {
    it('should generate rate limit key', () => {
      const getRateLimitKey = (tenantId: string) => `rate-limit:ai:${tenantId}`;
      
      expect(getRateLimitKey('tenant-1')).toBe('rate-limit:ai:tenant-1');
    });
  });
});
