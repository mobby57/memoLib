import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  const response = NextResponse.next();
  const version = process.env.NEXT_PUBLIC_APP_VERSION || 'unknown';
  const commit = process.env.NEXT_PUBLIC_BUILD_COMMIT || '';

  response.headers.set('x-app-version', version);
  if (commit) {
    response.headers.set('x-build-commit', commit);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
