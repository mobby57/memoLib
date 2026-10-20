/**
 * Seed du sandbox : cree un tenant de demo avec donnees 100% fictives.
 * Usage : npx tsx scripts/sandbox/seed.ts
 * Idempotent : peut etre relance sans erreur.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SANDBOX_PLAN_ID = 'sandbox-plan-demo-0000-0000-000000000001';
const SANDBOX_TENANT_ID = 'sandbox-tenant-demo-0000-0000-000000000001';
const SANDBOX_USER_ID = 'sandbox-user-demo-0000-0000-000000000001';
const SANDBOX_CLIENT_ID = 'sandbox-client-demo-0000-0000-000000000001';
const SANDBOX_DOSSIER_ID = 'sandbox-dossier-demo-0000-0000-000000000001';

async function main() {
  console.log('[seed] Creation du sandbox...');

  // 1. Plan (obligatoire pour le Tenant)
  await prisma.plan.upsert({
    where: { id: SANDBOX_PLAN_ID },
    update: {},
    create: {
      id: SANDBOX_PLAN_ID,
      name: 'sandbox-plan',
      displayName: 'Plan Demo (FICTIF)',
      priceMonthly: 0,
      priceYearly: 0,
    },
  });
  console.log('  [1/5] Plan OK');

  // 2. Tenant
  await prisma.tenant.upsert({
    where: { id: SANDBOX_TENANT_ID },
    update: {},
    create: {
      id: SANDBOX_TENANT_ID,
      name: 'Cabinet Demo (FICTIF)',
      subdomain: 'sandbox-demo',
      planId: SANDBOX_PLAN_ID,
      status: 'active',
      updatedAt: new Date(),
    },
  });
  console.log('  [2/5] Tenant OK');

  // 3. User avocat demo
  await prisma.user.upsert({
    where: { id: SANDBOX_USER_ID },
    update: {},
    create: {
      id: SANDBOX_USER_ID,
      email: 'demo-sandbox@example-fictif.fr',
      name: 'Maitre Demo (FICTIF)',
      password: '',
      role: 'AVOCAT',
      tenantId: SANDBOX_TENANT_ID,
      status: 'active',
      updatedAt: new Date(),
    },
  });
  console.log('  [3/5] User OK');

  // 4. Client fictif
  await prisma.client.upsert({
    where: { id: SANDBOX_CLIENT_ID },
    update: {},
    create: {
      id: SANDBOX_CLIENT_ID,
      tenantId: SANDBOX_TENANT_ID,
      firstName: 'Jean',
      lastName: 'DUPONT (FICTIF)',
      email: 'jean.dupont@example-fictif.fr',
      phone: '0102030405',
      updatedAt: new Date(),
    },
  });
  console.log('  [4/5] Client OK');

  // 5. Dossier type CESEDA/OQTF
  await prisma.dossier.upsert({
    where: { id: SANDBOX_DOSSIER_ID },
    update: {},
    create: {
      id: SANDBOX_DOSSIER_ID,
      tenantId: SANDBOX_TENANT_ID,
      numero: 'DEMO-2026-001',
      clientId: SANDBOX_CLIENT_ID,
      typeDossier: 'OQTF',
      objet: 'OQTF - M. DUPONT (dossier fictif)',
      updatedAt: new Date(),
    },
  });
  console.log('  [5/5] Dossier OK');

  console.log('');
  console.log('Sandbox cree avec succes.');
  console.log('  Tenant  : ' + SANDBOX_TENANT_ID);
  console.log('  User    : ' + SANDBOX_USER_ID);
  console.log('  Dossier : DEMO-2026-001');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
