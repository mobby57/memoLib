/**
 * Antivirus — scan sur upload (P2, remplace le test FALSE).
 *
 * Importe le code de production réel (src/lib/security/antivirus.ts) au lieu de
 * ré-implémenter le scanner. Vérifie qu'un exécutable est marqué INFECTED et
 * qu'un contenu inoffensif est marqué CLEAN. Ferme le cas FALSE ANTIVIRUS-SCAN.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    document: { update: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
// Forcer ClamAV indisponible pour tester le scan local (signatures + patterns)
vi.mock('net', () => ({
  default: {
    Socket: class {
      connect() {
        // Simule l'échec de connexion à ClamAV -> engine clamav-unavailable (clean)
        setImmediate(() => this._err && this._err());
      }
      on(evt: string, cb: () => void) {
        if (evt === 'error') this._err = cb;
        return this;
      }
      write() {}
      destroy() {}
      _err?: () => void;
    },
  },
}));

import { scanDocumentAsync } from '@/lib/security/antivirus';

function lastUpdateData() {
  const calls = mockPrisma.document.update.mock.calls;
  return calls[calls.length - 1][0].data;
}

describe('[P2] Antivirus — scanDocumentAsync (code de prod importé)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marque INFECTED un exécutable Windows PE (magic bytes MZ)', async () => {
    const buffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]); // "MZ..."
    await scanDocumentAsync({ documentId: 'doc1', fileName: 'evil.exe', mimeType: 'application/octet-stream', buffer });

    const data = lastUpdateData();
    expect(data.antivirusStatus).toBe('INFECTED');
    expect(data.antivirusEngine).toBe('signature-scan');
  });

  it('marque INFECTED un contenu avec pattern malveillant (WScript.Shell)', async () => {
    const buffer = Buffer.from('var x = new WScript.Shell(); x.Run("cmd");', 'utf-8');
    await scanDocumentAsync({ documentId: 'doc2', fileName: 'macro.txt', mimeType: 'text/plain', buffer });

    const data = lastUpdateData();
    expect(data.antivirusStatus).toBe('INFECTED');
    expect(data.antivirusEngine).toBe('pattern-scan');
  });

  it('marque CLEAN un contenu inoffensif', async () => {
    const buffer = Buffer.from('Bonjour Maître, voici les pièces de mon dossier OQTF.', 'utf-8');
    await scanDocumentAsync({ documentId: 'doc3', fileName: 'lettre.txt', mimeType: 'text/plain', buffer });

    const data = lastUpdateData();
    expect(data.antivirusStatus).toBe('CLEAN');
  });
});
