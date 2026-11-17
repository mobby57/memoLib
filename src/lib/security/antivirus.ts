import { logger } from '@/lib/logger';
import { withTenantContext } from '@/lib/prisma';
import net from 'net';

interface ScanRequest {
  documentId: string;
  tenantId: string;
  mimeType: string;
  buffer: Buffer;
}

interface ScanResult {
  clean: boolean;
  threat?: string;
  engine: string;
}

const CLAMAV_HOST = process.env.CLAMAV_HOST || 'localhost';
const CLAMAV_PORT = parseInt(process.env.CLAMAV_PORT || '3310', 10);

// Dangerous byte signatures (magic bytes for executables, scripts, etc.)
const MALICIOUS_SIGNATURES: Array<{ name: string; bytes: number[] }> = [
  { name: 'ELF executable', bytes: [0x7f, 0x45, 0x4c, 0x46] },
  { name: 'Windows PE executable', bytes: [0x4d, 0x5a] },
  { name: 'Java class file', bytes: [0xca, 0xfe, 0xba, 0xbe] },
  { name: 'Mach-O binary', bytes: [0xfe, 0xed, 0xfa, 0xce] },
  { name: 'Mach-O binary (64)', bytes: [0xfe, 0xed, 0xfa, 0xcf] },
];

// Patterns in file content that indicate malicious intent
const MALICIOUS_PATTERNS = [
  /<%.*eval\s*\(/i,
  /<script[^>]*>.*document\.cookie/is,
  /\bpowershell\b.*-enc/i,
  /\bcmd\.exe\b.*\/c\b/i,
  /\bWScript\.Shell\b/i,
  /\bShell\.Application\b/i,
];

function scanSignatures(buffer: Buffer): ScanResult {
  for (const sig of MALICIOUS_SIGNATURES) {
    if (buffer.length >= sig.bytes.length) {
      const match = sig.bytes.every((b, i) => buffer[i] === b);
      if (match) {
        return { clean: false, threat: sig.name, engine: 'signature-scan' };
      }
    }
  }
  return { clean: true, engine: 'signature-scan' };
}

function scanPatterns(buffer: Buffer): ScanResult {
  const text = buffer.slice(0, 65536).toString('utf-8');
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      return { clean: false, threat: `Malicious pattern: ${pattern.source.slice(0, 40)}`, engine: 'pattern-scan' };
    }
  }
  return { clean: true, engine: 'pattern-scan' };
}

async function scanWithClamAV(buffer: Buffer): Promise<ScanResult> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const chunks: Buffer[] = [];
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve({ clean: true, engine: 'clamav-timeout' });
      }
    }, 10000);

    socket.connect(CLAMAV_PORT, CLAMAV_HOST, () => {
      // INSTREAM command: send size-prefixed chunks, end with zero-length chunk
      socket.write('zINSTREAM\0');
      const sizeBuffer = Buffer.alloc(4);
      sizeBuffer.writeUInt32BE(buffer.length, 0);
      socket.write(sizeBuffer);
      socket.write(Uint8Array.from(buffer));
      const endBuffer = Buffer.alloc(4, 0);
      socket.write(endBuffer);
    });

    socket.on('data', (data: Buffer) => chunks.push(data));

    socket.on('end', () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      const response = Buffer.concat(chunks).toString('utf-8').trim();
      if (response.includes('FOUND')) {
        const threat = response.replace('stream:', '').replace('FOUND', '').trim();
        resolve({ clean: false, threat, engine: 'clamav' });
      } else if (response.endsWith('OK')) {
        resolve({ clean: true, engine: 'clamav' });
      } else {
        resolve({ clean: false, threat: 'Invalid ClamAV response', engine: 'clamav-invalid-response' });
      }
    });

    socket.on('error', () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      // ClamAV not available — fall through to local scan only
      resolve({ clean: true, engine: 'clamav-unavailable' });
    });
  });
}

export async function scanDocumentAsync(req: ScanRequest): Promise<void> {
  const { documentId, tenantId, buffer } = req;

  logger.info('[ANTIVIRUS] Scanning document', { documentId, size: buffer.length });

  try {
    // Step 1: Local signature scan
    const sigResult = scanSignatures(buffer);
    if (!sigResult.clean) {
      await markInfected(documentId, tenantId, sigResult);
      return;
    }

    // Step 2: Pattern scan
    const patternResult = scanPatterns(buffer);
    if (!patternResult.clean) {
      await markInfected(documentId, tenantId, patternResult);
      return;
    }

    // Step 3: ClamAV (if available)
    const clamResult = await scanWithClamAV(buffer);
    if (clamResult.engine !== 'clamav') {
      await updateScanStatus(documentId, tenantId, 'ERROR', clamResult.engine);
      return;
    }
    if (!clamResult.clean) {
      await markInfected(documentId, tenantId, clamResult);
      return;
    }

    await updateScanStatus(documentId, tenantId, 'CLEAN', clamResult.engine);

    logger.info('[ANTIVIRUS] Document clean', { documentId, engine: clamResult.engine });
  } catch (error) {
    logger.error('[ANTIVIRUS] Scan failed', {
      documentId,
      error: error instanceof Error ? error.name : 'UnknownError',
    });
    await updateScanStatus(documentId, tenantId, 'ERROR', 'scan-error');
  }
}

async function updateScanStatus(
  documentId: string,
  tenantId: string,
  antivirusStatus: 'CLEAN' | 'ERROR',
  antivirusEngine: string
): Promise<void> {
  await withTenantContext(tenantId, transaction =>
    transaction.document.updateMany({
      where: { id: documentId, tenantId },
      data: { antivirusStatus, antivirusEngine, antivirusScannedAt: new Date() },
    })
  );
}

async function markInfected(
  documentId: string,
  tenantId: string,
  result: ScanResult
): Promise<void> {
  logger.warn('[ANTIVIRUS] Threat detected', { documentId, engine: result.engine });
  await withTenantContext(tenantId, transaction =>
    transaction.document.updateMany({
      where: { id: documentId, tenantId },
      data: {
        antivirusStatus: 'INFECTED',
        antivirusEngine: result.engine,
        antivirusScannedAt: new Date(),
      },
    })
  );
}
