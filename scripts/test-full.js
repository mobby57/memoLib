import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import 'dotenv/config';

// ------------------------------------------------------------------
// 1. Configuration de l'adaptateur Prisma 7
// ------------------------------------------------------------------
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL non définie dans .env');
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ------------------------------------------------------------------
// 2. Données de test
// ------------------------------------------------------------------
const SEED = {
  tenant: {
    name: 'Cabinet Test',
    subdomain: 'test-cabinet',
    domain: 'test-cabinet.local',
  },
  plan: {
    id: 'starter',
    name: 'Starter',
    displayName: 'Starter',
    description: 'Plan de test',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'EUR',
    maxWorkspaces: 1,
    maxDossiers: 100,
    maxClients: 20,
    maxStorageGb: 5,
    maxUsers: 5,
    aiAutonomyLevel: 1,
    humanValidation: true,
    advancedAnalytics: false,
    externalAiAccess: false,
    prioritySupport: false,
    customBranding: false,
    apiAccess: false,
    isActive: true,
  },
  users: [
    { email: 'admin@test.com', name: 'Admin Test', password: 'Admin123!', role: 'ADMIN' },
    { email: 'avocat@test.com', name: 'Avocat Test', password: 'Test@123456', role: 'USER' },
  ],
  client: {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '0612345678',
    address: '1 rue de la Justice, 75001 Paris',
  },
  dossier: {
    numero: 'D2026001',
    typeDossier: 'Contentieux',
    statut: 'en_cours',
    phase: 'instruction',
    objet: 'Litige contractuel',
  },
  deadline: {
    type: 'RECOURS_CONTENTIEUX',
    label: "Délai d'appel",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
};

// ------------------------------------------------------------------
// 3. Fonctions utilitaires (avec génération d'ID)
// ------------------------------------------------------------------
async function findOrCreatePlan() {
  let plan = await prisma.plan.findUnique({ where: { id: SEED.plan.id } });
  if (!plan) {
    plan = await prisma.plan.create({ data: SEED.plan });
    console.log(`✅ Plan créé : ${plan.id}`);
  } else {
    console.log(`ℹ️ Plan existant : ${plan.id}`);
  }
  return plan;
}

async function createTenant(planId) {
  let tenant = await prisma.tenant.findUnique({ where: { subdomain: SEED.tenant.subdomain } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        id: randomUUID(), // ID explicite
        name: SEED.tenant.name,
        subdomain: SEED.tenant.subdomain,
        domain: SEED.tenant.domain,
        planId,
        status: 'active',
        currentWorkspaces: 1,
        currentDossiers: 0,
        currentClients: 0,
        currentStorageGb: 0,
        currentUsers: 0,
      },
    });
    console.log(`✅ Tenant créé : ${tenant.id} (${tenant.subdomain})`);
  } else {
    console.log(`ℹ️ Tenant existant : ${tenant.id}`);
  }
  return tenant;
}

async function createUsers(tenantId) {
  const results = [];
  for (const u of SEED.users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`ℹ️ Utilisateur déjà présent : ${u.email}`);
      results.push(existing);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.create({
      data: {
        id: randomUUID(), // ID explicite
        email: u.email,
        name: u.name,
        password: passwordHash,
        role: u.role,
        tenantId,
        status: 'active',
        language: 'fr',
        timezone: 'Europe/Paris',
      },
    });
    console.log(`✅ Utilisateur créé : ${user.email} (${user.role})`);
    results.push(user);
  }
  return results;
}

async function createClient(tenantId) {
  const { firstName, lastName, email, phone, address } = SEED.client;
  const existing = await prisma.client.findUnique({
    where: { tenantId_email: { tenantId, email } },
  });
  if (existing) {
    console.log(`ℹ️ Client existant : ${existing.email}`);
    return existing;
  }
  const client = await prisma.client.create({
    data: {
      id: randomUUID(), // ID explicite
      tenantId,
      firstName,
      lastName,
      email,
      phone,
      address,
      pays: 'France',
      status: 'actif',
    },
  });
  console.log(`✅ Client créé : ${client.id} (${client.email})`);
  return client;
}

async function createDossier(tenantId, clientId, userId) {
  const { numero, typeDossier, statut, phase, objet } = SEED.dossier;
  const existing = await prisma.dossier.findUnique({
    where: { tenantId_numero: { tenantId, numero } },
  });
  if (existing) {
    console.log(`ℹ️ Dossier existant : ${existing.numero}`);
    return existing;
  }
  const dossier = await prisma.dossier.create({
    data: {
      id: randomUUID(), // ID explicite
      tenantId,
      clientId,
      numero,
      typeDossier,
      statut,
      phase,
      objet,
      responsableId: userId,
      dateCreation: new Date(),
      dateOuverture: new Date(),
    },
  });
  console.log(`✅ Dossier créé : ${dossier.id} (${dossier.numero})`);
  return dossier;
}

async function createDeadline(tenantId, dossierId, clientId, userId) {
  const { type, label, dueDate } = SEED.deadline;
  const existing = await prisma.legalDeadline.findFirst({
    where: { tenantId, dossierId, label },
  });
  if (existing) {
    console.log(`ℹ️ Délai existant : ${existing.label}`);
    return existing;
  }
  const deadline = await prisma.legalDeadline.create({
    data: {
      id: randomUUID(), // ID explicite
      tenantId,
      dossierId,
      clientId,
      type,
      label,
      referenceDate: new Date(),
      dueDate,
      status: 'PENDING',
      createdBy: userId,
    },
  });
  console.log(`✅ Délai créé : ${deadline.id} (${deadline.label})`);
  return deadline;
}

async function createFacture(tenantId, clientId, dossierId, userId) {
  const numero = `F${Date.now()}`;
  const facture = await prisma.facture.create({
    data: {
      id: randomUUID(), // ID explicite
      tenantId,
      clientId,
      dossierId,
      numero,
      reference: `REF-${numero}`,
      description: 'Facture test',
      montantHT: 1000,
      tauxTVA: 20,
      montantTVA: 200,
      montantTTC: 1200,
      statut: 'brouillon',
      dateEmission: new Date(),
      dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.ligneFacture.create({
    data: {
      id: randomUUID(), // ID explicite
      factureId: facture.id,
      description: 'Honoraires - Dossier test',
      quantite: 1,
      prixUnitaire: 1000,
      montantHT: 1000,
    },
  });
  console.log(`✅ Facture créée : ${facture.id} (${facture.numero})`);
  return facture;
}

async function simulateEmailAndAction(tenantId, dossierId, clientId) {
  const email = await prisma.email.create({
    data: {
      id: randomUUID(), // ID explicite
      tenantId,
      from: 'client@example.com',
      to: 'avocat@test.com',
      subject: "Demande d'information sur le dossier",
      body: 'Bonjour, je souhaite faire un point sur mon dossier.',
      receivedAt: new Date(),
      isProcessed: true,
      category: 'general-inquiry',
      urgency: 'medium',
      sentiment: 'neutral',
      clientId,
      dossierId,
    },
  });
  console.log(`✅ Email créé : ${email.id}`);

  const proposal = await prisma.actionProposal.create({
    data: {
      id: randomUUID(), // ID explicite
      tenantId,
      emailId: email.id,
      dossierId,
      type: 'CREATE_LEGAL_DEADLINE',
      status: 'PENDING',
      priority: 'MEDIUM',
      riskLevel: 'LOW',
      rationale: 'Le client demande un point, il faut peut-être programmer un rendez-vous.',
      payloadJson: JSON.stringify({ suggestion: 'planifier appel' }),
      proposedBy: 'system-ia',
      idempotencyKey: randomUUID(),
    },
  });
  console.log(`✅ Proposition IA créée : ${proposal.id}`);
  return { email, proposal };
}

async function createDocument(tenantId, dossierId, clientId, userId) {
  const doc = await prisma.document.create({
    data: {
      id: randomUUID(), // ID explicite
      tenantId,
      dossierId,
      clientId,
      filename: 'test.pdf',
      originalName: 'test.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      storageKey: 'test-key',
      uploadedBy: userId,
      ocrProcessed: true,
      ocrText: 'Contenu OCR simulé.',
    },
  });
  console.log(`✅ Document créé : ${doc.id}`);
  return doc;
}

async function createProof(tenantId, dossierId, clientId, userId) {
  const proof = await prisma.proof.create({
    data: {
      id: randomUUID(), // ID explicite
      tenantId,
      type: 'DOCUMENT_RECEPTION',
      title: "Accusé de réception",
      description: 'Preuve de réception du document test',
      dossierId,
      clientId,
      proofDate: new Date(),
      capturedBy: userId,
      status: 'PENDING_VALIDATION',
    },
  });
  console.log(`✅ Preuve créée : ${proof.id}`);
  return proof;
}

async function createReport(tenantId, userId) {
  const report = await prisma.report.create({
    data: {
      id: randomUUID(), // ID explicite
      tenantId,
      type: 'DOSSIER_SUMMARY',
      title: 'Rapport de test',
      status: 'PENDING',
      generatedBy: userId,
    },
  });
  console.log(`✅ Rapport créé : ${report.id}`);
  return report;
}

async function checkAuditLogs(tenantId) {
  const count = await prisma.auditLog.count({ where: { tenantId } });
  console.log(`📊 Nombre de logs d'audit pour le tenant : ${count}`);
  return count;
}

// ------------------------------------------------------------------
// 4. Main
// ------------------------------------------------------------------
async function main() {
  console.log('🚀 Lancement du script de test complet...\n');

  const plan = await findOrCreatePlan();
  const tenant = await createTenant(plan.id);
  const users = await createUsers(tenant.id);
  const admin = users.find(u => u.role === 'ADMIN');
  const avocat = users.find(u => u.role === 'USER');

  const client = await createClient(tenant.id);
  const dossier = await createDossier(tenant.id, client.id, avocat.id);
  await createDeadline(tenant.id, dossier.id, client.id, avocat.id);
  await createFacture(tenant.id, client.id, dossier.id, avocat.id);
  await simulateEmailAndAction(tenant.id, dossier.id, client.id);
  await createDocument(tenant.id, dossier.id, client.id, avocat.id);
  await createProof(tenant.id, dossier.id, client.id, avocat.id);
  await createReport(tenant.id, avocat.id);
  const auditCount = await checkAuditLogs(tenant.id);

  console.log('\n✅ Résumé des IDs créés :');
  console.log(`   Tenant  : ${tenant.id}`);
  console.log(`   Admin   : ${admin.email} (${admin.id})`);
  console.log(`   Avocat  : ${avocat.email} (${avocat.id})`);
  console.log(`   Client  : ${client.id}`);
  console.log(`   Dossier : ${dossier.id}`);
  console.log(`   Logs    : ${auditCount} entrées`);
  console.log('\n🎉 Test complet terminé avec succès.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du test :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
