import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // 1. Plans
  console.log('📦 Création des plans...');
  
  const starter = await prisma.plan.upsert({
    where: { name: 'starter' },
    update: {},
    create: {
      name: 'starter',
      displayName: 'Starter',
      description: 'Pour débuter avec la documentation juridique',
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'EUR',
      maxWorkspaces: 1,
      maxDossiers: 50,
      maxClients: 10,
      maxStorageGb: 2,
      maxUsers: 2,
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

  const pro = await prisma.plan.upsert({
    where: { name: 'pro' },
    update: {},
    create: {
      name: 'pro',
      displayName: 'Pro',
      description: 'Pour les cabinets en croissance',
      priceMonthly: 99,
      priceYearly: 990,
      currency: 'EUR',
      maxWorkspaces: 3,
      maxDossiers: 500,
      maxClients: 100,
      maxStorageGb: 50,
      maxUsers: 10,
      aiAutonomyLevel: 2,
      humanValidation: true,
      advancedAnalytics: true,
      externalAiAccess: false,
      prioritySupport: true,
      customBranding: false,
      apiAccess: true,
      isActive: true,
    },
  });

  const enterprise = await prisma.plan.upsert({
    where: { name: 'enterprise' },
    update: {},
    create: {
      name: 'enterprise',
      displayName: 'Enterprise',
      description: 'Pour les grandes structures',
      priceMonthly: 299,
      priceYearly: 2990,
      currency: 'EUR',
      maxWorkspaces: 10,
      maxDossiers: -1,
      maxClients: -1,
      maxStorageGb: 500,
      maxUsers: 50,
      aiAutonomyLevel: 3,
      humanValidation: true,
      advancedAnalytics: true,
      externalAiAccess: true,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true,
      isActive: true,
    },
  });

  console.log('✅ Plans créés:', { starter: starter.id, pro: pro.id, enterprise: enterprise.id });

  // 2. Articles CESEDA (sélection critique)
  console.log('📚 Création des articles CESEDA...');

  const articles = [
    {
      code: 'CESEDA',
      article: 'L313-11',
      version: '2024',
      title: 'Carte de séjour temporaire portant la mention "salarié"',
      content: 'La carte de séjour temporaire portant la mention "salarié" est délivrée à l\'étranger dont l\'employeur s\'est engagé à verser une rémunération au moins égale au salaire minimum de croissance.',
      summary: 'Conditions de délivrance du titre de séjour salarié',
      category: 'titre_sejour',
      keywords: JSON.stringify(['salarié', 'titre de séjour', 'rémunération', 'SMIC']),
      defaultDeadlineDays: 120,
      deadlineType: 'calendaire',
      legifrance_url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042772415',
      isActive: true,
    },
    {
      code: 'CESEDA',
      article: 'L511-1',
      version: '2024',
      title: 'Obligation de quitter le territoire français (OQTF)',
      content: 'L\'autorité administrative peut obliger un étranger à quitter le territoire français lorsqu\'il se trouve en situation irrégulière.',
      summary: 'Conditions et procédure d\'OQTF',
      category: 'eloignement',
      keywords: JSON.stringify(['OQTF', 'éloignement', 'reconduite', 'situation irrégulière']),
      defaultDeadlineDays: 30,
      deadlineType: 'franc',
      legifrance_url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042772589',
      isActive: true,
    },
    {
      code: 'CESEDA',
      article: 'L512-1',
      version: '2024',
      title: 'Délai de départ volontaire',
      content: 'L\'étranger dispose d\'un délai de départ volontaire de trente jours à compter de la notification de la décision.',
      summary: 'Délai de départ volontaire après OQTF',
      category: 'eloignement',
      keywords: JSON.stringify(['délai', 'départ volontaire', 'OQTF']),
      defaultDeadlineDays: 30,
      deadlineType: 'franc',
      legifrance_url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042772593',
      isActive: true,
    },
    {
      code: 'CESEDA',
      article: 'L743-1',
      version: '2024',
      title: 'Demande d\'asile',
      content: 'L\'étranger qui demande l\'asile bénéficie du droit de se maintenir sur le territoire français jusqu\'à la décision définitive.',
      summary: 'Droit au maintien pendant la procédure d\'asile',
      category: 'asile',
      keywords: JSON.stringify(['asile', 'demande', 'maintien', 'territoire']),
      defaultDeadlineDays: 90,
      deadlineType: 'calendaire',
      legifrance_url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042772751',
      isActive: true,
    },
    {
      code: 'CJA',
      article: 'R421-1',
      version: '2024',
      title: 'Délai de recours contentieux',
      content: 'Le délai de recours contentieux est de deux mois. Il court à compter de la notification ou de la publication de la décision attaquée.',
      summary: 'Délai de 2 mois pour recours contentieux',
      category: 'recours',
      keywords: JSON.stringify(['recours contentieux', 'délai', '2 mois', 'tribunal administratif']),
      defaultDeadlineDays: 60,
      deadlineType: 'franc',
      legifrance_url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006449326',
      isActive: true,
    },
    {
      code: 'CJA',
      article: 'R421-5',
      version: '2024',
      title: 'Délai d\'appel',
      content: 'Le délai d\'appel est d\'un mois à compter de la notification du jugement.',
      summary: 'Délai de 1 mois pour appel devant la CAA',
      category: 'recours',
      keywords: JSON.stringify(['appel', 'CAA', 'délai', '1 mois']),
      defaultDeadlineDays: 30,
      deadlineType: 'franc',
      legifrance_url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006449330',
      isActive: true,
    },
  ];

  for (const article of articles) {
    await prisma.legalReference.upsert({
      where: {
        code_article_version: {
          code: article.code,
          article: article.article,
          version: article.version,
        },
      },
      update: {},
      create: article,
    });
  }

  console.log(`✅ ${articles.length} articles CESEDA créés`);

  // 3. Tenant de démo
  console.log('🏢 Création du tenant de démo...');

  const demoTenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Cabinet Démo',
      subdomain: 'demo',
      planId: starter.id,
      status: 'active',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.tenantSettings.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      ollamaEnabled: true,
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2:latest',
      emailEnabled: false,
      maxDossiers: 50,
      maxUsers: 2,
      storageLimit: 2000,
    },
  });

  console.log('✅ Tenant démo créé:', demoTenant.id);

  // 4. Super Admin
  console.log('👤 Création du super admin...');

  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@iapostemanage.com' },
    update: {},
    create: {
      email: 'admin@iapostemanage.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'super_admin',
      status: 'active',
      language: 'fr',
      timezone: 'Europe/Paris',
    },
  });

  console.log('✅ Super admin créé:', superAdmin.id);

  console.log('🎉 Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
