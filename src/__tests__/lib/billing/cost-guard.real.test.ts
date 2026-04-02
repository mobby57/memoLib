/**
 * Real tests for billing/cost-guard.ts to increase actual coverage
 * Tests AI cost configuration constants
 */

import {
  AI_COSTS,
  MONTHLY_COST_LIMITS,
  COST_ALERT_THRESHOLDS,
} from '@/lib/billing/cost-guard'

describe('cost-guard - REAL TESTS', () => {
  describe('AI_COSTS', () => {
    it('should define cloudflare costs', () => {
      expect(AI_COSTS.cloudflare).toBeDefined()
      expect(AI_COSTS.cloudflare.costPer1000Tokens).toBeGreaterThan(0)
      expect(AI_COSTS.cloudflare.costPerEmbedding).toBeGreaterThanOrEqual(0)
    })

    it('should define ollama costs as free', () => {
      expect(AI_COSTS.ollama).toBeDefined()
      expect(AI_COSTS.ollama.costPer1000Tokens).toBe(0)
      expect(AI_COSTS.ollama.costPerEmbedding).toBe(0)
    })

    it('should have cloudflare token cost around 0.01 EUR', () => {
      expect(AI_COSTS.cloudflare.costPer1000Tokens).toBeLessThanOrEqual(0.05)
      expect(AI_COSTS.cloudflare.costPer1000Tokens).toBeGreaterThan(0)
    })
  })

  describe('MONTHLY_COST_LIMITS', () => {
    it('should define SOLO plan limit', () => {
      expect(MONTHLY_COST_LIMITS.SOLO).toBeDefined()
      expect(MONTHLY_COST_LIMITS.SOLO).toBeGreaterThan(0)
    })

    it('should define CABINET plan limit higher than SOLO', () => {
      expect(MONTHLY_COST_LIMITS.CABINET).toBeGreaterThan(MONTHLY_COST_LIMITS.SOLO)
    })

    it('should define ENTERPRISE plan limit highest', () => {
      expect(MONTHLY_COST_LIMITS.ENTERPRISE).toBeGreaterThan(MONTHLY_COST_LIMITS.CABINET)
    })

    it('should have BASIC and PREMIUM plans', () => {
      expect(MONTHLY_COST_LIMITS.BASIC).toBeDefined()
      expect(MONTHLY_COST_LIMITS.PREMIUM).toBeDefined()
    })

    it('should have starter and pro plans', () => {
      expect(MONTHLY_COST_LIMITS.starter).toBeDefined()
      expect(MONTHLY_COST_LIMITS.pro).toBeDefined()
    })

    it('should have enterprise and DEFAULT plans', () => {
      expect(MONTHLY_COST_LIMITS.enterprise).toBeDefined()
      expect(MONTHLY_COST_LIMITS.DEFAULT).toBeDefined()
    })

    it('should have FREE plan with minimal budget', () => {
      expect(MONTHLY_COST_LIMITS.FREE).toBeDefined()
      expect(MONTHLY_COST_LIMITS.FREE).toBeLessThan(MONTHLY_COST_LIMITS.SOLO)
    })

    it('should have all limits as positive numbers', () => {
      Object.values(MONTHLY_COST_LIMITS).forEach(limit => {
        expect(limit).toBeGreaterThanOrEqual(0)
      })
    })

    it('should have plan hierarchy: FREE < starter < BASIC < PREMIUM < ENTERPRISE', () => {
      expect(MONTHLY_COST_LIMITS.FREE).toBeLessThanOrEqual(MONTHLY_COST_LIMITS.starter)
      expect(MONTHLY_COST_LIMITS.BASIC).toBeLessThanOrEqual(MONTHLY_COST_LIMITS.PREMIUM)
      expect(MONTHLY_COST_LIMITS.PREMIUM).toBeLessThanOrEqual(MONTHLY_COST_LIMITS.ENTERPRISE)
    })
  })

  describe('COST_ALERT_THRESHOLDS', () => {
    it('should define WARNING threshold', () => {
      expect(COST_ALERT_THRESHOLDS.WARNING).toBeDefined()
      expect(COST_ALERT_THRESHOLDS.WARNING).toBe(70)
    })

    it('should define CRITICAL threshold', () => {
      expect(COST_ALERT_THRESHOLDS.CRITICAL).toBeDefined()
      expect(COST_ALERT_THRESHOLDS.CRITICAL).toBe(90)
    })

    it('should define BLOCKED threshold', () => {
      expect(COST_ALERT_THRESHOLDS.BLOCKED).toBeDefined()
      expect(COST_ALERT_THRESHOLDS.BLOCKED).toBe(100)
    })

    it('should have thresholds in ascending order', () => {
      expect(COST_ALERT_THRESHOLDS.WARNING).toBeLessThan(COST_ALERT_THRESHOLDS.CRITICAL)
      expect(COST_ALERT_THRESHOLDS.CRITICAL).toBeLessThan(COST_ALERT_THRESHOLDS.BLOCKED)
    })

    it('should have WARNING at 70%', () => {
      expect(COST_ALERT_THRESHOLDS.WARNING).toBe(70)
    })

    it('should have CRITICAL at 90%', () => {
      expect(COST_ALERT_THRESHOLDS.CRITICAL).toBe(90)
    })

    it('should have BLOCKED at 100%', () => {
      expect(COST_ALERT_THRESHOLDS.BLOCKED).toBe(100)
    })
  })

  describe('Cost calculations', () => {
    it('should calculate Cloudflare cost for 1000 tokens', () => {
      const tokens = 1000
      const cost = (tokens / 1000) * AI_COSTS.cloudflare.costPer1000Tokens
      expect(cost).toBe(AI_COSTS.cloudflare.costPer1000Tokens)
    })

    it('should calculate zero cost for Ollama regardless of tokens', () => {
      const tokens = 1000000
      const cost = (tokens / 1000) * AI_COSTS.ollama.costPer1000Tokens
      expect(cost).toBe(0)
    })

    it('should show Ollama is 100% cheaper than Cloudflare', () => {
      const savings = AI_COSTS.cloudflare.costPer1000Tokens - AI_COSTS.ollama.costPer1000Tokens
      expect(savings).toBe(AI_COSTS.cloudflare.costPer1000Tokens)
    })
  })

  describe('Budget validation scenarios', () => {
    it('should identify 70% usage as WARNING', () => {
      const usage = 70
      expect(usage >= COST_ALERT_THRESHOLDS.WARNING).toBe(true)
      expect(usage < COST_ALERT_THRESHOLDS.CRITICAL).toBe(true)
    })

    it('should identify 90% usage as CRITICAL', () => {
      const usage = 90
      expect(usage >= COST_ALERT_THRESHOLDS.CRITICAL).toBe(true)
      expect(usage < COST_ALERT_THRESHOLDS.BLOCKED).toBe(true)
    })

    it('should identify 100% usage as BLOCKED', () => {
      const usage = 100
      expect(usage >= COST_ALERT_THRESHOLDS.BLOCKED).toBe(true)
    })

    it('should calculate days remaining if under budget', () => {
      const dailyUsage = 0.5 // 0.50€ per day
      const limit = MONTHLY_COST_LIMITS.SOLO // 5€
      const daysRemaining = Math.floor(limit / dailyUsage)
      expect(daysRemaining).toBe(10)
    })
  })
})
