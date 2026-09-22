import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/:locale',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/:locale/sign-in(.*)',
  '/:locale/sign-up(.*)',
  '/:locale/auth/login(.*)',
  '/:locale/auth/register(.*)',
  '/:locale/auth/forgot-password(.*)',
  '/:locale/auth/reset-password(.*)',
  '/:locale/(privacy|terms|contact|pricing)(.*)',
  '/api/cron(.*)',
  '/api/webhooks',
  '/api/webhooks/stripe(.*)',
  '/api/webhooks/github(.*)',
  '/api/webhooks/email(.*)',
  '/api/webhooks/email-inbound(.*)',
  '/api/webhooks/inbox(.*)',
  '/api/webhooks/channel(.*)',
]);

function addSecurityHeaders(response: NextResponse): NextResponse {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com",
    "style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.sentry.io https://*.neon.tech wss:",
    "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ];

  response.headers.set('Content-Security-Policy', csp.join('; '));
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
  response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
  return response;
}

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  return addSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
