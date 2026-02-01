import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { 
  addSecurityHeaders, 
  addApiSecurityHeaders, 
  checkRateLimit, 
  isSecureRoute, 
  validateCSRF 
} from './middleware/security';

/**
 * Proxy/Middleware - Verifications hierarchiques et isolation tenant
 * + Securite OWASP ZAP compliant
 * 
 * Hierarchie des roles :
 * - SUPER_ADMIN : Acces a tous les tenants (routes /super-admin/*)
 * - ADMIN : Acces a son tenant uniquement (routes /admin/*, /api/admin/*, /dashboard, etc.)
 * - CLIENT : Acces lecture seule a ses propres donnees (routes /client/*, /api/client/*)
 */

type UserContext = {
  role: string;
  tenantId: string;
};

/**
 * Verifie si la route est publique
 */
function isPublicRoute(pathname: string): boolean {
  return pathname === '/' || 
         pathname.startsWith('/auth') || 
         pathname.startsWith('/api/auth');
}

/**
 * Gere les requetes non authentifiees
 */
function handleUnauthenticated(pathname: string, request: NextRequest): NextResponse {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }
  
  const url = new URL('/auth/login', request.url);
  url.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(url);
}

/**
 * Verifie l'acces aux routes Super Admin
 */
function handleSuperAdminRoutes(pathname: string, userRole: string): NextResponse | null {
  const isSuperAdminRoute = pathname.startsWith('/super-admin') || pathname.startsWith('/api/super-admin');
  if (!isSuperAdminRoute) {
    return null;
  }

  if (userRole !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Acces refuse: Niveau Super Admin requis' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

/**
 * Verifie si le pathname correspond a une route admin
 */
function isAdminRoute(pathname: string): boolean {
  const adminPaths = ['/admin', '/api/admin', '/dashboard', '/dossiers', '/clients', '/factures'];
  return adminPaths.some(path => pathname.startsWith(path));
}

/**
 * Verifie l'isolation tenant pour les routes admin
 */
function checkTenantIsolation(pathname: string, userTenantId: string): NextResponse | null {
  const needsTenantCheck = pathname.startsWith('/api/admin') || pathname.startsWith('/api/tenant');
  if (!needsTenantCheck) {
    return null;
  }

  const tenantIdInUrl = extractTenantIdFromPath(pathname);
  if (tenantIdInUrl && tenantIdInUrl !== userTenantId) {
    return NextResponse.json(
      { error: 'Acces refuse: Isolation tenant' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Gere l'acces aux routes Admin
 */
function handleAdminRoutes(pathname: string, user: UserContext): NextResponse | null {
  if (!isAdminRoute(pathname)) {
    return null;
  }

  if (user.role === 'CLIENT') {
    return NextResponse.json(
      { error: 'Acces refuse: Niveau Admin requis' },
      { status: 403 }
    );
  }

  if (user.role === 'ADMIN') {
    const tenantError = checkTenantIsolation(pathname, user.tenantId);
    if (tenantError) {
      return tenantError;
    }
  }

  return NextResponse.next();
}

/**
 * Gere l'acces aux routes Client
 */
function handleClientRoutes(pathname: string): NextResponse | null {
  const isClientRoute = pathname.startsWith('/client') || pathname.startsWith('/api/client');
  if (!isClientRoute) {
    return null;
  }

  // ADMIN et SUPER_ADMIN peuvent aussi acceder (debug/support)
  return NextResponse.next();
}

/**
 * Gere l'acces aux routes API tenant avec isolation stricte
 */
function handleTenantApiRoutes(pathname: string, user: UserContext): NextResponse | null {
  if (!pathname.startsWith('/api/tenant/')) {
    return null;
  }

  const tenantIdInUrl = pathname.split('/')[3];

  // Super Admin a acces a tous les tenants
  if (user.role === 'SUPER_ADMIN') {
    return NextResponse.next();
  }

  // Isolation stricte pour ADMIN et CLIENT
  if (tenantIdInUrl && tenantIdInUrl !== user.tenantId) {
    return NextResponse.json(
      { error: 'Acces refuse: Isolation tenant' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

/**
 * Redirige l'utilisateur selon son role
 */
function handleRootRedirect(pathname: string, userRole: string, request: NextRequest): NextResponse | null {
  if (pathname !== '/') {
    return null;
  }

  const roleRedirects: Record<string, string> = {
    'SUPER_ADMIN': '/super-admin',
    'ADMIN': '/dashboard',
    'CLIENT': '/client'
  };

  const redirectPath = roleRedirects[userRole];
  if (redirectPath) {
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return null;
}

/**
 * Fonction principale du middleware
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. SeCURITe : Rate limiting
  if (!checkRateLimit(request)) {
    return NextResponse.json(
      { error: 'Trop de requetes' }, 
      { status: 429 }
    );
  }

  // 2. SeCURITe : Validation CSRF pour routes sensibles
  if (isSecureRoute(pathname) && !validateCSRF(request)) {
    return NextResponse.json(
      { error: 'CSRF validation failed' }, 
      { status: 403 }
    );
  }

  // 3. Routes publiques : acces direct avec headers securises
  if (isPublicRoute(pathname)) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // 4. Recuperer le token JWT
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || '',
  });

  // 5. Non authentifie : rediriger vers login
  if (!token) {
    return handleUnauthenticated(pathname, request);
  }

  const user: UserContext = {
    role: token.role as string,
    tenantId: token.tenantId as string
  };

  // 6. Traiter les routes dans l'ordre hierarchique
  const handlers = [
    () => handleSuperAdminRoutes(pathname, user.role),
    () => handleAdminRoutes(pathname, user),
    () => handleClientRoutes(pathname),
    () => handleTenantApiRoutes(pathname, user),
    () => handleRootRedirect(pathname, user.role, request)
  ];

  for (const handler of handlers) {
    const result = handler();
    if (result) {
      // Ajouter headers securises a toutes les reponses
      const secureResult = addSecurityHeaders(result);
      if (pathname.startsWith('/api/')) {
        return addApiSecurityHeaders(secureResult);
      }
      return secureResult;
    }
  }

  // 7. Reponse par defaut avec headers securises
  const response = NextResponse.next();
  const secureResponse = addSecurityHeaders(response);
  
  if (pathname.startsWith('/api/')) {
    return addApiSecurityHeaders(secureResponse);
  }
  
  return secureResponse;
}

/**
 * Extrait le tenantId d'un path API si present
 * Ex: /api/tenant/abc123/dossiers [Next] abc123
 */
function extractTenantIdFromPath(pathname: string): string | null {
  const tenantMatch = pathname.match(/\/api\/tenant\/([^\/]+)/);
  if (tenantMatch && tenantMatch[1]) {
    return tenantMatch[1];
  }
  return null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
