/**
 * RATE LIMITER AVANCÉ - Protection API par tier
 * Sliding window avec Redis Upstash
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Configuration par tier
const TIER_LIMITS = {
  anonymous: { requests: 20, window: '1m' as const },
  free: { requests: 100, window: '1h' as const },
  pro: { requests: 1000, window: '1h' as const },
  enterprise: { requests: 10000, window: '1h' as const },
  admin: { requests: 100000, window: '1h' as const },
} as const;

export type RateLimitTier = keyof typeof TIER_LIMITS;

// Cache des limiters
const limiters = new Map<RateLimitTier, Ratelimit>();

function getAdvancedRateLimiter(tier: RateLimitTier): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) return null;
  
  if (limiters.has(tier)) {
    return limiters.get(tier)!;
  }
  
  const config = TIER_LIMITS[tier];
  const redis = new Redis({ url, token });
  
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `ratelimit:${tier}`,
    analytics: true,
  });
  
  limiters.set(tier, limiter);
  return limiter;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  tier: RateLimitTier;
}

/**
 * Vérifier le rate limit pour un identifiant
 */
export async function checkAdvancedRateLimit(
  identifier: string,
  tier: RateLimitTier = 'anonymous'
): Promise<RateLimitResult> {
  const limiter = getAdvancedRateLimiter(tier);
  
  if (!limiter) {
    return {
      success: true,
      limit: TIER_LIMITS[tier].requests,
      remaining: TIER_LIMITS[tier].requests,
      reset: Date.now() + 60000,
      tier,
    };
  }
  
  const result = await limiter.limit(identifier);
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    tier,
  };
}

/**
 * Middleware Next.js pour rate limiting avancé
 */
export async function advancedRateLimitMiddleware(
  req: NextRequest
): Promise<NextResponse | null> {
  // Ignorer les assets
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/static') ||
    req.nextUrl.pathname.includes('.')
  ) {
    return null;
  }
  
  if (!req.nextUrl.pathname.startsWith('/api')) {
    return null;
  }
  
  let tier: RateLimitTier = 'anonymous';
  let identifier = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token) {
      identifier = token.sub || token.email as string || identifier;
      tier = (token.tier as RateLimitTier) || 'free';
    }
  } catch {
    // Pas de token
  }
  
  const result = await checkAdvancedRateLimit(identifier, tier);
  
  const headers = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    'X-RateLimit-Tier': result.tier,
  };
  
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again later.`,
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
      { status: 429, headers }
    );
  }
  
  return null;
}

/**
 * Wrapper pour route API avec rate limit
 */
export function withAdvancedRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  tier?: RateLimitTier
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await advancedRateLimitMiddleware(req);
    if (rateLimitResponse) return rateLimitResponse;
    
    const response = await handler(req);
    return response;
  };
}
