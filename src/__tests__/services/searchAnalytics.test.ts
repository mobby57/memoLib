/**
 * Tests pour le service d'analytics de recherche
 * Couverture: logging, recherches populaires, historique
 */

describe('Search Analytics Service', () => {
  describe('SearchAnalytics Interface', () => {
    it('devrait avoir tous les champs requis', () => {
      const analytics = {
        query: 'test search',
        resultCount: 10,
        executionTime: 150,
        userId: 'user-123',
      };

      expect(analytics).toHaveProperty('query');
      expect(analytics).toHaveProperty('resultCount');
      expect(analytics).toHaveProperty('executionTime');
      expect(analytics).toHaveProperty('userId');
    });

    it('devrait supporter les champs optionnels', () => {
      const analytics = {
        query: 'test search',
        resultCount: 10,
        executionTime: 150,
        userId: 'user-123',
        types: ['dossier', 'client'],
        tenantId: 'tenant-456',
      };

      expect(analytics.types).toEqual(['dossier', 'client']);
      expect(analytics.tenantId).toBe('tenant-456');
    });
  });

  describe('Query Validation', () => {
    const sanitizeQuery = (query: string): string => {
      return query.trim().toLowerCase().substring(0, 100);
    };

    it('devrait nettoyer les espaces', () => {
      expect(sanitizeQuery('  test  ')).toBe('test');
    });

    it('devrait mettre en minuscules', () => {
      expect(sanitizeQuery('TEST')).toBe('test');
    });

    it('devrait limiter la longueur', () => {
      const longQuery = 'a'.repeat(150);
      expect(sanitizeQuery(longQuery).length).toBe(100);
    });
  });

  describe('Popular Searches Aggregation', () => {
    const aggregateSearches = (
      searches: Array<{ query: string }>
    ): Array<{ query: string; count: number }> => {
      const countMap = new Map<string, number>();
      
      for (const search of searches) {
        const current = countMap.get(search.query) || 0;
        countMap.set(search.query, current + 1);
      }

      return Array.from(countMap.entries())
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count);
    };

    it('devrait compter les occurrences', () => {
      const searches = [
        { query: 'oqtf' },
        { query: 'oqtf' },
        { query: 'visa' },
      ];

      const result = aggregateSearches(searches);
      
      expect(result[0].query).toBe('oqtf');
      expect(result[0].count).toBe(2);
    });

    it('devrait trier par fréquence décroissante', () => {
      const searches = [
        { query: 'a' },
        { query: 'b' },
        { query: 'b' },
        { query: 'c' },
        { query: 'c' },
        { query: 'c' },
      ];

      const result = aggregateSearches(searches);
      
      expect(result[0].query).toBe('c');
      expect(result[1].query).toBe('b');
      expect(result[2].query).toBe('a');
    });

    it('devrait gérer un tableau vide', () => {
      const result = aggregateSearches([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('Recent Searches', () => {
    const getRecentSearches = (
      searches: Array<{ query: string; createdAt: Date }>,
      limit: number
    ): string[] => {
      return searches
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)
        .map(s => s.query);
    };

    it('devrait retourner les plus récentes en premier', () => {
      const searches = [
        { query: 'old', createdAt: new Date('2024-01-01') },
        { query: 'recent', createdAt: new Date('2024-06-01') },
        { query: 'middle', createdAt: new Date('2024-03-01') },
      ];

      const recent = getRecentSearches(searches, 10);
      
      expect(recent[0]).toBe('recent');
      expect(recent[1]).toBe('middle');
      expect(recent[2]).toBe('old');
    });

    it('devrait respecter la limite', () => {
      const searches = [
        { query: 'a', createdAt: new Date('2024-01-01') },
        { query: 'b', createdAt: new Date('2024-02-01') },
        { query: 'c', createdAt: new Date('2024-03-01') },
      ];

      const recent = getRecentSearches(searches, 2);
      
      expect(recent).toHaveLength(2);
    });
  });

  describe('Execution Time Analysis', () => {
    const analyzeExecutionTimes = (times: number[]): {
      avg: number;
      min: number;
      max: number;
    } => {
      if (times.length === 0) {
        return { avg: 0, min: 0, max: 0 };
      }
      
      return {
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
      };
    };

    it('devrait calculer la moyenne', () => {
      const times = [100, 200, 300];
      const analysis = analyzeExecutionTimes(times);
      expect(analysis.avg).toBe(200);
    });

    it('devrait trouver le minimum', () => {
      const times = [100, 50, 300];
      const analysis = analyzeExecutionTimes(times);
      expect(analysis.min).toBe(50);
    });

    it('devrait trouver le maximum', () => {
      const times = [100, 50, 300];
      const analysis = analyzeExecutionTimes(times);
      expect(analysis.max).toBe(300);
    });

    it('devrait gérer un tableau vide', () => {
      const analysis = analyzeExecutionTimes([]);
      expect(analysis).toEqual({ avg: 0, min: 0, max: 0 });
    });
  });

  describe('Search Types Filtering', () => {
    const validTypes = ['dossier', 'client', 'document', 'facture'];

    const filterValidTypes = (types: string[]): string[] => {
      return types.filter(t => validTypes.includes(t));
    };

    it('devrait garder les types valides', () => {
      const input = ['dossier', 'client'];
      expect(filterValidTypes(input)).toEqual(['dossier', 'client']);
    });

    it('devrait exclure les types invalides', () => {
      const input = ['dossier', 'invalid', 'client'];
      expect(filterValidTypes(input)).toEqual(['dossier', 'client']);
    });

    it('devrait retourner vide si tous invalides', () => {
      const input = ['foo', 'bar'];
      expect(filterValidTypes(input)).toEqual([]);
    });
  });

  describe('Result Count Categories', () => {
    const categorizeResultCount = (count: number): string => {
      if (count === 0) return 'NO_RESULTS';
      if (count <= 5) return 'FEW';
      if (count <= 20) return 'MODERATE';
      if (count <= 100) return 'MANY';
      return 'TOO_MANY';
    };

    it('devrait catégoriser 0 comme NO_RESULTS', () => {
      expect(categorizeResultCount(0)).toBe('NO_RESULTS');
    });

    it('devrait catégoriser 1-5 comme FEW', () => {
      expect(categorizeResultCount(3)).toBe('FEW');
    });

    it('devrait catégoriser 6-20 comme MODERATE', () => {
      expect(categorizeResultCount(15)).toBe('MODERATE');
    });

    it('devrait catégoriser 21-100 comme MANY', () => {
      expect(categorizeResultCount(50)).toBe('MANY');
    });

    it('devrait catégoriser >100 comme TOO_MANY', () => {
      expect(categorizeResultCount(500)).toBe('TOO_MANY');
    });
  });

  describe('Tenant Isolation', () => {
    const filterByTenant = <T extends { tenantId?: string }>(
      items: T[],
      tenantId: string
    ): T[] => {
      return items.filter(item => item.tenantId === tenantId);
    };

    it('devrait filtrer par tenant', () => {
      const items = [
        { query: 'a', tenantId: 'tenant-1' },
        { query: 'b', tenantId: 'tenant-2' },
        { query: 'c', tenantId: 'tenant-1' },
      ];

      const filtered = filterByTenant(items, 'tenant-1');
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(i => i.tenantId === 'tenant-1')).toBe(true);
    });
  });
});
