/**
 * Seed Beta Plan — Creates a free "Beta" plan for pilot law firms
 * 
 * Usage: npx tsx prisma/seed-beta-plan.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating Beta plan...');

  const betaPlan = await prisma.plan.upsert({
    where: { name: 'beta' },
    update: {
      displayName: 'Beta Gratuit',
      description: 'Plan gratuit pour les cabinets pilotes. Accès complet aux fonctionnalités core pendant la phase de test.',
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'EUR',
      maxWorkspaces: 5,
      maxDossiers: 50,
      maxClients: 30,
      maxStorageGb: 2,
      maxUsers: 3,
      aiAutonomyLevel: 1,
      humanValidation: true,
      advancedAnalytics: false,
      externalAiAccess: false,
      prioritySupport: true, // Beta users get priority support
      customBranding: false,
      apiAccess: false,
      isActive: true,
    },
    create: {
      id: 'plan_beta_2026',
      name: 'beta',
      displayName: 'Beta Gratuit',
      description: 'Plan gratuit pour les cabinets pilotes. Accès complet aux fonctionnalités core pendant la phase de test.',
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'EUR',
      maxWorkspaces: 5,
      maxDossiers: 50,
      maxClients: 30,
      maxStorageGb: 2,
      maxUsers: 3,
      aiAutonomyLevel: 1,
      humanValidation: true,
      advancedAnalytics: false,
      externalAiAccess: false,
      prioritySupport: true,
      customBranding: false,
      apiAccess: false,
      isActive: true,
    },
  });

  console.log(`✅ Plan "${betaPlan.displayName}" créé/mis à jour (id: ${betaPlan.id})`);
  console.log(`   - ${betaPlan.maxDossiers} dossiers max`);
  console.log(`   - ${betaPlan.maxClients} clients max`);
  console.log(`   - ${betaPlan.maxUsers} utilisateurs max`);
  console.log(`   - ${betaPlan.maxStorageGb} Go stockage`);
  console.log(`   - Prix : GRATUIT`);
  console.log('');
  console.log('📋 Pour assigner ce plan à un cabinet :');
  console.log('   UPDATE "Tenant" SET "planId" = \'plan_beta_2026\' WHERE subdomain = \'mon-cabinet\';');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
