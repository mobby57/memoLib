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
 * Proxy/Middleware - Vérifications hiérarchiques et isolation tenant
 * + Sécurité OWASP ZAP compliant
 * 
 * Hiérarchie des rôles :
 * - SUPER_ADMIN : Accès à tous les tenants (routes /super-admin/*)
 * - ADMIN : Accès à son tenant uniquement (routes /admin/*, /api/admin/*, /dashboard, etc.)
 * - CLIENT : Accès lecture seule à ses propres données (routes /client/*, /api/client/*)
 */

type UserContext = {
  role: string;
  tenantId: string;
};

/**
 * Vérifie si la route est publique
 */
function isPublicRoute(pathname: string): boolean {
  return pathname === '/' || 
         pathname.startsWith('/auth') || 
         pathname.startsWith('/api/auth');
}

/**
 * Gère les requêtes non authentifiées
 */
function handleUnauthenticated(pathname: string, request: NextRequest): NextResponse {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  
  const url = new URL('/auth/login', request.url);
  url.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(url);
}

/**
 * Vérifie l'accès aux routes Super Admin
 */
function handleSuperAdminRoutes(pathname: string, userRole: string): NextResponse | null {
  const isSuperAdminRoute = pathname.startsWith('/super-admin') || pathname.startsWith('/api/super-admin');
  if (!isSuperAdminRoute) {
    return null;
  }

  if (userRole !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Accès refusé: Niveau Super Admin requis' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

/**
 * Vérifie si le pathname correspond à une route admin
 */
function isAdminRoute(pathname: string): boolean {
  const adminPaths = ['/admin', '/api/admin', '/dashboard', '/dossiers', '/clients', '/factures'];
  return adminPaths.some(path => pathname.startsWith(path));
}

/**
 * Vérifie l'isolation tenant pour les routes admin
 */
function checkTenantIsolation(pathname: string, userTenantId: string): NextResponse | null {
  const needsTenantCheck = pathname.startsWith('/api/admin') || pathname.startsWith('/api/tenant');
  if (!needsTenantCheck) {
    return null;
  }

  const tenantIdInUrl = extractTenantIdFromPath(pathname);
  if (tenantIdInUrl && tenantIdInUrl !== userTenantId) {
    return NextResponse.json(
      { error: 'Accès refusé: Isolation tenant' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Gère l'accès aux routes Admin
 */
function handleAdminRoutes(pathname: string, user: UserContext): NextResponse | null {
  if (!isAdminRoute(pathname)) {
    return null;
  }

  if (user.role === 'CLIENT') {
    return NextResponse.json(
      { error: 'Accès refusé: Niveau Admin requis' },
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
 * Gère l'accès aux routes Client
 */
function handleClientRoutes(pathname: string): NextResponse | null {
  const isClientRoute = pathname.startsWith('/client') || pathname.startsWith('/api/client');
  if (!isClientRoute) {
    return null;
  }

  // ADMIN et SUPER_ADMIN peuvent aussi accéder (debug/support)
  return NextResponse.next();
}

/**
 * Gère l'accès aux routes API tenant avec isolation stricte
 */
function handleTenantApiRoutes(pathname: string, user: UserContext): NextResponse | null {
  if (!pathname.startsWith('/api/tenant/')) {
    return null;
  }

  const tenantIdInUrl = pathname.split('/')[3];

  // Super Admin a accès à tous les tenants
  if (user.role === 'SUPER_ADMIN') {
    return NextResponse.next();
  }

  // Isolation stricte pour ADMIN et CLIENT
  if (tenantIdInUrl && tenantIdInUrl !== user.tenantId) {
    return NextResponse.json(
      { error: 'Accès refusé: Isolation tenant' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

/**
 * Redirige l'utilisateur selon son rôle
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

  // 1. SÉCURITÉ : Rate limiting
  if (!checkRateLimit(request)) {
    return NextResponse.json(
      { error: 'Trop de requêtes' }, 
      { status: 429 }
    );
  }

  // 2. SÉCURITÉ : Validation CSRF pour routes sensibles
  if (isSecureRoute(pathname) && !validateCSRF(request)) {
    return NextResponse.json(
      { error: 'CSRF validation failed' }, 
      { status: 403 }
    );
  }

  // 3. Routes publiques : accès direct avec headers sécurisés
  if (isPublicRoute(pathname)) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // 4. Récupérer le token JWT
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || '',
  });

  // 5. Non authentifié : rediriger vers login
  if (!token) {
    return handleUnauthenticated(pathname, request);
  }

  const user: UserContext = {
    role: token.role as string,
    tenantId: token.tenantId as string
  };

  // 6. Traiter les routes dans l'ordre hiérarchique
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
      // Ajouter headers sécurisés à toutes les réponses
      const secureResult = addSecurityHeaders(result);
      if (pathname.startsWith('/api/')) {
        return addApiSecurityHeaders(secureResult);
      }
      return secureResult;
    }
  }

  // 7. Réponse par défaut avec headers sécurisés
  const response = NextResponse.next();
  const secureResponse = addSecurityHeaders(response);
  
  if (pathname.startsWith('/api/')) {
    return addApiSecurityHeaders(secureResponse);
  }
  
  return secureResponse;
}

/**
 * Extrait le tenantId d'un path API si présent
 * Ex: /api/tenant/abc123/dossiers → abc123
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
