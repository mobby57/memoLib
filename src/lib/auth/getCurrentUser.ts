import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  // On cherche l'utilisateur dans notre base de données
  const user = await prisma.user.findFirst({
    where: { id: userId }, // ou clerkId selon ton schéma
    include: { Tenant: true }
  });

  if (!user) return null;

  return user;
}
