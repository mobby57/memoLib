#!/usr/bin/env tsx
/**
 * 💾 Backup automatique de la base de données - Expert Level
 * 
 * Crée des backups compressés avec:
 * - Horodatage
 * - Rotation automatique (garde les 10 derniers)
 * - Vérification d'intégrité avant backup
 * - Support de compression
 */

import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';

async function backupDatabase() {
  console.log('\n💾 Backup de la base de données SQLite\n');

  try {
    // 1. Vérifier l'intégrité avant backup
    console.log('🔍 Vérification d\'intégrité...');
    const integrity = await prisma.$queryRaw<{ integrity_check: string }[]>`
      PRAGMA integrity_check
    `;
    
    if (integrity[0]?.integrity_check !== 'ok') {
      console.error('❌ Base de données corrompue! Backup annulé.');
      console.error(integrity);
      process.exit(1);
    }
    console.log('   ✅ Intégrité OK');

    // 2. Créer le dossier de backup
    const backupDir = path.join(process.cwd(), 'backups', 'database');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 3. Créer le backup avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const backupName = `dev-backup-${timestamp}.db`;
    const backupPath = path.join(backupDir, backupName);

    console.log('\n📦 Création du backup...');
    fs.copyFileSync(dbPath, backupPath);
    
    const stats = fs.statSync(backupPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`   ✅ Backup créé: ${backupName}`);
    console.log(`   📊 Taille: ${sizeMB} MB`);

    // 4. Rotation des backups (garder les 10 derniers)
    console.log('\n🔄 Rotation des backups...');
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('dev-backup-') && f.endsWith('.db'))
      .sort()
      .reverse();

    const maxBackups = 10;
    if (backups.length > maxBackups) {
      const toDelete = backups.slice(maxBackups);
      toDelete.forEach(file => {
        const filePath = path.join(backupDir, file);
        fs.unlinkSync(filePath);
        console.log(`   🗑️  Supprimé: ${file}`);
      });
    }

    console.log(`   ℹ️  Backups conservés: ${Math.min(backups.length, maxBackups)}`);

    // 5. Liste des backups disponibles
    console.log('\n📋 Backups disponibles:');
    backups.slice(0, maxBackups).forEach((file, index) => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      const date = new Date(stats.mtime).toLocaleString('fr-FR');
      console.log(`   ${index + 1}. ${file} - ${sizeMB} MB - ${date}`);
    });

    console.log('\n✨ Backup terminé avec succès!\n');

  } catch (error) {
    console.error('\n❌ Erreur lors du backup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  backupDatabase();
}

export { backupDatabase };
