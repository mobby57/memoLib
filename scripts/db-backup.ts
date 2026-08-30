#!/usr/bin/env tsx
/**
 * 💾 Backup automatique PostgreSQL via Docker
 *
 * - pg_dump 17 depuis le conteneur PostgreSQL
 * - Format custom
 * - Vérification du dump
 * - Rotation automatique : 10 derniers backups
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

const CONTAINER = 'memolib-db';
const DB_USER = 'postgres';
const DB_NAME = 'memolib';

function runSimpleCommand(
  command: string,
  args: string[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';

    child.stderr?.on('data', data => {
      stderr += data.toString();
    });

    child.on('error', reject);

    child.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `${command} a échoué avec le code ${code}\n${stderr.trim()}`,
          ),
        );
      }
    });
  });
}

function createDump(outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);

    const child = spawn('docker', [
      'exec',
      CONTAINER,
      'pg_dump',
      '-U',
      DB_USER,
      '-d',
      DB_NAME,
      '--format=custom',
      '--no-owner',
      '--no-privileges',
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';

    child.stderr?.on('data', data => {
      stderr += data.toString();
    });

    child.stdout?.pipe(output);

    child.on('error', error => {
      output.destroy();
      reject(error);
    });

    child.on('close', code => {
      output.close(() => {
        if (code === 0) {
          resolve();
        } else {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }

          reject(
            new Error(
              `pg_dump a échoué avec le code ${code}\n${stderr.trim()}`,
            ),
          );
        }
      });
    });
  });
}

function verifyDump(inputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(inputPath);

    const child = spawn(
      'docker',
      [
        'exec',
        '-i',
        CONTAINER,
        'pg_restore',
        '--list',
      ],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );

    let stderr = '';

    child.stderr?.on('data', data => {
      stderr += data.toString();
    });

    input.on('error', reject);

    child.on('error', reject);

    child.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `pg_restore --list a échoué avec le code ${code}\n${stderr.trim()}`,
          ),
        );
      }
    });

    input.pipe(child.stdin!);
  });
}

async function backupDatabase(): Promise<void> {
  console.log('\n💾 Backup de la base de données PostgreSQL\n');

  // --------------------------------------------------
  // 1. Vérification PostgreSQL
  // --------------------------------------------------

  console.log('🐘 Vérification de PostgreSQL...');

  await runSimpleCommand('docker', [
    'exec',
    CONTAINER,
    'pg_dump',
    '--version',
  ]);

  console.log('   ✅ pg_dump PostgreSQL 17 disponible');

  await runSimpleCommand('docker', [
    'exec',
    CONTAINER,
    'pg_isready',
    '-U',
    DB_USER,
    '-d',
    DB_NAME,
  ]);

  console.log('   ✅ PostgreSQL accessible');

  // --------------------------------------------------
  // 2. Dossier
  // --------------------------------------------------

  const backupDir = path.join(
    process.cwd(),
    'backups',
    'database',
  );

  fs.mkdirSync(backupDir, { recursive: true });

  // --------------------------------------------------
  // 3. Nom du fichier
  // --------------------------------------------------

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .substring(0, 19);

  const backupName = `postgres-backup-${timestamp}.dump`;
  const backupPath = path.join(backupDir, backupName);

  // --------------------------------------------------
  // 4. Création
  // --------------------------------------------------

  console.log('\n📦 Création du backup...');

  await createDump(backupPath);

  // --------------------------------------------------
  // 5. Vérification taille
  // --------------------------------------------------

  if (!fs.existsSync(backupPath)) {
    throw new Error('Le fichier de backup n’a pas été créé.');
  }

  const stats = fs.statSync(backupPath);

  if (stats.size === 0) {
    fs.unlinkSync(backupPath);
    throw new Error('Le fichier de backup est vide.');
  }

  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`   ✅ Backup créé : ${backupName}`);
  console.log(`   📊 Taille : ${sizeMB} MB`);

  // --------------------------------------------------
  // 6. Vérification pg_restore
  // --------------------------------------------------

  console.log('\n🔍 Vérification du dump...');

  await verifyDump(backupPath);

  console.log('   ✅ Dump PostgreSQL valide');

  // --------------------------------------------------
  // 7. Rotation
  // --------------------------------------------------

  console.log('\n🔄 Rotation des backups...');

  const maxBackups = 10;

  let backups = fs.readdirSync(backupDir)
    .filter(
      file =>
        file.startsWith('postgres-backup-') &&
        file.endsWith('.dump'),
    )
    .map(file => {
      const filePath = path.join(backupDir, file);
      const fileStats = fs.statSync(filePath);

      return {
        file,
        filePath,
        mtime: fileStats.mtime.getTime(),
        size: fileStats.size,
      };
    })
    .sort((a, b) => b.mtime - a.mtime);

  if (backups.length > maxBackups) {
    for (const backup of backups.slice(maxBackups)) {
      fs.unlinkSync(backup.filePath);
      console.log(`   🗑️  Supprimé : ${backup.file}`);
    }

    backups = backups.slice(0, maxBackups);
  }

  console.log(`   ℹ️  Backups conservés : ${backups.length}`);

  // --------------------------------------------------
  // 8. Liste
  // --------------------------------------------------

  console.log('\n📋 Backups disponibles :');

  backups.forEach((backup, index) => {
    const size = (backup.size / (1024 * 1024)).toFixed(2);
    const date = new Date(backup.mtime).toLocaleString('fr-FR');

    console.log(
      `   ${index + 1}. ${backup.file} - ${size} MB - ${date}`,
    );
  });

  console.log('\n✨ Backup PostgreSQL terminé avec succès !\n');
}

if (require.main === module) {
  backupDatabase().catch(error => {
    console.error('\n❌ Erreur lors du backup :');

    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(error);
    }

    process.exit(1);
  });
}

export { backupDatabase };
