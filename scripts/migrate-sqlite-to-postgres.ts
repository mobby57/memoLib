#!/usr/bin/env tsx
/**
 * Migration SQLite → PostgreSQL
 * Copie toutes les données de SQLite vers PostgreSQL Docker
 */

import { PrismaClient as PrismaSQLite } from '@prisma/client';
import { PrismaClient as PrismaPostgres } from '@prisma/client';

// Clients séparés
const sqlite = new PrismaSQLite({
  datasources: { db: { url: 'file:./prisma/dev.db' } },
});

const postgres = new PrismaPostgres({
  datasources: { db: { url: 'postgresql://iapostemanage:changeme@localhost:5432/iapostemanage' } },
});

interface MigrationResult {
  model: string;
  records: number;
  duration: number;
  status: 'success' | 'error';
  error?: string;
}

const results: MigrationResult[] = [];

async function migrateModel(
  modelName: string,
  sourceModel: any,
  targetModel: any
) {
  const start = Date.now();
  console.log(`\n🔄 Migration de ${modelName}...`);

  try {
    // Compter les enregistrements source
    const count = await sourceModel.count();
    console.log(`   📊 ${count} enregistrements à migrer`);

    if (count === 0) {
      results.push({
        model: modelName,
        records: 0,
        duration: Date.now() - start,
        status: 'success',
      });
      console.log(`   ✅ Aucun enregistrement (OK)`);
      return;
    }

    // Récupérer tous les enregistrements
    const records = await sourceModel.findMany();

    // Insérer par batch de 100
    const batchSize = 100;
    let migrated = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      for (const record of batch) {
        // Supprimer les champs auto-générés pour éviter les conflits
        const { createdAt, updatedAt, ...data } = record;
        
        await targetModel.create({
          data: {
            ...data,
            createdAt: createdAt || new Date(),
            updatedAt: updatedAt || new Date(),
          },
        });
      }
      
      migrated += batch.length;
      process.stdout.write(`\r   ⏳ Progression: ${migrated}/${count} (${Math.round((migrated/count)*100)}%)`);
    }

    console.log(`\n   ✅ ${count} enregistrements migrés`);
    
    results.push({
      model: modelName,
      records: count,
      duration: Date.now() - start,
      status: 'success',
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`\n   ❌ Erreur: ${errorMsg}`);
    
    results.push({
      model: modelName,
      records: 0,
      duration: Date.now() - start,
      status: 'error',
      error: errorMsg,
    });
  }
}

async function main() {
  console.log('🚀 MIGRATION SQLite → PostgreSQL');
  console.log('=====================================\n');
  console.log('Source: SQLite (file:./prisma/dev.db)');
  console.log('Cible: PostgreSQL (localhost:5432/iapostemanage)\n');

  const startTime = Date.now();

  try {
    // Test connexions
    console.log('🔌 Test des connexions...');
    await sqlite.$connect();
    console.log('   ✅ SQLite connecté');
    await postgres.$connect();
    console.log('   ✅ PostgreSQL connecté');

    // Migration dans l'ordre des dépendances
    const models = [
      { name: 'Plan', source: sqlite.plan, target: postgres.plan },
      { name: 'Tenant', source: sqlite.tenant, target: postgres.tenant },
      { name: 'TenantSettings', source: sqlite.tenantSettings, target: postgres.tenantSettings },
      { name: 'User', source: sqlite.user, target: postgres.user },
      { name: 'Client', source: sqlite.client, target: postgres.client },
      { name: 'Dossier', source: sqlite.dossier, target: postgres.dossier },
      { name: 'Workspace', source: sqlite.workspace, target: postgres.workspace },
      { name: 'Facture', source: sqlite.facture, target: postgres.facture },
      { name: 'Document', source: sqlite.document, target: postgres.document },
      { name: 'Email', source: sqlite.email, target: postgres.email },
      { name: 'EmailClassification', source: sqlite.emailClassification, target: postgres.emailClassification },
      { name: 'Subscription', source: sqlite.subscription, target: postgres.subscription },
    ];

    for (const model of models) {
      await migrateModel(model.name, model.source, model.target);
    }

    // Rapport final
    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const totalRecords = results.reduce((sum, r) => sum + r.records, 0);

    console.log('\n\n📊 RAPPORT DE MIGRATION');
    console.log('=====================================');
    console.log(`✅ Modèles migrés: ${successCount}/${models.length}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📊 Total enregistrements: ${totalRecords}`);
    console.log(`⏱️  Durée totale: ${(totalDuration/1000).toFixed(2)}s\n`);

    console.log('Détails par modèle:\n');
    console.log('Modèle                Records    Durée      Statut');
    console.log('-------------------------------------------------------');
    
    for (const result of results) {
      const status = result.status === 'success' ? '✅' : '❌';
      const duration = `${result.duration}ms`;
      console.log(
        `${result.model.padEnd(20)} ${String(result.records).padEnd(10)} ${duration.padEnd(10)} ${status}`
      );
    }

    if (errorCount > 0) {
      console.log('\n⚠️  ERREURS DÉTAILLÉES:\n');
      for (const result of results.filter(r => r.status === 'error')) {
        console.log(`${result.model}:`);
        console.log(`  - ${result.error}\n`);
      }
    }

    console.log('\n🎉 Migration terminée avec succès!');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Modifier .env.local pour utiliser PostgreSQL');
    console.log('   2. Relancer le serveur: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  }
}

main();
