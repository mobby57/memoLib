/**
 * Advanced Rate Limiting & DDoS Protection
 * - Per-user rate limits
 * - Per-IP rate limits
 * - Adaptive throttling
 * - Automatic banning for abuse
 */

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  blockDuration?: number // Ban duration if exceeded
}

interface RateLimitStore {
  count: number
  resetTime: number
  blocked?: number
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitStore>()
const blockedIPs = new Map<string, number>()

/**
 * Rate limit configurations by endpoint type
 */
export const RATE_LIMITS = {
  // Authentication endpoints
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    blockDuration: 60 * 60 * 1000, // 1 hour
  },
  
  // API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 req/min
  },
  
  // File uploads
  upload: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    blockDuration: 10 * 60 * 1000, // 10 minutes
  },
  
  // Email sending
  email: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
  },
  
  // Exports (expensive operations)
  export: {
    windowMs: 60 * 1000,
    maxRequests: 5,
    blockDuration: 5 * 60 * 1000, // 5 minutes
  },
  
  // AI operations
  ai: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    blockDuration: 2 * 60 * 1000, // 2 minutes
  },
} as const

/**
 * Check if request is rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  
  // Check if blocked
  const blockedUntil = blockedIPs.get(identifier)
  if (blockedUntil && blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: blockedUntil - now,
    }
  } else if (blockedUntil) {
    blockedIPs.delete(identifier)
  }

  // Get or create rate limit entry
  let entry = rateLimitStore.get(identifier)
  
  if (!entry || entry.resetTime < now) {
    // Create new window
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(identifier, entry)
  }

  // Increment count
  entry.count++

  // Check if exceeded
  if (entry.count > config.maxRequests) {
    if (config.blockDuration) {
      // Block user/IP
      const blockUntil = now + config.blockDuration
      blockedIPs.set(identifier, blockUntil)
      
      console.warn('[RATE LIMIT] Blocked:', identifier, 'until', new Date(blockUntil))
    }

    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  }
}

/**
 * Rate limit middleware for Next.js API routes
 */
export function rateLimitMiddleware(
  limitType: keyof typeof RATE_LIMITS = 'api'
) {
  return (req: any) => {
    const config = RATE_LIMITS[limitType]
    
    // Use user ID if authenticated, otherwise IP
    const identifier = req.session?.user?.id || 
                      req.headers['x-forwarded-for'] || 
                      req.socket.remoteAddress ||
                      'unknown'

    const result = checkRateLimit(identifier, config)

    if (!result.allowed) {
      const error: any = new Error('Rate limit exceeded')
      error.statusCode = 429
      error.headers = {
        'X-RateLimit-Limit': config.maxRequests,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(Date.now() + result.resetIn).toISOString(),
        'Retry-After': Math.ceil(result.resetIn / 1000),
      }
      throw error
    }

    // Add rate limit headers to response
    return {
      headers: {
        'X-RateLimit-Limit': config.maxRequests,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(Date.now() + result.resetIn).toISOString(),
      },
    }
  }
}

/**
 * Clean up expired entries (run periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now()
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
  
  for (const [key, blockUntil] of blockedIPs.entries()) {
    if (blockUntil < now) {
      blockedIPs.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000)

/**
 * Adaptive rate limiting based on system load
 */
export function getAdaptiveRateLimit(
  baseConfig: RateLimitConfig,
  systemLoad: number // 0-1 (0 = no load, 1 = max load)
): RateLimitConfig {
  // Reduce limits as system load increases
  const adaptiveFactor = 1 - (systemLoad * 0.5) // Max 50% reduction
  
  return {
    ...baseConfig,
    maxRequests: Math.floor(baseConfig.maxRequests * adaptiveFactor),
  }
}
