import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Next.js 16+ utilise "proxy" au lieu de "middleware"
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques
  if (pathname === '/' || 
      pathname === '/auth/login' || 
      pathname.startsWith('/api/auth') || 
      pathname.startsWith('/api/webhooks') ||
      pathname.startsWith('/_next') || 
      pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Rediriger /login vers /auth/login
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Vérifier token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
