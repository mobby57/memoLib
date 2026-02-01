/**
 * Automated Encrypted Backup System
 * - Daily database backups
 * - Document file backups
 * - Encrypted storage
 * - Retention policy (30 days)
 * - Point-in-time recovery
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { encryptFile, decryptFile } from './encryption'
import { createAuditLog } from './audit-trail'

const execAsync = promisify(exec)

interface BackupConfig {
  databaseUrl: string
  backupDir: string
  retentionDays: number
  encryptionEnabled: boolean
}

const DEFAULT_CONFIG: BackupConfig = {
  databaseUrl: process.env.DATABASE_URL || '',
  backupDir: process.env.BACKUP_DIR || './backups',
  retentionDays: 30,
  encryptionEnabled: true,
}

/**
 * Create database backup
 */
export async function createDatabaseBackup(
  config: Partial<BackupConfig> = {}
): Promise<string> {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFileName = `db-backup-${timestamp}.sql`
    const backupPath = path.join(cfg.backupDir, backupFileName)

    // Ensure backup directory exists
    await fs.mkdir(cfg.backupDir, { recursive: true })

    // PostgreSQL backup command
    const pgDumpCommand = `pg_dump "${cfg.databaseUrl}" > "${backupPath}"`
    
    console.log('[Backup] Creating database backup...')
    await execAsync(pgDumpCommand)

    // Encrypt backup if enabled
    if (cfg.encryptionEnabled) {
      const fileContent = await fs.readFile(backupPath)
      const encrypted = await encryptFile(fileContent)
      
      const encryptedPath = `${backupPath}.enc`
      await fs.writeFile(encryptedPath, encrypted)
      
      // Delete unencrypted backup
      await fs.unlink(backupPath)
      
      console.log('[Backup] Database backup encrypted:', encryptedPath)
      
      await createAuditLog({
        userId: 'SYSTEM',
        action: 'CREATE',
        resource: 'SYSTEM',
        description: `Encrypted database backup created: ${encryptedPath}`,
        success: true,
        metadata: { size: encrypted.length },
      })

      return encryptedPath
    }

    console.log('[Backup] Database backup created:', backupPath)
    
    await createAuditLog({
      userId: 'SYSTEM',
      action: 'CREATE',
      resource: 'SYSTEM',
      description: `Database backup created: ${backupPath}`,
      success: true,
    })

    return backupPath
  } catch (error) {
    console.error('[Backup] Failed to create database backup:', error)
    
    await createAuditLog({
      userId: 'SYSTEM',
      action: 'CREATE',
      resource: 'SYSTEM',
      description: 'Database backup failed',
      success: false,
      metadata: { error: (error as Error).message },
    })
    
    throw error
  }
}

/**
 * Restore database from backup
 */
export async function restoreDatabaseBackup(
  backupPath: string,
  config: Partial<BackupConfig> = {}
): Promise<void> {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  try {
    let sqlFilePath = backupPath

    // Decrypt if encrypted
    if (backupPath.endsWith('.enc')) {
      const encryptedContent = await fs.readFile(backupPath)
      const decrypted = await decryptFile(encryptedContent)
      
      sqlFilePath = backupPath.replace('.enc', '')
      await fs.writeFile(sqlFilePath, decrypted)
    }

    console.log('[Backup] Restoring database from:', sqlFilePath)
    
    // PostgreSQL restore command
    const psqlCommand = `psql "${cfg.databaseUrl}" < "${sqlFilePath}"`
    await execAsync(psqlCommand)

    // Clean up decrypted file if it was encrypted
    if (backupPath.endsWith('.enc')) {
      await fs.unlink(sqlFilePath)
    }

    console.log('[Backup] Database restored successfully')
    
    await createAuditLog({
      userId: 'SYSTEM',
      action: 'UPDATE',
      resource: 'SYSTEM',
      description: `Database restored from backup: ${backupPath}`,
      success: true,
      sensitiveData: true,
    })
  } catch (error) {
    console.error('[Backup] Failed to restore database:', error)
    
    await createAuditLog({
      userId: 'SYSTEM',
      action: 'UPDATE',
      resource: 'SYSTEM',
      description: 'Database restore failed',
      success: false,
      metadata: { error: (error as Error).message },
    })
    
    throw error
  }
}

/**
 * Clean up old backups based on retention policy
 */
export async function cleanupOldBackups(
  config: Partial<BackupConfig> = {}
): Promise<number> {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  try {
    const files = await fs.readdir(cfg.backupDir)
    const backupFiles = files.filter(f => f.startsWith('db-backup-'))
    
    const now = Date.now()
    const retentionMs = cfg.retentionDays * 24 * 60 * 60 * 1000
    
    let deletedCount = 0

    for (const file of backupFiles) {
      const filePath = path.join(cfg.backupDir, file)
      const stats = await fs.stat(filePath)
      
      const age = now - stats.mtimeMs
      
      if (age > retentionMs) {
        await fs.unlink(filePath)
        console.log('[Backup] Deleted old backup:', file)
        deletedCount++
      }
    }

    if (deletedCount > 0) {
      await createAuditLog({
        userId: 'SYSTEM',
        action: 'DELETE',
        resource: 'SYSTEM',
        description: `Cleaned up ${deletedCount} old backup(s)`,
        success: true,
      })
    }

    return deletedCount
  } catch (error) {
    console.error('[Backup] Cleanup failed:', error)
    return 0
  }
}

/**
 * List available backups
 */
export async function listBackups(
  config: Partial<BackupConfig> = {}
): Promise<Array<{ file: string; size: number; created: Date; encrypted: boolean }>> {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  try {
    const files = await fs.readdir(cfg.backupDir)
    const backupFiles = files.filter(f => f.startsWith('db-backup-'))
    
    const backups = await Promise.all(
      backupFiles.map(async (file) => {
        const filePath = path.join(cfg.backupDir, file)
        const stats = await fs.stat(filePath)
        
        return {
          file,
          size: stats.size,
          created: stats.mtime,
          encrypted: file.endsWith('.enc'),
        }
      })
    )

    return backups.sort((a, b) => b.created.getTime() - a.created.getTime())
  } catch (error) {
    console.error('[Backup] Failed to list backups:', error)
    return []
  }
}

/**
 * Schedule automatic daily backups
 */
export function scheduleAutomaticBackups(
  hour: number = 2, // 2 AM by default
  config: Partial<BackupConfig> = {}
) {
  const runBackup = async () => {
    try {
      console.log('[Backup] Starting scheduled backup...')
      await createDatabaseBackup(config)
      await cleanupOldBackups(config)
      console.log('[Backup] Scheduled backup completed')
    } catch (error) {
      console.error('[Backup] Scheduled backup failed:', error)
    }
  }

  // Calculate milliseconds until next scheduled time
  const now = new Date()
  const scheduledTime = new Date()
  scheduledTime.setHours(hour, 0, 0, 0)
  
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1)
  }

  const msUntilNext = scheduledTime.getTime() - now.getTime()

  // Schedule first backup
  setTimeout(() => {
    runBackup()
    // Then run every 24 hours
    setInterval(runBackup, 24 * 60 * 60 * 1000)
  }, msUntilNext)

  console.log('[Backup] Automatic backups scheduled for', hour, ':00 daily')
}
