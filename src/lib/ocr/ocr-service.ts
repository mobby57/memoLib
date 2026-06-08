/**
 * Service OCR — Extraction de texte depuis images/photos de documents
 *
 * Stratégie multi-niveaux :
 * 1. Ollama vision (llava) si disponible → meilleure qualité
 * 2. Tesseract.js (local) → fonctionne toujours, français inclus
 *
 * Après extraction du texte brut, analyse IA pour structurer les données.
 */

import { createWorker, Worker } from 'tesseract.js';

let tesseractWorker: Worker | null = null;

async function getTesseractWorker(): Promise<Worker> {
  if (!tesseractWorker) {
    tesseractWorker = await createWorker('fra+eng');
  }
  return tesseractWorker;
}

/**
 * Extrait le texte d'une image (photo de courrier, scan, etc.)
 */
export async function ocrExtractText(buffer: Buffer, mimeType: string): Promise<{ text: string; method: 'ollama_vision' | 'tesseract'; confidence: number }> {
  // Tier 1 : Ollama vision
  const ollamaUrl = process.env.OLLAMA_URL;
  if (ollamaUrl) {
    try {
      const base64 = buffer.toString('base64');
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_VISION_MODEL || 'llava',
          prompt: 'Transcris intégralement le texte de ce document administratif français. Retourne uniquement le texte brut, sans commentaire.',
          images: [base64],
          stream: false,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.response && data.response.length > 20) {
          return { text: data.response, method: 'ollama_vision', confidence: 0.9 };
        }
      }
    } catch { /* fallback to tesseract */ }
  }

  // Tier 2 : Tesseract.js
  const worker = await getTesseractWorker();
  const { data } = await worker.recognize(buffer);
  return { text: data.text, method: 'tesseract', confidence: data.confidence / 100 };
}

/**
 * Analyse structurée du texte extrait d'un document juridique
 */
export function analyzeExtractedDocument(text: string): DocumentAnalysis {
  const lower = text.toLowerCase();
  const result: DocumentAnalysis = {
    type: null,
    client: null,
    reference: null,
    dates: [],
    deadline: null,
    urgence: 'normale',
    prefecture: null,
    articles: [],
  };

  // Type de document
  if (lower.includes('obligation de quitter') || lower.match(/o\.?q\.?t\.?f/)) {
    result.type = 'OQTF';
    result.urgence = lower.includes('sans délai') || lower.includes('sans delai') ? 'critique' : 'haute';
    result.deadline = result.urgence === 'critique' ? '48h' : '30 jours';
  } else if (lower.includes('refus de séjour') || lower.includes('refus de titre')) {
    result.type = 'REFUS_TITRE_SEJOUR';
    result.deadline = '2 mois';
  } else if (lower.includes('récépissé') || lower.includes('recepisse')) {
    result.type = 'RECEPISSE';
  } else if (lower.includes('convocation') && lower.includes('tribunal')) {
    result.type = 'CONVOCATION_TA';
    result.urgence = 'haute';
  } else if (lower.includes('naturalisation') || lower.includes('ajournement')) {
    result.type = 'NATURALISATION';
    result.deadline = '2 mois';
  } else if (lower.includes('asile') || lower.includes('ofpra')) {
    result.type = 'ASILE';
    result.deadline = '21 jours';
    result.urgence = 'haute';
  } else if (lower.includes('assignation') || lower.includes('rétention')) {
    result.type = 'RETENTION';
    result.urgence = 'critique';
    result.deadline = '48h';
  } else if (lower.includes('regroupement familial')) {
    result.type = 'REGROUPEMENT_FAMILIAL';
  }

  // Référence dossier
  const refMatch = text.match(/(?:n°|dossier|ref|réf)[^\d]*(\d[\d\-\/\.]+\d)/i);
  if (refMatch) result.reference = refMatch[1];

  // Dates (format français)
  const dateMatches = text.matchAll(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g);
  for (const m of dateMatches) {
    result.dates.push(`${m[1]}/${m[2]}/${m[3]}`);
  }
  // Date en toutes lettres
  const dateLettreMatch = text.match(/(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i);
  if (dateLettreMatch) result.dates.push(dateLettreMatch[0]);

  // Client (nom)
  const nomMatch = text.match(/(?:monsieur|madame|m\.|mme\.?)\s+([A-ZÀ-Ü][a-zà-ü]+(?:\s+[A-ZÀ-Ü][a-zà-ü]+){0,2})/i);
  if (nomMatch) result.client = nomMatch[1].trim();

  // Préfecture
  const prefMatch = text.match(/(?:préfet|préfecture|prefecture)\s+(?:de\s+(?:la\s+)?|du\s+)?([A-ZÀ-Ü][a-zà-ü\-]+(?:\s+[a-zà-ü\-]+)*)/i);
  if (prefMatch) result.prefecture = prefMatch[1].trim();

  // Articles de loi cités
  const articleMatches = text.matchAll(/(?:article|art\.?)\s*(L\.?\s*\d[\d\-]+[\d])/gi);
  for (const m of articleMatches) {
    result.articles.push('Art. ' + m[1].replace(/\s+/g, ''));
  }

  return result;
}

export interface DocumentAnalysis {
  type: string | null;
  client: string | null;
  reference: string | null;
  dates: string[];
  deadline: string | null;
  urgence: 'normale' | 'haute' | 'critique';
  prefecture: string | null;
  articles: string[];
}
