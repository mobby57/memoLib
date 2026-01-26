/**
 * Tests pour src/lib/cache/smart-cache.ts
 * Coverage: Cache multi-couche avec Redis Upstash
 */

// Mock Redis avant l'import
const mockRedis = {
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  scan: jest.fn(),
  pipeline: jest.fn(() => ({
    del: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  })),
};

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(() => mockRedis),
}));

describe('Smart Cache', () => {
  let cacheGet: any;
  let cacheSet: any;
  let cacheDelete: any;
  let cacheInvalidatePattern: any;
  let CACHE_TTL: any;
  let TTL_TIERS: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Set env vars before import
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    
    const module = await import('@/lib/cache/smart-cache');
    cacheGet = module.cacheGet;
    cacheSet = module.cacheSet;
    cacheDelete = module.cacheDelete;
    cacheInvalidatePattern = module.cacheInvalidatePattern;
    CACHE_TTL = module.CACHE_TTL;
    TTL_TIERS = module.TTL_TIERS;
  });

  describe('CACHE_TTL configuration', () => {
    it('should have HOT tier at 60 seconds', () => {
      expect(CACHE_TTL.HOT).toBe(60);
    });

    it('should have WARM tier at 5 minutes', () => {
      expect(CACHE_TTL.WARM).toBe(300);
    });

    it('should have COLD tier at 1 hour', () => {
      expect(CACHE_TTL.COLD).toBe(3600);
    });

    it('should have STATIC tier at 24 hours', () => {
      expect(CACHE_TTL.STATIC).toBe(86400);
    });

    it('should have SESSION tier at 30 minutes', () => {
      expect(CACHE_TTL.SESSION).toBe(1800);
    });

    it('should have TTL_TIERS alias equal to CACHE_TTL', () => {
      expect(TTL_TIERS).toEqual(CACHE_TTL);
    });
  });

  describe('cacheGet', () => {
    it('should return cached value when found', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedis.get.mockResolvedValue(testData);

      const result = await cacheGet('test-key');
      
      expect(result).toEqual(testData);
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key not found', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheGet('missing-key');
      
      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await cacheGet('error-key');
      
      expect(result).toBeNull();
    });

    it('should handle string values', async () => {
      mockRedis.get.mockResolvedValue('simple string');

      const result = await cacheGet<string>('string-key');
      
      expect(result).toBe('simple string');
    });

    it('should handle array values', async () => {
      const testArray = [1, 2, 3, 4, 5];
      mockRedis.get.mockResolvedValue(testArray);

      const result = await cacheGet<number[]>('array-key');
      
      expect(result).toEqual(testArray);
    });
  });

  describe('cacheSet', () => {
    it('should set value with default WARM tier', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      const result = await cacheSet('test-key', { data: 'value' });
      
      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 300, { data: 'value' });
    });

    it('should set value with HOT tier', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      const result = await cacheSet('hot-key', 'hot-data', 'HOT');
      
      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith('hot-key', 60, 'hot-data');
    });

    it('should set value with COLD tier', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      const result = await cacheSet('cold-key', 'cold-data', 'COLD');
      
      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith('cold-key', 3600, 'cold-data');
    });

    it('should set value with STATIC tier', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      const result = await cacheSet('static-key', 'static-data', 'STATIC');
      
      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith('static-key', 86400, 'static-data');
    });

    it('should set value with SESSION tier', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      const result = await cacheSet('session-key', { user: 'data' }, 'SESSION');
      
      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith('session-key', 1800, { user: 'data' });
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis write failed'));

      const result = await cacheSet('error-key', 'data');
      
      expect(result).toBe(false);
    });

    it('should handle complex objects', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      const complexData = {
        dossier: { id: '123', status: 'active' },
        documents: [{ id: 1 }, { id: 2 }],
        metadata: { created: new Date().toISOString() }
      };

      const result = await cacheSet('complex-key', complexData);
      
      expect(result).toBe(true);
    });
  });

  describe('cacheDelete', () => {
    it('should delete key successfully', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await cacheDelete('delete-key');
      
      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('delete-key');
    });

    it('should handle non-existent key', async () => {
      mockRedis.del.mockResolvedValue(0);

      const result = await cacheDelete('missing-key');
      
      expect(result).toBe(true);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis delete failed'));

      const result = await cacheDelete('error-key');
      
      expect(result).toBe(false);
    });
  });

  describe('cacheInvalidatePattern', () => {
    it('should invalidate keys matching pattern', async () => {
      mockRedis.scan.mockResolvedValueOnce(['0', ['tenant:123:a', 'tenant:123:b']]);

      const result = await cacheInvalidatePattern('tenant:123:*');
      
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty scan result', async () => {
      mockRedis.scan.mockResolvedValueOnce(['0', []]);

      const result = await cacheInvalidatePattern('empty:*');
      
      expect(result).toBe(0);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.scan.mockRejectedValue(new Error('Redis scan failed'));

      const result = await cacheInvalidatePattern('error:*');
      
      expect(result).toBe(0);
    });
  });

  describe('Redis not configured', () => {
    beforeEach(async () => {
      jest.resetModules();
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      
      const module = await import('@/lib/cache/smart-cache');
      cacheGet = module.cacheGet;
      cacheSet = module.cacheSet;
      cacheDelete = module.cacheDelete;
    });

    it('should return null for get when Redis not configured', async () => {
      const result = await cacheGet('any-key');
      expect(result).toBeNull();
    });

    it('should return false for set when Redis not configured', async () => {
      const result = await cacheSet('any-key', 'value');
      expect(result).toBe(false);
    });

    it('should return false for delete when Redis not configured', async () => {
      const result = await cacheDelete('any-key');
      expect(result).toBe(false);
    });
  });
});

describe('Cache Integration Patterns', () => {
  let cacheGet: any;
  let cacheSet: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    
    const module = await import('@/lib/cache/smart-cache');
    cacheGet = module.cacheGet;
    cacheSet = module.cacheSet;
  });

  it('should follow cache-aside pattern for dossier', async () => {
    const dossierId = 'dossier-123';
    const cacheKey = `dossier:${dossierId}`;
    
    // Cache miss
    mockRedis.get.mockResolvedValueOnce(null);
    let result = await cacheGet(cacheKey);
    expect(result).toBeNull();
    
    // Fetch from DB and cache
    const dossierData = { id: dossierId, status: 'ACTIVE' };
    mockRedis.setex.mockResolvedValue('OK');
    await cacheSet(cacheKey, dossierData, 'WARM');
    
    // Cache hit
    mockRedis.get.mockResolvedValueOnce(dossierData);
    result = await cacheGet(cacheKey);
    expect(result).toEqual(dossierData);
  });

  it('should use appropriate TTL for different data types', async () => {
    // Session data - short TTL
    mockRedis.setex.mockResolvedValue('OK');
    await cacheSet('session:abc', { userId: '123' }, 'SESSION');
    expect(mockRedis.setex).toHaveBeenCalledWith('session:abc', 1800, expect.any(Object));
    
    // Reference data - long TTL
    await cacheSet('ceseda:articles', ['L511-1', 'L511-2'], 'STATIC');
    expect(mockRedis.setex).toHaveBeenCalledWith('ceseda:articles', 86400, expect.any(Array));
  });
});
