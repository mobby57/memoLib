/**
 * Document text extraction service
 * Extracts text from PDF (pdf-parse) and DOCX (mammoth).
 * Both packages are already in package.json dependencies.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface ExtractionResult {
  text: string;
  confidence: number;
  pages?: number;
}

/**
 * Extract text from a document buffer based on MIME type
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractionResult> {
  switch (mimeType) {
    case 'application/pdf':
      return extractFromPDF(buffer);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractFromDOCX(buffer);
    case 'text/plain':
      return { text: buffer.toString('utf-8'), confidence: 1.0 };
    default:
      return { text: '', confidence: 0 };
  }
}

async function extractFromPDF(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    const data = await pdfParse(buffer);
    return {
      text: data.text || '',
      confidence: data.text?.length > 10 ? 0.95 : 0.3,
      pages: data.numpages,
    };
  } catch (error) {
    logger.error('[OCR] PDF extraction failed', { error });
    return { text: '', confidence: 0 };
  }
}

async function extractFromDOCX(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value || '',
      confidence: result.value?.length > 10 ? 0.95 : 0.3,
    };
  } catch (error) {
    logger.error('[OCR] DOCX extraction failed', { error });
    return { text: '', confidence: 0 };
  }
}

/**
 * Process OCR for a document and update the DB record
 */
export async function processDocumentOCR(documentId: string, buffer: Buffer, mimeType: string) {
  try {
    const result = await extractText(buffer, mimeType);

    if (result.text.length === 0) {
      await prisma.document.update({
        where: { id: documentId },
        data: { ocrProcessed: true, ocrConfidence: 0 },
      });
      return;
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        ocrProcessed: true,
        ocrText: result.text.substring(0, 50000),
        ocrConfidence: result.confidence,
      },
    });

    logger.info('[OCR] Extraction complete', {
      documentId,
      chars: result.text.length,
      confidence: result.confidence,
      pages: result.pages,
    });
  } catch (error) {
    logger.error('[OCR] Processing failed', { documentId, error });
    await prisma.document.update({
      where: { id: documentId },
      data: { ocrProcessed: true, ocrConfidence: 0 },
    }).catch(() => {});
  }
}
