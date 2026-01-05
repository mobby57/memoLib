import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques
  if (pathname === '/' || 
      pathname === '/login' || 
      pathname.startsWith('/api/auth') || 
      pathname.startsWith('/api/webhooks') ||
      pathname.startsWith('/_next') || 
      pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Vérifier token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
