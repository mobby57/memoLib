import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import crypto from 'node:crypto';

/**
 * Test round-trip du dépôt/téléchargement de pièce : addIntakeUploadedFile
 * chiffre + stocke, getIntakeUploadedFile télécharge + déchiffre + vérifie le
 * hash. On mocke prisma, le storage et l'audit ; le chiffrement est réel.
 */

const store = new Map<string, Buffer>();

const mocks = vi.hoisted(() => {
  const row: any = {
    id: 'i1',
    tenantId: 't1',
    status: 'IN_PROGRESS',
    encryptedData: null,
    requiredFields: [],
    requiredDocuments: ['Passeport'],
    providedDocuments: [],
    uploadedFiles: [],
  };
  return {
    row,
    findFirst: vi.fn(),
    update: vi.fn(),
    upload: vi.fn(),
    download: vi.fn(),
    createAuditLog: vi.fn(),
  };
});

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: { intakeRequest: { findFirst: mocks.findFirst, update: mocks.update } },
  prisma: { intakeRequest: { findFirst: mocks.findFirst, update: mocks.update } },
}));

vi.mock('@/lib/storage', () => ({
  getStorageService: () => ({
    upload: async (key: string, data: Buffer) => {
      store.set(key, data);
      mocks.upload(key, data);
      return { id: key, name: key, path: key, size: data.length, contentType: 'application/octet-stream', createdAt: new Date() };
    },
    download: async (key: string) => {
      mocks.download(key);
      const v = store.get(key);
      if (!v) throw new Error('not found');
      return v;
    },
    delete: async (key: string) => {
      store.delete(key);
    },
    exists: async () => true,
    list: async () => [],
  }),
}));

vi.mock('@/lib/security/audit-trail', () => ({ createAuditLog: mocks.createAuditLog }));

let addIntakeUploadedFile: typeof import('@/lib/services/intake.service').addIntakeUploadedFile;
let getIntakeUploadedFile: typeof import('@/lib/services/intake.service').getIntakeUploadedFile;
let deleteIntakeUploadedFile: typeof import('@/lib/services/intake.service').deleteIntakeUploadedFile;

beforeAll(async () => {
  process.env.ENCRYPTION_MASTER_KEY = 'test-master-key-of-sufficient-length-1234567890';
  const mod = await import('@/lib/services/intake.service');
  addIntakeUploadedFile = mod.addIntakeUploadedFile;
  getIntakeUploadedFile = mod.getIntakeUploadedFile;
  deleteIntakeUploadedFile = mod.deleteIntakeUploadedFile;
});

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
  mocks.createAuditLog.mockResolvedValue({});
  mocks.update.mockResolvedValue({});
  // Reset row
  mocks.row.uploadedFiles = [];
  mocks.row.providedDocuments = [];
});

describe('intake upload/download round-trip', () => {
  it('chiffre au dépôt puis restitue le contenu original au téléchargement', async () => {
    mocks.findFirst.mockResolvedValue(mocks.row);

    const original = Buffer.from('%PDF-1.4 contenu confidentiel du client', 'utf8');
    const { file } = await addIntakeUploadedFile(
      't1',
      'i1',
      { documentLabel: 'Passeport', fileName: 'passeport.pdf', mimeType: 'application/pdf', buffer: original },
      'u1'
    );

    // Le contenu stocké est chiffré (différent de l'original).
    const stored = store.get(file.storageKey)!;
    expect(stored.equals(original)).toBe(false);
    expect(mocks.createAuditLog).toHaveBeenCalled();

    // Simule la persistance de uploadedFiles pour la lecture.
    mocks.findFirst.mockResolvedValue({ ...mocks.row, uploadedFiles: [file] });

    const result = await getIntakeUploadedFile('t1', 'i1', file.id);
    expect(result).not.toBeNull();
    expect(result!.content.equals(original)).toBe(true);
    // Le hash enregistré correspond bien au contenu.
    expect(result!.meta.sha256).toBe(crypto.createHash('sha256').update(original).digest('hex'));
  });

  it('null si le fichier n’existe pas', async () => {
    mocks.findFirst.mockResolvedValue({ ...mocks.row, uploadedFiles: [] });
    const result = await getIntakeUploadedFile('t1', 'i1', 'inconnu');
    expect(result).toBeNull();
  });

  it('supprime la pièce : retire du storage + décoche le document requis', async () => {
    mocks.findFirst.mockResolvedValue(mocks.row);
    const original = Buffer.from('%PDF-1.4 x', 'utf8');
    const { file } = await addIntakeUploadedFile(
      't1',
      'i1',
      { documentLabel: 'Passeport', fileName: 'p.pdf', mimeType: 'application/pdf', buffer: original },
      'u1'
    );
    expect(store.has(file.storageKey)).toBe(true);

    // La demande contient maintenant ce fichier + "Passeport" fourni.
    mocks.findFirst.mockResolvedValue({
      ...mocks.row,
      uploadedFiles: [file],
      providedDocuments: ['Passeport'],
    });

    const res = await deleteIntakeUploadedFile('t1', 'i1', file.id, 'u1');
    expect(res.deleted).toBe(true);
    // L'objet chiffré a été retiré du storage.
    expect(store.has(file.storageKey)).toBe(false);
    // Un seul doc requis (Passeport), plus couvert → complétude 0.
    expect(res.completeness).toBe(0);
    // update appelé avec providedDocuments vidé.
    const updateArg = mocks.update.mock.calls.at(-1)?.[0];
    expect(updateArg.data.providedDocuments).toEqual([]);
  });

  it('deleted=false si la pièce n’existe pas', async () => {
    mocks.findFirst.mockResolvedValue({ ...mocks.row, uploadedFiles: [] });
    const res = await deleteIntakeUploadedFile('t1', 'i1', 'inconnu', 'u1');
    expect(res.deleted).toBe(false);
  });
});
