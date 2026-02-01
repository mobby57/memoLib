/**
 * Upstash Redis Client Configuration
 * Serverless Redis pour cache, queues et sessions
 */

import { Redis } from '@upstash/redis'

// Configuration du client Upstash Redis
const upstashConfig = {
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  enableTelemetry: process.env.UPSTASH_DISABLE_TELEMETRY !== 'true',
}

// Creer une instance singleton
let redisInstance: Redis | null = null

/**
 * Obtenir l'instance Redis Upstash
 */
export function getRedis(): Redis {
  if (!redisInstance) {
    if (!upstashConfig.url || !upstashConfig.token) {
      throw new Error(
        'Upstash Redis credentials missing. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local'
      )
    }
    redisInstance = new Redis(upstashConfig)
  }
  return redisInstance
}

/**
 * Instance Redis par defaut (singleton)
 */
export const redis = getRedis()

/**
 * Verifier si Redis est disponible
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error('Redis unavailable:', error)
    return false
  }
}

/**
 * Helpers pour cache simple
 */
export const cache = {
  /**
   * Stocker une valeur avec expiration optionnelle
   */
  async set<T>(key: string, value: T, expirationSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value)
    if (expirationSeconds) {
      await redis.set(key, serialized, { ex: expirationSeconds })
    } else {
      await redis.set(key, serialized)
    }
  },

  /**
   * Recuperer une valeur
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get<string>(key)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return value as T
    }
  },

  /**
   * Supprimer une ou plusieurs cles
   */
  async del(...keys: string[]): Promise<number> {
    return await redis.del(...keys)
  },

  /**
   * Verifier l'existence d'une cle
   */
  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key)
    return result === 1
  },

  /**
   * Definir une expiration sur une cle existante
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await redis.expire(key, seconds)
    return result === 1
  },

  /**
   * Obtenir le TTL d'une cle
   */
  async ttl(key: string): Promise<number> {
    return await redis.ttl(key)
  },
}

/**
 * Helpers pour queues (lists)
 */
export const queue = {
  /**
   * Ajouter un element a la fin de la queue
   */
  async push<T>(queueName: string, item: T): Promise<number> {
    const serialized = JSON.stringify(item)
    return await redis.rpush(queueName, serialized)
  },

  /**
   * Retirer et retourner le premier element de la queue
   */
  async pop<T>(queueName: string): Promise<T | null> {
    const value = await redis.lpop<string>(queueName)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return value as T
    }
  },

  /**
   * Obtenir la longueur de la queue
   */
  async length(queueName: string): Promise<number> {
    return await redis.llen(queueName)
  },

  /**
   * Voir les elements de la queue sans les retirer
   */
  async peek<T>(queueName: string, start = 0, end = -1): Promise<T[]> {
    const values = await redis.lrange<string>(queueName, start, end)
    return values.map((v) => {
      try {
        return JSON.parse(v) as T
      } catch {
        return v as T
      }
    })
  },
}

/**
 * Helpers pour sessions et rate limiting
 */
export const session = {
  /**
   * Stocker une session utilisateur
   */
  async set(userId: string, data: any, expirationSeconds = 3600): Promise<void> {
    const key = `session:${userId}`
    await cache.set(key, data, expirationSeconds)
  },

  /**
   * Recuperer une session utilisateur
   */
  async get<T = any>(userId: string): Promise<T | null> {
    const key = `session:${userId}`
    return await cache.get<T>(key)
  },

  /**
   * Supprimer une session
   */
  async delete(userId: string): Promise<void> {
    const key = `session:${userId}`
    await cache.del(key)
  },

  /**
   * Rate limiting simple (nombre de requetes par periode)
   */
  async rateLimit(
    identifier: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const key = `ratelimit:${identifier}`
    const now = Date.now()
    const windowMs = windowSeconds * 1000

    // Incrementer le compteur
    const count = await redis.incr(key)

    // Si c'est la premiere requete, definir l'expiration
    if (count === 1) {
      await redis.expire(key, windowSeconds)
    }

    // Obtenir le TTL
    const ttl = await redis.ttl(key)
    const resetAt = now + ttl * 1000

    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
      resetAt,
    }
  },
}

/**
 * Helpers pour sorted sets (leaderboards, scores, etc.)
 */
export const sortedSet = {
  /**
   * Ajouter un membre avec un score
   */
  async add(setName: string, member: string, score: number): Promise<number> {
    const result = await redis.zadd(setName, { score, member })
    return result ?? 0
  },

  /**
   * Obtenir le top N membres
   */
  async top(setName: string, count = 10): Promise<Array<{ member: string; score: number }>> {
    return await redis.zrange(setName, 0, count - 1, { withScores: true, rev: true })
  },

  /**
   * Obtenir le rang d'un membre
   */
  async rank(setName: string, member: string): Promise<number | null> {
    return await redis.zrevrank(setName, member)
  },

  /**
   * Obtenir le score d'un membre
   */
  async score(setName: string, member: string): Promise<number | null> {
    return await redis.zscore(setName, member)
  },

  /**
   * Incrementer le score d'un membre
   */
  async increment(setName: string, member: string, increment: number): Promise<number> {
    return await redis.zincrby(setName, increment, member)
  },
}

/**
 * Helpers pour hash maps
 */
export const hashMap = {
  /**
   * Definir plusieurs champs d'un hash
   */
  async set(hashName: string, data: Record<string, any>): Promise<number> {
    const serialized = Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'string' ? value : JSON.stringify(value)
      return acc
    }, {} as Record<string, string>)
    return await redis.hset(hashName, serialized)
  },

  /**
   * Obtenir un champ d'un hash
   */
  async get<T = string>(hashName: string, field: string): Promise<T | null> {
    const value = await redis.hget<string>(hashName, field)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return value as T
    }
  },

  /**
   * Obtenir tous les champs d'un hash
   */
  async getAll<T = Record<string, any>>(hashName: string): Promise<T | null> {
    const data = await redis.hgetall<Record<string, string>>(hashName)
    if (!data || Object.keys(data).length === 0) return null
    
    const parsed = Object.entries(data).reduce((acc, [key, value]) => {
      try {
        acc[key] = JSON.parse(value)
      } catch {
        acc[key] = value
      }
      return acc
    }, {} as any)
    
    return parsed as T
  },

  /**
   * Supprimer un ou plusieurs champs
   */
  async del(hashName: string, ...fields: string[]): Promise<number> {
    return await redis.hdel(hashName, ...fields)
  },

  /**
   * Verifier l'existence d'un champ
   */
  async exists(hashName: string, field: string): Promise<boolean> {
    const result = await redis.hexists(hashName, field)
    return result === 1
  },
}

export default redis
