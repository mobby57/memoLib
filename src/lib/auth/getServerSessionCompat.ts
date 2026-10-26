import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function getServerSessionCompat() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findFirst({
    where: { OR: [{ id: userId }, { email: userId }] },
    include: { Client: true }
  });

  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      clientId: user.Client?.[0]?.id || null,
      groups: [] // Fallback vide
    } as any
  };
}
