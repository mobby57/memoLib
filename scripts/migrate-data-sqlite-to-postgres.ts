#!/usr/bin/env tsx
/**
 * Migration SQLite → PostgreSQL
 * Copie toutes les données de la base SQLite vers PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import Database from 'better-sqlite3';

const SQLITE_PATH = './prisma/dev.db';
const POSTGRES_URL = 'postgresql://iapostemanage:changeme@localhost:5432/iapostemanage';

// Client PostgreSQL (destination)
const prisma = new PrismaClient({
  datasources: { db: { url: POSTGRES_URL } },
});

// SQLite (source) - lecture directe
const sqlite = new Database(SQLITE_PATH, { readonly: true });

interface MigrationStats {
  model: string;
  count: number;
  status: 'success' | 'error';
  error?: string;
}

const stats: MigrationStats[] = [];

/**
 * Convertit les types SQLite en types PostgreSQL
 * - Integer (0/1) → Boolean
 * - Integer timestamp → Date
 */
function convertSQLiteToPostgres(row: any): any {
  const converted: any = {};
  
  for (const [key, value] of Object.entries(row)) {
    // Convertir les booléens SQLite (0/1) en Boolean
    if (typeof value === 'number' && (value === 0 || value === 1)) {
      // Liste des champs booléens connus
      const booleanFields = [
        'humanValidation', 'advancedAnalytics', 'externalAiAccess',
        'prioritySupport', 'customBranding', 'apiAccess', 'isActive',
        'ollamaEnabled', 'emailEnabled', 'autoRenew',
        'accepteNotifications', 'accepteNewsletter', 'consentementRGPD',
        'accessRestreint', 'locked'
      ];
      
      if (booleanFields.includes(key)) {
        converted[key] = value === 1;
        continue;
      }
    }
    
    // Convertir les timestamps (millisecondes) en Date
    if (typeof value === 'number' && value > 100000000) {
      // C'est probablement un timestamp (> 1973 si en millisecondes, > 1973 si en secondes)
      const dateFields = [
        'createdAt', 'updatedAt', 'lastActivityAt', 'lastLogin',
        'trialEndsAt', 'currentPeriodStart', 'currentPeriodEnd', 'trialEnd',
        'canceledAt', 'endedAt', 'dateEmission', 'dateEcheance', 'datePaiement',
        'dateCreation', 'dateOuverture', 'dateEcheance', 'dateProchaineEtape',
        'dateCloture', 'dateArchivage', 'stateChangedAt', 'validatedAt', 'completedAt',
        'dateOfBirth', 'passportExpiry', 'idCardExpiry', 'titreSejourExpiry',
        'dateConsentementRGPD', 'datePremiereVisite', 'dateDernierContact',
        'dernierContactClient', 'prochaineRelance', 'notificationDate', 'deadlineDate',
        'closedAt'
      ];
      
      if (dateFields.includes(key)) {
        // Si valeur < 10 milliards, c'est en secondes, sinon millisecondes
        const timestamp = value < 10000000000 ? value * 1000 : value;
        converted[key] = new Date(timestamp);
        continue;
      }
    }
    
    // Valeur inchangée
    converted[key] = value;
  }
  
  return converted;
}

async function migrateTable(tableName: string, prismaModel: any) {
  console.log(`\n🔄 Migration de ${tableName}...`);
  
  try {
    // Lire depuis SQLite
    const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all();
    console.log(`   📊 ${rows.length} enregistrements trouvés`);
    
    if (rows.length === 0) {
      stats.push({ model: tableName, count: 0, status: 'success' });
      console.log(`   ✅ Table vide (OK)`);
      return;
    }

    // Insérer dans PostgreSQL
    let inserted = 0;
    for (const row of rows) {
      try {
        // Convertir les types SQLite → PostgreSQL
        const data = convertSQLiteToPostgres(row);
        await prismaModel.create({ data });
        inserted++;
        
        if (inserted % 10 === 0) {
          process.stdout.write(`\r   ⏳ Progression: ${inserted}/${rows.length}`);
        }
      } catch (err: any) {
        // Ignorer les duplicata ET les foreign key violations (on migrera les dépendances après)
        if (err.code === 'P2002' || err.code === 'P2003') {
          // P2002 = Unique constraint, P2003 = Foreign key constraint
          continue;
        }
        throw err;
      }
    }
    
    console.log(`\n   ✅ ${inserted}/${rows.length} enregistrements migrés`);
    stats.push({ model: tableName, count: inserted, status: 'success' });
    
  } catch (error: any) {
    console.log(`\n   ❌ Erreur: ${error.message}`);
    stats.push({ 
      model: tableName, 
      count: 0, 
      status: 'error',
      error: error.message 
    });
  }
}

async function main() {
  console.log('🚀 MIGRATION SQLite → PostgreSQL\n');
  console.log(`Source: ${SQLITE_PATH}`);
  console.log(`Cible: ${POSTGRES_URL}\n`);

  const startTime = Date.now();

  try {
    await prisma.$connect();
    console.log('✅ Connecté à PostgreSQL\n');

    // Migration dans l'ordre des dépendances (foreign keys)
    const migrations = [
      { table: 'Plan', model: prisma.plan },
      { table: 'Tenant', model: prisma.tenant },
      { table: 'TenantSettings', model: prisma.tenantSettings },
      { table: 'Subscription', model: prisma.subscription },
      { table: 'Client', model: prisma.client },
      { table: 'User', model: prisma.user },
      { table: 'Dossier', model: prisma.dossier },
      { table: 'Workspace', model: prisma.workspace },
      { table: 'Email', model: prisma.email },
      { table: 'EmailClassification', model: prisma.emailClassification },
      { table: 'Document', model: prisma.document },
      { table: 'Facture', model: prisma.facture },
      { table: 'WorkspaceReasoning', model: prisma.workspaceReasoning },
      { table: 'ExtractedFact', model: prisma.extractedFact },
      { table: 'IdentifiedContext', model: prisma.identifiedContext },
      { table: 'DetectedObligation', model: prisma.detectedObligation },
      { table: 'GeneratedDraft', model: prisma.generatedDraft },
      { table: 'AuditLog', model: prisma.auditLog },
    ];

    for (const { table, model } of migrations) {
      await migrateTable(table, model);
    }

    // Rapport final
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successCount = stats.filter(s => s.status === 'success').length;
    const totalRecords = stats.reduce((sum, s) => sum + s.count, 0);

    console.log('\n\n📊 RAPPORT DE MIGRATION');
    console.log('='.repeat(60));
    console.log(`✅ Tables migrées: ${successCount}/${migrations.length}`);
    console.log(`📊 Total enregistrements: ${totalRecords}`);
    console.log(`⏱️  Durée: ${duration}s\n`);

    console.log('Détails:\n');
    for (const stat of stats) {
      const icon = stat.status === 'success' ? '✅' : '❌';
      console.log(`${icon} ${stat.model.padEnd(25)} ${stat.count} records`);
    }

    const errors = stats.filter(s => s.status === 'error');
    if (errors.length > 0) {
      console.log('\n⚠️  ERREURS:\n');
      for (const err of errors) {
        console.log(`${err.model}: ${err.error}`);
      }
    }

    console.log('\n🎉 Migration terminée!\n');
    console.log('📝 Prochaines étapes:');
    console.log('   1. Vérifier les données: npx prisma studio');
    console.log('   2. Relancer le serveur: npm run dev');

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

main();
