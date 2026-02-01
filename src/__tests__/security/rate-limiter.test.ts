/**
 * Tests unitaires pour le rate limiter
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Import après réinitialisation du module
describe('rate-limiter', () => {
  let checkRateLimit: typeof import('@/lib/security/rate-limiter').checkRateLimit;
  let RATE_LIMITS: typeof import('@/lib/security/rate-limiter').RATE_LIMITS;

  beforeEach(async () => {
    // Reset le cache de modules pour avoir un store propre
    jest.resetModules();

    // Réimporter le module
    const rateLimiter = await import('@/lib/security/rate-limiter');
    checkRateLimit = rateLimiter.checkRateLimit;
    RATE_LIMITS = rateLimiter.RATE_LIMITS;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('RATE_LIMITS configuration', () => {
    it('devrait avoir une configuration pour les endpoints de login', () => {
      expect(RATE_LIMITS.login).toBeDefined();
      expect(RATE_LIMITS.login.windowMs).toBe(15 * 60 * 1000);
      expect(RATE_LIMITS.login.maxRequests).toBe(5);
      expect(RATE_LIMITS.login.blockDuration).toBe(60 * 60 * 1000);
    });

    it('devrait avoir une configuration pour les endpoints API', () => {
      expect(RATE_LIMITS.api).toBeDefined();
      expect(RATE_LIMITS.api.windowMs).toBe(60 * 1000);
      expect(RATE_LIMITS.api.maxRequests).toBe(60);
    });

    it('devrait avoir une configuration pour les uploads', () => {
      expect(RATE_LIMITS.upload).toBeDefined();
      expect(RATE_LIMITS.upload.maxRequests).toBe(10);
    });

    it('devrait avoir une configuration pour les opérations AI', () => {
      expect(RATE_LIMITS.ai).toBeDefined();
      expect(RATE_LIMITS.ai.maxRequests).toBe(10);
      expect(RATE_LIMITS.ai.blockDuration).toBe(2 * 60 * 1000);
    });
  });

  describe('checkRateLimit', () => {
    const testConfig = {
      windowMs: 1000, // 1 seconde pour les tests
      maxRequests: 3,
      blockDuration: 5000,
    };

    it('devrait autoriser les premières requêtes', () => {
      const result = checkRateLimit('user_1', testConfig);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('devrait décrémenter le nombre restant', () => {
      checkRateLimit('user_2', testConfig);
      const result = checkRateLimit('user_2', testConfig);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('devrait bloquer après max requêtes', () => {
      const identifier = 'user_blocked';

      checkRateLimit(identifier, testConfig);
      checkRateLimit(identifier, testConfig);
      checkRateLimit(identifier, testConfig);
      const result = checkRateLimit(identifier, testConfig);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('devrait retourner le temps avant reset', () => {
      const result = checkRateLimit('user_reset', testConfig);

      expect(result.resetIn).toBeGreaterThan(0);
      expect(result.resetIn).toBeLessThanOrEqual(testConfig.windowMs);
    });

    it('devrait isoler les identifiants différents', () => {
      const config = { windowMs: 1000, maxRequests: 1 };

      checkRateLimit('user_a', config);
      const resultA = checkRateLimit('user_a', config);
      const resultB = checkRateLimit('user_b', config);

      expect(resultA.allowed).toBe(false);
      expect(resultB.allowed).toBe(true);
    });

    it('devrait gérer les IPs', () => {
      const result = checkRateLimit('ip:192.168.1.1', testConfig);

      expect(result.allowed).toBe(true);
    });

    it('devrait appliquer le blocage après dépassement', () => {
      const configWithBlock = {
        windowMs: 100,
        maxRequests: 1,
        blockDuration: 10000,
      };
      const identifier = 'blocked_user';

      checkRateLimit(identifier, configWithBlock);
      checkRateLimit(identifier, configWithBlock);

      // Après blocage, toutes les requêtes devraient être refusées
      const result = checkRateLimit(identifier, configWithBlock);
      expect(result.allowed).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('devrait gérer un identifier vide', () => {
      const result = checkRateLimit('', { windowMs: 1000, maxRequests: 5 });
      expect(result).toBeDefined();
    });

    it('devrait gérer maxRequests = 0', () => {
      const result = checkRateLimit('test', { windowMs: 1000, maxRequests: 0 });
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('devrait gérer de très grands identifiants', () => {
      const longId = 'x'.repeat(1000);
      const result = checkRateLimit(longId, { windowMs: 1000, maxRequests: 5 });
      expect(result.allowed).toBe(true);
    });
  });
});
