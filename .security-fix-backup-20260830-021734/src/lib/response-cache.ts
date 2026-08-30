/**
 * Response Caching for GET Endpoints
 * Phase 5: Optimisations
 *
 * In-memory cache with:
 * - TTL (Time To Live)
 * - Cache invalidation
 * - Size limits
 * - Hit/miss tracking
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
  hits: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  entries: Array<{
    key: string;
    age: number;
    ttl: number;
    hits: number;
    data?: string;
  }>;
}

/**
 * Simple in-memory cache for GET responses
 * Useful for endpoints that don't change frequently
 */
export class ResponseCache {
  private cache = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;
  private maxSize: number;

  constructor(maxSizeInBytes: number = 50 * 1024 * 1024) {
    // Default 50MB
    this.maxSize = maxSizeInBytes;
  }

  /**
   * Generate cache key from request path and query params
   */
  private generateKey(path: string, query?: Record<string, any>): string {
    if (!query || Object.keys(query).length === 0) {
      return path;
    }

    const sortedQuery = Object.keys(query)
      .sort()
      .map((k) => `${k}=${query[k]}`)
      .join('&');

    return `${path}?${sortedQuery}`;
  }

  /**
   * Get cached response
   */
  get<T>(path: string, query?: Record<string, any>): T | null {
    const key = this.generateKey(path, query);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    entry.hits++;
    this.hits++;
    return entry.data as T;
  }

  /**
   * Set cached response
   */
  set<T>(path: string, data: T, ttlMs: number = 60000, query?: Record<string, any>): void {
    const key = this.generateKey(path, query);

    // Enforce cache size limit
    if (this.cache.size >= 1000) {
      // Max 1000 entries
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
      hits: 0,
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(path: string, query?: Record<string, any>): boolean {
    const key = this.generateKey(path, query);
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total === 0 ? 0 : (this.hits / total) * 100;

    const entries = Array.from(this.cache.entries()).map(([key, entry]) => {
      const age = Date.now() - entry.timestamp;
      return {
        key,
        age: Math.round(age),
        ttl: Math.round(entry.ttlMs),
        hits: entry.hits,
        data: typeof entry.data === 'object' ? JSON.stringify(entry.data).substring(0, 100) : '',
      };
    });

    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      entries,
    };
  }

  /**
   * Cache middleware for Next.js API routes
   * Usage: const cached = cache.getOrCompute(path, async () => await fetchData())
   */
  async getOrCompute<T>(
    path: string,
    computeFn: () => Promise<T>,
    ttlMs: number = 60000,
    query?: Record<string, any>,
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(path, query);
    if (cached) {
      return cached;
    }

    // Compute and cache
    const result = await computeFn();
    this.set(path, result, ttlMs, query);
    return result;
  }
}

/**
 * Global response cache instance
 */
export const globalResponseCache = new ResponseCache();

/**
 * Get cache middleware function for Next.js API routes
 * Usage in route.ts:
 * const cached = await getOrCompute('/api/endpoint', () => expensiveOperation())
 */
export async function getOrCompute<T>(
  path: string,
  computeFn: () => Promise<T>,
  ttlMs: number = 60000,
  query?: Record<string, any>,
): Promise<T> {
  return globalResponseCache.getOrCompute(path, computeFn, ttlMs, query);
}

/**
 * Invalidate cache for specific endpoint
 */
export function invalidateCache(path: string, query?: Record<string, any>): boolean {
  return globalResponseCache.invalidate(path, query);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  return globalResponseCache.getStats();
}

/**
 * Clear all cached responses
 */
export function clearCache(): void {
  globalResponseCache.clear();
}

/**
 * Response cache decorator pattern helper
 * For caching entire endpoint responses
 */
export function withCaching<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  ttlMs: number = 60000,
) {
  return async function cachedHandler(...args: any[]) {
    const path = args[0]?.url || 'unknown';
    const cached = globalResponseCache.get(path);

    if (cached) {
      return cached;
    }

    const result = await handler(...args);
    globalResponseCache.set(path, result, ttlMs);
    return result;
  };
}
