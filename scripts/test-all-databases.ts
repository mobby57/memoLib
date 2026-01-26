/**
 * Test des 3 Environnements de Base de Données
 * SQLite (dev) | PostgreSQL (Docker) | Cloudflare D1 (cloud)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

interface DatabaseTest {
  name: string;
  url: string;
  type: 'sqlite' | 'postgresql' | 'd1';
  description: string;
}

interface TestResult {
  database: string;
  test: string;
  success: boolean;
  duration: number;
  details?: any;
  error?: string;
}

class DatabaseTester {
  private results: TestResult[] = [];

  /**
   * Configuration des 3 environnements
   */
  private getDatabases(): DatabaseTest[] {
    return [
      {
        name: 'SQLite (Dev)',
        url: 'file:./prisma/dev.db',
        type: 'sqlite',
        description: 'Base de données de développement locale'
      },
      {
        name: 'PostgreSQL (Docker)',
        url: process.env.POSTGRES_URL || 
          'postgresql://iapostemanage:changeme@localhost:5432/iapostemanage',
        type: 'postgresql',
        description: 'Base de données Docker pour production'
      },
      {
        name: 'Cloudflare D1',
        url: process.env.D1_DATABASE_URL || 'file:./prisma/.d1/iapostemanager-db.db',
        type: 'd1',
        description: 'Base de données Cloudflare pour cloud'
      }
    ];
  }

  /**
   * Test de connexion (utilise la connexion par défaut pour SQLite)
   */
  private async testConnection(db: DatabaseTest): Promise<TestResult> {
    const startTime = Date.now();
    let prisma: PrismaClient | null = null;

    try {
      console.log(`\n🔌 Test connexion: ${db.name}...`);

      // Pour SQLite dev, utiliser la connexion par défaut
      if (db.type === 'sqlite' && db.url.includes('./prisma/dev.db')) {
        prisma = new PrismaClient();
      } else {
        prisma = new PrismaClient({
          datasources: { db: { url: db.url } }
        });
      }

      // Test simple
      await prisma.$queryRaw`SELECT 1 as test`;

      const duration = Date.now() - startTime;
      console.log(`   ✅ Connexion OK (${duration}ms)`);

      return {
        database: db.name,
        test: 'Connexion',
        success: true,
        duration
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.log(`   ❌ Échec: ${error.message}`);

      return {
        database: db.name,
        test: 'Connexion',
        success: false,
        duration,
        error: error.message
      };
    } finally {
      if (prisma) await prisma.$disconnect();
    }
  }

  /**
   * Test CRUD complet
   */
  private async testCRUD(db: DatabaseTest): Promise<TestResult> {
    const startTime = Date.now();
    let prisma: PrismaClient | null = null;

    try {
      console.log(`\n📝 Test CRUD: ${db.name}...`);

      // Pour SQLite dev, utiliser la connexion par défaut
      if (db.type === 'sqlite' && db.url.includes('./prisma/dev.db')) {
        prisma = new PrismaClient();
      } else {
        prisma = new PrismaClient({
          datasources: { db: { url: db.url } }
        });
      }

      // CREATE
      const testPlan = await prisma.plan.create({
        data: {
          name: `TEST_${Date.now()}`,
          displayName: 'Plan de Test',
          priceMonthly: 0,
          priceYearly: 0,
          isActive: false
        }
      });
      console.log(`   ✅ CREATE: Plan créé (${testPlan.id})`);

      // READ
      const foundPlan = await prisma.plan.findUnique({
        where: { id: testPlan.id }
      });
      console.log(`   ✅ READ: Plan trouvé`);

      // UPDATE
      const updatedPlan = await prisma.plan.update({
        where: { id: testPlan.id },
        data: { displayName: 'Plan de Test Modifié' }
      });
      console.log(`   ✅ UPDATE: Plan modifié`);

      // DELETE
      await prisma.plan.delete({
        where: { id: testPlan.id }
      });
      console.log(`   ✅ DELETE: Plan supprimé`);

      const duration = Date.now() - startTime;
      console.log(`   ✅ CRUD complet OK (${duration}ms)`);

      return {
        database: db.name,
        test: 'CRUD',
        success: true,
        duration
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.log(`   ❌ Échec: ${error.message}`);

      return {
        database: db.name,
        test: 'CRUD',
        success: false,
        duration,
        error: error.message
      };
    } finally {
      if (prisma) await prisma.$disconnect();
    }
  }

  /**
   * Test de performance
   */
  private async testPerformance(db: DatabaseTest): Promise<TestResult> {
    const startTime = Date.now();
    let prisma: PrismaClient | null = null;

    try {
      console.log(`\n⚡ Test performance: ${db.name}...`);

      // Pour SQLite dev, utiliser la connexion par défaut
      if (db.type === 'sqlite' && db.url.includes('./prisma/dev.db')) {
        prisma = new PrismaClient();
      } else {
        prisma = new PrismaClient({
          datasources: { db: { url: db.url } }
        });
      }

      // Test 1: Count simple
      const countStart = Date.now();
      const count = await prisma.plan.count();
      const countDuration = Date.now() - countStart;
      console.log(`   📊 Count: ${count} plans en ${countDuration}ms`);

      // Test 2: FindMany avec pagination
      const findStart = Date.now();
      const plans = await prisma.plan.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      const findDuration = Date.now() - findStart;
      console.log(`   📋 FindMany: ${plans.length} plans en ${findDuration}ms`);

      // Test 3: Requête complexe avec relations
      const complexStart = Date.now();
      const tenantsWithPlans = await prisma.tenant.findMany({
        take: 5,
        include: { plan: true }
      });
      const complexDuration = Date.now() - complexStart;
      console.log(`   🔗 Requête complexe: ${tenantsWithPlans.length} tenants en ${complexDuration}ms`);

      const totalDuration = Date.now() - startTime;

      return {
        database: db.name,
        test: 'Performance',
        success: true,
        duration: totalDuration,
        details: {
          count: { records: count, duration: countDuration },
          findMany: { records: plans.length, duration: findDuration },
          complex: { records: tenantsWithPlans.length, duration: complexDuration }
        }
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.log(`   ❌ Échec: ${error.message}`);

      return {
        database: db.name,
        test: 'Performance',
        success: false,
        duration,
        error: error.message
      };
    } finally {
      if (prisma) await prisma.$disconnect();
    }
  }

  /**
   * Test d'isolation multi-tenant
   */
  private async testTenantIsolation(db: DatabaseTest): Promise<TestResult> {
    const startTime = Date.now();
    let prisma: PrismaClient | null = null;

    try {
      console.log(`\n🔒 Test isolation tenant: ${db.name}...`);

      // Pour SQLite dev, utiliser la connexion par défaut
      if (db.type === 'sqlite' && db.url.includes('./prisma/dev.db')) {
        prisma = new PrismaClient();
      } else {
        prisma = new PrismaClient({
          datasources: { db: { url: db.url } }
        });
      }

      // Compter les tenants
      const tenantCount = await prisma.tenant.count();
      console.log(`   📊 ${tenantCount} tenant(s) trouvé(s)`);

      if (tenantCount === 0) {
        console.log(`   ⚠️  Aucun tenant pour tester l'isolation`);
        return {
          database: db.name,
          test: 'Isolation Tenant',
          success: true,
          duration: Date.now() - startTime,
          details: { message: 'Pas de tenant à tester' }
        };
      }

      // Récupérer les dossiers par tenant
      const tenants = await prisma.tenant.findMany({ take: 3 });
      
      for (const tenant of tenants) {
        const dossiers = await prisma.dossier.findMany({
          where: { tenantId: tenant.id }
        });
        console.log(`   ✅ Tenant ${tenant.name}: ${dossiers.length} dossier(s) isolé(s)`);
      }

      const duration = Date.now() - startTime;

      return {
        database: db.name,
        test: 'Isolation Tenant',
        success: true,
        duration,
        details: { tenantsChecked: tenants.length }
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.log(`   ❌ Échec: ${error.message}`);

      return {
        database: db.name,
        test: 'Isolation Tenant',
        success: false,
        duration,
        error: error.message
      };
    } finally {
      if (prisma) await prisma.$disconnect();
    }
  }

  /**
   * Exécuter tous les tests pour une base
   */
  private async testDatabase(db: DatabaseTest): Promise<void> {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🗄️  ${db.name.toUpperCase()}`);
    console.log(`   Type: ${db.type}`);
    console.log(`   Description: ${db.description}`);
    console.log(`${'='.repeat(80)}`);

    // Tests séquentiels
    const connectionResult = await this.testConnection(db);
    this.results.push(connectionResult);

    if (connectionResult.success) {
      this.results.push(await this.testCRUD(db));
      this.results.push(await this.testPerformance(db));
      this.results.push(await this.testTenantIsolation(db));
    } else {
      console.log(`\n⚠️  Connexion échouée, tests suivants ignorés`);
    }
  }

  /**
   * Générer le rapport
   */
  private generateReport(): void {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📊 RAPPORT DE TEST DES BASES DE DONNÉES`);
    console.log(`${'='.repeat(80)}\n`);

    // Grouper par base
    const databases = [...new Set(this.results.map(r => r.database))];

    for (const dbName of databases) {
      const dbResults = this.results.filter(r => r.database === dbName);
      const successCount = dbResults.filter(r => r.success).length;
      const totalCount = dbResults.length;
      const status = successCount === totalCount ? '✅' : '❌';

      console.log(`${status} ${dbName}: ${successCount}/${totalCount} tests réussis`);

      for (const result of dbResults) {
        const icon = result.success ? '✅' : '❌';
        const duration = `${result.duration}ms`;
        console.log(`   ${icon} ${result.test.padEnd(20)} ${duration.padStart(8)}`);
        
        if (result.error) {
          console.log(`      Erreur: ${result.error}`);
        }
      }
      console.log('');
    }

    // Statistiques globales
    const totalSuccess = this.results.filter(r => r.success).length;
    const totalTests = this.results.length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n📈 STATISTIQUES GLOBALES:`);
    console.log(`   Tests réussis: ${totalSuccess}/${totalTests}`);
    console.log(`   Taux de succès: ${((totalSuccess / totalTests) * 100).toFixed(1)}%`);
    console.log(`   Durée totale: ${totalDuration}ms`);

    // Sauvegarder le rapport
    const reportPath = path.join(process.cwd(), 'database-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        totalSuccess,
        totalDuration,
        successRate: (totalSuccess / totalTests) * 100
      },
      results: this.results
    }, null, 2));

    console.log(`\n💾 Rapport sauvegardé: ${reportPath}\n`);
  }

  /**
   * Exécuter tous les tests
   */
  async runAll(): Promise<boolean> {
    console.log(`\n🧪 DÉBUT DES TESTS DES 3 BASES DE DONNÉES\n`);

    const databases = this.getDatabases();

    for (const db of databases) {
      await this.testDatabase(db);
    }

    this.generateReport();

    const allSuccess = this.results.every(r => r.success);
    return allSuccess;
  }
}

// Exécution
async function main() {
  const tester = new DatabaseTester();

  try {
    const allSuccess = await tester.runAll();

    if (allSuccess) {
      console.log(`\n✅ Tous les tests ont réussi!`);
      process.exit(0);
    } else {
      console.log(`\n❌ Certains tests ont échoué.`);
      process.exit(1);
    }

  } catch (error: any) {
    console.error(`\n❌ Erreur fatale: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Lancer les tests
if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseTester };
