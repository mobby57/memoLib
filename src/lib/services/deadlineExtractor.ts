/**
 * Service d'extraction automatique des délais (échéances) depuis les documents CESEDA
 * Utilise l'IA (OpenAI/Ollama) pour analyser les documents et extraire les dates clés
 */

import { logger } from '@/lib/logger';

export interface ExtractedDeadline {
  type: string; // delai_recours_contentieux, audience, etc.
  titre: string;
  description?: string;
  dateEcheance: Date;
  dateReference?: Date;
  delaiJours?: number;
  priorite: 'critique' | 'haute' | 'normale' | 'basse';
  aiConfidence: number; // 0-1
  extractedText: string;
  metadata?: {
    juridiction?: string;
    typeRecours?: string;
    article?: string;
    [key: string]: any;
  };
}

export interface DeadlineExtractionResult {
  success: boolean;
  deadlines: ExtractedDeadline[];
  rawText?: string;
  error?: string;
}

/**
 * Prompt système pour l'extraction de délais CESEDA
 */
const DEADLINE_EXTRACTION_PROMPT = `Tu es un assistant juridique expert en droit des étrangers (CESEDA).
Ta mission est d'analyser des documents administratifs et judiciaires pour extraire TOUS les délais et échéances.

Types de délais à rechercher :
- delai_recours_contentieux : recours devant le tribunal administratif (généralement 48h pour OQTF, 2 mois standard)
- delai_recours_gracieux : recours gracieux auprès de la préfecture
- audience : dates d'audience devant CNDA, TA, CAA, CE
- depot_memoire : dépôt de mémoires complémentaires
- reponse_prefecture : délai de réponse de la préfecture
- expiration_titre : expiration titre de séjour, récépissé, APS
- oqtf_execution : délai d'exécution volontaire OQTF
- prescription : délais de prescription
- convocation : convocations préfecture, police
- autre : autres types de délais

Pour chaque délai trouvé, extrais :
1. Le type exact
2. La date d'échéance (format ISO 8601)
3. La date de référence (notification, décision) si mentionnée
4. Le nombre de jours du délai
5. La priorité (critique si < 7j, haute si < 30j, normale sinon)
6. Le texte exact où tu as trouvé cette information
7. Le niveau de confiance (0-1) dans ton extraction

Réponds UNIQUEMENT avec un JSON valide suivant ce format :
{
  "deadlines": [
    {
      "type": "delai_recours_contentieux",
      "titre": "Recours contentieux OQTF",
      "description": "Recours devant le tribunal administratif contre l'OQTF",
      "dateEcheance": "2026-01-15T23:59:59Z",
      "dateReference": "2026-01-13T00:00:00Z",
      "delaiJours": 2,
      "priorite": "critique",
      "aiConfidence": 0.95,
      "extractedText": "Vous disposez d'un délai de 48 heures à compter de la notification...",
      "metadata": {
        "juridiction": "Tribunal administratif de Paris",
        "typeRecours": "référé-liberté",
        "article": "L.512-1 CESEDA"
      }
    }
  ]
}

Si aucun délai n'est trouvé, réponds : {"deadlines": []}`;

/**
 * Appel à l'IA pour analyser le document
 * Utilise Ollama en local ou OpenAI selon la configuration
 */
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  // Vérifier la configuration IA
  const ollamaEnabled = process.env.OLLAMA_ENABLED === 'true';
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2:latest';
  
  if (ollamaEnabled) {
    // Appel Ollama
    try {
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || '';
    } catch (error) {
      logger.error('Erreur appel Ollama pour extraction délais', error, {
        ollamaUrl: process.env.OLLAMA_URL,
        model: 'llama3.2:3b'
      });
      throw new Error('IA non disponible (Ollama)');
    }
  } else if (process.env.OPENAI_API_KEY) {
    // Appel OpenAI (nécessite installation de openai package)
    throw new Error('OpenAI non encore implémenté - utilisez Ollama');
  } else {
    throw new Error('Aucune IA configurée (Ollama ou OpenAI)');
  }
}

/**
 * Extrait les délais d'un document texte
 */
export async function extractDeadlinesFromText(
  documentText: string,
  documentType?: string
): Promise<DeadlineExtractionResult> {
  try {
    if (!documentText || documentText.trim().length === 0) {
      return {
        success: false,
        deadlines: [],
        error: 'Texte du document vide'
      };
    }

    // Construire le prompt avec contexte
    const userPrompt = `Analyse le document suivant${documentType ? ` (type: ${documentType})` : ''} et extrais tous les délais et échéances :

---DOCUMENT---
${documentText}
---FIN DOCUMENT---

Réponds avec le JSON structuré des délais trouvés.`;

    // Appel à l'IA
    const aiResponse = await callAI(
      DEADLINE_EXTRACTION_PROMPT,
      userPrompt
    );

    // Parser la réponse JSON
    let parsedResponse;
    try {
      // Nettoyer la réponse (enlever markdown code blocks si présents)
      const cleanedResponse = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      logger.error('Erreur parsing réponse JSON de l\'IA', parseError, {
        aiResponse: aiResponse.substring(0, 200),
        documentType
      });
      return {
        success: false,
        deadlines: [],
        rawText: aiResponse,
        error: 'Format de réponse IA invalide'
      };
    }

    // Valider et transformer les dates
    const deadlines: ExtractedDeadline[] = (parsedResponse.deadlines || []).map((dl: any) => {
      return {
        type: dl.type || 'autre',
        titre: dl.titre || 'Échéance',
        description: dl.description,
        dateEcheance: new Date(dl.dateEcheance),
        dateReference: dl.dateReference ? new Date(dl.dateReference) : undefined,
        delaiJours: dl.delaiJours,
        priorite: dl.priorite || 'normale',
        aiConfidence: dl.aiConfidence || 0.5,
        extractedText: dl.extractedText || '',
        metadata: dl.metadata
      };
    });

    return {
      success: true,
      deadlines,
      rawText: aiResponse
    };

  } catch (error: any) {
    logger.error('Erreur lors de l\'extraction automatique des délais', error, {
      documentType,
      textLength: documentText?.length
    });
    return {
      success: false,
      deadlines: [],
      error: error.message || 'Erreur inconnue'
    };
  }
}

/**
 * Extrait les délais depuis un fichier uploadé
 * Supporte PDF, DOCX, TXT
 */
export async function extractDeadlinesFromFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<DeadlineExtractionResult> {
  try {
    // Extraire le texte selon le type de fichier
    let documentText: string;

    if (mimeType === 'application/pdf') {
      // TODO: Intégrer un parser PDF (pdf-parse)
      documentText = await extractTextFromPDF(fileBuffer);
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // TODO: Intégrer un parser DOCX (mammoth)
      documentText = await extractTextFromDOCX(fileBuffer);
    } else if (mimeType === 'text/plain') {
      documentText = fileBuffer.toString('utf-8');
    } else {
      return {
        success: false,
        deadlines: [],
        error: `Type de fichier non supporté: ${mimeType}`
      };
    }

    // Détecter le type de document par le nom de fichier
    const documentType = detectDocumentType(fileName);

    // Extraire les délais du texte
    return await extractDeadlinesFromText(documentText, documentType);

  } catch (error: any) {
    logger.error('Erreur extraction délais depuis fichier', error, {
      fileName,
      mimeType
    });
    return {
      success: false,
      deadlines: [],
      error: error.message || 'Erreur extraction fichier'
    };
  }
}

/**
 * Détecte le type de document CESEDA par le nom de fichier
 */
function detectDocumentType(fileName: string): string | undefined {
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.includes('oqtf')) return 'OQTF';
  if (lowerName.includes('arrete')) return 'ARRETE_PREFECTORAL';
  if (lowerName.includes('decision') || lowerName.includes('décision')) return 'DECISION_ADMINISTRATIVE';
  if (lowerName.includes('convocation')) return 'CONVOCATION';
  if (lowerName.includes('audience')) return 'CONVOCATION_AUDIENCE';
  if (lowerName.includes('jugement')) return 'JUGEMENT';
  if (lowerName.includes('ordonnance')) return 'ORDONNANCE';
  if (lowerName.includes('titre') || lowerName.includes('recepisse') || lowerName.includes('récépissé')) return 'TITRE_SEJOUR';
  
  return undefined;
}

/**
 * Extrait le texte d'un PDF
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    logger.error('Erreur extraction texte depuis PDF', error, {
      bufferSize: buffer.length
    });
    throw new Error('Impossible d\'extraire le texte du PDF');
  }
}

/**
 * Extrait le texte d'un DOCX
 */
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    logger.error('Erreur extraction texte depuis DOCX', error, {
      bufferSize: buffer.length
    });
    throw new Error('Impossible d\'extraire le texte du DOCX');
  }
}

/**
 * Calcule le statut d'une échéance en fonction de la date
 */
export function calculateDeadlineStatus(dateEcheance: Date): string {
  const now = new Date();
  const diffMs = dateEcheance.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'depasse';
  if (diffDays === 0) return 'urgent'; // Aujourd'hui
  if (diffDays <= 3) return 'urgent';
  if (diffDays <= 7) return 'proche';
  return 'a_venir';
}

/**
 * Calcule la priorité automatique en fonction du délai restant
 */
export function calculateDeadlinePriority(dateEcheance: Date, type: string): string {
  const now = new Date();
  const diffMs = dateEcheance.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Délais OQTF/expulsion sont toujours critiques
  if (type.includes('oqtf') || type.includes('expulsion')) {
    return 'critique';
  }

  // Délais de recours contentieux courts = critique
  if (type === 'delai_recours_contentieux' && diffDays <= 7) {
    return 'critique';
  }

  // Calcul standard
  if (diffDays < 0) return 'critique'; // Dépassé
  if (diffDays <= 3) return 'critique';
  if (diffDays <= 7) return 'haute';
  if (diffDays <= 30) return 'normale';
  return 'basse';
}

export const deadlineExtractor = {
  extractDeadlinesFromText,
  extractDeadlinesFromFile,
  calculateDeadlineStatus,
  calculateDeadlinePriority
};
