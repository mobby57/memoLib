/**
 * Seed: Plans SaaS pour MemoLib
 * 
 * Crée les 4 plans dans la base de données.
 * Usage: npx ts-node prisma/seed-saas-plans.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PLANS = [
  {
    id: 'plan-pilot',
    name: 'pilot',
    displayName: 'Pilot',
    description: 'Plan gratuit pour découvrir MemoLib',
    priceMonthly: 0,
    priceYearly: 0,
    maxWorkspaces: 1,
    maxDossiers: 5,
    maxClients: 5,
    maxStorageGb: 1,
    maxUsers: 1,
    aiAutonomyLevel: 0,
    humanValidation: true,
    advancedAnalytics: false,
    externalAiAccess: false,
    prioritySupport: false,
    customBranding: false,
    apiAccess: false,
  },
  {
    id: 'plan-solo',
    name: 'solo',
    displayName: 'Solo',
    description: 'Pour l\'avocat indépendant — IA intégrée, gestion complète',
    priceMonthly: 29,
    priceYearly: 276, // 23€/mois × 12
    maxWorkspaces: 5,
    maxDossiers: 50,
    maxClients: 100,
    maxStorageGb: 5,
    maxUsers: 1,
    aiAutonomyLevel: 1,
    humanValidation: true,
    advancedAnalytics: false,
    externalAiAccess: true,
    prioritySupport: false,
    customBranding: false,
    apiAccess: false,
  },
  {
    id: 'plan-cabinet',
    name: 'cabinet',
    displayName: 'Cabinet',
    description: 'Pour les cabinets de 2 à 10 avocats — collaboration, comptabilité',
    priceMonthly: 79,
    priceYearly: 756, // 63€/mois × 12
    maxWorkspaces: 20,
    maxDossiers: 500,
    maxClients: 1000,
    maxStorageGb: 50,
    maxUsers: 10,
    aiAutonomyLevel: 2,
    humanValidation: true,
    advancedAnalytics: true,
    externalAiAccess: true,
    prioritySupport: true,
    customBranding: false,
    apiAccess: true,
  },
  {
    id: 'plan-enterprise',
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'Pour les grands cabinets — illimité, API, branding, support dédié',
    priceMonthly: 199,
    priceYearly: 1908, // 159€/mois × 12
    maxWorkspaces: 100,
    maxDossiers: 10000,
    maxClients: 10000,
    maxStorageGb: 200,
    maxUsers: 50,
    aiAutonomyLevel: 3,
    humanValidation: false,
    advancedAnalytics: true,
    externalAiAccess: true,
    prioritySupport: true,
    customBranding: true,
    apiAccess: true,
  },
];

async function main() {
  console.log('🌱 Seeding SaaS plans...');

  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: {
        ...plan,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        ...plan,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(`  ✅ Plan "${plan.displayName}" (${plan.priceMonthly}€/mois)`);
  }

  // Créer aussi les alias pour compatibilité avec l'ancien système
  const aliases = [
    { from: 'SOLO', to: 'plan-solo' },
    { from: 'CABINET', to: 'plan-cabinet' },
    { from: 'ENTERPRISE', to: 'plan-enterprise' },
    { from: 'starter', to: 'plan-pilot' },
    { from: 'pro', to: 'plan-cabinet' },
  ];

  console.log('\n📋 Plans créés:');
  console.log('  PILOT     : 0€/mois   (5 dossiers, 1 user, découverte)');
  console.log('  SOLO      : 29€/mois  (50 dossiers, 1 user, IA)');
  console.log('  CABINET   : 79€/mois  (500 dossiers, 10 users, comptabilité)');
  console.log('  ENTERPRISE: 199€/mois (illimité, API, support dédié)');
  console.log(`\n✅ ${PLANS.length} plans seedés avec succès.`);
  
  console.log('\n💡 Pour configurer Stripe, ajoutez dans .env.local:');
  console.log('  STRIPE_PRICE_SOLO_MONTHLY=price_xxx');
  console.log('  STRIPE_PRICE_SOLO_YEARLY=price_xxx');
  console.log('  STRIPE_PRICE_CABINET_MONTHLY=price_xxx');
  console.log('  STRIPE_PRICE_CABINET_YEARLY=price_xxx');
  console.log('  STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxx');
  console.log('  STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxx');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
