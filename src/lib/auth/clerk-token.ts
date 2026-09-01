import { auth } from '@/lib/clerk-auth';

export interface AuthToken {
  sub: string;
  email: string;
  role: string;
  tenantId?: string;
}

export async function getAuthToken(): Promise<AuthToken | null> {
  const { user } = await auth();
  if (!user) {
    return null;
  }

  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  };
}
