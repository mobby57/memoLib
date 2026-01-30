import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const protect = process.env.PREVIEW_PROTECT === 'true';
  if (!protect) {
    return NextResponse.next();
  }

  // Allow assets and Next internals
  const url = req.nextUrl;
  const pathname = url.pathname;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml')
  ) {
    return NextResponse.next();
  }

  // Token via header or cookie
  const headerToken = req.headers.get('x-preview-token') || '';
  const cookieToken = req.cookies.get('preview_token')?.value || '';
  const expected = process.env.PREVIEW_TOKEN || '';

  if (expected && (headerToken === expected || cookieToken === expected)) {
    return NextResponse.next();
  }

  return new NextResponse('Preview Protected: set x-preview-token header or cookie', {
    status: 401,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export const config = {
  matcher: ['/((?!api/health).*)'],
};
