import { describe, expect, it } from 'vitest';
import { createDatabaseBackup, restoreDatabaseBackup } from '@/lib/security/backup-system';

describe('encrypted backup safeguards', () => {
  it('requires an explicit restore confirmation before accessing a backup', async () => {
    await expect(
      restoreDatabaseBackup('C:\\backups\\db-backup-2026-09-01.sql.enc', {
        databaseUrl: 'postgresql://unused',
      })
    ).rejects.toThrow('allowRestore: true');
  });

  it('rejects creating a cleartext backup before starting pg_dump', async () => {
    await expect(
      createDatabaseBackup({
        databaseUrl: 'postgresql://unused',
        encryptionEnabled: false,
      })
    ).rejects.toThrow('Unencrypted database backups are not supported');
  });
});
