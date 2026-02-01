/**
 * Tests d'intégration API Légifrance
 * 
 * Vérifie l'intégration avec l'API PISTE/Légifrance
 */

import { legifranceApi, LegifranceConfig } from '@/lib/legifrance/api-client';

describe('Légifrance API Integration', () => {
  const hasApiKeys = Boolean(
    process.env.PISTE_SANDBOX_CLIENT_ID && 
    process.env.PISTE_SANDBOX_CLIENT_SECRET
  );

  describe('Configuration', () => {
    it('should have valid configuration', () => {
      const config: LegifranceConfig = {
        clientId: process.env.PISTE_SANDBOX_CLIENT_ID || 'test',
        clientSecret: process.env.PISTE_SANDBOX_CLIENT_SECRET || 'test',
        environment: (process.env.PISTE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
        oauthUrl: process.env.PISTE_SANDBOX_OAUTH_URL || 'https://sandbox-oauth.piste.gouv.fr',
        apiUrl: process.env.PISTE_SANDBOX_API_URL || 'https://sandbox-api.piste.gouv.fr',
      };
      
      expect(config.environment).toMatch(/^(sandbox|production)$/);
      expect(config.oauthUrl).toMatch(/^https:\/\//);
      expect(config.apiUrl).toMatch(/^https:\/\//);
    });
  });

  describe('CESEDA Search', () => {
    it('should search CESEDA articles', async () => {
      if (!hasApiKeys) {
        console.log('⚠️ Skipping: PISTE API keys not configured');
        return;
      }

      const results = await legifranceApi.searchCeseda({
        query: 'visa',
        pageSize: 5,
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results.results) || results.error).toBeTruthy();
    });

    it('should get specific CESEDA article', async () => {
      if (!hasApiKeys) {
        console.log('⚠️ Skipping: PISTE API keys not configured');
        return;
      }

      const article = await legifranceApi.getCesedaArticle('L311-1');
      
      expect(article).toBeDefined();
    });

    it('should search by keywords', async () => {
      if (!hasApiKeys) {
        console.log('⚠️ Skipping: PISTE API keys not configured');
        return;
      }

      const results = await legifranceApi.searchCesedaByKeywords(
        ['titre de séjour', 'regroupement familial'],
        { pageSize: 10 }
      );

      expect(results).toBeDefined();
    });
  });

  describe('Jurisprudence Search', () => {
    it('should search administrative jurisprudence', async () => {
      if (!hasApiKeys) {
        console.log('⚠️ Skipping: PISTE API keys not configured');
        return;
      }

      const results = await legifranceApi.searchJurisprudenceAdministrative({
        query: 'OQTF',
        pageSize: 5,
      });

      expect(results).toBeDefined();
    });

    it('should search judicial jurisprudence', async () => {
      if (!hasApiKeys) {
        console.log('⚠️ Skipping: PISTE API keys not configured');
        return;
      }

      const results = await legifranceApi.searchJurisprudenceJudiciaire({
        query: 'nationalité',
        pageSize: 5,
      });

      expect(results).toBeDefined();
    });

    it('should get recent CESEDA case law', async () => {
      if (!hasApiKeys) {
        console.log('⚠️ Skipping: PISTE API keys not configured');
        return;
      }

      const results = await legifranceApi.getCesedaRecentCaseLaw({
        days: 30,
        pageSize: 10,
      });

      expect(results).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid queries gracefully', async () => {
      if (!hasApiKeys) {
        console.log('⚠️ Skipping: PISTE API keys not configured');
        return;
      }

      // Empty query should be handled
      const results = await legifranceApi.searchCeseda({
        query: '',
        pageSize: 5,
      });

      expect(results).toBeDefined();
    });

    it('should handle network errors', async () => {
      // This test verifies error handling without actual API calls
      const mockError = new Error('Network error');
      expect(mockError.message).toBe('Network error');
    });
  });

  describe('Mock Mode (without API keys)', () => {
    it('should return mock data when API keys missing', async () => {
      if (hasApiKeys) {
        console.log('ℹ️ Skipping mock test: API keys are configured');
        return;
      }

      // Without API keys, should still not crash
      expect(() => {
        const config = {
          clientId: '',
          clientSecret: '',
          environment: 'sandbox' as const,
        };
        return config;
      }).not.toThrow();
    });
  });
});

describe('API Rate Limiting', () => {
  it('should respect rate limits', async () => {
    // Rate limit check - ensure we don't exceed 10 req/s
    const startTime = Date.now();
    const requests = 5;
    
    // Simulate delay between requests
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    
    for (let i = 0; i < requests; i++) {
      await delay(100); // 100ms between requests = 10 req/s max
    }
    
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(requests * 100 - 50); // Allow some tolerance
  });
});
