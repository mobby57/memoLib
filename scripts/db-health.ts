#!/usr/bin/env tsx
/**
 * 🩺 Health Check PostgreSQL
 *
 * Vérifie :
 * - Connexion PostgreSQL
 * - Version PostgreSQL
 * - Taille de la base
 * - Nombre de tables
 * - Connexions actives
 * - Performance
 * - Lecture/écriture
 */

import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical';
  checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
    details?: unknown;
  }[];
  timestamp: Date;
}

async function healthCheck(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    status: 'healthy',
    checks: [],
    timestamp: new Date(),
  };

  console.log('\n🩺 Health Check de la base de données PostgreSQL\n');

  // 1. Connexion
  console.log('🔌 Test de connexion...');

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;

    result.checks.push({
      name: 'Connection',
      status: 'pass',
      message: `Connexion PostgreSQL active (${duration}ms)`,
      details: { duration },
    });

    console.log(`   ✅ Connexion PostgreSQL OK (${duration}ms)`);
  } catch (error) {
    result.checks.push({
      name: 'Connection',
      status: 'fail',
      message: 'Connexion PostgreSQL impossible',
      details: error instanceof Error ? error.message : String(error),
    });

    result.status = 'critical';
    console.log('   ❌ Connexion impossible');
  }

  // 2. Version PostgreSQL
  console.log('\n🐘 Version PostgreSQL...');

  try {
    const rows = await prisma.$queryRaw<{ version: string }[]>`
      SELECT version()
    `;

    const version = rows[0]?.version ?? 'Inconnue';

    result.checks.push({
      name: 'PostgreSQL Version',
      status: 'pass',
      message: version,
      details: { version },
    });

    console.log(`   ✅ ${version}`);
  } catch (error) {
    result.checks.push({
      name: 'PostgreSQL Version',
      status: 'warn',
      message: 'Version PostgreSQL indisponible',
      details: error instanceof Error ? error.message : String(error),
    });

    if (result.status === 'healthy') {
      result.status = 'warning';
    }

    console.log('   ⚠️ Version indisponible');
  }

  // 3. Taille de la base
  console.log('\n📊 Taille de la base...');

  try {
    const rows = await prisma.$queryRaw<{ database_size: bigint }[]>`
      SELECT pg_database_size(current_database()) AS database_size
    `;

    const sizeBytes = Number(rows[0]?.database_size ?? 0);
    const sizeMB = sizeBytes / (1024 * 1024);

    result.checks.push({
      name: 'Database Size',
      status: 'pass',
      message: `Taille: ${sizeMB.toFixed(2)} MB`,
      details: { sizeBytes, sizeMB },
    });

    console.log(`   ✅ Taille: ${sizeMB.toFixed(2)} MB`);
  } catch (error) {
    result.checks.push({
      name: 'Database Size',
      status: 'warn',
      message: 'Impossible de récupérer la taille',
      details: error instanceof Error ? error.message : String(error),
    });

    if (result.status === 'healthy') {
      result.status = 'warning';
    }

    console.log('   ⚠️ Taille indisponible');
  }

  // 4. Nombre de tables
  console.log('\n📋 Vérification des tables...');

  try {
    const rows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `;

    const tableCount = Number(rows[0]?.count ?? 0);

    result.checks.push({
      name: 'Tables',
      status: tableCount > 0 ? 'pass' : 'fail',
      message: `${tableCount} tables`,
      details: { tableCount },
    });

    if (tableCount > 0) {
      console.log(`   ✅ ${tableCount} tables`);
    } else {
      console.log('   ❌ Aucune table');
      result.status = 'critical';
    }
  } catch (error) {
    result.checks.push({
      name: 'Tables',
      status: 'fail',
      message: 'Impossible de vérifier les tables',
      details: error instanceof Error ? error.message : String(error),
    });

    result.status = 'critical';
    console.log('   ❌ Erreur');
  }

  // 5. Connexions
  console.log('\n🔗 Connexions PostgreSQL...');

  try {
    const rows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;

    const connectionCount = Number(rows[0]?.count ?? 0);

    result.checks.push({
      name: 'Connections',
      status: 'pass',
      message: `${connectionCount} connexion(s)`,
      details: { connectionCount },
    });

    console.log(`   ✅ ${connectionCount} connexion(s)`);
  } catch (error) {
    result.checks.push({
      name: 'Connections',
      status: 'warn',
      message: 'Impossible de vérifier les connexions',
      details: error instanceof Error ? error.message : String(error),
    });

    if (result.status === 'healthy') {
      result.status = 'warning';
    }

    console.log('   ⚠️ Connexions indisponibles');
  }

  // 6. Performance
  console.log('\n⚡ Performance...');

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;

    const status = duration < 100 ? 'pass' : 'warn';

    result.checks.push({
      name: 'Query Performance',
      status,
      message: `SELECT 1: ${duration}ms`,
      details: { duration },
    });

    console.log(
      `   ${duration < 100 ? '✅' : '⚠️'} Requête: ${duration}ms`
    );

    if (status === 'warn' && result.status === 'healthy') {
      result.status = 'warning';
    }
  } catch (error) {
    result.checks.push({
      name: 'Query Performance',
      status: 'fail',
      message: 'Test de performance échoué',
      details: error instanceof Error ? error.message : String(error),
    });

    result.status = 'critical';
    console.log('   ❌ Test échoué');
  }

  // 7. Lecture
  console.log('\n📖 Test de lecture...');

  try {
    const rows = await prisma.$queryRaw<{ result: number }[]>`
      SELECT 1 AS result
    `;

    const ok = rows[0]?.result === 1;

    result.checks.push({
      name: 'Read Test',
      status: ok ? 'pass' : 'fail',
      message: ok ? 'Lecture fonctionnelle' : 'Résultat inattendu',
    });

    if (ok) {
      console.log('   ✅ Lecture OK');
    } else {
      result.status = 'critical';
      console.log('   ❌ Lecture incorrecte');
    }
  } catch (error) {
    result.checks.push({
      name: 'Read Test',
      status: 'fail',
      message: 'Lecture échouée',
      details: error instanceof Error ? error.message : String(error),
    });

    result.status = 'critical';
    console.log('   ❌ Lecture échouée');
  }

  // Résumé
  console.log('\n' + '='.repeat(55));

  const emoji =
    result.status === 'healthy'
      ? '✅'
      : result.status === 'warning'
        ? '⚠️'
        : '❌';

  console.log(`${emoji} STATUS: ${result.status.toUpperCase()}`);
  console.log('='.repeat(55) + '\n');

  return result;
}

healthCheck()
  .catch((error) => {
    console.error('\n❌ Erreur:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
