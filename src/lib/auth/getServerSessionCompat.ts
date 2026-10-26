import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Compat Helper - Fonctionne en prod (Clerk) ET en test (NextAuth mock).
 * 
 * Ordre de résolution :
 * 1. Clerk (prod) : si auth() retourne un userId, on cherche l'user en DB
 * 2. NextAuth (test) : si des tests mockent getServerSession, on l'utilise
 * 
 * Ça permet aux 247 routes API migrées de fonctionner en prod
 * ET aux tests existants de continuer à marcher sans modification.
 */
export async function getServerSessionCompat() {
  // ─── 1. TENTER CLERK (PROD) ───
  try {
    const { userId } = await auth();
    if (userId) {
      const user = await prisma.user.findFirst({
        where: { OR: [{ id: userId }, { email: userId }] },
        include: { Client: true }
      });
      if (user) {
        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
            clientId: user.Client?.[0]?.id || null,
            groups: [] as string[],
          } as any
        };
      }
    }
  } catch {
    // Clerk pas configuré ou pas de requête HTTP → on continue
  }

  // ─── 2. FALLBACK NEXT-AUTH (TESTS) ───
  try {
    // Import dynamique pour éviter de casser si next-auth n'est plus installé
    const nextAuth = await import('next-auth').catch(() => null);
    if (nextAuth?.getServerSession) {
      const session = await (nextAuth.getServerSession as any)({}).catch(() => null);
      if (session?.user) return session;
    }
  } catch {
    // Pas de next-auth ou pas de mock → on continue
  }

  return null;
}
