#!/usr/bin/env node
/**
 * Script de démarrage avec migrations Prisma pour Fly.io
 * Exécute les migrations avant de démarrer le serveur Next.js
 */

const { execSync } = require('child_process');

console.log('🚀 Starting application with database migrations...');

try {
  // Run Prisma migrations
  console.log('📦 Running Prisma database migrations...');
  execSync('./node_modules/.bin/prisma migrate deploy', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Migrations completed successfully');
} catch (error) {
  console.error('⚠️  Migration failed:', error.message);
  console.log('⚠️  Continuing anyway - the app might not work correctly');
}

try {
  // Generate Prisma client (ensure it's up to date)
  console.log('🔧 Generating Prisma client...');
  execSync('./node_modules/.bin/prisma generate', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Prisma client generated successfully');
} catch (error) {
  console.error('⚠️  Client generation failed:', error.message);
  console.log('⚠️  Continuing anyway');
}

// Start Next.js server
console.log('✅ Starting Next.js production server...');
try {
  require('./server.js');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}
