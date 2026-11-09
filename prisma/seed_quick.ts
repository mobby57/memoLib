import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Quick seed démarré...');

  // 0. Créer un Plan d'abord
  const plan = await prisma.plan.create({
    data: {
      name: 'demo-plan',
      displayName: 'Démo',
      description: 'Plan de démonstration',
      priceMonthly: 0,
      priceYearly: 0,
      isActive: true
    }
  });
  console.log('✅ Plan créé');

  // 1. Créer un Tenant (cabinet juridique)
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Cabinet Juridique Démo',
      subdomain: 'demo',
      planId: plan.id
    }
  });
  console.log('✅ Tenant créé:', tenant.id);

  // 2. Créer des utilisateurs
  const lawyer = await prisma.user.create({
    data: {
      email: 'avocat@demo.fr',
      name: 'Maître Dupont',
      password: 'demo123',
      role: 'LAWYER',
      tenantId: tenant.id
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@demo.fr',
      name: 'Admin Demo',
      password: 'admin123',
      role: 'ADMIN',
      tenantId: tenant.id
    }
  });

  console.log('✅ Utilisateurs créés');

  // 3. Créer un client
  const client = await prisma.client.create({
    data: {
      firstName: 'Jean',
      lastName: 'Martin',
      email: 'jean@demo.fr',
      tenantId: tenant.id
    }
  });
  console.log('✅ Client créé');

  // 4. Créer un dossier
  const dossier = await prisma.dossier.create({
    data: {
      tenantId: tenant.id,
      numero: 'DOSS-001',
      clientId: client.id,
      typeDossier: 'IMMIGRATION'
    }
  });
  console.log('✅ Dossier créé');

  console.log('\n✅ Seed terminé !');
  console.log('\n📋 IDENTIFIANTS:');
  console.log('   Admin: admin@demo.fr / admin123');
  console.log('   Avocat: avocat@demo.fr / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
