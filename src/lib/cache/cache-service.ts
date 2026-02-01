/**
 * Service de Cache Abstrait
 * Supporte Redis (production) ou In-Memory (développement)
 */

import { Redis } from '@upstash/redis';

// Types
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live en secondes
  prefix?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

// Cache en mémoire (fallback)
class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0 };

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    this.stats.size = this.store.size;
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
    this.stats.size = this.store.size;
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.store.keys()).filter(k => regex.test(k));
  }

  async flush(): Promise<void> {
    this.store.clear();
    this.stats = { hits: 0, misses: 0, size: 0 };
  }

  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(k => this.get<T>(k)));
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Nettoyage des entrées expirées
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        cleaned++;
      }
    }

    this.stats.size = this.store.size;
    return cleaned;
  }
}

// Singleton Redis/Memory
let redisClient: Redis | null = null;
let memoryCache: MemoryCache | null = null;
let useRedis = false;

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      redisClient = new Redis({ url, token });
      useRedis = true;
      console.log('[Cache] Redis (Upstash) connecté');
      return redisClient;
    } catch (error) {
      console.warn('[Cache] Erreur connexion Redis:', error);
    }
  }

  return null;
}

function getMemoryCache(): MemoryCache {
  if (!memoryCache) {
    memoryCache = new MemoryCache();
    console.log('[Cache] Mode mémoire (développement)');

    // Nettoyage périodique
    setInterval(() => {
      const cleaned = memoryCache?.cleanup() ?? 0;
      if (cleaned > 0) {
        console.log(`[Cache] Nettoyé ${cleaned} entrées expirées`);
      }
    }, 60 * 1000); // Toutes les minutes
  }
  return memoryCache;
}

// Interface de cache unifiée
class CacheService {
  private prefix: string;
  private defaultTTL: number;

  constructor(options: CacheOptions = {}) {
    this.prefix = options.prefix || 'iapm:';
    this.defaultTTL = options.ttl || 3600; // 1 heure par défaut

    // Initialiser le client approprié
    getRedisClient() || getMemoryCache();
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Récupérer une valeur du cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);

    if (useRedis && redisClient) {
      const value = await redisClient.get(fullKey);
      return value as T | null;
    }

    return getMemoryCache().get<T>(fullKey);
  }

  /**
   * Stocker une valeur dans le cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = this.getKey(key);
    const seconds = ttl || this.defaultTTL;

    if (useRedis && redisClient) {
      await redisClient.set(fullKey, value, { ex: seconds });
      return;
    }

    await getMemoryCache().set(fullKey, value, seconds);
  }

  /**
   * Supprimer une clé du cache
   */
  async del(key: string): Promise<void> {
    const fullKey = this.getKey(key);

    if (useRedis && redisClient) {
      await redisClient.del(fullKey);
      return;
    }

    await getMemoryCache().del(fullKey);
  }

  /**
   * Vérifier si une clé existe
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);

    if (useRedis && redisClient) {
      const exists = await redisClient.exists(fullKey);
      return exists === 1;
    }

    return getMemoryCache().exists(fullKey);
  }

  /**
   * Récupérer ou calculer une valeur (cache-through)
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Invalider plusieurs clés par pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const fullPattern = this.getKey(pattern);

    if (useRedis && redisClient) {
      const keys = await redisClient.keys(fullPattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return keys.length;
    }

    const cache = getMemoryCache();
    const keys = await cache.keys(fullPattern);
    await Promise.all(keys.map(k => cache.del(k)));
    return keys.length;
  }

  /**
   * Récupérer plusieurs clés
   */
  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    const fullKeys = keys.map(k => this.getKey(k));

    if (useRedis && redisClient) {
      return (await redisClient.mget(...fullKeys)) as (T | null)[];
    }

    return getMemoryCache().mget<T>(...fullKeys);
  }

  /**
   * Obtenir les statistiques du cache
   */
  async stats(): Promise<CacheStats & { type: 'redis' | 'memory' }> {
    if (useRedis && redisClient) {
      // Redis n'a pas de stats simples, on retourne une estimation
      const keys = await redisClient.keys(`${this.prefix}*`);
      return {
        type: 'redis',
        hits: 0, // Non disponible sans Redis Enterprise
        misses: 0,
        size: keys.length,
      };
    }

    return {
      type: 'memory',
      ...getMemoryCache().getStats(),
    };
  }

  /**
   * Vider tout le cache
   */
  async flush(): Promise<void> {
    if (useRedis && redisClient) {
      const keys = await redisClient.keys(`${this.prefix}*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return;
    }

    await getMemoryCache().flush();
  }
}

// Instances de cache par domaine
export const cache = new CacheService();

export const dossierCache = new CacheService({
  prefix: 'iapm:dossier:',
  ttl: 300, // 5 minutes
});

export const clientCache = new CacheService({
  prefix: 'iapm:client:',
  ttl: 600, // 10 minutes
});

export const userCache = new CacheService({
  prefix: 'iapm:user:',
  ttl: 900, // 15 minutes
});

export const searchCache = new CacheService({
  prefix: 'iapm:search:',
  ttl: 60, // 1 minute
});

export const aiCache = new CacheService({
  prefix: 'iapm:ai:',
  ttl: 3600, // 1 heure (résultats AI coûteux)
});

// Helpers pour invalidation
export async function invalidateDossierCache(dossierId: string): Promise<void> {
  await dossierCache.del(dossierId);
  await searchCache.invalidatePattern('dossier:*');
}

export async function invalidateClientCache(clientId: string): Promise<void> {
  await clientCache.del(clientId);
  await searchCache.invalidatePattern('client:*');
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await userCache.del(userId);
}

export default cache;
