import { auth, type AuthenticatedUser } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser;
}

export interface AuthResult {
  authenticated: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

export async function verifyAuth(): Promise<AuthResult> {
  const { isAuthenticated, user } = await auth();
  if (!isAuthenticated || !user) {
    return { authenticated: false, error: 'Non authentifié' };
  }

  return { authenticated: true, user };
}

export async function authMiddleware(
  request: NextRequest,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const result = await verifyAuth();
  if (!result.authenticated || !result.user) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = result.user;
  return handler(authenticatedRequest);
}

export function hasRole(user: AuthenticatedUser | undefined, roles: readonly string[]): boolean {
  return user !== undefined && roles.includes(user.role);
}

export async function roleMiddleware(
  request: NextRequest,
  allowedRoles: readonly string[],
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const result = await verifyAuth();
  if (!result.authenticated || !result.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  if (!hasRole(result.user, allowedRoles)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = result.user;
  return handler(authenticatedRequest);
}

export default authMiddleware;
