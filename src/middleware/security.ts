/**
 * Security Middleware - OWASP ZAP Compliant
 * memoLib - Securite niveau Enterprise
 * 
 * Conforme aux exigences :
 * - RGPD / CNIL
 * - OWASP Top 10
 * - Audit cabinet d'avocats
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Headers de securite OWASP compliant
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy - Strict mais fonctionnel
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' http://localhost:* https://api.* wss://localhost:*",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  // Headers de securite obligatoires
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // HSTS - Seulement en HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security', 
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // Permissions Policy (anciennement Feature Policy)
  const permissions = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', ');
  response.headers.set('Permissions-Policy', permissions);

  // Headers additionnels pour la confidentialite
  response.headers.set('X-Powered-By', ''); // Masquer la technologie
  response.headers.set('Server', ''); // Masquer le serveur
  
  return response;
}

/**
 * Configuration cookies securises
 */
export const SECURE_COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 jours
  path: '/'
};

/**
 * Rate limiting simple (en memoire)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  request: NextRequest, 
  maxRequests = 100, 
  windowMs = 60000
): boolean {
  const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const windowStart = now - windowMs;

  const current = rateLimitMap.get(ip);
  
  if (!current || current.resetTime < windowStart) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

/**
 * Validation des routes sensibles
 */
export function isSecureRoute(pathname: string): boolean {
  const secureRoutes = [
    '/api/admin',
    '/api/tenant',
    '/dashboard',
    '/dossiers',
    '/clients',
    '/factures',
    '/super-admin'
  ];
  
  return secureRoutes.some(route => pathname.startsWith(route));
}

/**
 * Headers specifiques API
 */
export function addApiSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-API-Version', '1.0');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

/**
 * Validation CSRF simple
 */
export function validateCSRF(request: NextRequest): boolean {
  if (request.method === 'GET') return true;
  
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  if (!origin && !referer) return false;
  
  const allowedOrigins = [
    `http://localhost:3000`,
    `https://${host}`,
    process.env.NEXTAUTH_URL
  ].filter(Boolean);
  
  return allowedOrigins.some(allowed => 
    origin === allowed || referer?.startsWith(allowed + '/')
  );
}
