import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Génération de données de démonstration réalistes...');

  // 1. Créer les plans
  const plans = await createPlans();
  
  // 2. Créer les tenants (cabinets)
  const tenants = await createTenants(plans);
  
  // 3. Créer les utilisateurs
  const users = await createUsers(tenants);
  
  // 4. Créer les clients
  const clients = await createClients(tenants);
  
  // 5. Créer les dossiers CESEDA
  const dossiers = await createDossiers(tenants, clients);
  
  // 6. Créer les factures
  await createFactures(tenants, dossiers);
  
  // 7. Créer les échéances
  await createEcheances(tenants, dossiers);
  
  // 8. Créer les actions IA
  await createAIActions(tenants, dossiers);

  console.log('✅ Données de démonstration créées avec succès !');
}

async function createPlans() {
  const plans = [
    {
      id: 'plan-basic',
      name: 'BASIC',
      displayName: 'Cabinet Starter',
      description: 'Pour petits cabinets (1-2 avocats)',
      priceMonthly: 99,
      priceYearly: 990,
      maxDossiers: 100,
      maxClients: 50,
      maxUsers: 3,
      aiAutonomyLevel: 1,
      humanValidation: true
    },
    {
      id: 'plan-premium',
      name: 'PREMIUM',
      displayName: 'Cabinet Pro',
      description: 'Pour cabinets moyens (3-10 avocats)',
      priceMonthly: 299,
      priceYearly: 2990,
      maxDossiers: 500,
      maxClients: 200,
      maxUsers: 15,
      aiAutonomyLevel: 3,
      advancedAnalytics: true
    },
    {
      id: 'plan-enterprise',
      name: 'ENTERPRISE',
      displayName: 'Cabinet Enterprise',
      description: 'Pour grands cabinets (10+ avocats)',
      priceMonthly: 799,
      priceYearly: 7990,
      maxDossiers: 2000,
      maxClients: 1000,
      maxUsers: 50,
      aiAutonomyLevel: 4,
      advancedAnalytics: true,
      prioritySupport: true,
      apiAccess: true
    }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan
    });
  }

  return plans;
}

async function createTenants(plans) {
  const tenants = [
    {
      id: 'cabinet-dupont',
      name: 'Cabinet Dupont & Associés',
      subdomain: 'dupont',
      planId: 'plan-premium',
      status: 'active',
      billingEmail: 'facturation@cabinet-dupont.fr'
    },
    {
      id: 'cabinet-martin',
      name: 'SCP Martin-Rousseau',
      subdomain: 'martin-rousseau',
      planId: 'plan-enterprise',
      status: 'active',
      billingEmail: 'compta@scp-martin-rousseau.fr'
    },
    {
      id: 'cabinet-bernard',
      name: 'Maître Bernard - Avocat',
      subdomain: 'bernard',
      planId: 'plan-basic',
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  ];

  for (const tenant of tenants) {
    await prisma.tenant.upsert({
      where: { id: tenant.id },
      update: tenant,
      create: tenant
    });
  }

  return tenants;
}

async function createUsers(tenants) {
  const users = [
    // Super Admin
    {
      id: 'user-superadmin',
      email: 'admin@memoLib.com',
      name: 'Super Administrateur',
      password: await hash('admin123', 12),
      role: 'SUPER_ADMIN',
      tenantId: null
    },
    // Cabinet Dupont
    {
      id: 'user-dupont-admin',
      email: 'me.dupont@cabinet-dupont.fr',
      name: 'Maître Dupont',
      password: await hash('dupont123', 12),
      role: 'ADMIN',
      tenantId: 'cabinet-dupont'
    },
    {
      id: 'user-dupont-assistant',
      email: 'assistant@cabinet-dupont.fr',
      name: 'Marie Assistante',
      password: await hash('assistant123', 12),
      role: 'ADMIN',
      tenantId: 'cabinet-dupont'
    },
    // Cabinet Martin
    {
      id: 'user-martin-admin',
      email: 'me.martin@scp-martin-rousseau.fr',
      name: 'Maître Martin',
      password: await hash('martin123', 12),
      role: 'ADMIN',
      tenantId: 'cabinet-martin'
    }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user
    });
  }

  return users;
}

async function createClients(tenants) {
  const clients = [];
  const prenoms = ['Ahmed', 'Fatima', 'Mohamed', 'Aisha', 'Omar', 'Khadija', 'Ali', 'Amina', 'Hassan', 'Zeinab'];
  const noms = ['Benali', 'Ouali', 'Mansouri', 'Khoury', 'Alami', 'Benjelloun', 'Tazi', 'Fassi', 'Idrissi', 'Lahlou'];
  const nationalites = ['Marocaine', 'Algérienne', 'Tunisienne', 'Sénégalaise', 'Malienne', 'Ivoirienne'];

  for (let i = 0; i < 50; i++) {
    const prenom = prenoms[Math.floor(Math.random() * prenoms.length)];
    const nom = noms[Math.floor(Math.random() * noms.length)];
    const tenantId = i < 25 ? 'cabinet-dupont' : 'cabinet-martin';
    
    const client = {
      id: `client-${i + 1}`,
      tenantId,
      firstName: prenom,
      lastName: nom,
      email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@email.com`,
      phone: `06${Math.floor(Math.random() * 90000000 + 10000000)}`,
      nationality: nationalites[Math.floor(Math.random() * nationalites.length)],
      dateOfBirth: new Date(1980 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      address: `${Math.floor(Math.random() * 200) + 1} rue de la République`,
      ville: 'Paris',
      codePostal: `750${Math.floor(Math.random() * 20) + 1}`,
      status: 'active'
    };
    
    clients.push(client);
    
    await prisma.client.upsert({
      where: { id: client.id },
      update: client,
      create: client
    });
  }

  return clients;
}

async function createDossiers(tenants, clients) {
  const typesDossier = ['OQTF', 'Naturalisation', 'Asile', 'TitreSejour', 'RegroupementFamilial'];
  const statuts = ['en_cours', 'urgent', 'en_attente', 'termine'];
  const priorites = ['normale', 'haute', 'critique'];
  
  const dossiers = [];

  for (let i = 0; i < 100; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)];
    const type = typesDossier[Math.floor(Math.random() * typesDossier.length)];
    
    const dossier = {
      id: `dossier-${i + 1}`,
      tenantId: client.tenantId,
      numero: `D-2026-${String(i + 1).padStart(3, '0')}`,
      clientId: client.id,
      typeDossier: type,
      statut: statuts[Math.floor(Math.random() * statuts.length)],
      priorite: priorites[Math.floor(Math.random() * priorites.length)],
      dateCreation: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      dateEcheance: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000),
      objet: `${type} - ${client.firstName} ${client.lastName}`,
      description: `Dossier ${type} pour ${client.firstName} ${client.lastName}`,
      honorairesEstimes: Math.floor(Math.random() * 3000) + 1000,
      prediction_ia: Math.floor(Math.random() * 40) + 60 // 60-100%
    };
    
    dossiers.push(dossier);
    
    await prisma.dossier.upsert({
      where: { id: dossier.id },
      update: dossier,
      create: dossier
    });
  }

  return dossiers;
}

async function createFactures(tenants, dossiers) {
  for (let i = 0; i < 30; i++) {
    const dossier = dossiers[Math.floor(Math.random() * dossiers.length)];
    const statuts = ['en_attente', 'payee', 'en_retard'];
    
    const facture = {
      id: `facture-${i + 1}`,
      tenantId: dossier.tenantId,
      numero: `F-2026-${String(i + 1).padStart(3, '0')}`,
      dossierId: dossier.id,
      clientName: `Client ${i + 1}`,
      montant: Math.floor(Math.random() * 2000) + 500,
      statut: statuts[Math.floor(Math.random() * statuts.length)],
      dateEmission: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      dateEcheance: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      description: `Honoraires dossier ${dossier.numero}`
    };
    
    await prisma.facture.upsert({
      where: { id: facture.id },
      update: facture,
      create: facture
    });
  }
}

async function createEcheances(tenants, dossiers) {
  const typesEcheance = ['delai_recours_contentieux', 'audience', 'depot_memoire', 'reponse_prefecture'];
  
  for (let i = 0; i < 50; i++) {
    const dossier = dossiers[Math.floor(Math.random() * dossiers.length)];
    
    const echeance = {
      id: `echeance-${i + 1}`,
      tenantId: dossier.tenantId,
      dossierId: dossier.id,
      type: typesEcheance[Math.floor(Math.random() * typesEcheance.length)],
      titre: `Échéance ${i + 1}`,
      dateEcheance: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      statut: 'a_venir',
      priorite: 'normale',
      createdBy: 'system'
    };
    
    await prisma.echeance.upsert({
      where: { id: echeance.id },
      update: echeance,
      create: echeance
    });
  }
}

async function createAIActions(tenants, dossiers) {
  const actionTypes = ['EMAIL_TRIAGE', 'DRAFT_GENERATION', 'URGENCY_DETECTION', 'CLASSIFICATION'];
  const statuses = ['APPROVED', 'PENDING', 'REJECTED'];
  
  for (let i = 0; i < 200; i++) {
    const dossier = dossiers[Math.floor(Math.random() * dossiers.length)];
    
    const action = {
      id: `ai-action-${i + 1}`,
      actionType: actionTypes[Math.floor(Math.random() * actionTypes.length)],
      autonomyLevel: 'ORANGE',
      confidence: 0.7 + Math.random() * 0.3,
      requiresValidation: true,
      validationLevel: 'STANDARD',
      validationStatus: statuses[Math.floor(Math.random() * statuses.length)],
      content: JSON.stringify({ action: 'demo', data: 'sample' }),
      rationale: 'Action générée pour démonstration',
      dossierId: dossier.id,
      tenantId: dossier.tenantId,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    };
    
    await prisma.aIAction.upsert({
      where: { id: action.id },
      update: action,
      create: action
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la génération des données:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });_GENERATION', 'URGENCY_DETECTION', 'CLASSIFICATION'];
  const statuses = ['APPROVED', 'PENDING', 'REJECTED'];
  
  for (let i = 0; i < 200; i++) {
    const dossier = dossiers[Math.floor(Math.random() * dossiers.length)];
    
    const action = {
      id: `ai-action-${i + 1}`,
      actionType: actionTypes[Math.floor(Math.random() * actionTypes.length)],
      autonomyLevel: 'ORANGE',
      confidence: 0.7 + Math.random() * 0.3,
      requiresValidation: true,
      validationLevel: 'STANDARD',
      validationStatus: statuses[Math.floor(Math.random() * statuses.length)],
      content: JSON.stringify({ action: 'demo', data: 'sample' }),
      rationale: 'Action générée pour démonstration',
      dossierId: dossier.id,
      tenantId: dossier.tenantId,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    };
    
    await prisma.aIAction.upsert({
      where: { id: action.id },
      update: action,
      create: action
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la génération des données:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });