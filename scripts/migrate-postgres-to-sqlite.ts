/**
 * Script de Migration PostgreSQL → SQLite
 * Migre les données d'une base PostgreSQL vers SQLite (dev/D1)
 */

import { PrismaClient as PrismaClientPostgres } from '@prisma/client';
import { PrismaClient as PrismaClientSQLite } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Types
type ModelName = 
  | 'Plan' | 'Tenant' | 'TenantSettings' | 'User' 
  | 'Client' | 'Dossier' | 'Facture' | 'Document'
  | 'RendezVous' | 'Email' | 'EmailClassification'
  | 'Workspace' | 'ChecklistItem' | 'WorkspaceDocument'
  | 'WorkspaceDraft' | 'WorkspaceAlert' | 'TimelineEvent'
  | 'TenantMetrics' | 'Jurisprudence' | 'ClientWorkspace';

interface MigrationStats {
  modelName: string;
  recordsCount: number;
  success: boolean;
  duration: number;
  errors: string[];
}

interface MigrationConfig {
  sourcePostgresUrl: string;
  targetSqlitePath: string;
  batchSize: number;
  excludeModels: string[];
  dryRun: boolean;
}

class DatabaseMigrator {
  private sourceDb: PrismaClientPostgres;
  private targetDb: PrismaClientSQLite;
  private stats: MigrationStats[] = [];
  private config: MigrationConfig;

  constructor(config: MigrationConfig) {
    this.config = config;
    
    // Connexion source (PostgreSQL)
    this.sourceDb = new PrismaClientPostgres({
      datasources: { db: { url: config.sourcePostgresUrl } }
    });

    // Connexion cible (SQLite)
    this.targetDb = new PrismaClientSQLite({
      datasources: { db: { url: `file:${config.targetSqlitePath}` } }
    });

    console.log(`📊 Configuration de migration:`);
    console.log(`   Source: PostgreSQL (${this.maskUrl(config.sourcePostgresUrl)})`);
    console.log(`   Cible: SQLite (${config.targetSqlitePath})`);
    console.log(`   Batch size: ${config.batchSize}`);
    console.log(`   Dry run: ${config.dryRun ? 'OUI ⚠️' : 'NON'}`);
  }

  private maskUrl(url: string): string {
    return url.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  }

  /**
   * Liste des modèles à migrer dans l'ordre (respecte les dépendances)
   */
  private getModelsInOrder(): ModelName[] {
    return [
      // Niveau 1: Pas de dépendances
      'Plan',
      
      // Niveau 2: Dépend de Plan
      'Tenant',
      'TenantSettings',
      
      // Niveau 3: Dépend de Tenant
      'User',
      'Client',
      
      // Niveau 4: Dépend de Client
      'Dossier',
      'Workspace',
      
      // Niveau 5: Dépend de Dossier/Workspace
      'Facture',
      'Document',
      'RendezVous',
      'Email',
      'EmailClassification',
      'ChecklistItem',
      'WorkspaceDocument',
      'WorkspaceDraft',
      'WorkspaceAlert',
      'TimelineEvent',
      'ClientWorkspace',
      
      // Niveau 6: Métriques et statistiques
      'TenantMetrics',
      'Jurisprudence',
    ];
  }

  /**
   * Migration d'un modèle spécifique
   */
  private async migrateModel(modelName: ModelName): Promise<MigrationStats> {
    const startTime = Date.now();
    const stat: MigrationStats = {
      modelName,
      recordsCount: 0,
      success: false,
      duration: 0,
      errors: []
    };

    try {
      console.log(`\n🔄 Migration de ${modelName}...`);

      // Récupérer les données de la source
      const sourceModel = (this.sourceDb as any)[modelName.toLowerCase()];
      const targetModel = (this.targetDb as any)[modelName.toLowerCase()];

      if (!sourceModel || !targetModel) {
        throw new Error(`Modèle ${modelName} introuvable dans Prisma`);
      }

      // Compter les enregistrements source
      const totalRecords = await sourceModel.count();
      console.log(`   📊 Total à migrer: ${totalRecords}`);

      if (totalRecords === 0) {
        stat.success = true;
        stat.duration = Date.now() - startTime;
        console.log(`   ✅ Aucun enregistrement (OK)`);
        return stat;
      }

      // Migration par batch
      let migratedCount = 0;
      let skip = 0;

      while (skip < totalRecords) {
        const batch = await sourceModel.findMany({
          skip,
          take: this.config.batchSize
        });

        if (!this.config.dryRun) {
          // Insérer dans la cible
          for (const record of batch) {
            try {
              await targetModel.create({ data: record });
              migratedCount++;
            } catch (error: any) {
              stat.errors.push(`Erreur enregistrement ${skip}: ${error.message}`);
              console.error(`   ❌ Erreur: ${error.message}`);
            }
          }
        } else {
          migratedCount += batch.length;
        }

        skip += this.config.batchSize;
        
        const progress = Math.round((skip / totalRecords) * 100);
        console.log(`   ⏳ Progression: ${migratedCount}/${totalRecords} (${progress}%)`);
      }

      stat.recordsCount = migratedCount;
      stat.success = migratedCount === totalRecords;
      stat.duration = Date.now() - startTime;

      if (stat.success) {
        console.log(`   ✅ Migration complète: ${migratedCount} enregistrements en ${stat.duration}ms`);
      } else {
        console.log(`   ⚠️  Migration partielle: ${migratedCount}/${totalRecords} (${stat.errors.length} erreurs)`);
      }

    } catch (error: any) {
      stat.errors.push(error.message);
      console.error(`   ❌ Erreur critique: ${error.message}`);
    }

    return stat;
  }

  /**
   * Migration complète
   */
  async migrate(): Promise<void> {
    console.log(`\n🚀 Début de la migration ${this.config.dryRun ? '(DRY RUN)' : ''}...\n`);

    const models = this.getModelsInOrder().filter(
      model => !this.config.excludeModels.includes(model)
    );

    for (const modelName of models) {
      const stat = await this.migrateModel(modelName);
      this.stats.push(stat);
    }

    await this.generateReport();
  }

  /**
   * Génération du rapport
   */
  private async generateReport(): Promise<void> {
    console.log(`\n\n📊 RAPPORT DE MIGRATION`);
    console.log(`${'='.repeat(80)}\n`);

    const totalRecords = this.stats.reduce((sum, s) => sum + s.recordsCount, 0);
    const totalDuration = this.stats.reduce((sum, s) => sum + s.duration, 0);
    const successCount = this.stats.filter(s => s.success).length;
    const errorCount = this.stats.filter(s => !s.success).length;

    console.log(`✅ Modèles migrés avec succès: ${successCount}/${this.stats.length}`);
    console.log(`❌ Modèles en erreur: ${errorCount}`);
    console.log(`📊 Total enregistrements: ${totalRecords}`);
    console.log(`⏱️  Durée totale: ${(totalDuration / 1000).toFixed(2)}s`);
    
    console.log(`\n📋 Détails par modèle:\n`);
    console.log(`${'Modèle'.padEnd(25)} ${'Records'.padEnd(10)} ${'Durée'.padEnd(12)} ${'Statut'.padEnd(10)}`);
    console.log(`${'-'.repeat(80)}`);

    for (const stat of this.stats) {
      const status = stat.success ? '✅' : '❌';
      const duration = `${stat.duration}ms`;
      console.log(
        `${stat.modelName.padEnd(25)} ${String(stat.recordsCount).padEnd(10)} ${duration.padEnd(12)} ${status}`
      );
    }

    // Erreurs détaillées
    const errorsFound = this.stats.filter(s => s.errors.length > 0);
    if (errorsFound.length > 0) {
      console.log(`\n\n⚠️  ERREURS DÉTAILLÉES:\n`);
      for (const stat of errorsFound) {
        console.log(`${stat.modelName}:`);
        stat.errors.forEach(err => console.log(`  - ${err}`));
      }
    }

    // Sauvegarder le rapport
    const reportPath = path.join(process.cwd(), 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      config: this.config,
      summary: {
        totalModels: this.stats.length,
        successCount,
        errorCount,
        totalRecords,
        totalDuration
      },
      details: this.stats
    }, null, 2));

    console.log(`\n💾 Rapport sauvegardé: ${reportPath}`);
  }

  /**
   * Validation de la migration
   */
  async validate(): Promise<boolean> {
    console.log(`\n\n🔍 VALIDATION DE LA MIGRATION\n`);

    const models = this.getModelsInOrder();
    let allValid = true;

    for (const modelName of models) {
      const sourceModel = (this.sourceDb as any)[modelName.toLowerCase()];
      const targetModel = (this.targetDb as any)[modelName.toLowerCase()];

      if (!sourceModel || !targetModel) continue;

      const sourceCount = await sourceModel.count();
      const targetCount = await targetModel.count();

      const match = sourceCount === targetCount;
      const status = match ? '✅' : '❌';

      console.log(`${status} ${modelName.padEnd(25)} Source: ${sourceCount}, Cible: ${targetCount}`);

      if (!match) allValid = false;
    }

    console.log(`\n${allValid ? '✅' : '❌'} Validation ${allValid ? 'RÉUSSIE' : 'ÉCHOUÉE'}`);
    return allValid;
  }

  /**
   * Nettoyage
   */
  async cleanup(): Promise<void> {
    await this.sourceDb.$disconnect();
    await this.targetDb.$disconnect();
  }
}

// Exécution
async function main() {
  const config: MigrationConfig = {
    sourcePostgresUrl: process.env.POSTGRES_URL || 
      'postgresql://iapostemanage:changeme@localhost:5432/iapostemanage',
    targetSqlitePath: process.env.SQLITE_PATH || './prisma/migrated.db',
    batchSize: parseInt(process.env.BATCH_SIZE || '100'),
    excludeModels: [],
    dryRun: process.argv.includes('--dry-run')
  };

  const migrator = new DatabaseMigrator(config);

  try {
    // Migration
    await migrator.migrate();

    // Validation si pas en dry-run
    if (!config.dryRun) {
      const isValid = await migrator.validate();
      if (!isValid) {
        console.error(`\n⚠️  La validation a échoué. Vérifiez le rapport.`);
        process.exit(1);
      }
    }

    console.log(`\n\n🎉 Migration terminée avec succès!`);

  } catch (error: any) {
    console.error(`\n❌ Erreur fatale: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await migrator.cleanup();
  }
}

// Lancer la migration
if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseMigrator, MigrationConfig };
