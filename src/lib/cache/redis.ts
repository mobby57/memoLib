/**
 * Redis Caching Layer - MemoLib
 * 
 * Features:
 * - Session caching
 * - Analytics caching
 * - Rate limit caching
 * - OAuth token caching
 * - Query result caching
 * - Cache invalidation strategies
 * - GDPR-compliant data handling
 * 
 * Performance targets:
 * - Cache hit rate: > 90%
 * - Cache response time: < 5ms
 * - Memory usage: < 512MB
 */

import { createClient, RedisClientType } from 'redis';

class RedisCache {
    private static instance: RedisCache;
    private client: RedisClientType | null = null;
    private connecting: boolean = false;
    private connected: boolean = false;

    private constructor() { }

    static getInstance(): RedisCache {
        if (!RedisCache.instance) {
            RedisCache.instance = new RedisCache();
        }
        return RedisCache.instance;
    }

    /**
     * Initialize Redis connection
     */
    async connect(): Promise<void> {
        if (this.connected) return;
        if (this.connecting) {
            // Wait for existing connection attempt
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.connect();
        }

        this.connecting = true;

        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

            this.client = createClient({
                url: redisUrl,
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.error('❌ Redis: Max reconnection attempts reached');
                            return new Error('Max retries reached');
                        }
                        return Math.min(retries * 100, 3000);
                    },
                },
            });

            this.client.on('error', (err) => {
                console.error('❌ Redis Error:', err);
                this.connected = false;
            });

            this.client.on('connect', () => {
                console.log('🔌 Redis: Connecting...');
            });

            this.client.on('ready', () => {
                console.log('✅ Redis: Connected and ready');
                this.connected = true;
            });

            this.client.on('reconnecting', () => {
                console.log('🔄 Redis: Reconnecting...');
                this.connected = false;
            });

            await this.client.connect();
        } catch (error) {
            console.error('❌ Redis connection failed:', error);
            this.client = null;
            this.connected = false;
        } finally {
            this.connecting = false;
        }
    }

    /**
     * Disconnect from Redis
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.connected = false;
        }
    }

    /**
     * Generic cache get
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.client || !this.connected) {
            return null;
        }

        try {
            const value = await this.client.get(key);
            if (!value) return null;
            return JSON.parse(value) as T;
        } catch (error) {
            console.error('Redis GET error:', error);
            return null;
        }
    }

    /**
     * Generic cache set
     */
    async set(
        key: string,
        value: any,
        ttlSeconds: number = 300
    ): Promise<boolean> {
        if (!this.client || !this.connected) {
            return false;
        }

        try {
            await this.client.setEx(
                key,
                ttlSeconds,
                JSON.stringify(value)
            );
            return true;
        } catch (error) {
            console.error('Redis SET error:', error);
            return false;
        }
    }

    /**
     * Delete cache key
     */
    async delete(key: string): Promise<boolean> {
        if (!this.client || !this.connected) {
            return false;
        }

        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error('Redis DELETE error:', error);
            return false;
        }
    }

    /**
     * Delete keys by pattern
     */
    async deletePattern(pattern: string): Promise<number> {
        if (!this.client || !this.connected) {
            return 0;
        }

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length === 0) return 0;
            await this.client.del(keys);
            return keys.length;
        } catch (error) {
            console.error('Redis DELETE PATTERN error:', error);
            return 0;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        if (!this.client || !this.connected) {
            return false;
        }

        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error('Redis EXISTS error:', error);
            return false;
        }
    }

    /**
     * Increment counter (for rate limiting)
     */
    async increment(
        key: string,
        ttlSeconds: number = 60
    ): Promise<number> {
        if (!this.client || !this.connected) {
            return 0;
        }

        try {
            const value = await this.client.incr(key);
            if (value === 1) {
                // First increment, set TTL
                await this.client.expire(key, ttlSeconds);
            }
            return value;
        } catch (error) {
            console.error('Redis INCR error:', error);
            return 0;
        }
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<CacheStats> {
        if (!this.client || !this.connected) {
            return {
                connected: false,
                keys: 0,
                memory: '0B',
                hitRate: 0,
            };
        }

        try {
            const info = await this.client.info('stats');
            const dbSize = await this.client.dbSize();
            const memory = await this.client.info('memory');

            // Parse hit rate
            const hitsMatch = info.match(/keyspace_hits:(\d+)/);
            const missesMatch = info.match(/keyspace_misses:(\d+)/);
            const hits = hitsMatch ? parseInt(hitsMatch[1]) : 0;
            const misses = missesMatch ? parseInt(missesMatch[1]) : 0;
            const total = hits + misses;
            const hitRate = total > 0 ? (hits / total) * 100 : 0;

            // Parse memory
            const memoryMatch = memory.match(/used_memory_human:(.+)/);
            const usedMemory = memoryMatch ? memoryMatch[1].trim() : '0B';

            return {
                connected: true,
                keys: dbSize,
                memory: usedMemory,
                hitRate: Math.round(hitRate * 100) / 100,
                hits,
                misses,
            };
        } catch (error) {
            console.error('Redis STATS error:', error);
            return {
                connected: false,
                keys: 0,
                memory: '0B',
                hitRate: 0,
            };
        }
    }

    /**
     * Flush all cache (GDPR right to erasure)
     */
    async flushAll(): Promise<boolean> {
        if (!this.client || !this.connected) {
            return false;
        }

        try {
            await this.client.flushAll();
            return true;
        } catch (error) {
            console.error('Redis FLUSH error:', error);
            return false;
        }
    }
}

// Export singleton instance
export const cache = RedisCache.getInstance();

/**
 * Session Cache
 */
export class SessionCache {
    private static readonly TTL = 3600; // 1 hour
    private static readonly PREFIX = 'session:';

    static async get(sessionToken: string): Promise<any | null> {
        return cache.get(`${this.PREFIX}${sessionToken}`);
    }

    static async set(sessionToken: string, session: any): Promise<boolean> {
        return cache.set(`${this.PREFIX}${sessionToken}`, session, this.TTL);
    }

    static async delete(sessionToken: string): Promise<boolean> {
        return cache.delete(`${this.PREFIX}${sessionToken}`);
    }

    static async deleteUserSessions(userId: string): Promise<number> {
        return cache.deletePattern(`${this.PREFIX}*:${userId}`);
    }
}

/**
 * Analytics Cache
 */
export class AnalyticsCache {
    private static readonly TTL = 300; // 5 minutes
    private static readonly PREFIX = 'analytics:';

    static async getRevenueMetrics(): Promise<any | null> {
        return cache.get(`${this.PREFIX}revenue:current`);
    }

    static async setRevenueMetrics(metrics: any): Promise<boolean> {
        return cache.set(`${this.PREFIX}revenue:current`, metrics, this.TTL);
    }

    static async getEngagementMetrics(): Promise<any | null> {
        return cache.get(`${this.PREFIX}engagement:current`);
    }

    static async setEngagementMetrics(metrics: any): Promise<boolean> {
        return cache.set(`${this.PREFIX}engagement:current`, metrics, this.TTL);
    }

    static async invalidateAll(): Promise<number> {
        return cache.deletePattern(`${this.PREFIX}*`);
    }
}

/**
 * Rate Limit Cache
 */
export class RateLimitCache {
    private static readonly PREFIX = 'ratelimit:';

    static async checkLimit(
        identifier: string,
        limit: number,
        windowSeconds: number
    ): Promise<{ allowed: boolean; remaining: number }> {
        const key = `${this.PREFIX}${identifier}`;
        const count = await cache.increment(key, windowSeconds);

        return {
            allowed: count <= limit,
            remaining: Math.max(0, limit - count),
        };
    }

    static async reset(identifier: string): Promise<boolean> {
        return cache.delete(`${this.PREFIX}${identifier}`);
    }

    static async ban(
        identifier: string,
        durationSeconds: number
    ): Promise<boolean> {
        return cache.set(
            `${this.PREFIX}ban:${identifier}`,
            { banned: true },
            durationSeconds
        );
    }

    static async isBanned(identifier: string): Promise<boolean> {
        return cache.exists(`${this.PREFIX}ban:${identifier}`);
    }
}

/**
 * OAuth Token Cache
 */
export class OAuthTokenCache {
    private static readonly TTL = 3600; // 1 hour
    private static readonly PREFIX = 'oauth:';

    static async getTokens(userId: string, provider: string): Promise<any | null> {
        return cache.get(`${this.PREFIX}${userId}:${provider}`);
    }

    static async setTokens(
        userId: string,
        provider: string,
        tokens: any
    ): Promise<boolean> {
        return cache.set(
            `${this.PREFIX}${userId}:${provider}`,
            tokens,
            this.TTL
        );
    }

    static async deleteTokens(userId: string, provider: string): Promise<boolean> {
        return cache.delete(`${this.PREFIX}${userId}:${provider}`);
    }

    static async deleteUserTokens(userId: string): Promise<number> {
        return cache.deletePattern(`${this.PREFIX}${userId}:*`);
    }
}

/**
 * Query Result Cache
 */
export class QueryCache {
    private static readonly TTL = 60; // 1 minute
    private static readonly PREFIX = 'query:';

    static async get<T>(cacheKey: string): Promise<T | null> {
        return cache.get(`${this.PREFIX}${cacheKey}`);
    }

    static async set(
        cacheKey: string,
        result: any,
        ttl: number = this.TTL
    ): Promise<boolean> {
        return cache.set(`${this.PREFIX}${cacheKey}`, result, ttl);
    }

    static async invalidate(cacheKey: string): Promise<boolean> {
        return cache.delete(`${this.PREFIX}${cacheKey}`);
    }

    static async invalidatePattern(pattern: string): Promise<number> {
        return cache.deletePattern(`${this.PREFIX}${pattern}`);
    }
}

// Types
interface CacheStats {
    connected: boolean;
    keys: number;
    memory: string;
    hitRate: number;
    hits?: number;
    misses?: number;
}

// Initialize Redis connection on module load
if (process.env.REDIS_URL) {
    cache.connect().catch(console.error);
}

export default cache;
