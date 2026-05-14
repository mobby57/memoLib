/**
 * Tests d'intégration DB — Vérification SaaS readiness
 * Exécute des requêtes réelles sur la base PostgreSQL locale
 * 
 * Lancer avec : npx jest src/__tests__/integration/saas-db.test.ts --no-cache
 * @jest-environment node
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config({ path: '.env' });

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

let dbAvailable = false;

beforeAll(async () => {
  try {
    await prisma.$connect();
    dbAvailable = true;
  } catch {
    console.warn('⚠️  PostgreSQL non disponible — tests d\'intégration DB skippés');
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('DB — Tables SaaS', () => {
  it('la table UsageRecord existe', async () => {
    if (!dbAvailable) return;
    const count = await prisma.usageRecord.count();
    expect(typeof count).toBe('number');
  });

  it('la table AIUsageLog existe', async () => {
    if (!dbAvailable) return;
    const count = await prisma.aIUsageLog.count();
    expect(typeof count).toBe('number');
  });

  it('la table QuotaEvent existe', async () => {
    if (!dbAvailable) return;
    const count = await prisma.quotaEvent.count();
    expect(typeof count).toBe('number');
  });
});

describe('DB — Plans alignés', () => {
  it('les 4 plans officiels existent et sont actifs', async () => {
    if (!dbAvailable) return;
    const plans = await prisma.plan.findMany({
      where: { name: { in: ['pilot', 'solo', 'cabinet', 'enterprise'] }, isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });

    expect(plans).toHaveLength(4);
    expect(plans.map(p => p.name)).toEqual(['pilot', 'solo', 'cabinet', 'enterprise']);
  });

  it('les prix sont corrects', async () => {
    if (!dbAvailable) return;
    const plans = await prisma.plan.findMany({
      where: { name: { in: ['pilot', 'solo', 'cabinet', 'enterprise'] } },
      orderBy: { priceMonthly: 'asc' },
      select: { name: true, priceMonthly: true, priceYearly: true },
    });

    const byName = Object.fromEntries(plans.map(p => [p.name, p]));
    expect(byName.pilot.priceMonthly).toBe(0);
    expect(byName.solo.priceMonthly).toBe(49);
    expect(byName.cabinet.priceMonthly).toBe(349);
    expect(byName.enterprise.priceMonthly).toBe(599);
  });

  it('les limites sont cohérentes (enterprise = illimité)', async () => {
    if (!dbAvailable) return;
    const enterprise = await prisma.plan.findUnique({ where: { name: 'enterprise' } });
    expect(enterprise!.maxDossiers).toBe(-1);
    expect(enterprise!.maxClients).toBe(-1);
  });

  it('pilot a les limites les plus basses', async () => {
    if (!dbAvailable) return;
    const pilot = await prisma.plan.findUnique({ where: { name: 'pilot' } });
    expect(pilot!.maxDossiers).toBe(5);
    expect(pilot!.maxClients).toBe(5);
    expect(pilot!.maxUsers).toBe(1);
    expect(pilot!.maxStorageGb).toBe(1);
  });
});

describe('DB — Tenant démo', () => {
  it('le tenant démo existe avec le plan pilot', async () => {
    if (!dbAvailable) return;
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: 'demo' },
      include: { plan: { select: { name: true } } },
    });

    expect(tenant).toBeDefined();
    expect(tenant!.plan.name).toBe('pilot');
    expect(tenant!.status).toBe('active');
  });

  it('le tenant démo a une subscription en trialing', async () => {
    if (!dbAvailable) return;
    const tenant = await prisma.tenant.findUnique({ where: { subdomain: 'demo' } });
    const sub = await prisma.subscription.findUnique({ where: { tenantId: tenant!.id } });

    expect(sub).toBeDefined();
    expect(sub!.status).toBe('trialing');
    expect(sub!.trialEnd).toBeDefined();
    expect(new Date(sub!.trialEnd!).getTime()).toBeGreaterThan(Date.now());
  });

  it('le tenant démo a des TenantSettings', async () => {
    if (!dbAvailable) return;
    const tenant = await prisma.tenant.findUnique({ where: { subdomain: 'demo' } });
    const settings = await prisma.tenantSettings.findUnique({ where: { tenantId: tenant!.id } });

    expect(settings).toBeDefined();
    expect(settings!.ollamaEnabled).toBe(true);
  });
});

describe('DB — Utilisateurs', () => {
  it('le super admin existe sans tenant', async () => {
    if (!dbAvailable) return;
    const user = await prisma.user.findUnique({ where: { email: 'superadmin@memolib.com' } });
    expect(user).toBeDefined();
    expect(user!.role).toBe('SUPER_ADMIN');
    expect(user!.tenantId).toBeNull();
  });

  it('l\'avocat existe avec le bon rôle et tenant', async () => {
    if (!dbAvailable) return;
    const user = await prisma.user.findUnique({
      where: { email: 'avocat@memolib.fr' },
      include: { tenant: { select: { subdomain: true } } },
    });
    expect(user).toBeDefined();
    expect(user!.role).toBe('AVOCAT');
    expect(user!.tenant!.subdomain).toBe('demo');
  });

  it('le client existe avec le bon rôle', async () => {
    if (!dbAvailable) return;
    const user = await prisma.user.findUnique({ where: { email: 'client@memolib.fr' } });
    expect(user).toBeDefined();
    expect(user!.role).toBe('CLIENT');
  });
});

describe('DB — UsageRecord CRUD', () => {
  let testRecordId: string;

  it('peut créer un enregistrement d\'usage', async () => {
    if (!dbAvailable) return;
    const tenant = await prisma.tenant.findUnique({ where: { subdomain: 'demo' } });
    const record = await prisma.usageRecord.create({
      data: {
        tenantId: tenant!.id,
        type: 'ocr',
        quantity: 5,
        unitCost: 0.02,
        totalCost: 0.10,
      },
    });

    testRecordId = record.id;
    expect(record.id).toBeDefined();
    expect(record.totalCost).toBe(0.10);
  });

  it('peut agréger les usages par type', async () => {
    if (!dbAvailable) return;
    const tenant = await prisma.tenant.findUnique({ where: { subdomain: 'demo' } });
    const result = await prisma.usageRecord.groupBy({
      by: ['type'],
      where: { tenantId: tenant!.id },
      _sum: { quantity: true, totalCost: true },
    });

    expect(Array.isArray(result)).toBe(true);
  });

  afterAll(async () => {
    if (testRecordId) {
      await prisma.usageRecord.delete({ where: { id: testRecordId } }).catch(() => {});
    }
  });
});
