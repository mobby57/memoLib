/**
 * Seed des Plans Tarifaires — memoLib
 * 
 * Crée les 3 plans stratégiques :
 * - SOLO (49-79€/mois) - Entrée de marché
 * - CABINET (249-490€/mois) - SWEET SPOT
 * - ENTERPRISE (1200-3000€/mois) - Vision licorne
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed des plans tarifaires...\n');

  // ============================================
  // ⚡ PLAN PILOTE (Gratuit 30 jours)
  // ============================================
  const planPilot = await prisma.plan.upsert({
    where: { name: 'PILOT' },
    update: {},
    create: {
      name: 'PILOT',
      displayName: 'Plan Pilote',
      description: 'Essai gratuit 30 jours — découvrez MemoLib sans engagement',

      priceMonthly: 0,
      priceYearly: 0,
      currency: 'EUR',

      maxWorkspaces: 1,
      maxDossiers: 5,
      maxClients: 5,
      maxStorageGb: 1,
      maxUsers: 1,

      aiAutonomyLevel: 1,
      humanValidation: true,
      advancedAnalytics: false,
      externalAiAccess: false,

      prioritySupport: false,
      customBranding: false,
      apiAccess: false,

      isActive: true,
    },
  });

  console.log('✅ Plan PILOT créé:', planPilot.name);
  console.log(`   Prix: GRATUIT (30 jours)`);
  console.log(`   Quotas: ${planPilot.maxDossiers} dossiers, ${planPilot.maxClients} clients\n`);

  // ============================================
  // 🟢 PLAN SOLO / ASSOCIATION
  // ============================================
  const planSolo = await prisma.plan.upsert({
    where: { name: 'SOLO' },
    update: {},
    create: {
      name: 'SOLO',
      displayName: 'Plan Solo',
      description: 'Pour avocats indépendants et petites structures associatives',

      // Tarification
      priceMonthly: 49,
      priceYearly: 490, // -20% annuel
      currency: 'EUR',

      // Limites quotas
      maxWorkspaces: 1,      // 1 seul workspace actif
      maxDossiers: 50,       // 50 dossiers / mois
      maxClients: 20,        // 20 clients actifs
      maxStorageGb: 5,       // 5 GB stockage
      maxUsers: 1,           // 1 utilisateur

      // Capacités IA
      aiAutonomyLevel: 1,         // Niveau basique
      humanValidation: true,      // Validation obligatoire
      advancedAnalytics: false,   // Pas d'analytics
      externalAiAccess: false,    // Pas d'API externe

      // Services premium
      prioritySupport: false,     // Support standard
      customBranding: false,      // Pas de white-label
      apiAccess: false,           // Pas d'API

      isActive: true,
    },
  });

  console.log('✅ Plan SOLO créé:', planSolo.name);
  console.log(`   Prix: ${planSolo.priceMonthly}€/mois - ${planSolo.priceYearly}€/an`);
  console.log(`   Quotas: ${planSolo.maxWorkspaces} workspace, ${planSolo.maxDossiers} dossiers/mois\n`);

  // ============================================
  // 🔵 PLAN CABINET (SWEET SPOT)
  // ============================================
  const planCabinet = await prisma.plan.upsert({
    where: { name: 'CABINET' },
    update: {},
    create: {
      name: 'CABINET',
      displayName: 'Plan Cabinet',
      description: 'Pour cabinets d\'avocats et structures moyennes - LE SWEET SPOT',

      // Tarification
      priceMonthly: 349,
      priceYearly: 3490, // -20% annuel
      currency: 'EUR',

      // Limites quotas
      maxWorkspaces: 10,     // 10 workspaces actifs
      maxDossiers: 300,      // 300 dossiers / mois
      maxClients: 100,       // 100 clients actifs
      maxStorageGb: 50,      // 50 GB stockage
      maxUsers: 5,           // 5 utilisateurs (avocats + assistants)

      // Capacités IA
      aiAutonomyLevel: 2,         // IA intermédiaire
      humanValidation: true,      // Validation recommandée
      advancedAnalytics: true,    // Analytics inclus
      externalAiAccess: false,    // Ollama local suffit

      // Services premium
      prioritySupport: true,      // Support prioritaire (email 24h)
      customBranding: false,      // Pas encore de white-label
      apiAccess: false,           // Pas d'API publique

      isActive: true,
    },
  });

  console.log('✅ Plan CABINET créé:', planCabinet.name);
  console.log(`   Prix: ${planCabinet.priceMonthly}€/mois - ${planCabinet.priceYearly}€/an`);
  console.log(`   Quotas: ${planCabinet.maxWorkspaces} workspaces, ${planCabinet.maxDossiers} dossiers/mois`);
  console.log(`   🎯 TARGET: C'est ici que tu gagnes de l'argent!\n`);

  // ============================================
  // 🔴 PLAN ENTERPRISE / INSTITUTION
  // ============================================
  const planEnterprise = await prisma.plan.upsert({
    where: { name: 'ENTERPRISE' },
    update: {},
    create: {
      name: 'ENTERPRISE',
      displayName: 'Plan Enterprise',
      description: 'Pour grandes structures et institutions - Vision licorne',

      // Tarification
      priceMonthly: 1990,
      priceYearly: 19900, // -20% annuel
      currency: 'EUR',

      // Limites quotas (ILLIMITÉ = -1)
      maxWorkspaces: -1,     // ILLIMITÉ (fair use)
      maxDossiers: -1,       // ILLIMITÉ
      maxClients: -1,        // ILLIMITÉ
      maxStorageGb: 500,     // 500 GB (ou custom)
      maxUsers: 50,          // 50 utilisateurs (ou custom)

      // Capacités IA
      aiAutonomyLevel: 4,         // IA avancée maximale
      humanValidation: false,     // Validation optionnelle (configurable)
      advancedAnalytics: true,    // Analytics + BI personnalisé
      externalAiAccess: true,     // Accès GPT-4, Claude (API externe)

      // Services premium
      prioritySupport: true,      // Support dédié (SLA < 4h)
      customBranding: true,       // White-label complet
      apiAccess: true,            // API REST complète

      isActive: true,
    },
  });

  console.log('✅ Plan ENTERPRISE créé:', planEnterprise.name);
  console.log(`   Prix: ${planEnterprise.priceMonthly}€/mois - ${planEnterprise.priceYearly}€/an`);
  console.log(`   Quotas: ILLIMITÉ (fair use)`);
  console.log(`   🦄 VISION LICORNE: SSO, API, White-label, Support dédié\n`);

  // ============================================
  // 📊 RÉCAPITULATIF
  // ============================================
  const allPlans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: 'asc' },
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RÉCAPITULATIF DES PLANS ACTIFS\n');

  let totalMRRPotential = 0;

  for (const plan of allPlans) {
    console.log(`${plan.displayName}:`);
    console.log(`  💰 ${plan.priceMonthly}€/mois (${plan.priceYearly}€/an)`);
    console.log(`  📦 Workspaces: ${plan.maxWorkspaces === -1 ? 'ILLIMITÉ' : plan.maxWorkspaces}`);
    console.log(`  📁 Dossiers/mois: ${plan.maxDossiers === -1 ? 'ILLIMITÉ' : plan.maxDossiers}`);
    console.log(`  🤖 IA Level: ${plan.aiAutonomyLevel}/4`);
    console.log('');

    // Projection MRR si 10 clients Cabinet
    if (plan.name === 'CABINET') {
      totalMRRPotential = plan.priceMonthly * 10;
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 OBJECTIF COURT TERME (10 clients Cabinet):');
  console.log(`   MRR cible: ${totalMRRPotential}€/mois`);
  console.log(`   ARR cible: ${totalMRRPotential * 12}€/an\n`);

  console.log('✅ Seed terminé avec succès!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erreur seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
