/**
 * Real tests for rate-limiter.ts to increase actual coverage
 * Tests rate limiting, blocking, and adaptive throttling
 */

import {
  RATE_LIMITS,
  checkRateLimit,
  rateLimitMiddleware,
  cleanupRateLimitStore,
  getAdaptiveRateLimit,
} from '@/lib/security/rate-limiter'

describe('rate-limiter - REAL TESTS', () => {
  // Clear stores before each test
  beforeEach(() => {
    // Run cleanup to reset state
    cleanupRateLimitStore()
    // Need to wait a bit for cleanup
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('RATE_LIMITS configuration', () => {
    it('should have login rate limit configuration', () => {
      expect(RATE_LIMITS.login).toBeDefined()
      expect(RATE_LIMITS.login.windowMs).toBe(15 * 60 * 1000) // 15 minutes
      expect(RATE_LIMITS.login.maxRequests).toBe(5)
      expect(RATE_LIMITS.login.blockDuration).toBe(60 * 60 * 1000) // 1 hour
    })

    it('should have api rate limit configuration', () => {
      expect(RATE_LIMITS.api).toBeDefined()
      expect(RATE_LIMITS.api.windowMs).toBe(60 * 1000) // 1 minute
      expect(RATE_LIMITS.api.maxRequests).toBe(60)
    })

    it('should have upload rate limit configuration', () => {
      expect(RATE_LIMITS.upload).toBeDefined()
      expect(RATE_LIMITS.upload.maxRequests).toBe(10)
      expect(RATE_LIMITS.upload.blockDuration).toBe(10 * 60 * 1000)
    })

    it('should have email rate limit configuration', () => {
      expect(RATE_LIMITS.email).toBeDefined()
      expect(RATE_LIMITS.email.windowMs).toBe(60 * 60 * 1000) // 1 hour
      expect(RATE_LIMITS.email.maxRequests).toBe(100)
    })

    it('should have export rate limit configuration', () => {
      expect(RATE_LIMITS.export).toBeDefined()
      expect(RATE_LIMITS.export.maxRequests).toBe(5)
    })

    it('should have ai rate limit configuration', () => {
      expect(RATE_LIMITS.ai).toBeDefined()
      expect(RATE_LIMITS.ai.maxRequests).toBe(10)
      expect(RATE_LIMITS.ai.blockDuration).toBe(2 * 60 * 1000)
    })
  })

  describe('checkRateLimit', () => {
    const testConfig = {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 3,
    }

    it('should allow first request', () => {
      const result = checkRateLimit('user-test-1', testConfig)
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2) // 3 - 1
      expect(result.resetIn).toBeGreaterThan(0)
    })

    it('should decrement remaining on each request', () => {
      const id = 'user-decrement-' + Date.now()
      
      const r1 = checkRateLimit(id, testConfig)
      expect(r1.remaining).toBe(2)
      
      const r2 = checkRateLimit(id, testConfig)
      expect(r2.remaining).toBe(1)
      
      const r3 = checkRateLimit(id, testConfig)
      expect(r3.remaining).toBe(0)
    })

    it('should deny after exceeding max requests', () => {
      const id = 'user-exceed-' + Date.now()
      
      // Make max requests
      for (let i = 0; i < 3; i++) {
        checkRateLimit(id, testConfig)
      }
      
      // Next request should be denied
      const result = checkRateLimit(id, testConfig)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should block user when blockDuration is set', () => {
      const configWithBlock = {
        windowMs: 60 * 1000,
        maxRequests: 2,
        blockDuration: 30 * 1000,
      }
      const id = 'user-block-' + Date.now()
      
      // Exceed limit
      checkRateLimit(id, configWithBlock)
      checkRateLimit(id, configWithBlock)
      const blocked = checkRateLimit(id, configWithBlock)
      
      expect(blocked.allowed).toBe(false)
      
      // Should still be blocked
      const stillBlocked = checkRateLimit(id, configWithBlock)
      expect(stillBlocked.allowed).toBe(false)
    })

    it('should provide resetIn time', () => {
      const id = 'user-reset-' + Date.now()
      const result = checkRateLimit(id, testConfig)
      
      expect(result.resetIn).toBeLessThanOrEqual(testConfig.windowMs)
      expect(result.resetIn).toBeGreaterThan(0)
    })

    it('should reset count after window expires', () => {
      const id = 'user-window-' + Date.now()
      
      // Make requests
      checkRateLimit(id, testConfig)
      checkRateLimit(id, testConfig)
      
      // Fast forward past window
      jest.advanceTimersByTime(testConfig.windowMs + 1000)
      
      // Should be reset
      const result = checkRateLimit(id, testConfig)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)
    })

    it('should handle different identifiers independently', () => {
      const id1 = 'user-ind-1-' + Date.now()
      const id2 = 'user-ind-2-' + Date.now()
      
      // Max out first user
      for (let i = 0; i <= 3; i++) {
        checkRateLimit(id1, testConfig)
      }
      
      // Second user should still be allowed
      const result = checkRateLimit(id2, testConfig)
      expect(result.allowed).toBe(true)
    })
  })

  describe('rateLimitMiddleware', () => {
    it('should return a function', () => {
      const middleware = rateLimitMiddleware('api')
      expect(typeof middleware).toBe('function')
    })

    it('should allow request under limit', () => {
      const middleware = rateLimitMiddleware('api')
      const mockReq = {
        session: { user: { id: 'mw-test-' + Date.now() } },
        headers: {},
        socket: { remoteAddress: '1.2.3.4' },
      }
      
      const result = middleware(mockReq)
      
      expect(result).toHaveProperty('headers')
      expect(result.headers['X-RateLimit-Limit']).toBe(60)
      expect(result.headers['X-RateLimit-Remaining']).toBeDefined()
    })

    it('should use user ID when authenticated', () => {
      const middleware = rateLimitMiddleware('api')
      const userId = 'auth-user-' + Date.now()
      const mockReq = {
        session: { user: { id: userId } },
        headers: {},
        socket: { remoteAddress: '10.0.0.1' },
      }
      
      const result = middleware(mockReq)
      expect(result.headers).toBeDefined()
    })

    it('should use forwarded IP for anonymous requests', () => {
      const middleware = rateLimitMiddleware('api')
      const ip = '192.168.1.' + Math.floor(Math.random() * 255)
      const mockReq = {
        session: null,
        headers: { 'x-forwarded-for': ip },
        socket: { remoteAddress: '127.0.0.1' },
      }
      
      const result = middleware(mockReq)
      expect(result.headers).toBeDefined()
    })

    it('should throw with 429 status when rate limited', () => {
      const strictConfig = rateLimitMiddleware('login')
      const ip = 'rate-limited-ip-' + Date.now()
      
      const mockReq = {
        session: null,
        headers: { 'x-forwarded-for': ip },
        socket: {},
      }
      
      // Exhaust the limit (5 requests for login)
      for (let i = 0; i < 5; i++) {
        strictConfig(mockReq)
      }
      
      // Next should throw
      expect(() => strictConfig(mockReq)).toThrow('Rate limit exceeded')
      
      try {
        strictConfig(mockReq)
      } catch (error: any) {
        expect(error.statusCode).toBe(429)
        expect(error.headers).toBeDefined()
        expect(error.headers['Retry-After']).toBeDefined()
      }
    })

    it('should work with different limit types', () => {
      const limitTypes: Array<keyof typeof RATE_LIMITS> = [
        'login', 'api', 'upload', 'email', 'export', 'ai'
      ]
      
      limitTypes.forEach(type => {
        const middleware = rateLimitMiddleware(type)
        expect(typeof middleware).toBe('function')
      })
    })
  })

  describe('cleanupRateLimitStore', () => {
    it('should be a function', () => {
      expect(typeof cleanupRateLimitStore).toBe('function')
    })

    it('should not throw when called', () => {
      expect(() => cleanupRateLimitStore()).not.toThrow()
    })

    it('should clean expired entries', () => {
      const id = 'cleanup-test-' + Date.now()
      const shortWindow = { windowMs: 100, maxRequests: 10 }
      
      // Create entry
      checkRateLimit(id, shortWindow)
      
      // Fast forward
      jest.advanceTimersByTime(200)
      
      // Cleanup
      cleanupRateLimitStore()
      
      // Entry should be gone, so new request starts fresh
      const result = checkRateLimit(id, shortWindow)
      expect(result.remaining).toBe(9) // Fresh start
    })
  })

  describe('getAdaptiveRateLimit', () => {
    const baseConfig = {
      windowMs: 60000,
      maxRequests: 100,
    }

    it('should return same limits at 0 load', () => {
      const result = getAdaptiveRateLimit(baseConfig, 0)
      
      expect(result.windowMs).toBe(baseConfig.windowMs)
      expect(result.maxRequests).toBe(100)
    })

    it('should reduce limits at high load', () => {
      const result = getAdaptiveRateLimit(baseConfig, 1) // Max load
      
      expect(result.maxRequests).toBeLessThan(baseConfig.maxRequests)
      expect(result.maxRequests).toBe(50) // 50% reduction at max load
    })

    it('should scale linearly with load', () => {
      const low = getAdaptiveRateLimit(baseConfig, 0.2)
      const mid = getAdaptiveRateLimit(baseConfig, 0.5)
      const high = getAdaptiveRateLimit(baseConfig, 0.8)
      
      expect(low.maxRequests).toBeGreaterThan(mid.maxRequests)
      expect(mid.maxRequests).toBeGreaterThan(high.maxRequests)
    })

    it('should preserve other config properties', () => {
      const configWithBlock = {
        windowMs: 30000,
        maxRequests: 50,
        blockDuration: 60000,
      }
      
      const result = getAdaptiveRateLimit(configWithBlock, 0.5)
      
      expect(result.windowMs).toBe(30000)
      expect(result.blockDuration).toBe(60000)
    })

    it('should handle edge cases', () => {
      const r1 = getAdaptiveRateLimit(baseConfig, 0)
      const r2 = getAdaptiveRateLimit(baseConfig, 0.5)
      const r3 = getAdaptiveRateLimit(baseConfig, 1)
      
      expect(r1.maxRequests).toBe(100) // No reduction
      expect(r2.maxRequests).toBe(75)  // 25% reduction
      expect(r3.maxRequests).toBe(50)  // 50% reduction (max)
    })

    it('should floor the result to integer', () => {
      const oddConfig = { windowMs: 1000, maxRequests: 33 }
      const result = getAdaptiveRateLimit(oddConfig, 0.3)
      
      expect(Number.isInteger(result.maxRequests)).toBe(true)
    })
  })

  describe('Rate limit scenarios', () => {
    it('should handle login brute force protection', () => {
      const loginMiddleware = rateLimitMiddleware('login')
      const attackerIp = 'attacker-' + Date.now()
      const req = {
        session: null,
        headers: { 'x-forwarded-for': attackerIp },
        socket: {},
      }
      
      // 5 attempts allowed
      for (let i = 0; i < 5; i++) {
        expect(() => loginMiddleware(req)).not.toThrow()
      }
      
      // 6th attempt blocked
      expect(() => loginMiddleware(req)).toThrow('Rate limit exceeded')
    })

    it('should handle API burst traffic', () => {
      const apiMiddleware = rateLimitMiddleware('api')
      const userId = 'burst-user-' + Date.now()
      const req = {
        session: { user: { id: userId } },
        headers: {},
        socket: {},
      }
      
      // 60 requests per minute allowed
      for (let i = 0; i < 60; i++) {
        const result = apiMiddleware(req)
        expect(result.headers['X-RateLimit-Remaining']).toBe(59 - i)
      }
      
      // 61st blocked
      expect(() => apiMiddleware(req)).toThrow()
    })
  })
})
