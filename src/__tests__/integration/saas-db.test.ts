import { PrismaClient } from '@prisma/client';

// Utiliser DATABASE_URL directement
const prisma = new PrismaClient();

describe('Database Integration (saas-db)', () => {
    it('should connect to the database', async () => {
        const result = await prisma.$queryRaw`SELECT 1 as val`;
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('val', 1);
    });

    it('should have Plan table with data', async () => {
        const plan = await prisma.plan.findFirst();
        expect(plan).toBeDefined();
    });

    it('should have Tenant table with data', async () => {
        const tenant = await prisma.tenant.findFirst();
        expect(tenant).toBeDefined();
    });

    it('should have User table with data', async () => {
        const user = await prisma.user.findFirst();
        expect(user).toBeDefined();
    });

    it('should have demo tenant with plan pilot', async () => {
        const tenant = await prisma.tenant.findFirst({ where: { subdomain: 'demo' } });
        expect(tenant).toBeDefined();
        if (tenant) {
            const plan = await prisma.plan.findUnique({ where: { id: tenant.planId } });
            expect(plan).toBeDefined();
            if (plan) {
                expect(plan.name).toBe('pilot');
            }
        }
    });
});
