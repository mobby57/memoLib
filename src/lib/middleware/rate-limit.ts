/**
 * Middleware Rate Limiting pour les API Next.js
 * Wrapper centralisé pour appliquer le rate limiting à toutes les routes
 */

import { authOptions } from '@/lib/auth/authOptions';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

type RateLimitType = keyof typeof RATE_LIMITS;

interface RateLimitMiddlewareOptions {
  type?: RateLimitType;
  customConfig?: {
    windowMs: number;
    maxRequests: number;
    blockDuration?: number;
  };
  keyGenerator?: (req: NextRequest) => string;
}

/**
 * Extraire l'IP du client
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return '127.0.0.1';
}

/**
 * Créer une réponse rate limit
 */
function createRateLimitResponse(resetIn: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Too Many Requests',
      message: 'Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard.',
      retryAfter: Math.ceil(resetIn / 1000),
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(resetIn / 1000)),
        'X-RateLimit-Limit': '0',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Date.now() + resetIn),
      },
    }
  );
}

/**
 * Higher-order function pour wrapper un handler avec rate limiting
 */
export function withRateLimit<T>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>,
  options: RateLimitMiddlewareOptions = {}
) {
  return async (req: NextRequest, context?: T): Promise<NextResponse> => {
    const { type = 'api', customConfig, keyGenerator } = options;

    // Déterminer la configuration
    const config = customConfig || RATE_LIMITS[type];

    // Générer l'identifiant (IP par défaut, ou userId si authentifié)
    let identifier: string;

    if (keyGenerator) {
      identifier = keyGenerator(req);
    } else {
      const ip = getClientIP(req);

      // Essayer d'obtenir l'utilisateur authentifié
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
          identifier = `user:${session.user.id}`;
        } else {
          identifier = `ip:${ip}`;
        }
      } catch {
        identifier = `ip:${ip}`;
      }
    }

    // Ajouter le path pour différencier les endpoints
    const path = req.nextUrl.pathname;
    const fullIdentifier = `${identifier}:${path}`;

    // Vérifier le rate limit
    const { allowed, remaining, resetIn } = checkRateLimit(fullIdentifier, config);

    if (!allowed) {
      return createRateLimitResponse(resetIn);
    }

    // Exécuter le handler original
    const response = await handler(req, context);

    // Ajouter les headers de rate limit
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(Date.now() + resetIn));

    return response;
  };
}

/**
 * Décorateurs spécialisés par type d'endpoint
 */
export const withLoginRateLimit = <T>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
) => withRateLimit(handler, { type: 'login' });

export const withUploadRateLimit = <T>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
) => withRateLimit(handler, { type: 'upload' });

export const withAIRateLimit = <T>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
) => withRateLimit(handler, { type: 'ai' });

export const withExportRateLimit = <T>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
) => withRateLimit(handler, { type: 'export' });

export const withEmailRateLimit = <T>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
) => withRateLimit(handler, { type: 'email' });

/**
 * Rate limiting global via middleware Next.js
 * À ajouter dans middleware.ts
 */
export async function rateLimitMiddleware(req: NextRequest): Promise<NextResponse | null> {
  const path = req.nextUrl.pathname;

  // Ignorer les assets statiques
  if (
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.includes('.') // fichiers statiques
  ) {
    return null;
  }

  // Déterminer le type de rate limit
  let type: RateLimitType = 'api';

  if (path.includes('/auth/') || path.includes('/login')) {
    type = 'login';
  } else if (path.includes('/upload')) {
    type = 'upload';
  } else if (path.includes('/ai') || path.includes('/analyze')) {
    type = 'ai';
  } else if (path.includes('/export')) {
    type = 'export';
  } else if (path.includes('/email')) {
    type = 'email';
  }

  const ip = getClientIP(req);
  const identifier = `ip:${ip}:${path}`;

  const config = RATE_LIMITS[type];
  const { allowed, resetIn } = checkRateLimit(identifier, config);

  if (!allowed) {
    return createRateLimitResponse(resetIn);
  }

  return null;
}

export default withRateLimit;
