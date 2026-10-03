/**
 * Seed E2E — utilisateur de test mappé au compte Clerk de test.
 *
 * L'auth réelle : session Clerk -> email -> prisma.user.findUnique({ where:{ email } }).
 * Ce script crée (idempotent) un tenant de test + un user local dont l'email
 * correspond au compte Clerk de test (E2E_CLERK_EMAIL). Le champ `password`
 * local est un placeholder : l'authentification passe par Clerk, pas par ce champ.
 *
 * Usage :
 *   E2E_CLERK_EMAIL=avocat@test.com DATABASE_URL=postgresql://... \
 *     npx tsx prisma/seed-e2e-user.ts
 */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const EMAIL = process.env.E2E_CLERK_EMAIL || 'avocat@test.com';
const TENANT_ID = 'e2e-test-tenant';
const TENANT_SUBDOMAIN = 'e2e-test';
const PLAN_ID = 'e2e-plan';

async function main() {
  // 0. Plan de test (FK Tenant.planId -> Plan.id) — idempotent
  await prisma.plan.upsert({
    where: { id: PLAN_ID },
    update: {},
    create: {
      id: PLAN_ID,
      name: 'e2e-test-plan',
      displayName: 'E2E Test Plan',
      priceMonthly: 0,
      priceYearly: 0,
      updatedAt: new Date(),
    },
  });

  // 1. Tenant de test (idempotent)
  await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: {},
    create: {
      id: TENANT_ID,
      name: 'Cabinet E2E Test',
      subdomain: TENANT_SUBDOMAIN,
      planId: PLAN_ID,
      status: 'active',
      updatedAt: new Date(),
    },
  });

  // 2. User local mappé au compte Clerk de test (idempotent par email unique)
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { tenantId: TENANT_ID, role: 'AVOCAT', status: 'active', updatedAt: new Date() },
    create: {
      id: crypto.randomUUID(),
      email: EMAIL,
      name: 'Avocat Test',
      // Placeholder : l'auth passe par Clerk, ce champ n'est pas utilisé pour login.
      password: 'clerk-managed-no-local-login',
      role: 'AVOCAT',
      tenantId: TENANT_ID,
      status: 'active',
      updatedAt: new Date(),
    },
  });

  console.log(`[seed-e2e] OK — tenant=${TENANT_ID} user=${user.email} role=${user.role}`);
}

main()
  .catch((e) => {
    console.error('[seed-e2e] ÉCHEC:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
