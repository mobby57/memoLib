import { auth } from '@/lib/auth/auth';

// Compatibility shim for legacy getServerSession(authOptions) usage.
// In next-auth v5, auth() is the canonical server-side API.
export async function getServerSession(..._args: unknown[]) {
  return auth();
}
