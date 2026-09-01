import { auth } from '@/lib/clerk-auth';
import { auth, type AuthenticatedUser } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedContext {
  user: AuthenticatedUser;
  params?: Record<string, string>;
}

type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthenticatedContext
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    context?: { params?: Record<string, string> }
  ): Promise<NextResponse> => {
    const { user } = await auth();
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    return handler(request, { user, params: context?.params });
  };
}

export function withRole(allowedRoles: readonly string[]) {
  return (handler: AuthenticatedHandler) =>
    withAuth(async (request, context) => {
      if (!allowedRoles.includes(context.user.role)) {
        return NextResponse.json(
          { error: 'Accès refusé', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      return handler(request, context);
    });
}

export const withAdmin = withRole(['ADMIN', 'SUPER_ADMIN']);
export const withLawyer = withRole(['AVOCAT', 'ADMIN', 'SUPER_ADMIN']);

export default withAuth;
