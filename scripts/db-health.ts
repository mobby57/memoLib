#!/usr/bin/env tsx
/**
 * 🩺 Health Check de la base de données - Expert Level
 * 
 * Vérifie:
 * - Connexion à la base de données
 * - Intégrité des données
 * - Performance des queries
 * - Taille et fragmentation
 * - État du WAL
 */

import 'dotenv/config';
import { prisma, prismaExtended } from '../src/lib/prisma';
import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical';
  checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
    details?: any;
  }[];
  timestamp: Date;
}

async function healthCheck(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    status: 'healthy',
    checks: [],
    timestamp: new Date(),
  };

  console.log('\n🩺 Health Check de la base de données SQLite\n');

  try {
    // 1. Test de connexion
    console.log('🔌 Test de connexion...');
    try {
      const health = await prismaExtended.$health();
      result.checks.push({
        name: 'Connection',
        status: health.status === 'healthy' ? 'pass' : 'fail',
        message: health.status === 'healthy' ? 'Connexion active' : 'Connexion impossible',
        details: health,
      });
      console.log(`   ✅ Connexion: ${health.status}`);
    } catch (error) {
      result.checks.push({
        name: 'Connection',
        status: 'fail',
        message: 'Erreur de connexion',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
      result.status = 'critical';
      console.log('   ❌ Connexion impossible');
    }

    // 2. Intégrité de la base
    console.log('\n🔍 Vérification d\'intégrité...');
    try {
      const integrity = await prisma.$queryRaw<{ integrity_check: string }[]>`
        PRAGMA integrity_check
      `;
      const isOk = integrity[0]?.integrity_check === 'ok';
      result.checks.push({
        name: 'Integrity',
        status: isOk ? 'pass' : 'fail',
        message: isOk ? 'Intégrité OK' : 'Problèmes détectés',
        details: integrity,
      });
      console.log(`   ${isOk ? '✅' : '❌'} Intégrité: ${isOk ? 'OK' : 'ERREUR'}`);
      if (!isOk) result.status = 'critical';
    } catch (error) {
      result.checks.push({
        name: 'Integrity',
        status: 'fail',
        message: 'Impossible de vérifier l\'intégrité',
      });
      result.status = 'critical';
      console.log('   ❌ Erreur lors de la vérification');
    }

    // 3. Statistiques de taille
    console.log('\n📊 Statistiques de taille...');
    const db = new Database(dbPath, { readonly: true });
    
    const pageCount = db.pragma('page_count', { simple: true }) as number;
    const pageSize = db.pragma('page_size', { simple: true }) as number;
    const freePages = db.pragma('freelist_count', { simple: true }) as number;
    
    const sizeBytes = pageCount * pageSize;
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    const wastedMB = ((freePages * pageSize) / (1024 * 1024)).toFixed(2);
    const wastedPercent = ((freePages / pageCount) * 100).toFixed(2);
    
    const needsVacuum = parseFloat(wastedPercent) > 20;
    
    result.checks.push({
      name: 'Database Size',
      status: needsVacuum ? 'warn' : 'pass',
      message: `Taille: ${sizeMB} MB, ${wastedPercent}% fragmenté`,
      details: { sizeMB, wastedMB, wastedPercent, needsVacuum },
    });
    
    console.log(`   Taille totale: ${sizeMB} MB`);
    console.log(`   Fragmentation: ${wastedPercent}% (${wastedMB} MB)`);
    console.log(`   ${needsVacuum ? '⚠️  VACUUM recommandé' : '✅ Fragmentation acceptable'}`);
    
    if (needsVacuum && result.status === 'healthy') result.status = 'warning';
    
    db.close();

    // 4. Mode WAL
    console.log('\n📝 Configuration SQLite...');
    const dbConfig = new Database(dbPath, { readonly: true });
    
    const journalMode = dbConfig.pragma('journal_mode', { simple: true });
    const syncMode = dbConfig.pragma('synchronous', { simple: true });
    const cacheSize = dbConfig.pragma('cache_size', { simple: true });
    
    result.checks.push({
      name: 'SQLite Configuration',
      status: journalMode === 'wal' ? 'pass' : 'warn',
      message: `Journal: ${journalMode}, Sync: ${syncMode}, Cache: ${cacheSize}`,
      details: { journalMode, syncMode, cacheSize },
    });
    
    console.log(`   Journal mode: ${journalMode} ${journalMode === 'wal' ? '✅' : '⚠️'}`);
    console.log(`   Synchronous: ${syncMode}`);
    console.log(`   Cache size: ${cacheSize} pages`);
    
    dbConfig.close();

    // 5. Performance metrics
    console.log('\n⚡ Métriques de performance...');
    const metrics = prismaExtended.$metrics();
    
    const hasSlowQueries = metrics.slowQueries > 0;
    const avgDurationOk = metrics.averageDuration < 100;
    
    result.checks.push({
      name: 'Query Performance',
      status: !avgDurationOk || hasSlowQueries ? 'warn' : 'pass',
      message: `Moyenne: ${metrics.averageDuration}ms, Lentes: ${metrics.slowQueries}`,
      details: metrics,
    });
    
    console.log(`   Total queries: ${metrics.totalQueries}`);
    console.log(`   Durée moyenne: ${metrics.averageDuration}ms ${avgDurationOk ? '✅' : '⚠️'}`);
    console.log(`   Queries lentes: ${metrics.slowQueries} ${hasSlowQueries ? '⚠️' : '✅'}`);
    
    if (!avgDurationOk && result.status === 'healthy') result.status = 'warning';

    // 6. Test de lecture/écriture
    console.log('\n📝 Test de lecture/écriture...');
    try {
      await prisma.$queryRaw`SELECT 1`;
      result.checks.push({
        name: 'Read/Write Test',
        status: 'pass',
        message: 'Lecture/écriture fonctionnelle',
      });
      console.log('   ✅ Lecture/écriture OK');
    } catch (error) {
      result.checks.push({
        name: 'Read/Write Test',
        status: 'fail',
        message: 'Erreur lors du test',
      });
      result.status = 'critical';
      console.log('   ❌ Erreur de lecture/écriture');
    }

    // Résumé final
    console.log('\n' + '='.repeat(50));
    const statusEmoji = result.status === 'healthy' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${statusEmoji} Status global: ${result.status.toUpperCase()}`);
    console.log('='.repeat(50) + '\n');

    return result;

  } catch (error) {
    console.error('\n❌ Erreur lors du health check:', error);
    result.status = 'critical';
    result.checks.push({
      name: 'Health Check',
      status: 'fail',
      message: 'Erreur fatale',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
    return result;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  healthCheck().then((result) => {
    process.exit(result.status === 'critical' ? 1 : 0);
  });
}

export { healthCheck };
