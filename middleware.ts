import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Middleware: i18n routing + security headers + feature gate for MemoLib
 * Handles locale detection, auth redirects, security headers, and beta feature blocking
 */

const LOCALES = ['en', 'fr', 'es', 'de', 'pt', 'ja', 'zh', 'hi', 'ru', 'ko'];
const DEFAULT_LOCALE = 'fr';

// ============================================================================
// BETA FEATURE GATE — Modules with real code but no E2E coverage
// Enable via env vars: FEATURE_COMPTABILITE=true, etc.
// Stubs (ANTS, RPVA, Telerecours, veille-juridique) have been DELETED.
// ============================================================================
const DISABLED_API_PREFIXES: { prefix: string; envKey: string; module: string }[] = [
  // Comptabilité (11 routes, 0 tests, domaine réglementé)
  { prefix: '/api/comptabilite', envKey: 'FEATURE_COMPTABILITE', module: 'comptabilite' },
  { prefix: '/api/exports/fec', envKey: 'FEATURE_COMPTABILITE', module: 'comptabilite' },

  // Multi-canal (WhatsApp, SMS, Teams — dépendance Twilio)
  { prefix: '/api/multichannel', envKey: 'FEATURE_MULTICHANNEL', module: 'multichannel' },

  // Voice (dictée vocale Ollama/Whisper)
  { prefix: '/api/voice', envKey: 'FEATURE_VOICE', module: 'voice' },

  // OCR (extraction texte images — tests placeholder)
  { prefix: '/api/ocr', envKey: 'FEATURE_OCR', module: 'ocr' },

  // GitHub (sync dossiers, issues — intégration Octokit)
  { prefix: '/api/github', envKey: 'FEATURE_GITHUB', module: 'github' },

  // Azure (KeyVault, Blob storage)
  { prefix: '/api/azure', envKey: 'FEATURE_AZURE', module: 'azure' },

  // Calendar sync (Google/Outlook OAuth)
  { prefix: '/api/calendar/google-sync', envKey: 'FEATURE_CALENDAR_SYNC', module: 'calendar-sync' },
  { prefix: '/api/calendar/sync', envKey: 'FEATURE_CALENDAR_SYNC', module: 'calendar-sync' },
  { prefix: '/api/integrations/sync', envKey: 'FEATURE_CALENDAR_SYNC', module: 'calendar-sync' },

  // IA avancée (copilot, prédiction, OFPRA, stratégie, recours)
  { prefix: '/api/ai/copilot', envKey: 'FEATURE_AI_ADVANCED', module: 'ai-advanced' },
  { prefix: '/api/ai/predict-outcome', envKey: 'FEATURE_AI_ADVANCED', module: 'ai-advanced' },
  { prefix: '/api/ai/prepare-ofpra', envKey: 'FEATURE_AI_ADVANCED', module: 'ai-advanced' },
  { prefix: '/api/ai/risk-analysis', envKey: 'FEATURE_AI_ADVANCED', module: 'ai-advanced' },
  { prefix: '/api/ai/strategy', envKey: 'FEATURE_AI_ADVANCED', module: 'ai-advanced' },
  { prefix: '/api/ai/translate', envKey: 'FEATURE_AI_ADVANCED', module: 'ai-advanced' },
  { prefix: '/api/ai/generate-recours', envKey: 'FEATURE_AI_ADVANCED', module: 'ai-advanced' },

  // Forms & approvals (workflows d'approbation)
  { prefix: '/api/forms/approvals', envKey: 'FEATURE_FORMS', module: 'forms' },
  { prefix: '/api/forms/resource-request', envKey: 'FEATURE_FORMS', module: 'forms' },
  { prefix: '/api/forms/risk-assessment', envKey: 'FEATURE_FORMS', module: 'forms' },
  { prefix: '/api/forms/strategic-decision', envKey: 'FEATURE_FORMS', module: 'forms' },

  // Questionnaire dynamique
  { prefix: '/api/questionnaire', envKey: 'FEATURE_QUESTIONNAIRE', module: 'questionnaire' },

  // Super-admin (panel plateforme)
  { prefix: '/api/super-admin', envKey: 'FEATURE_SUPER_ADMIN', module: 'super-admin' },

  // Subscriptions Stripe
  { prefix: '/api/subscriptions', envKey: 'FEATURE_SUBSCRIPTIONS', module: 'subscriptions' },

  // Workspace reasoning (CESDA avancé)
  { prefix: '/api/workspace-reasoning', envKey: 'FEATURE_WORKSPACE_REASONING', module: 'workspace-reasoning' },
];

function isFeatureEnvEnabled(envKey: string): boolean {
  const val = process.env[envKey];
  return val === 'true' || val === '1';
}

/**
 * Check if an API route is blocked by feature flags.
 * Returns the module name if blocked, null if allowed.
 */
function getBlockedApiModule(pathname: string): string | null {
  for (const { prefix, envKey, module } of DISABLED_API_PREFIXES) {
    if (pathname.startsWith(prefix) && !isFeatureEnvEnabled(envKey)) {
      return module;
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── API routes: check feature gate, then pass through ──
  if (pathname.startsWith('/api')) {
    const blockedModule = getBlockedApiModule(pathname);
    if (blockedModule) {
      return NextResponse.json(
        {
          error: 'Feature not available',
          message: `Le module "${blockedModule}" n'est pas activé. Contactez votre administrateur.`,
          code: 'FEATURE_DISABLED',
          module: blockedModule,
        },
        { status: 404 }
      );
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    /\.(?:png|jpg|jpeg|gif|svg|webp|ico|xml|txt)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Raccourcis directs — redirige sans locale prefix
  const shortcuts: Record<string, string> = {
    '/dashboard': `/${DEFAULT_LOCALE}/dashboard`,
    '/login': `/${DEFAULT_LOCALE}/auth/login`,
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

  // Protected routes: redirect to login if no session
  const hasSession = request.cookies.has('next-auth.session-token') || 
                     request.cookies.has('__Secure-next-auth.session-token');
  
  const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/super-admin', '/lawyer', '/client-dashboard', '/dossiers', '/clients', '/documents', '/factures', '/emails'];
  const pathnameWithoutLocale = pathname.replace(/^\/(fr|en|es|de|pt|ja|zh|hi|ru|ko)/, '');
  
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

  // 🔒 ANTI-FUITE: Empêche les proxies/CDN de cacher des données sensibles
  response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

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

  // 🔒 Content-Security-Policy (CSP) — nonce-based
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
 * Applique le middleware à toutes les routes :
 * - API endpoints (pour le feature gate)
 * - Pages (pour i18n + auth + security headers)
 * Sauf:
 * - Fichiers statiques Next.js (_next/static, _next/image)
 * - Favicon et images root
 */
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - static files (/_next/static, /_next/image)
     * - public assets (images, sitemap, robots, favicon)
     */
    '/((?!_next/static|_next/image|static|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
};
