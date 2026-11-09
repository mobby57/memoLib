#!/usr/bin/env tsx
/**
 * 🔧 Script d'optimisation et maintenance SQLite - Expert Level
 * 
 * Effectue:
 * - VACUUM pour récupérer l'espace disque
 * - ANALYZE pour optimiser le query planner
 * - INTEGRITY CHECK pour vérifier l'intégrité
 * - Backup automatique
 * - Statistiques de la base
 */

import 'dotenv/config';
import { prisma, prismaExtended } from '../src/lib/prisma';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';

async function optimizeDatabase() {
  console.log('\n🚀 Début de l\'optimisation de la base de données SQLite\n');

  try {
    // 1. Health Check
    console.log('📊 Health Check...');
    const health = await prismaExtended.$health();
    console.log(`   Status: ${health.status}`);
    
    if (health.status === 'unhealthy') {
      console.error('   ❌ La base de données n\'est pas accessible!');
      process.exit(1);
    }

    // 2. Statistiques avant optimisation
    console.log('\n📈 Statistiques avant optimisation:');
    const db = new Database(dbPath, { readonly: true });
    
    const pageCount = db.pragma('page_count', { simple: true }) as number;
    const pageSize = db.pragma('page_size', { simple: true }) as number;
    const freePages = db.pragma('freelist_count', { simple: true }) as number;
    
    const sizeBytes = pageCount * pageSize;
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    const wastedMB = ((freePages * pageSize) / (1024 * 1024)).toFixed(2);
    
    console.log(`   Taille totale: ${sizeMB} MB`);
    console.log(`   Pages libres: ${freePages} (${wastedMB} MB gaspillés)`);
    console.log(`   Mode journal: ${db.pragma('journal_mode', { simple: true })}`);
    
    db.close();

    // 3. Backup avant optimisation
    console.log('\n💾 Création d\'un backup...');
    const backupDir = path.join(process.cwd(), 'backups', 'database');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const backupPath = path.join(backupDir, `dev-backup-${timestamp}.db`);
    
    fs.copyFileSync(dbPath, backupPath);
    console.log(`   ✅ Backup créé: ${backupPath}`);

    // 4. Integrity Check
    console.log('\n🔍 Vérification de l\'intégrité...');
    const integrityResult = await prisma.$queryRaw<{ integrity_check: string }[]>`
      PRAGMA integrity_check
    `;
    
    if (integrityResult[0]?.integrity_check === 'ok') {
      console.log('   ✅ Intégrité: OK');
    } else {
      console.error('   ❌ Problèmes d\'intégrité détectés!');
      console.error(integrityResult);
      process.exit(1);
    }

    // 5. ANALYZE - Optimiser le query planner
    console.log('\n⚡ Exécution de ANALYZE...');
    await prisma.$executeRawUnsafe('ANALYZE');
    console.log('   ✅ ANALYZE terminé');

    // 6. VACUUM - Récupérer l'espace disque
    console.log('\n🧹 Exécution de VACUUM...');
    await prisma.$executeRawUnsafe('VACUUM');
    console.log('   ✅ VACUUM terminé');

    // 7. Statistiques après optimisation
    console.log('\n📊 Statistiques après optimisation:');
    const dbAfter = new Database(dbPath, { readonly: true });
    
    const pageCountAfter = dbAfter.pragma('page_count', { simple: true }) as number;
    const freePagesAfter = dbAfter.pragma('freelist_count', { simple: true }) as number;
    
    const sizeBytesAfter = pageCountAfter * pageSize;
    const sizeMBAfter = (sizeBytesAfter / (1024 * 1024)).toFixed(2);
    const wastedMBAfter = ((freePagesAfter * pageSize) / (1024 * 1024)).toFixed(2);
    
    console.log(`   Taille totale: ${sizeMBAfter} MB`);
    console.log(`   Pages libres: ${freePagesAfter} (${wastedMBAfter} MB gaspillés)`);
    
    const savedMB = (parseFloat(sizeMB) - parseFloat(sizeMBAfter)).toFixed(2);
    console.log(`   💾 Espace récupéré: ${savedMB} MB`);
    
    dbAfter.close();

    // 8. Métriques Prisma
    console.log('\n📈 Métriques Prisma:');
    const metrics = prismaExtended.$metrics();
    console.log(`   Total queries: ${metrics.totalQueries}`);
    console.log(`   Durée moyenne: ${metrics.averageDuration}ms`);
    console.log(`   Queries lentes (>100ms): ${metrics.slowQueries}`);

    console.log('\n✨ Optimisation terminée avec succès!\n');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'optimisation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  optimizeDatabase();
}

export { optimizeDatabase };
