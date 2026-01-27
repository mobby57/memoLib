import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware Global Next.js
 * 
 * Fonctions:
 * 1. Protection des routes /api/* (sauf publiques)
 * 2. Rate limiting (basique - à améliorer avec Upstash)
 * 3. Headers de sécurité
 * 4. Logging des requêtes
 */

// Routes publiques (pas d'auth requise)
const PUBLIC_ROUTES = [
  '/api/health',
  '/api/auth',
  '/api/webhooks/stripe',
  '/api/webhooks/email',
  '/api/webhooks/github',
  '/api/billing/plans',
];

// Routes qui nécessitent juste une session (tout rôle)
const AUTHENTICATED_ROUTES = [
  '/api/client',
  '/api/dossiers',
  '/api/documents',
  '/api/notifications',
];

// Routes admin/avocat seulement
const ADMIN_ROUTES = [
  '/api/admin',
  '/api/lawyer',
  '/api/tenant',
];

// Routes super-admin seulement
const SUPER_ADMIN_ROUTES = [
  '/api/super-admin',
];

// Rate limiting simple en mémoire (à remplacer par Upstash en prod)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMITS = {
  public: 30,     // 30 req/min pour routes publiques
  auth: 100,      // 100 req/min pour utilisateurs authentifiés
  ai: 10,         // 10 req/min pour endpoints IA
};

function checkRateLimit(key: string, limit: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

function isSuperAdminRoute(pathname: string): boolean {
  return SUPER_ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

function isAIRoute(pathname: string): boolean {
  return pathname.includes('/ai/') || pathname.includes('/reasoning') || pathname.includes('/suggestions');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip pour les assets statiques
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Headers de sécurité pour toutes les réponses
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Routes non-API: laisser passer
  if (!pathname.startsWith('/api')) {
    return response;
  }

  // Routes publiques: rate limit basique
  if (isPublicRoute(pathname)) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const { allowed, remaining } = checkRateLimit(`public:${ip}`, RATE_LIMITS.public);
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez dans 1 minute.' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  }

  // Vérifier l'authentification
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  if (!token) {
    return NextResponse.json(
      { error: 'Non authentifié' },
      { status: 401 }
    );
  }

  const userRole = token.role as string;
  const userId = token.sub as string;

  // Vérifier les permissions par rôle
  if (isSuperAdminRoute(pathname) && userRole !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Accès refusé. Super Admin requis.' },
      { status: 403 }
    );
  }

  if (isAdminRoute(pathname) && !['ADMIN', 'AVOCAT', 'SUPER_ADMIN'].includes(userRole)) {
    return NextResponse.json(
      { error: 'Accès refusé. Rôle Admin requis.' },
      { status: 403 }
    );
  }

  // Rate limit pour utilisateurs authentifiés
  const rateLimit = isAIRoute(pathname) ? RATE_LIMITS.ai : RATE_LIMITS.auth;
  const { allowed, remaining } = checkRateLimit(`user:${userId}`, rateLimit);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Limite de requêtes atteinte. Réessayez dans 1 minute.' },
      { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Remaining': '0',
        }
      }
    );
  }

  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-User-Id', userId);
  response.headers.set('X-User-Role', userRole);

  return response;
}

// Configuration du matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
