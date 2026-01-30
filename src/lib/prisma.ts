// Prisma désactivé pour build/demo
export const prisma: any = new Proxy({}, { get: () => async () => [] });
