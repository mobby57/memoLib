/**
 * SMART CACHE - Cache multi-couche avec Redis Upstash
 * Pattern Cache-Aside avec invalidation automatique
 */

import { Redis } from '@upstash/redis';

// Configuration singleton
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.warn('[Cache] Redis non configuré - cache désactivé');
    return null;
  }
  
  redis = new Redis({ url, token });
  return redis;
}

// TTL par tier de données
export const CACHE_TTL = {
  HOT: 60,          // 1 min - données très fréquentes
  WARM: 300,        // 5 min - données moyennes
  COLD: 3600,       // 1h - données stables
  STATIC: 86400,    // 24h - référentiels (CESEDA, etc.)
  SESSION: 1800,    // 30 min - sessions utilisateur
} as const;

// Alias pour compatibilité
export const TTL_TIERS = CACHE_TTL;

export type CacheTier = keyof typeof CACHE_TTL;

/**
 * Récupérer une valeur du cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  
  try {
    const cached = await client.get(key);
    if (cached === null) return null;
    
    // Déjà parsé par Upstash
    return cached as T;
  } catch (error) {
    console.error('[Cache] GET error:', error);
    return null;
  }
}

/**
 * Stocker une valeur dans le cache
 */
export async function cacheSet(
  key: string,
  value: unknown,
  tier: CacheTier = 'WARM'
): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;
  
  try {
    await client.setex(key, CACHE_TTL[tier], value);
    return true;
  } catch (error) {
    console.error('[Cache] SET error:', error);
    return false;
  }
}

/**
 * Supprimer une clé du cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;
  
  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('[Cache] DEL error:', error);
    return false;
  }
}

/**
 * Invalider par pattern (ex: "tenant:123:*")
 */
export async function cacheInvalidatePattern(pattern: string): Promise<number> {
  const client = getRedis();
  if (!client) return 0;
  
  try {
    const keys = await client.keys(pattern);
    if (keys.length === 0) return 0;
    
    await client.del(...keys);
    return keys.length;
  } catch (error) {
    console.error('[Cache] INVALIDATE error:', error);
    return 0;
  }
}

/**
 * Cache-through pattern - Récupère du cache ou exécute le fetcher
 */
export async function cacheThrough<T>(
  key: string,
  fetcher: () => Promise<T>,
  tier: CacheTier = 'WARM'
): Promise<T> {
  // Essayer le cache d'abord
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Exécuter le fetcher
  const fresh = await fetcher();
  
  // Stocker en cache (non-bloquant)
  cacheSet(key, fresh, tier).catch(() => {});
  
  return fresh;
}

/**
 * Décorateur pour cacher automatiquement les résultats
 */
export function withCache<T extends (...args: unknown[]) => Promise<unknown>>(
  keyGenerator: (...args: Parameters<T>) => string,
  tier: CacheTier = 'WARM'
) {
  return (fn: T): T => {
    return (async (...args: Parameters<T>) => {
      const key = keyGenerator(...args);
      return cacheThrough(key, () => fn(...args), tier);
    }) as T;
  };
}

/**
 * Générer une clé de cache standardisée
 */
export function cacheKey(
  resource: string,
  id?: string,
  params?: Record<string, string | number | boolean>
): string {
  let key = `cache:${resource}`;
  if (id) key += `:${id}`;
  if (params) {
    const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
    const hash = sorted.map(([k, v]) => `${k}=${v}`).join('&');
    if (hash) key += `:${hash}`;
  }
  return key;
}

/**
 * Statistiques du cache
 */
export async function cacheStats(): Promise<{
  connected: boolean;
  keys?: number;
}> {
  const client = getRedis();
  if (!client) return { connected: false };
  
  try {
    await client.ping();
    const keys = await client.dbsize();
    return { connected: true, keys };
  } catch {
    return { connected: false };
  }
}
