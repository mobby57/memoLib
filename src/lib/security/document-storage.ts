import { decryptFile, encryptFile } from '@/lib/security/encryption';
import path from 'path';

const ENCRYPTED_LOCAL_PREFIX = 'vault-encrypted/';
const ENCRYPTED_BLOB_PREFIX = 'blob-encrypted:';

export class DocumentStorageUnavailableError extends Error {
  constructor() {
    super('Secure document storage is not configured.');
    this.name = 'DocumentStorageUnavailableError';
  }
}

export class InvalidDocumentStoragePathError extends Error {
  constructor() {
    super('Invalid document storage path.');
    this.name = 'InvalidDocumentStoragePathError';
  }
}

export class DocumentStorageNotFoundError extends Error {
  constructor() {
    super('Stored document was not found.');
    this.name = 'DocumentStorageNotFoundError';
  }
}

function resolveLocalPath(storageKey: string): { root: string; path: string } {
  let root: string;
  let relativeKey: string;

  if (storageKey.startsWith(ENCRYPTED_LOCAL_PREFIX)) {
    root = process.env.VAULT_STORAGE_ROOT ?? path.join(process.cwd(), 'uploads');
    relativeKey = storageKey.slice(ENCRYPTED_LOCAL_PREFIX.length);
  } else if (storageKey.startsWith('client-quarantine/')) {
    root =
      process.env.VAULT_STORAGE_ROOT ?? path.join(process.cwd(), 'uploads', 'client-quarantine');
    relativeKey = storageKey.slice('client-quarantine/'.length);
  } else if (storageKey.startsWith('/uploads/')) {
    root = path.join(process.cwd(), 'uploads');
    relativeKey = storageKey.slice('/uploads/'.length);
  } else {
    throw new InvalidDocumentStoragePathError();
  }

  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, relativeKey);
  const relativePath = path.relative(resolvedRoot, resolvedPath);
  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new InvalidDocumentStoragePathError();
  }

  return { root: resolvedRoot, path: resolvedPath };
}

async function readBlob(pathname: string, access: 'private' | 'public'): Promise<Buffer> {
  const { get } = await import('@vercel/blob');
  const blob = await get(pathname, { access, useCache: false });
  if (!blob) {
    throw new DocumentStorageNotFoundError();
  }

  return Buffer.from(await new Response(blob.stream).arrayBuffer());
}

export async function storeEncryptedDocument(
  tenantId: string,
  documentId: string,
  area: 'documents' | 'client-quarantine' | 'client-intake',
  plaintext: Buffer
): Promise<string> {
  if (!process.env.ENCRYPTION_MASTER_KEY) {
    throw new DocumentStorageUnavailableError();
  }

  const encrypted = await encryptFile(plaintext);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`${area}/${tenantId}/${documentId}`, encrypted, {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/octet-stream',
    });
    return `${ENCRYPTED_BLOB_PREFIX}${blob.pathname}`;
  }

  if (process.env.NODE_ENV === 'production' && !process.env.VAULT_STORAGE_ROOT) {
    throw new DocumentStorageUnavailableError();
  }

  const fs = await import('fs/promises');
  const path = await import('path');
  const storageKey = `${ENCRYPTED_LOCAL_PREFIX}${area}/${tenantId}/${documentId}`;
  const target = resolveLocalPath(storageKey);
  await fs.mkdir(path.dirname(target.path), { recursive: true });
  await fs.writeFile(target.path, encrypted, { flag: 'wx' });
  return storageKey;
}

export async function readDocumentBytes(storageKey: string): Promise<Buffer> {
  if (storageKey.startsWith(ENCRYPTED_BLOB_PREFIX)) {
    const ciphertext = await readBlob(storageKey.slice(ENCRYPTED_BLOB_PREFIX.length), 'private');
    return decryptFile(ciphertext);
  }

  if (/^https:\/\//i.test(storageKey)) {
    return readBlob(storageKey, 'public');
  }

  const fs = await import('fs/promises');
  const target = resolveLocalPath(storageKey);
  let storedBytes: Buffer;
  try {
    storedBytes = await fs.readFile(target.path);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      throw new DocumentStorageNotFoundError();
    }
    throw error;
  }

  return storageKey.startsWith(ENCRYPTED_LOCAL_PREFIX) ? decryptFile(storedBytes) : storedBytes;
}

export async function deleteDocumentObject(
  storageKey: string
): Promise<{ alreadyMissing: boolean }> {
  if (storageKey.startsWith(ENCRYPTED_BLOB_PREFIX) || /^https:\/\//i.test(storageKey)) {
    const { del } = await import('@vercel/blob');
    const blobKey = storageKey.startsWith(ENCRYPTED_BLOB_PREFIX)
      ? storageKey.slice(ENCRYPTED_BLOB_PREFIX.length)
      : storageKey;
    await del(blobKey);
    return { alreadyMissing: false };
  }

  const fs = await import('fs/promises');
  const target = resolveLocalPath(storageKey);
  try {
    await fs.unlink(target.path);
    return { alreadyMissing: false };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      return { alreadyMissing: true };
    }
    throw error;
  }
}
