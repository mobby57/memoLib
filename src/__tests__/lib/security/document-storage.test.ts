import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decryptFile } from '@/lib/security/encryption';

const blobMocks = vi.hoisted(() => ({
  del: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
}));

vi.mock('@vercel/blob', () => blobMocks);

import {
  DocumentStorageUnavailableError,
  deleteDocumentObject,
  readDocumentBytes,
  storeEncryptedDocument,
} from '@/lib/security/document-storage';

describe('secure document storage', () => {
  const originalEnvironment = {
    blobToken: process.env.BLOB_READ_WRITE_TOKEN,
    encryptionKey: process.env.ENCRYPTION_MASTER_KEY,
    nodeEnv: process.env.NODE_ENV,
    vaultRoot: process.env.VAULT_STORAGE_ROOT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-token');
    vi.stubEnv('ENCRYPTION_MASTER_KEY', 'test-master-key-for-document-storage');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('VAULT_STORAGE_ROOT', '');
    blobMocks.put.mockResolvedValue({ pathname: 'documents/tenant-a/doc-a' });
    blobMocks.del.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (originalEnvironment.blobToken !== undefined) {
      process.env.BLOB_READ_WRITE_TOKEN = originalEnvironment.blobToken;
    }
    if (originalEnvironment.encryptionKey !== undefined) {
      process.env.ENCRYPTION_MASTER_KEY = originalEnvironment.encryptionKey;
    }
    if (originalEnvironment.nodeEnv !== undefined) {
      process.env.NODE_ENV = originalEnvironment.nodeEnv;
    }
    if (originalEnvironment.vaultRoot !== undefined) {
      process.env.VAULT_STORAGE_ROOT = originalEnvironment.vaultRoot;
    }
  });

  it('encrypts each file before private Blob storage', async () => {
    const plaintext = Buffer.from('sensitive document');

    const storageKey = await storeEncryptedDocument('tenant-a', 'doc-a', 'documents', plaintext);

    expect(storageKey).toBe('blob-encrypted:documents/tenant-a/doc-a');
    expect(blobMocks.put).toHaveBeenCalledWith(
      'documents/tenant-a/doc-a',
      expect.any(Buffer),
      expect.objectContaining({ access: 'private' })
    );
    expect(await decryptFile(blobMocks.put.mock.calls[0][1])).toEqual(plaintext);
  });

  it('decrypts private Blob content only through the server-side reader', async () => {
    const plaintext = Buffer.from('sensitive document');
    const storageKey = await storeEncryptedDocument('tenant-a', 'doc-a', 'documents', plaintext);
    const ciphertext = blobMocks.put.mock.calls[0][1] as Buffer;
    blobMocks.get.mockResolvedValue({ stream: new Blob([ciphertext]).stream() });

    await expect(readDocumentBytes(storageKey)).resolves.toEqual(plaintext);
    expect(blobMocks.get).toHaveBeenCalledWith('documents/tenant-a/doc-a', {
      access: 'private',
      useCache: false,
    });
  });

  it('refuses storage when application encryption is not configured', async () => {
    vi.stubEnv('ENCRYPTION_MASTER_KEY', '');

    await expect(
      storeEncryptedDocument('tenant-a', 'doc-a', 'documents', Buffer.from('sensitive'))
    ).rejects.toBeInstanceOf(DocumentStorageUnavailableError);
    expect(blobMocks.put).not.toHaveBeenCalled();
  });

  it('refuses an unconfigured production filesystem fallback', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VAULT_STORAGE_ROOT', '');

    await expect(
      storeEncryptedDocument('tenant-a', 'doc-a', 'documents', Buffer.from('sensitive'))
    ).rejects.toBeInstanceOf(DocumentStorageUnavailableError);
    expect(blobMocks.put).not.toHaveBeenCalled();
  });

  it('deletes the private Blob using its opaque pathname', async () => {
    await deleteDocumentObject('blob-encrypted:documents/tenant-a/doc-a');

    expect(blobMocks.del).toHaveBeenCalledWith('documents/tenant-a/doc-a');
  });
});
