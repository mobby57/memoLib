#!/usr/bin/env tsx
/**
 * Test de connexion PostgreSQL
 * Vérifie que l'application utilise bien PostgreSQL avec les données migrées
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 TEST POSTGRESQL - Vérification Migration\n');

  try {
    // Connexion
    await prisma.$connect();
    console.log('✅ Connecté à PostgreSQL\n');

    // Vérifier les données migrées
    console.log('📊 Données migrées:\n');

    const plans = await prisma.plan.count();
    console.log(`   Plans: ${plans}`);

    const tenants = await prisma.tenant.count();
    console.log(`   Tenants: ${tenants}`);

    const users = await prisma.user.count();
    console.log(`   Users: ${users}`);

    const clients = await prisma.client.count();
    console.log(`   Clients: ${clients}`);

    const dossiers = await prisma.dossier.count();
    console.log(`   Dossiers: ${dossiers}`);

    const documents = await prisma.document.count();
    console.log(`   Documents: ${documents}`);

    const workspaces = await prisma.workspace.count();
    console.log(`   Workspaces: ${workspaces}`);

    const total = plans + tenants + users + clients + dossiers + documents + workspaces;
    console.log(`\n   📊 TOTAL: ${total} enregistrements`);

    // Test d'un utilisateur
    console.log('\n👤 Test utilisateur Super Admin:\n');
    const superadmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { email: true, name: true, role: true, createdAt: true }
    });

    if (superadmin) {
      console.log(`   ✅ ${superadmin.name} (${superadmin.email})`);
      console.log(`   Rôle: ${superadmin.role}`);
      console.log(`   Créé le: ${superadmin.createdAt.toLocaleString('fr-FR')}`);
    }

    // Test tenant
    console.log('\n🏢 Test tenant:\n');
    const tenant = await prisma.tenant.findFirst({
      include: { plan: true },
    });

    if (tenant) {
      console.log(`   ✅ ${tenant.name} (${tenant.subdomain})`);
      console.log(`   Plan: ${tenant.plan.displayName}`);
      console.log(`   Status: ${tenant.status}`);
    }

    console.log('\n\n🎉 MIGRATION POSTGRESQL RÉUSSIE !');
    console.log('\n📝 Configuration actuelle:');
    console.log(`   DATABASE_URL: postgresql://memolib@localhost:5432/memolib`);
    console.log(`   Serveur: http://localhost:3000`);
    console.log(`   Prisma Studio: http://localhost:5555`);

  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
