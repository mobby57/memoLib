#!/usr/bin/env node

/**
 * Script de réinitialisation de la base de données
 * IA Poste Manager - Reset DB
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Réinitialisation de la base de données...');

try {
  // 1. Supprimer l'ancienne base de données
  const dbPath = path.join(__dirname, '../prisma/dev.db');
  const dbJournalPath = path.join(__dirname, '../prisma/dev.db-journal');
  
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✅ Ancienne base supprimée');
  }
  
  if (fs.existsSync(dbJournalPath)) {
    fs.unlinkSync(dbJournalPath);
    console.log('✅ Journal supprimé');
  }

  // 2. Supprimer le dossier migrations
  const migrationsPath = path.join(__dirname, '../prisma/migrations');
  if (fs.existsSync(migrationsPath)) {
    fs.rmSync(migrationsPath, { recursive: true, force: true });
    console.log('✅ Migrations supprimées');
  }

  // 3. Pousser le schéma vers la nouvelle base
  console.log('📦 Création de la nouvelle base...');
  execSync('npx prisma db push --force-reset', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  // 4. Générer le client Prisma
  console.log('🔧 Génération du client Prisma...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  // 5. Seeder les données
  console.log('🌱 Insertion des données de test...');
  execSync('npx tsx prisma/seed.ts', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('🎉 Base de données réinitialisée avec succès !');
  
} catch (error) {
  console.error('❌ Erreur lors de la réinitialisation :', error.message);
  process.exit(1);
}