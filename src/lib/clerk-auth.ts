export { auth } from '@clerk/nextjs/server';

export async function getCurrentUser() {
  const { auth: getAuth } = await import('@clerk/nextjs/server');
  const { userId, sessionClaims } = await getAuth();
  if (!userId) return null;
  return { id: userId, ...sessionClaims };
}
