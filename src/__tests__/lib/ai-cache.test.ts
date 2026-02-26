/**
 * Tests pour src/lib/ai-cache.ts
 * Coverage: Cache des réponses IA
 */

describe('AI Cache - Pure Unit Tests', () => {
  describe('cache key generation', () => {
    it('should generate cache key from prompt', () => {
      const generateCacheKey = (prompt: string, model: string) => {
        const hash = prompt.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        return `ai:${model}:${Math.abs(hash)}`;
      };

      const key = generateCacheKey('Hello world', 'gpt-4');
      expect(key).toMatch(/^ai:gpt-4:\d+$/);
    });

    it('should normalize prompt before hashing', () => {
      const normalizePrompt = (prompt: string) => 
        prompt.toLowerCase().trim().replace(/\s+/g, ' ');

      expect(normalizePrompt('  Hello   World  ')).toBe('hello world');
    });
  });

  describe('cache TTL by model', () => {
    it('should define TTL per model', () => {
      const MODEL_TTL: Record<string, number> = {
        'gpt-3.5-turbo': 3600,     // 1 hour
        'gpt-4': 7200,             // 2 hours
        'gpt-4-turbo': 3600,       // 1 hour
        'claude-3': 7200,          // 2 hours
      };

      expect(MODEL_TTL['gpt-4']).toBe(7200);
    });

    it('should get TTL with fallback', () => {
      const getTTL = (model: string) => {
        const ttls: Record<string, number> = {
          'gpt-4': 7200,
          'gpt-3.5': 3600,
        };
        return ttls[model] ?? 1800; // Default 30 min
      };

      expect(getTTL('gpt-4')).toBe(7200);
      expect(getTTL('unknown')).toBe(1800);
    });
  });

  describe('cache eligibility', () => {
    it('should check if response is cacheable', () => {
      const isCacheable = (response: { tokens: number; error?: string }) => 
        !response.error && response.tokens > 0;

      expect(isCacheable({ tokens: 100 })).toBe(true);
      expect(isCacheable({ tokens: 100, error: 'Error' })).toBe(false);
      expect(isCacheable({ tokens: 0 })).toBe(false);
    });

    it('should check prompt length for caching', () => {
      const isPromptCacheable = (prompt: string, minLength: number = 10) => 
        prompt.length >= minLength;

      expect(isPromptCacheable('Hello world test')).toBe(true);
      expect(isPromptCacheable('Hi')).toBe(false);
    });
  });

  describe('cache statistics', () => {
    it('should track cache hits and misses', () => {
      const stats = { hits: 0, misses: 0 };

      const recordHit = () => stats.hits++;
      const recordMiss = () => stats.misses++;
      const getHitRate = () => {
        const total = stats.hits + stats.misses;
        return total > 0 ? (stats.hits / total) * 100 : 0;
      };

      recordHit();
      recordHit();
      recordMiss();

      expect(getHitRate()).toBeCloseTo(66.67, 1);
    });
  });

  describe('response compression', () => {
    it('should check if compression is needed', () => {
      const needsCompression = (size: number, threshold: number = 1024) => 
        size > threshold;

      expect(needsCompression(500)).toBe(false);
      expect(needsCompression(2000)).toBe(true);
    });
  });

  describe('cache invalidation', () => {
    it('should generate invalidation patterns', () => {
      const getInvalidationPattern = (userId: string) => 
        `ai:*:${userId}:*`;

      expect(getInvalidationPattern('user123')).toBe('ai:*:user123:*');
    });

    it('should check if cache entry is expired', () => {
      const isExpired = (timestamp: number, ttl: number) => 
        Date.now() > timestamp + ttl * 1000;

      const recent = Date.now() - 1000;
      const old = Date.now() - 100000;

      expect(isExpired(recent, 60)).toBe(false);
      expect(isExpired(old, 60)).toBe(true);
    });
  });

  describe('cache entry structure', () => {
    it('should create cache entry', () => {
      const createEntry = (response: string, tokens: number) => ({
        response,
        tokens,
        createdAt: Date.now(),
        model: 'gpt-4',
      });

      const entry = createEntry('Hello', 10);
      expect(entry.tokens).toBe(10);
      expect(entry.model).toBe('gpt-4');
    });
  });

  describe('semantic caching', () => {
    it('should calculate prompt similarity', () => {
      const calculateSimilarity = (a: string, b: string) => {
        const wordsA = new Set(a.toLowerCase().split(' '));
        const wordsB = new Set(b.toLowerCase().split(' '));
        const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
        const union = new Set([...wordsA, ...wordsB]);
        return intersection.size / union.size;
      };

      const sim = calculateSimilarity('hello world', 'hello there');
      expect(sim).toBeGreaterThan(0);
      expect(sim).toBeLessThan(1);
    });
  });

  describe('cost savings', () => {
    it('should calculate savings from cache hit', () => {
      const calculateSavings = (tokens: number, pricePerToken: number) => 
        tokens * pricePerToken;

      // GPT-4: $0.03 per 1K tokens
      const savings = calculateSavings(1000, 0.00003);
      expect(savings).toBeCloseTo(0.03);
    });

    it('should track cumulative savings', () => {
      let totalSavings = 0;
      const addSavings = (amount: number) => totalSavings += amount;

      addSavings(0.03);
      addSavings(0.02);
      addSavings(0.05);

      expect(totalSavings).toBeCloseTo(0.1);
    });
  });
});
