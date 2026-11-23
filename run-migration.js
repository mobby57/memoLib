#!/usr/bin/env node
/**
 * Script pour exécuter la migration 20261117235600_fix_access_grant_schema
 * sur Neon via Prisma CLI
 */

const { exec } = require('child_process');
const path = require('path');

// Vérifier que DATABASE_URL est définie
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL env var not set!');
  console.error('Set it from .env.production first');
  process.exit(1);
}

console.log('🚀 Starting Prisma migration deployment...');
console.log(`📍 Database: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown'}`);
console.log('');

// Exécuter: prisma migrate deploy
exec('npx prisma migrate deploy', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Migration FAILED:');
    console.error(stderr || stdout);
    process.exit(1);
  }

  console.log('✅ Migration SUCCESS!');
  console.log(stdout);
  console.log('');
  console.log('🎉 Phase 1 (Database) completed!');
  console.log('');
  console.log('Next: Phase 2 (RGPD fix)');
  process.exit(0);
});
