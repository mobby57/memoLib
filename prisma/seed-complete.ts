import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Créer d'abord un plan
  console.log('📋 Creating plan...');
  const plan = await prisma.plan.upsert({
    where: { name: 'PREMIUM' },
    update: {},
    create: {
      name: 'PREMIUM',
      displayName: 'Premium',
      description: 'Plan Premium avec toutes les fonctionnalités',
      priceMonthly: 99.0,
      priceYearly: 990.0,
      maxDossiers: 500,
      maxClients: 100,
      maxStorageGb: 50,
      maxUsers: 10,
      aiAutonomyLevel: 3,
      humanValidation: true,
      advancedAnalytics: true,
      externalAiAccess: true,
      prioritySupport: true,
      customBranding: false,
      apiAccess: true,
    },
  });
  console.log('✅ Plan created:', plan.displayName);

  // 2. Créer un tenant
  console.log('📦 Creating tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Cabinet Demo',
      subdomain: 'demo',
      planId: plan.id,
      status: 'active',
      billingEmail: 'billing@demo.com',
    },
  });
  console.log('✅ Tenant created:', tenant.name);

  // Hash password for all users
  console.log('🔐 Hashing password...');
  const hashedPassword = await bcrypt.hash('demo123', 12);

  // 3. Créer un super admin (sans tenant)
  console.log('👑 Creating super admin user...');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@demo.com' },
    update: {},
    create: {
      email: 'superadmin@demo.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      phone: '+33 6 99 99 99 99',
      status: 'active',
    },
  });
  console.log('✅ Super Admin created:', superAdmin.email);

  // 4. Créer un admin
  console.log('👤 Creating admin user...');
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: hashedPassword,
      name: 'Admin Demo',
      role: 'ADMIN',
      tenantId: tenant.id,
      phone: '+33 6 12 34 56 78',
      status: 'active',
    },
  });
  console.log('✅ Admin created:', admin.email);

  // 5. Créer 3 clients (entités Client)
  console.log('👥 Creating clients...');
  const clients = [];
  
  for (let i = 1; i <= 3; i++) {
    const clientEmail = `client${i}@demo.com`;
    const client = await prisma.client.upsert({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: clientEmail,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        civilite: i % 2 === 0 ? 'Mme' : 'M.',
        firstName: `Client${i}`,
        lastName: `Test`,
        email: clientEmail,
        phone: `+33 6 ${10 + i} 00 00 00`,
        dateOfBirth: new Date(1990 + i, i, i),
        nationality: i === 1 ? 'Algérienne' : i === 2 ? 'Tunisienne' : 'Marocaine',
        address: `${i} Avenue des Champs`,
        codePostal: i === 1 ? '75008' : i === 2 ? '69001' : '13001',
        ville: i === 1 ? 'Paris' : i === 2 ? 'Lyon' : 'Marseille',
        pays: 'France',
        status: 'active',
      },
    });
    clients.push(client);
    console.log(`✅ Client ${i} created:`, client.email);
    
    // Créer un User associé pour chaque Client
    await prisma.user.create({
      data: {
        email: client.email,
        password: hashedPassword,
        name: `${client.firstName} ${client.lastName}`,
        role: 'CLIENT',
        tenantId: tenant.id,
        clientId: client.id,
        phone: client.phone || undefined,
        status: 'active',
      },
    });
    console.log(`✅ User for Client ${i} created`);
  }

  // 6. Créer des dossiers pour chaque client
  console.log('📁 Creating dossiers...');
  const dossiers = [];
  const statuts = ['en_cours', 'en_attente', 'urgent'];
  const priorites = ['haute', 'normale', 'basse'];
  const types = [
    'TitreSejour',
    'Naturalisation',
    'Asile',
    'OQTF',
  ];

  for (let clientIndex = 0; clientIndex < clients.length; clientIndex++) {
    const client = clients[clientIndex];
    
    // Chaque client a 2-3 dossiers
    const numDossiers = 2 + clientIndex;
    
    for (let i = 0; i < numDossiers; i++) {
      const year = new Date().getFullYear();
      const dossierNum = `D-${year}-${String(clientIndex * 100 + i + 1).padStart(4, '0')}`;
      
      const dossier = await prisma.dossier.create({
        data: {
          numero: dossierNum,
          typeDossier: types[i % types.length],
          statut: statuts[i % statuts.length],
          priorite: priorites[i % priorites.length],
          objet: `Dossier ${types[i % types.length]}`,
          description: `Description détaillée du dossier pour le client ${client.firstName}`,
          dateOuverture: new Date(Date.now() - (i * 30 * 24 * 60 * 60 * 1000)), // i mois avant
          dateEcheance: new Date(Date.now() + ((3 - i) * 30 * 24 * 60 * 60 * 1000)), // i+3 mois après
          clientId: client.id,
          tenantId: tenant.id,
        },
      });
      dossiers.push(dossier);
      console.log(`✅ Dossier created: ${dossier.numero}`);
    }
  }

  // 7. Créer des documents pour les dossiers
  console.log('📄 Creating documents...');
  const mimeTypes = [
    'application/pdf',
    'image/jpeg',
    'application/msword',
    'image/png',
  ];
  const filenames = [
    'passeport.pdf',
    'photo_identite.jpg',
    'lettre_motivation.doc',
    'justificatif_domicile.png',
  ];

  for (const dossier of dossiers) {
    const numDocs = Math.floor(Math.random() * 3) + 1; // 1-3 docs par dossier
    
    for (let i = 0; i < numDocs; i++) {
      await prisma.document.create({
        data: {
          filename: `${Date.now()}_${filenames[i % filenames.length]}`,
          originalName: filenames[i % filenames.length],
          mimeType: mimeTypes[i % mimeTypes.length],
          size: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
          path: `uploads/demo/${dossier.numero}/${filenames[i % filenames.length]}`,
          dossierId: dossier.id,
          uploadedBy: admin.id,
        },
      });
    }
  }
  console.log('✅ Documents created');

  // 7. Créer des échéances
  console.log('⏰ Creating échéances...');
  for (const dossier of dossiers) {
    const numEcheances = Math.floor(Math.random() * 2) + 1; // 1-2 échéances
    
    for (let i = 0; i < numEcheances; i++) {
      await prisma.echeance.create({
        data: {
          titre: i === 0 ? 'Dépôt dossier complet' : 'Réponse administration',
          type: i === 0 ? 'depot_memoire' : 'reponse_prefecture',
          dateEcheance: new Date(Date.now() + (i + 1) * 15 * 24 * 60 * 60 * 1000), // +15 ou +30 jours
          description: `Échéance importante pour le dossier ${dossier.numero}`,
          statut: 'a_venir',
          priorite: 'normale',
          dossierId: dossier.id,
          tenantId: tenant.id,
          createdBy: admin.id,
        },
      });
    }
  }
  console.log('✅ Échéances created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log('-----------------------------------');
  console.log(`✅ Plan: ${plan.displayName}`);
  console.log(`✅ Tenant: ${tenant.name}`);
  console.log(`✅ Admin: ${admin.email} (password: demo123)`);
  console.log(`✅ Clients: ${clients.length}`);
  clients.forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.email} (password: demo123)`);
  });
  console.log(`✅ Dossiers: ${dossiers.length}`);
  console.log('✅ Documents, Échéances ✓');
  console.log('-----------------------------------\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
