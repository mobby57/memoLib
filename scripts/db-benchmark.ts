#!/usr/bin/env tsx
/**
 * 🧪 Tests de performance Prisma - Expert Level
 * 
 * Teste:
 * - Temps de réponse des queries courantes
 * - Performance avec grandes datasets
 * - Efficacité des index
 * - Impact du cache
 */

import 'dotenv/config';
import { prisma, prismaExtended, resetMetrics } from '../src/lib/prisma';
import { performance } from 'perf_hooks';

interface BenchmarkResult {
  name: string;
  duration: number;
  queriesCount: number;
  avgQueryTime: number;
  status: 'fast' | 'ok' | 'slow';
}

const results: BenchmarkResult[] = [];

async function benchmark(name: string, fn: () => Promise<any>): Promise<BenchmarkResult> {
  console.log(`\n⏱️  Benchmark: ${name}`);
  
  // Reset metrics
  resetMetrics();
  
  const start = performance.now();
  await fn();
  const end = performance.now();
  
  const duration = Math.round(end - start);
  const metrics = prismaExtended.$metrics();
  const avgQueryTime = metrics.averageDuration;
  
  const status: 'fast' | 'ok' | 'slow' = 
    duration < 100 ? 'fast' : 
    duration < 500 ? 'ok' : 'slow';
  
  const emoji = status === 'fast' ? '🚀' : status === 'ok' ? '✅' : '⚠️';
  console.log(`   ${emoji} Durée: ${duration}ms (${metrics.totalQueries} queries, avg: ${avgQueryTime}ms)`);
  
  const result: BenchmarkResult = {
    name,
    duration,
    queriesCount: metrics.totalQueries,
    avgQueryTime,
    status,
  };
  
  results.push(result);
  return result;
}

async function runPerformanceTests() {
  console.log('\n🧪 Tests de Performance Prisma SQLite\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Connexion et première query
    await benchmark('Connexion initiale', async () => {
      await prisma.$queryRaw`SELECT 1`;
    });

    // Test 2: Count sur une table
    await benchmark('Count Users', async () => {
      await prisma.user.count();
    });

    // Test 3: FindMany simple
    await benchmark('FindMany Users (limit 10)', async () => {
      await prisma.user.findMany({ take: 10 });
    });

    // Test 4: FindMany avec relations
    await benchmark('FindMany Users avec Tenant', async () => {
      await prisma.user.findMany({
        take: 10,
        include: {
          tenant: true,
        },
      });
    });

    // Test 5: Query complexe avec where
    await benchmark('Query complexe avec filtres', async () => {
      await prisma.dossier.findMany({
        where: {
          status: 'OUVERT',
        },
        include: {
          client: true,
          tenant: true,
        },
        take: 20,
      });
    });

    // Test 6: Aggregations
    await benchmark('Aggregations sur Dossiers', async () => {
      await prisma.dossier.aggregate({
        _count: true,
        _avg: {
          id: true,
        },
      });
    });

    // Test 7: Transactions
    await benchmark('Transaction simple', async () => {
      await prisma.$transaction([
        prisma.user.count(),
        prisma.tenant.count(),
        prisma.dossier.count(),
      ]);
    });

    // Test 8: Raw SQL
    await benchmark('Raw SQL SELECT', async () => {
      await prisma.$queryRaw`
        SELECT COUNT(*) as total 
        FROM User 
        WHERE deletedAt IS NULL
      `;
    });

    // Test 9: Health check
    await benchmark('Health Check', async () => {
      await prismaExtended.$health();
    });

    // Test 10: Multiple queries en parallèle
    await benchmark('10 queries en parallèle', async () => {
      await Promise.all([
        prisma.user.count(),
        prisma.tenant.count(),
        prisma.dossier.count(),
        prisma.client.count(),
        prisma.facture.count(),
        prisma.user.findFirst(),
        prisma.tenant.findFirst(),
        prisma.dossier.findFirst(),
        prisma.client.findFirst(),
        prisma.facture.findFirst(),
      ]);
    });

    // Résumé des résultats
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RÉSUMÉ DES PERFORMANCES\n');
    
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = Math.round(totalDuration / results.length);
    const fastCount = results.filter(r => r.status === 'fast').length;
    const okCount = results.filter(r => r.status === 'ok').length;
    const slowCount = results.filter(r => r.status === 'slow').length;
    
    console.log(`Total tests: ${results.length}`);
    console.log(`Durée totale: ${totalDuration}ms`);
    console.log(`Durée moyenne: ${avgDuration}ms`);
    console.log(`\n🚀 Fast (<100ms): ${fastCount}`);
    console.log(`✅ OK (100-500ms): ${okCount}`);
    console.log(`⚠️  Slow (>500ms): ${slowCount}`);
    
    // Tests les plus lents
    if (slowCount > 0) {
      console.log('\n⚠️  Tests les plus lents:');
      results
        .filter(r => r.status === 'slow')
        .sort((a, b) => b.duration - a.duration)
        .forEach(r => {
          console.log(`   ${r.name}: ${r.duration}ms`);
        });
    }
    
    // Recommandations
    console.log('\n💡 Recommandations:');
    if (slowCount > 3) {
      console.log('   ⚠️  Plusieurs queries lentes détectées');
      console.log('   → Exécuter ANALYZE et VACUUM: npm run db:optimize');
      console.log('   → Vérifier les index sur les colonnes fréquemment filtrées');
    } else if (avgDuration > 200) {
      console.log('   ⚠️  Durée moyenne élevée');
      console.log('   → Considérer l\'ajout d\'index');
      console.log('   → Optimiser les requêtes avec include');
    } else {
      console.log('   ✅ Performances excellentes!');
      console.log('   → Aucune action nécessaire');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  runPerformanceTests();
}

export { runPerformanceTests };
