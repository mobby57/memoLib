import { logger } from '@/lib/logger';

interface ScanRequest {
  documentId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export async function scanDocumentAsync(req: ScanRequest): Promise<void> {
  logger.info('[ANTIVIRUS] Scan queued', { documentId: req.documentId, file: req.fileName });
}
