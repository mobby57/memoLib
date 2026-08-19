/**
 * Seed: Ajouter le compte Gmail du fondateur comme SUPER_ADMIN
 * Usage: npx tsx prisma/seed-owner.ts
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('👤 Création du compte fondateur...');

  // Vérifier si un plan existe
  let plan = await prisma.plan.findFirst({ where: { isActive: true } });
  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        id: 'plan_pro_default',
        name: 'pro',
        displayName: 'Pro',
        description: 'Plan professionnel',
        priceMonthly: 99,
        priceYearly: 990,
        currency: 'EUR',
        maxWorkspaces: 10,
        maxDossiers: 10000,
        maxClients: 5000,
        maxStorageGb: 100,
        maxUsers: 50,
        aiAutonomyLevel: 4,
        humanValidation: false,
        advancedAnalytics: true,
        externalAiAccess: true,
        prioritySupport: true,
        customBranding: true,
        apiAccess: true,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }

  // Créer ou récupérer le tenant principal
  let tenant = await prisma.tenant.findFirst({ where: { subdomain: 'memolib-main' } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        id: 'tenant_main',
        name: 'MemoLib',
        subdomain: 'memolib-main',
        planId: plan.id,
        status: 'active',
        currentDossiers: 0,
        currentClients: 0,
        currentStorageGb: 0,
        currentUsers: 1,
        updatedAt: new Date(),
      },
    });
  }

  // Créer le user fondateur
  const password = await bcrypt.hash('Admin123!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'morosidibepro@gmail.com' },
    update: {
      role: 'SUPER_ADMIN',
      tenantId: tenant.id,
      status: 'active',
      emailVerified: new Date(),
    },
    create: {
      id: 'user_founder',
      email: 'morosidibepro@gmail.com',
      name: 'Morosi',
      password: password,
      role: 'SUPER_ADMIN',
      tenantId: tenant.id,
      status: 'active',
      emailVerified: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('');
  console.log('✅ Compte créé!');
  console.log('');
  console.log('📧 Email: morosidibepro@gmail.com');
  console.log('🔑 Connexion: via bouton "Google" sur /auth/login');
  console.log('👑 Rôle: SUPER_ADMIN');
  console.log('🏢 Tenant: MemoLib');
  console.log('');
  console.log('💡 Tu peux aussi te connecter avec: morosidibepro@gmail.com / Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
