/**
 * Automated encrypted backup system.
 *
 * Backups are written encrypted only. Restores are deliberately opt-in because
 * they modify the target database.
 */

import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { decryptFile, encryptFile } from './encryption';
import { createAuditLog } from './audit-trail';

const execFileAsync = promisify(execFile);

interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  retentionDays: number;
  encryptionEnabled: boolean;
  allowRestore: boolean;
}

const DEFAULT_CONFIG: BackupConfig = {
  databaseUrl: process.env.DATABASE_URL || '',
  backupDir: process.env.BACKUP_DIR || './backups',
  retentionDays: 30,
  encryptionEnabled: true,
  allowRestore: false,
};

function getConfig(config: Partial<BackupConfig>): BackupConfig {
  const resolved = { ...DEFAULT_CONFIG, ...config };
  if (!resolved.databaseUrl) {
    throw new Error('DATABASE_URL is required for database backup operations');
  }
  if (!resolved.encryptionEnabled) {
    throw new Error('Unencrypted database backups are not supported');
  }
  return resolved;
}

function getBackupDirectory(backupDir: string): string {
  return path.resolve(backupDir);
}

function resolveBackupPath(backupDir: string, backupPath: string): string {
  const resolvedDirectory = getBackupDirectory(backupDir);
  const resolvedBackup = path.resolve(backupPath);
  const directoryPrefix = `${resolvedDirectory}${path.sep}`;

  if (!resolvedBackup.startsWith(directoryPrefix)) {
    throw new Error('Backup path must be inside BACKUP_DIR');
  }
  if (!resolvedBackup.endsWith('.enc')) {
    throw new Error('Only encrypted backup files may be restored');
  }

  return resolvedBackup;
}

async function restoreWithPsql(databaseUrl: string, sql: Buffer): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const process = spawn(
      'psql',
      ['--set', 'ON_ERROR_STOP=1', '--single-transaction', databaseUrl],
      { stdio: ['pipe', 'ignore', 'pipe'] }
    );
    process.stderr.resume();
    process.once('error', () => reject(new Error('Unable to start psql restore process')));
    process.once('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Database restore failed (psql exit code ${code ?? 'unknown'})`));
      }
    });
    process.stdin.end(sql);
  });
}

/**
 * Create an encrypted database backup without placing cleartext on disk.
 */
export async function createDatabaseBackup(
  config: Partial<BackupConfig> = {}
): Promise<string> {
  const cfg = getConfig(config);
  const backupDir = getBackupDirectory(cfg.backupDir);

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `db-backup-${timestamp}.sql.enc`);

    await fs.mkdir(backupDir, { recursive: true, mode: 0o700 });
    const { stdout } = await execFileAsync(
      'pg_dump',
      ['--no-owner', '--no-privileges', cfg.databaseUrl],
      { encoding: 'buffer', maxBuffer: 512 * 1024 * 1024 }
    );
    const encrypted = await encryptFile(Buffer.from(stdout));
    await fs.writeFile(backupPath, encrypted, { mode: 0o600 });

    await createAuditLog({
      userId: 'SYSTEM',
      action: 'CREATE',
      resource: 'SYSTEM',
      description: 'Encrypted database backup created',
      success: true,
      metadata: { size: encrypted.length },
    });

    return backupPath;
  } catch (error) {
    await createAuditLog({
      userId: 'SYSTEM',
      action: 'CREATE',
      resource: 'SYSTEM',
      description: 'Database backup failed',
      success: false,
      metadata: { error: error instanceof Error ? error.message : 'Unknown backup error' },
    });
    throw error;
  }
}

/**
 * Restore an encrypted backup only after an explicit caller confirmation.
 * The SQL exists in memory only and psql aborts the transaction on SQL errors.
 */
export async function restoreDatabaseBackup(
  backupPath: string,
  config: Partial<BackupConfig> = {}
): Promise<void> {
  const cfg = getConfig(config);
  if (!cfg.allowRestore) {
    throw new Error('Database restore requires allowRestore: true');
  }

  try {
    const encryptedPath = resolveBackupPath(cfg.backupDir, backupPath);
    const decrypted = await decryptFile(await fs.readFile(encryptedPath));
    await restoreWithPsql(cfg.databaseUrl, decrypted);

    await createAuditLog({
      userId: 'SYSTEM',
      action: 'UPDATE',
      resource: 'SYSTEM',
      description: 'Database restored from encrypted backup',
      success: true,
      sensitiveData: true,
    });
  } catch (error) {
    await createAuditLog({
      userId: 'SYSTEM',
      action: 'UPDATE',
      resource: 'SYSTEM',
      description: 'Database restore failed',
      success: false,
      metadata: { error: error instanceof Error ? error.message : 'Unknown restore error' },
    });
    throw error;
  }
}

/**
 * Clean up encrypted backups older than the retention policy.
 */
export async function cleanupOldBackups(
  config: Partial<BackupConfig> = {}
): Promise<number> {
  const cfg = getConfig(config);
  const backupDir = getBackupDirectory(cfg.backupDir);

  try {
    const files = await fs.readdir(backupDir);
    const backupFiles = files.filter(file => file.startsWith('db-backup-') && file.endsWith('.enc'));
    const retentionMs = cfg.retentionDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of backupFiles) {
      const filePath = path.join(backupDir, file);
      const age = Date.now() - (await fs.stat(filePath)).mtimeMs;
      if (age > retentionMs) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      await createAuditLog({
        userId: 'SYSTEM',
        action: 'DELETE',
        resource: 'SYSTEM',
        description: `Cleaned up ${deletedCount} expired encrypted backup(s)`,
        success: true,
      });
    }

    return deletedCount;
  } catch (error) {
    await createAuditLog({
      userId: 'SYSTEM',
      action: 'DELETE',
      resource: 'SYSTEM',
      description: 'Database backup cleanup failed',
      success: false,
      metadata: { error: error instanceof Error ? error.message : 'Unknown backup cleanup error' },
    });
    return 0;
  }
}

export async function listBackups(
  config: Partial<BackupConfig> = {}
): Promise<Array<{ file: string; size: number; created: Date; encrypted: true }>> {
  const cfg = getConfig(config);
  const backupDir = getBackupDirectory(cfg.backupDir);

  try {
    const files = await fs.readdir(backupDir);
    const backups = await Promise.all(
      files
        .filter(file => file.startsWith('db-backup-') && file.endsWith('.enc'))
        .map(async file => {
          const stats = await fs.stat(path.join(backupDir, file));
          return { file, size: stats.size, created: stats.mtime, encrypted: true as const };
        })
    );
    return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
  } catch {
    return [];
  }
}

export function scheduleAutomaticBackups(
  hour = 2,
  config: Partial<BackupConfig> = {}
): void {
  const runBackup = async () => {
    await createDatabaseBackup(config);
    await cleanupOldBackups(config);
  };
  const scheduledTime = new Date();
  scheduledTime.setHours(hour, 0, 0, 0);
  if (scheduledTime <= new Date()) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  setTimeout(() => {
    void runBackup();
    setInterval(() => void runBackup(), 24 * 60 * 60 * 1000);
  }, scheduledTime.getTime() - Date.now());
}
