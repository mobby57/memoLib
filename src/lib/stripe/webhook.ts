import { Redis } from '@upstash/redis';

const processedEventIds = new Map<string, number>();

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
}

/**
 * Retourne true si l'evenement Stripe a deja ete traite.
 * Utilise Redis en priorite avec NX pour resister aux replays multi-instances,
 * puis un fallback memoire pour les environnements locaux.
 */
export async function isStripeEventDuplicate(eventId: string): Promise<boolean> {
  const key = `stripe:webhook:event:${eventId}`;
  const ttlSeconds = 60 * 60 * 24 * 7;

  try {
    const redis = getRedisClient();

    if (redis) {
      const result = await redis.set(key, '1', { nx: true, ex: ttlSeconds });
      return result !== 'OK';
    }
  } catch {
    // Fallback memoire si Redis est indisponible.
  }

  const now = Date.now();
  const existing = processedEventIds.get(eventId);
  if (existing && existing > now) {
    return true;
  }

  processedEventIds.set(eventId, now + ttlSeconds * 1000);
  return false;
}