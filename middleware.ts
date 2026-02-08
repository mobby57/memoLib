import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';

/**
 * Middleware combiné: i18n + sécurité globale pour MemoLib
 * - Route les requêtes vers le bon [locale]
 * - Applique les headers de sécurité globaux
 */

const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'fr', 'es', 'de', 'pt', 'ja', 'zh', 'hi', 'ru', 'ko'],
  defaultLocale: 'en',
});

export function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  // 🔒 X-Frame-Options: Prévient les attaques clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // 🔒 X-Content-Type-Options: Empêche le MIME-sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // 🔒 Referrer-Policy: Contrôle les informations envoyées dans le header Referer
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 🔒 Permissions-Policy: Désactive les APIs sensibles du navigateur
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );

  // 🔒 X-DNS-Prefetch-Control: Désactive le prefetch DNS pour les liens externes
  response.headers.set('X-DNS-Prefetch-Control', 'off');

  // 🔒 Content-Security-Policy (CSP)
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
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // 🔒 X-XSS-Protection: Protection XSS legacy
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // 📊 Server header - Masquer la version
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');

  return response;
}

/**
 * Configuration du matcher
 *
 * Applique le middleware à toutes les routes sauf:
 * - API endpoints
 * - Fichiers statiques Next.js (_next/static)
 * - Images optimisées (_next/image)
 * - Favicon et images root
 */
export const config = {
  matcher: [
    '/((?!api|_next|static|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)',
  ],
};
