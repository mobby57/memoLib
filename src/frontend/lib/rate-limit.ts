/**
 * Rate Limiting Service - Production DDoS Protection
 * 
 * Utilise Upstash Redis pour un rate limiting distribué
 * Compatible avec les déploiements multi-instances (Vercel, Azure, etc.)
 * 
 * Installation requise:
 * ```bash
 * npm install @upstash/ratelimit @upstash/redis
 * ```
 * 
 * Configuration Upstash:
 * 1. Créer compte gratuit: https://upstash.com
 * 2. Créer database Redis
 * 3. Copier UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN
 * 4. Ajouter dans .env.local:
 *    UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
 *    UPSTASH_REDIS_REST_TOKEN="xxx"
 * 
 * Usage dans route API:
 * ```typescript
 * import { ratelimit, checkRateLimit } from '@/lib/rate-limit';
 * 
 * export async function POST(req: Request) {
 *   const ip = req.headers.get('x-forwarded-for') || 'unknown';
 *   const { success, remaining } = await checkRateLimit(ip);
 *   
 *   if (!success) {
 *     return new Response('Too Many Requests', { 
 *       status: 429,
 *       headers: { 'X-RateLimit-Remaining': remaining.toString() }
 *     });
 *   }
 *   
 *   // Process request...
 * }
 * ```
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Configuration Redis Upstash
// Fallback vers mode in-memory si credentials manquants (dev uniquement)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/**
 * Rate limiter principal - Sliding Window Algorithm
 * 
 * Limites:
 * - 10 requêtes par 10 secondes par IP
 * - Fenêtre glissante (plus précis que fixed window)
 * - Analytics activées (dashboard Upstash)
 */
export const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
      prefix: 'memolib:ratelimit',
    })
  : null;

/**
 * Rate limiter strict pour webhooks
 * 
 * Limites plus restrictives pour les endpoints publics:
 * - 5 requêtes par minute par IP
 * - Token bucket algorithm (burst autorisé)
 */
export const webhookRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.tokenBucket(5, '1 m', 10), // 5/min, burst max 10
      analytics: true,
      prefix: 'memolib:webhook',
    })
  : null;

/**
 * Rate limiter pour authentification
 * 
 * Protection contre brute force:
 * - 5 tentatives par heure par IP
 * - Fixed window (reset complet après 1h)
 */
export const authRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(5, '1 h'),
      analytics: true,
      prefix: 'memolib:auth',
    })
  : null;

/**
 * Helper function pour vérifier rate limit
 * 
 * @param identifier - IP address ou user ID
 * @param type - Type de rate limiter ('default' | 'webhook' | 'auth')
 * @returns { success: boolean, remaining: number, reset: Date }
 */
export async function checkRateLimit(
  identifier: string,
  type: 'default' | 'webhook' | 'auth' = 'default'
): Promise<{
  success: boolean;
  remaining: number;
  reset: Date;
  limit: number;
}> {
  // Si Redis non configuré (dev), autoriser toutes les requêtes
  if (!redis) {
    console.warn('[RATE-LIMIT] Redis non configuré - rate limiting désactivé (dev only)');
    return {
      success: true,
      remaining: 999,
      reset: new Date(Date.now() + 10000),
      limit: 1000,
    };
  }

  // Sélectionner le rate limiter approprié
  const limiter = type === 'webhook' ? webhookRatelimit : type === 'auth' ? authRatelimit : ratelimit;

  if (!limiter) {
    throw new Error('Rate limiter not initialized');
  }

  // Vérifier le rate limit
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  return {
    success,
    remaining,
    reset: new Date(reset),
    limit,
  };
}

/**
 * Middleware helper pour ajouter headers rate limit
 * 
 * @param response - NextResponse
 * @param rateInfo - Résultat de checkRateLimit
 */
export function addRateLimitHeaders(
  response: Response,
  rateInfo: {
    remaining: number;
    reset: Date;
    limit: number;
  }
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', rateInfo.limit.toString());
  headers.set('X-RateLimit-Remaining', rateInfo.remaining.toString());
  headers.set('X-RateLimit-Reset', rateInfo.reset.toISOString());
  headers.set('Retry-After', Math.ceil((rateInfo.reset.getTime() - Date.now()) / 1000).toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Helper pour extraire IP de la requête
 * Supporte les headers Vercel, Cloudflare, Azure
 */
export function getClientIP(request: Request): string {
  // Vercel
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Cloudflare
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Azure
  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }

  // Fallback
  return 'unknown';
}
