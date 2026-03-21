import { NextRequest, NextResponse } from 'next/server';

const locales = ['fr', 'en', 'es'];
const defaultLocale = 'fr';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static files, Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has a locale
  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );

  if (!hasLocale) {
    return NextResponse.redirect(
      new URL(`/${defaultLocale}${pathname || '/'}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon|.*\\..*).*)'],
};
