import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const now = new Date();

async function main() {
  console.log('🌱 Création des données de test (version finale)...');

  // 1. CRÉER LE PLAN
  let plan = await prisma.plan.findFirst({ where: { name: 'STARTER' } });
  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        id: randomUUID(),
        name: 'STARTER',
        displayName: 'Starter (Gratuit)',
        priceMonthly: 0,
        priceYearly: 0,
        updatedAt: now,
      },
    });
    console.log('✅ Plan STARTER créé');
  } else {
    console.log('ℹ️ Plan STARTER existant trouvé');
  }

  // 2. CRÉER LE TENANT
  let tenant = await prisma.tenant.findFirst({ where: { name: 'Cabinet Test' } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        id: randomUUID(),
        name: 'Cabinet Test',
        subdomain: 'cabinet-test',
        planId: plan.id,
        status: 'active',
        updatedAt: now,
      },
    });
    console.log('✅ Tenant créé :', tenant.name);
  } else {
    console.log('ℹ️ Tenant existant trouvé :', tenant.name);
  }

  // 3. CRÉER LES UTILISATEURS
  const users = [
    { email: 'avocat@test.fr', name: 'Avocat Test', role: 'ADMIN' },
    { email: 'comptable@test.fr', name: 'Comptable Test', role: 'COMPTABLE' },
    { email: 'client@test.fr', name: 'Client Test', role: 'CLIENT' },
    { email: 'secretaire@test.fr', name: 'Secrétaire Test', role: 'SECRETAIRE' },
  ];

  const createdUsers = [];
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: randomUUID(),
        email: u.email,
        name: u.name,
        password: 'password123',
        role: u.role,
        tenantId: tenant.id,
        updatedAt: now,
      },
    });
    createdUsers.push(user);
    console.log(`✅ Utilisateur créé : ${user.email} (${user.role})`);
  }

  // 4. CRÉER LE PROFIL CLIENT
  const clientUser = createdUsers.find(u => u.role === 'CLIENT');
  if (clientUser) {
    const existingClient = await prisma.client.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: 'client@test.fr' } }
    });

    if (!existingClient) {
      await prisma.client.create({
        data: {
          id: randomUUID(),
          firstName: 'Jean',
          lastName: 'Client',
          email: 'client@test.fr',
          tenantId: tenant.id,
          updatedAt: now,
          User: { connect: { id: clientUser.id } },
        },
      });
      console.log('✅ Profil Client créé pour Jean Client');
    } else {
      console.log('ℹ️ Profil Client existant trouvé');
    }
  }

  // 5. CRÉER UNE FACTURE
  const client = await prisma.client.findFirst({ where: { tenantId: tenant.id } });
  if (client) {
    const existingFacture = await prisma.facture.findFirst({ where: { clientId: client.id } });
    if (!existingFacture) {
      const facture = await prisma.facture.create({
        data: {
          id: randomUUID(),
          numero: `FAC-${new Date().getFullYear()}-001`,
          tenantId: tenant.id,
          clientId: client.id,
          statut: 'en_attente',
          dateEmission: now,
          dateEcheance: new Date(new Date().setDate(now.getDate() + 30)),
          montantHT: 1000,
          montantTVA: 200,
          montantTTC: 1200,
          LigneFacture: {
            create: [{
              id: randomUUID(),
              description: 'Consultation juridique - Dossier OQTF',
              quantite: 1,
              prixUnitaire: 1000,
              montantHT: 1000,
            }],
          },
        },
      });
      console.log(`✅ Facture créée : ${facture.numero} (1200€ TTC)`);
    } else {
      console.log(`ℹ️ Facture existante trouvée : ${existingFacture.numero}`);
    }
  }

  // 6. CRÉER UN 2ÈME TENANT
  const tenantCount = await prisma.tenant.count();
  if (tenantCount < 2) {
    await prisma.tenant.create({
      data: {
        id: randomUUID(),
        name: 'Cabinet Beta',
        subdomain: 'cabinet-beta',
        planId: plan.id,
        status: 'active',
        updatedAt: now,
      },
    });
    console.log('✅ 2ème Tenant créé : Cabinet Beta');
  } else {
    console.log(`ℹ️ Il y a déjà ${tenantCount} tenants en base.`);
  }

  console.log('\n🎉 Tout est prêt pour les tests !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
