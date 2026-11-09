import { auth } from '@clerk/nextjs/server';

/** Shim de compatibilité pour next-auth/jwt getToken → Clerk auth() */
export async function getTokenCompat() {
  const { userId } = await auth();
  if (!userId) return null;
  return { sub: userId };
}

/** Alias utilisé par les middlewares */
export async function getAuthToken(req?: Request) {
  const { userId } = await auth();
  if (!userId) return null;
  return { sub: userId, email: '', tier: 'free' };
}

export { getAuthToken as getToken };
