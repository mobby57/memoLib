import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Middleware de sécurité global pour MemoLib
 * Applique les headers de sécurité recommandés pour la production
 *
 * Références:
 * - OWASP Secure Headers Project
 * - Next.js Security Best Practices
 * - ANSSI Recommandations sécurité web
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 🔒 X-Frame-Options: Prévient les attaques clickjacking
  // DENY = ne peut pas être affiché dans un iframe
  response.headers.set('X-Frame-Options', 'DENY');

  // 🔒 X-Content-Type-Options: Empêche le MIME-sniffing
  //Force les navigateurs à respecter le Content-Type déclaré
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // 🔒 Referrer-Policy: Contrôle les informations envoyées dans le header Referer
  // strict-origin-when-cross-origin = envoie l'origine uniquement en HTTPS
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 🔒 Permissions-Policy: Désactive les APIs sensibles du navigateur
  // Bloque l'accès à la géolocalisation, micro, caméra par défaut
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );

  // 🔒 X-DNS-Prefetch-Control: Désactive le prefetch DNS pour les liens externes
  response.headers.set('X-DNS-Prefetch-Control', 'off');

  // 🔒 Content-Security-Policy (CSP)
  // Politique stricte pour prévenir XSS et injections de code
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://vercel.live https://*.sentry.io https://*.neon.tech https://*.azurewebsites.net https://*.twilio.com wss://*.vercel.live",
    "frame-src 'self' https://vercel.live",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // 🔒 HSTS (HTTP Strict Transport Security) - PRODUCTION SEULEMENT
  // Force HTTPS pour 2 ans (63072000 secondes)
  // includeSubDomains = applique aussi aux sous-domaines
  // preload = eligible pour la HSTS preload list des navigateurs
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // 🔒 X-XSS-Protection: Protection XSS legacy (pour anciens navigateurs)
  // Mode=block arrête le rendu si XSS détecté
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // 📊 Server header - Masquer la version (sécurité par obscurité)
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');

  return response;
}

/**
 * Configuration du matcher
 *
 * Applique le middleware à toutes les routes SAUF:
 * - Fichiers statiques Next.js (_next/static)
 * - Images optimisées (_next/image)
 * - Favicon et images root
 * - API health check (besoin de réponses rapides)
 */
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf:
     * - api/health (pas de overhead sur health checks)
     * - _next/static (fichiers statiques)
     * - _next/image (images optimisées)
     * - favicon.ico
     * - fichiers .png, .jpg, .jpeg, .gif, .svg, .webp (statiques)
     */
    '/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)',
  ],
};
