/**
 * Seed E2E — Données minimales pour les tests Playwright
 * 
 * Usage: npx tsx prisma/seed-e2e.ts
 * 
 * Crée:
 * - 1 plan (starter)
 * - 1 tenant (cabinet-e2e)
 * - 1 admin (admin@memolib.local / Admin123!)
 * - 1 avocat (avocat@memolib.local / Avocat123!)
 * - 2 clients
 * - 2 dossiers (1 OQTF urgent, 1 titre séjour)
 * - 1 email entrant
 * - 1 deadline
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();
const uuid = () => crypto.randomUUID();

async function main() {
  console.log('🧪 Seed E2E — Données de test...');

  // 1. Plan
  const plan = await prisma.plan.upsert({
    where: { name: 'e2e-pro' },
    update: {},
    create: {
      id: 'plan_e2e_pro',
      name: 'e2e-pro',
      displayName: 'E2E Pro',
      description: 'Plan pour tests E2E',
      priceMonthly: 99,
      priceYearly: 990,
      currency: 'EUR',
      maxWorkspaces: 5,
      maxDossiers: 1000,
      maxClients: 500,
      maxStorageGb: 50,
      maxUsers: 20,
      aiAutonomyLevel: 3,
      humanValidation: false,
      advancedAnalytics: true,
      externalAiAccess: true,
      prioritySupport: true,
      customBranding: false,
      apiAccess: true,
      isActive: true,
      updatedAt: new Date(),
    },
  });

  // 2. Tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'tenant_e2e' },
    update: {},
    create: {
      id: 'tenant_e2e',
      name: 'Cabinet E2E Test',
      slug: 'cabinet-e2e',
      planId: plan.id,
      status: 'active',
      currentDossiers: 0,
      currentClients: 0,
      currentStorageGb: 0,
      currentUsers: 0,
      updatedAt: new Date(),
    },
  });

  // 3. Admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@memolib.local' },
    update: { password: adminPassword },
    create: {
      id: 'user_admin_e2e',
      email: 'admin@memolib.local',
      name: 'Admin E2E',
      password: adminPassword,
      role: 'ADMIN',
      tenantId: tenant.id,
      status: 'active',
      emailVerified: new Date(),
      updatedAt: new Date(),
    },
  });

  // 4. Lawyer user
  const lawyerPassword = await bcrypt.hash('Avocat123!', 12);
  const lawyer = await prisma.user.upsert({
    where: { email: 'avocat@memolib.local' },
    update: { password: lawyerPassword },
    create: {
      id: 'user_lawyer_e2e',
      email: 'avocat@memolib.local',
      name: 'Maître Avocat E2E',
      password: lawyerPassword,
      role: 'LAWYER',
      tenantId: tenant.id,
      status: 'active',
      emailVerified: new Date(),
      updatedAt: new Date(),
    },
  });

  // 5. Clients
  const client1 = await prisma.client.upsert({
    where: { id: 'client_e2e_1' },
    update: {},
    create: {
      id: 'client_e2e_1',
      firstName: 'Mohamed',
      lastName: 'BENALI',
      email: 'm.benali@email.com',
      telephone: '+33612345678',
      tenantId: tenant.id,
      status: 'actif',
      consentementRGPD: true,
      dateConsentementRGPD: new Date(),
      updatedAt: new Date(),
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: 'client_e2e_2' },
    update: {},
    create: {
      id: 'client_e2e_2',
      firstName: 'Jean',
      lastName: 'DUPONT',
      email: 'j.dupont@email.com',
      telephone: '+33698765432',
      tenantId: tenant.id,
      status: 'actif',
      consentementRGPD: true,
      dateConsentementRGPD: new Date(),
      updatedAt: new Date(),
    },
  });

  // 6. Dossiers
  const dossier1 = await prisma.dossier.upsert({
    where: { id: 'dossier_e2e_oqtf' },
    update: {},
    create: {
      id: 'dossier_e2e_oqtf',
      numero: 'D-2026-E2E-001',
      tenantId: tenant.id,
      clientId: client1.id,
      responsableId: lawyer.id,
      typeDossier: 'OQTF',
      objet: 'OQTF sans délai - Recours urgent',
      description: 'Client a reçu une OQTF sans délai de départ volontaire. Recours en 48h.',
      statut: 'URGENT',
      priorite: 'CRITIQUE',
      dateEcheance: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 jours
      articleCeseda: 'L.512-1',
      updatedAt: new Date(),
    },
  });

  const dossier2 = await prisma.dossier.upsert({
    where: { id: 'dossier_e2e_titre' },
    update: {},
    create: {
      id: 'dossier_e2e_titre',
      numero: 'D-2026-E2E-002',
      tenantId: tenant.id,
      clientId: client2.id,
      responsableId: lawyer.id,
      typeDossier: 'TITRE_SEJOUR',
      objet: 'Renouvellement titre de séjour',
      description: 'Renouvellement de titre de séjour salarié. Récépissé expire dans 30j.',
      statut: 'EN_COURS',
      priorite: 'NORMALE',
      dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
      updatedAt: new Date(),
    },
  });

  // 7. Email entrant
  await prisma.email.upsert({
    where: { id: 'email_e2e_1' },
    update: {},
    create: {
      id: 'email_e2e_1',
      tenantId: tenant.id,
      clientId: client1.id,
      dossierId: dossier1.id,
      from: 'm.benali@email.com',
      to: 'cabinet@memolib.local',
      subject: 'URGENCE - OQTF reçue hier',
      body: 'Maître, j\'ai reçu une OQTF sans délai de départ volontaire hier. Je dois quitter le territoire sous 48h. Aidez-moi SVP.',
      receivedAt: new Date(),
      urgency: 'critical',
      category: 'juridique',
      sentiment: 'negative',
      isRead: false,
      isArchived: false,
      updatedAt: new Date(),
    },
  });

  // 8. Deadline légale
  try {
    await prisma.legalDeadline.upsert({
      where: { id: 'deadline_e2e_1' },
      update: {},
      create: {
        id: 'deadline_e2e_1',
        tenantId: tenant.id,
        dossierId: dossier1.id,
        title: 'Recours TA contre OQTF',
        type: 'delai_recours_contentieux',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'URGENT',
        priority: 'CRITIQUE',
        description: 'Délai de 48h pour le référé-liberté contre l\'OQTF sans délai',
        updatedAt: new Date(),
      },
    });
  } catch (e) {
    console.log('⚠️  legalDeadline: table peut ne pas exister, skip');
  }

  // Update tenant counts
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      currentDossiers: 2,
      currentClients: 2,
      currentUsers: 2,
    },
  });

  console.log('✅ Seed E2E terminé!');
  console.log('');
  console.log('👤 Admin:  admin@memolib.local / Admin123!');
  console.log('⚖️  Avocat: avocat@memolib.local / Avocat123!');
  console.log('📁 2 dossiers: OQTF urgent + Titre séjour');
  console.log('📧 1 email entrant (OQTF)');
  console.log('⏰ 1 deadline critique (48h)');
}

main()
  .catch((e) => {
    console.error('❌ Seed E2E failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
