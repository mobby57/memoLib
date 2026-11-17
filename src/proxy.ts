// src/proxy.ts â€” Clerk + i18n + security headers + feature gate
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

const LOCALES = ['fr', 'en'] as const;
const DEFAULT_LOCALE = 'fr';

const DISABLED_API_PREFIXES: { prefix: string; envKey: string; module: string }[] = [
  { prefix: '/api/comptabilite', envKey: 'FEATURE_COMPTABILITE', module: 'comptabilite' },
  { prefix: '/api/exports/fec', envKey: 'FEATURE_COMPTABILITE', module: 'comptabilite' },
  { prefix: '/api/multichannel', envKey: 'FEATURE_MULTICHANNEL', module: 'multichannel' },
  { prefix: '/api/voice', envKey: 'FEATURE_VOICE', module: 'voice' },
  { prefix: '/api/ocr', envKey: 'FEATURE_OCR', module: 'ocr' },
  { prefix: '/api/github', envKey: 'FEATURE_GITHUB', module: 'github' },
  { prefix: '/api/azure', envKey: 'FEATURE_AZURE', module: 'azure' },
  { prefix: '/api/calendar/google-sync', envKey: 'FEATURE_CALENDAR_SYNC', module: 'calendar-sync' },
  { prefix: '/api/calendar/sync', envKey: 'FEATURE_CALENDAR_SYNC', module: 'calendar-sync' },
  { prefix: '/api/integrations/sync', envKey: 'FEATURE_CALENDAR_SYNC', module: 'calendar-sync' },
  { prefix: '/api/ai/copilot', envKey: 'FEATURE_AI_ADVANCED', module: 'ai-advanced' },
  { prefix: '/api/ai/predict-outcome', envKey: 'FEATURE_AI_ADVANCED', module: 'ai-advanced' },
  { prefix: '/api/ai/prepare-ofpra', envKey: 'FEATURE_AI_ADVANCED', module: 'ai-advanced' },
  { prefix: '/api/ai/risk-analysis', envKey: 'FEATURE_AI_ADVANCED', module: 'ai-advanced' },
  { prefix: '/api/ai/strategy', envKey: 'FEATURE_AI_ADVANCED', module: 'ai-advanced' },
  { prefix: '/api/ai/translate', envKey: 'FEATURE_AI_ADVANCED', module: 'ai-advanced' },
  { prefix: '/api/ai/generate-recours', envKey: 'FEATURE_AI_ADVANCED', module: 'ai-advanced' },
  { prefix: '/api/forms/approvals', envKey: 'FEATURE_FORMS', module: 'forms' },
  { prefix: '/api/forms/resource-request', envKey: 'FEATURE_FORMS', module: 'forms' },
  { prefix: '/api/forms/risk-assessment', envKey: 'FEATURE_FORMS', module: 'forms' },
  { prefix: '/api/forms/strategic-decision', envKey: 'FEATURE_FORMS', module: 'forms' },
  { prefix: '/api/questionnaire', envKey: 'FEATURE_QUESTIONNAIRE', module: 'questionnaire' },
  { prefix: '/api/super-admin', envKey: 'FEATURE_SUPER_ADMIN', module: 'super-admin' },
  { prefix: '/api/subscriptions', envKey: 'FEATURE_SUBSCRIPTIONS', module: 'subscriptions' },
  { prefix: '/api/workspace-reasoning', envKey: 'FEATURE_WORKSPACE_REASONING', module: 'workspace-reasoning' },
];

function isFeatureEnvEnabled(envKey: string): boolean {
  const val = process.env[envKey];
  return val === 'true' || val === '1';
}

function getBlockedApiModule(pathname: string): string | null {
  for (const { prefix, envKey, module } of DISABLED_API_PREFIXES) {
    if (pathname.startsWith(prefix) && !isFeatureEnvEnabled(envKey)) return module;
  }
  return null;
}

const GONE_PATHS = ['/associes-demo', '/register', '/associes'];

const shortcuts: Record<string, string> = {
  '/dashboard': `/${DEFAULT_LOCALE}/dashboard`,
  '/login': `/${DEFAULT_LOCALE}/auth/login`,
  '/auth/login': `/${DEFAULT_LOCALE}/auth/login`,
  '/auth/register': `/${DEFAULT_LOCALE}/auth/register`,
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

const isProtectedRoute = createRouteMatcher([
  '/(fr|en)/dashboard(.*)',
  '/(fr|en)/admin(.*)',
  '/(fr|en)/super-admin(.*)',
  '/(fr|en)/lawyer(.*)',
  '/(fr|en)/client-dashboard(.*)',
  '/(fr|en)/client(.*)',
  '/(fr|en)/dossiers(.*)',
  '/(fr|en)/clients(.*)',
  '/(fr|en)/documents(.*)',
  '/(fr|en)/factures(.*)',
  '/(fr|en)/emails(.*)',
  '/(fr|en)/calendrier(.*)',
  '/(fr|en)/ai-assistant(.*)',
  '/(fr|en)/analytics(.*)',
  '/(fr|en)/settings(.*)',
  '/(fr|en)/workspaces(.*)',
]);

function isStatic(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    /\.(?:png|jpg|jpeg|gif|svg|webp|ico|xml|txt)$/.test(pathname)
  );
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  const nonce = btoa(crypto.randomUUID());
  response.headers.set('x-nonce', nonce);

  response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );
  response.headers.set('X-DNS-Prefetch-Control', 'off');

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://vercel.live https://va.vercel-scripts.com https://clerk.com https://*.clerk.accounts.dev`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://vercel.live https://*.sentry.io https://*.neon.tech https://*.azurewebsites.net https://*.twilio.com https://clerk.com https://*.clerk.accounts.dev wss://*.vercel.live",
    "frame-src 'self' https://vercel.live https://clerk.com https://*.clerk.accounts.dev",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ];
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

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

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) {
    const blocked = getBlockedApiModule(pathname);
    if (blocked) {
      return NextResponse.json(
        {
          error: 'Feature not available',
          message: `Le module "${blocked}" n'est pas activÃ©. Contactez votre administrateur.`,
          code: 'FEATURE_DISABLED',
          module: blocked,
        },
        { status: 404 }
      );
    }
    return NextResponse.next();
  }

  if (isStatic(pathname)) {
    return NextResponse.next();
  }

  if (GONE_PATHS.includes(pathname)) {
    return new NextResponse(null, { status: 410 });
  }

  if (shortcuts[pathname]) {
    const url = request.nextUrl.clone();
    url.pathname = shortcuts[pathname];
    return NextResponse.redirect(url);
  }

  if (pathname === '/') {
    const { userId } = await auth();
    const url = request.nextUrl.clone();
    url.pathname = userId ? `/${DEFAULT_LOCALE}/dashboard` : `/${DEFAULT_LOCALE}`;
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    return NextResponse.next();
  }

  const hasLocale = LOCALES.some(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  );
  if (!hasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    return NextResponse.redirect(url);
  }

  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  return applySecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};