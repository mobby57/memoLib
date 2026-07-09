import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Proxy (formerly Middleware): i18n routing + security headers for MemoLib
 * Handles locale detection, auth redirects, and security headers
 * 
 * Note: In Next.js 16, middleware is renamed to proxy. Both conventions
 * are supported for backward compatibility. We export both names.
 */

const LOCALES = ['en', 'fr', 'es', 'de', 'pt', 'ja', 'zh', 'hi', 'ru', 'ko'];
const DEFAULT_LOCALE = 'fr';

function handler(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    /\.(?:png|jpg|jpeg|gif|svg|webp|ico|xml|txt)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Anciennes URLs (projet Freetime) — retourner 410 Gone pour désindexation
  const GONE_PATHS = ['/associes-demo', '/register', '/associes'];
  if (GONE_PATHS.includes(pathname)) {
    return new NextResponse(null, { status: 410 });
  }

  // Raccourcis directs — redirige sans locale prefix
  const shortcuts: Record<string, string> = {
    '/dashboard': `/${DEFAULT_LOCALE}/dashboard`,
    '/login': `/${DEFAULT_LOCALE}/auth/login`,
    '/auth/register': `/${DEFAULT_LOCALE}/auth/register`,
    '/auth/login': `/${DEFAULT_LOCALE}/auth/login`,
    '/auth/forgot-password': `/${DEFAULT_LOCALE}/auth/forgot-password`,
    '/auth/reset-password': `/${DEFAULT_LOCALE}/auth/reset-password`,
    '/emails': `/${DEFAULT_LOCALE}/emails`,
    '/dossiers': `/${DEFAULT_LOCALE}/dossiers`,
    '/clients': `/${DEFAULT_LOCALE}/clients`,
    '/documents': `/${DEFAULT_LOCALE}/documents`,
    '/jurisprudence': `/${DEFAULT_LOCALE}/jurisprudence`,
    '/calendrier': `/${DEFAULT_LOCALE}/calendrier`,
    '/factures': `/${DEFAULT_LOCALE}/factures`,
    '/admin': `/${DEFAULT_LOCALE}/admin/dashboard`,
    '/settings': `/${DEFAULT_LOCALE}/admin/settings`,
    '/billing': `/${DEFAULT_LOCALE}/billing`,
    '/analytics': `/${DEFAULT_LOCALE}/analytics`,
    '/client-dashboard': `/${DEFAULT_LOCALE}/client-dashboard`,
    '/client': `/${DEFAULT_LOCALE}/client`,
    '/contact': `/${DEFAULT_LOCALE}/contact`,
    '/ai-assistant': `/${DEFAULT_LOCALE}/ai-assistant`,
  };

  if (shortcuts[pathname]) {
    const url = request.nextUrl.clone();
    url.pathname = shortcuts[pathname];
    return NextResponse.redirect(url);
  }

  // Root → homepage ou dashboard selon session
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    const hasSession = request.cookies.has('next-auth.session-token') || 
                       request.cookies.has('__Secure-next-auth.session-token');
    url.pathname = hasSession ? `/${DEFAULT_LOCALE}/dashboard` : `/${DEFAULT_LOCALE}`;
    return NextResponse.redirect(url);
  }

  // Check if pathname already has a locale prefix
  const hasLocale = LOCALES.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Redirect to default locale if no locale in path
  if (!hasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Authenticated user on homepage → redirect to dashboard
  const pathnameWithoutLocale = pathname.replace(/^\/(fr|en|es|de|pt|ja|zh|hi|ru|ko)/, '');
  if (pathnameWithoutLocale === '' || pathnameWithoutLocale === '/') {
    const hasSessionHome = request.cookies.has('next-auth.session-token') || 
                           request.cookies.has('__Secure-next-auth.session-token');
    if (hasSessionHome) {
      const url = request.nextUrl.clone();
      const locale = LOCALES.find(l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`) || DEFAULT_LOCALE;
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  // Protected routes: redirect to login if no session
  const hasSession = request.cookies.has('next-auth.session-token') || 
                     request.cookies.has('__Secure-next-auth.session-token');
  
  const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/super-admin', '/lawyer', '/client-dashboard', '/client', '/dossiers', '/clients', '/documents', '/factures', '/emails', '/calendrier', '/ai-assistant', '/analytics', '/settings', '/workspaces'];
  if (!hasSession && PROTECTED_PREFIXES.some(p => pathnameWithoutLocale.startsWith(p))) {
    const url = request.nextUrl.clone();
    const locale = LOCALES.find(l => pathname.startsWith(`/${l}/`)) || DEFAULT_LOCALE;
    url.pathname = `/${locale}/auth/login`;
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  // Generate CSP nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  response.headers.set('x-nonce', nonce);

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );
  response.headers.set('X-DNS-Prefetch-Control', 'off');

  // CSP
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://vercel.live https://va.vercel-scripts.com`,
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
    'upgrade-insecure-requests',
  ];
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');

  return response;
}

// Export as both 'proxy' (Next.js 16) and 'middleware' (backward compat)
export const proxy = handler;
export const middleware = handler;
export default handler;

export const config = {
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|static|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)',
  ],
};
