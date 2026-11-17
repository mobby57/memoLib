import { prisma } from '@/lib/prisma';

export async function resolveActiveClerkUser(clerkUserId: string) {
  return prisma.user.findFirst({
    where: { clerkUserId, status: 'active' },
    select: {
      id: true,
      email: true,
      role: true,
      tenantId: true,
    },
  });
}
