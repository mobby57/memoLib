import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ocrExtractText, analyzeExtractedDocument } from '@/lib/ocr/ocr-service';

/**
 * POST /api/ocr/extract
 * Reçoit une image (photo de courrier) et extrait les informations structurées.
 * Utilise Tesseract.js (local) ou Ollama vision.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'Fichier requis (image ou PDF)' }, { status: 400 });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Type non supporté. Formats: JPEG, PNG, WebP, TIFF, PDF' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Extraction OCR
  const { text, method, confidence } = await ocrExtractText(buffer, file.type);

  if (!text || text.length < 10) {
    return NextResponse.json({ error: 'Impossible d\'extraire le texte du document' }, { status: 422 });
  }

  // Analyse structurée
  const analysis = analyzeExtractedDocument(text);

  return NextResponse.json({
    success: true,
    rawText: text.substring(0, 3000),
    textLength: text.length,
    method,
    confidence,
    analysis,
  });
}
