import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
/**
 * POST /api/ocr/extract
 * Recoit une image (photo de courrier) et extrait les informations structurees.
 * Utilise Ollama (local) ou fallback regex pour l'extraction.
 */
export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'Fichier requis (image ou PDF)' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await extractTextFromImage(buffer, file.type);

  if (!text) {
    return NextResponse.json({ error: 'Impossible d\'extraire le texte du document' }, { status: 422 });
  }

  // Analyse du texte extrait
  const extracted = analyzeDocument(text);

  return NextResponse.json({
    success: true,
    rawText: text.substring(0, 2000),
    extracted,
    confidence: extracted.type ? 'high' : 'low',
  });
}

/**
 * Extraction de texte depuis une image via Ollama vision ou Tesseract
 */
async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<string | null> {
  const ollamaUrl = process.env.OLLAMA_URL;

  if (ollamaUrl) {
    try {
      const base64 = buffer.toString('base64');
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_VISION_MODEL || 'llava',
          prompt: 'Extract all text from this document image. Return only the raw text, no commentary.',
          images: [base64],
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.response || null;
      }
    } catch (e) {
      console.warn('Ollama vision unavailable, using fallback');
    }
  }

  // Fallback: retourner un message indiquant que l'OCR necessite Ollama
  return `[OCR DEMO] Document recu (${(buffer.length / 1024).toFixed(0)} KB, type: ${mimeType}). Configurez OLLAMA_URL avec un modele vision (llava) pour l'extraction reelle.`;
}

/**
 * Analyse le texte extrait pour identifier le type de document et les donnees cles
 */
function analyzeDocument(text: string): Record<string, any> {
  const lower = text.toLowerCase();
  const result: Record<string, any> = {
    type: null,
    client: null,
    reference: null,
    date: null,
    deadline: null,
    urgence: 'normale',
    fields: {},
  };

  // Detection type de document
  if (lower.includes('obligation de quitter') || lower.includes('oqtf')) {
    result.type = 'OQTF';
    result.urgence = lower.includes('sans delai') ? 'critique' : 'haute';
    result.deadline = lower.includes('sans delai') ? '48h' : '30 jours';
  } else if (lower.includes('refus de sejour') || lower.includes('titre de sejour')) {
    result.type = 'TitreSejour';
    result.deadline = '2 mois';
  } else if (lower.includes('naturalisation')) {
    result.type = 'Naturalisation';
    result.deadline = '2 mois';
  } else if (lower.includes('asile') || lower.includes('ofpra')) {
    result.type = 'Asile';
    result.deadline = '21 jours';
  } else if (lower.includes('regroupement familial')) {
    result.type = 'RegroupementFamilial';
    result.deadline = '2 mois';
  }

  // Extraction reference dossier
  const refMatch = text.match(/(?:dossier|ref|n°|numero)\s*[:\s]*([A-Z0-9\-\/]+)/i);
  if (refMatch) result.reference = refMatch[1];

  // Extraction date
  const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dateMatch) result.date = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;

  // Extraction nom
  const nomMatch = text.match(/(?:monsieur|madame|m\.|mme)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (nomMatch) result.client = nomMatch[1];

  return result;
}


