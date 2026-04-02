/** @jest-environment node */

import path from 'path';

var mockExecAsync;

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

jest.mock('util', () => {
  const actual = jest.requireActual('util');
  mockExecAsync = jest.fn();
  return {
    ...actual,
    promisify: jest.fn(() => mockExecAsync),
  };
});

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  unlink: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
}));

jest.mock('@/lib/security/encryption', () => ({
  encryptFile: jest.fn(),
  decryptFile: jest.fn(),
}));

jest.mock('@/lib/security/audit-trail', () => ({
  createAuditLog: jest.fn(),
}));

import fs from 'fs/promises';
import {
  createDatabaseBackup,
  restoreDatabaseBackup,
  cleanupOldBackups,
  listBackups,
} from '@/lib/security/backup-system';
import { encryptFile, decryptFile } from '@/lib/security/encryption';
import { createAuditLog } from '@/lib/security/audit-trail';

describe('backup-system', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-31T10:20:30.123Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates an encrypted database backup', async () => {
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('sql-dump'));
    (encryptFile as jest.Mock).mockResolvedValue(Buffer.from('encrypted-dump'));
    (createAuditLog as jest.Mock).mockResolvedValue({});
    mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

    const backupPath = await createDatabaseBackup({
      backupDir: '/tmp/backups',
      databaseUrl: 'postgres://db',
      encryptionEnabled: true,
    });

    expect(backupPath).toContain(path.normalize('/tmp/backups/db-backup-2026-03-31T10-20-30-123Z.sql.enc'));
    expect(fs.mkdir).toHaveBeenCalledWith(
      expect.stringMatching(/[\\/]tmp[\\/]backups$/),
      { recursive: true }
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('.sql.enc'),
      Buffer.from('encrypted-dump')
    );
    expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('.sql'));
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        success: true,
      })
    );
  });

  it('creates a plain backup when encryption is disabled', async () => {
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (createAuditLog as jest.Mock).mockResolvedValue({});
    mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

    const backupPath = await createDatabaseBackup({
      backupDir: '/tmp/backups',
      databaseUrl: 'postgres://db',
      encryptionEnabled: false,
    });

    expect(backupPath).toContain(path.normalize('/tmp/backups/db-backup-2026-03-31T10-20-30-123Z.sql'));
    expect(fs.readFile).not.toHaveBeenCalled();
    expect(encryptFile).not.toHaveBeenCalled();
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        success: true,
      })
    );
  });

  it('logs and rethrows when backup creation fails', async () => {
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (createAuditLog as jest.Mock).mockResolvedValue({});
    mockExecAsync.mockRejectedValue(new Error('pg_dump failed'));

    await expect(
      createDatabaseBackup({ backupDir: '/tmp/backups', databaseUrl: 'postgres://db' })
    ).rejects.toThrow('pg_dump failed');

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        success: false,
      })
    );
  });

  it('restores an encrypted backup and removes temporary sql file', async () => {
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('enc'));
    (decryptFile as jest.Mock).mockResolvedValue(Buffer.from('decrypted sql'));
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
    (createAuditLog as jest.Mock).mockResolvedValue({});
    mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

    await restoreDatabaseBackup('/tmp/backups/db-backup.sql.enc', {
      databaseUrl: 'postgres://db',
    });

    expect(decryptFile).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/tmp/backups/db-backup.sql',
      Buffer.from('decrypted sql')
    );
    expect(fs.unlink).toHaveBeenCalledWith('/tmp/backups/db-backup.sql');
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE',
        success: true,
        sensitiveData: true,
      })
    );
  });

  it('deletes only backups older than retention and logs cleanup', async () => {
    (fs.readdir as jest.Mock).mockResolvedValue([
      'db-backup-old.sql',
      'db-backup-new.sql',
      'notes.txt',
    ]);

    const now = Date.now();
    (fs.stat as jest.Mock).mockImplementation(async (filePath: string) => {
      if (filePath.includes('old')) {
        return { mtimeMs: now - 40 * 24 * 60 * 60 * 1000 };
      }
      return { mtimeMs: now - 2 * 24 * 60 * 60 * 1000 };
    });

    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
    (createAuditLog as jest.Mock).mockResolvedValue({});

    const deleted = await cleanupOldBackups({
      backupDir: '/tmp/backups',
      retentionDays: 30,
    });

    expect(deleted).toBe(1);
    expect(fs.unlink).toHaveBeenCalledWith(path.normalize('/tmp/backups/db-backup-old.sql'));
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DELETE',
        success: true,
      })
    );
  });

  it('lists backups sorted by most recent first', async () => {
    (fs.readdir as jest.Mock).mockResolvedValue(['db-backup-a.sql.enc', 'db-backup-b.sql']);
    (fs.stat as jest.Mock).mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('a.sql.enc')) {
        return {
          size: 10,
          mtime: new Date('2026-03-31T12:00:00.000Z'),
        };
      }
      return {
        size: 20,
        mtime: new Date('2026-03-30T12:00:00.000Z'),
      };
    });

    const backups = await listBackups({ backupDir: '/tmp/backups' });

    expect(backups).toHaveLength(2);
    expect(backups[0].file).toBe('db-backup-a.sql.enc');
    expect(backups[0].encrypted).toBe(true);
    expect(backups[1].encrypted).toBe(false);
  });

  it('returns 0 when cleanup fails', async () => {
    (fs.readdir as jest.Mock).mockRejectedValue(new Error('cannot read dir'));

    const deleted = await cleanupOldBackups({ backupDir: '/tmp/backups' });

    expect(deleted).toBe(0);
  });

  it('returns empty list when listBackups fails', async () => {
    (fs.readdir as jest.Mock).mockRejectedValue(new Error('cannot read dir'));

    const backups = await listBackups({ backupDir: '/tmp/backups' });

    expect(backups).toEqual([]);
  });
});
