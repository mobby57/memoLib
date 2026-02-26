/**
 * Service d'extraction automatique des delais (echeances) depuis les documents CESEDA
 * Utilise l'IA (OpenAI/Ollama) pour analyser les documents et extraire les dates cles
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
  aiConfidence: number; // 0-1 (confidence score)
  confidenceLevel?: 'high' | 'medium' | 'low'; // High: >90%, Medium: 70-90%, Low: <70%
  extractedText: string;
  autoChecklist?: string[]; // Actions automatiques a effectuer
  templateMatch?: string; // Template OQTF detecte (48h_sans_delai, 30j_avec_delai, etc.)
  metadata?: {
    juridiction?: string;
    typeRecours?: string;
    article?: string;
    delaiStandard?: string; // Ex: "48h pour OQTF sans delai de depart"
    [key: string]: any;
  };
}

export interface DeadlineExtractionResult {
  success: boolean;
  deadlines: ExtractedDeadline[];
  templateDetected?: 'OQTF_48H_SANS_DELAI' | 'OQTF_30J_AVEC_DELAI' | 'REFUS_TITRE_2MOIS' | 'AUTRE';
  rawText?: string;
  error?: string;
  suggestedActions?: string[]; // Actions suggerees globalement
}

/**
 * Templates OQTF standards - Delais CESEDA
 */
const OQTF_TEMPLATES = {
  // Article L.512-1 CESEDA - OQTF sans delai de depart volontaire
  OQTF_48H_SANS_DELAI: {
    name: 'OQTF sans delai de depart',
    delaiRecours: 48, // heures
    articles: ['L.512-1', 'L.742-3', 'L.213-9'],
    checklist: [
      'Refere-liberte au TA (48h)',
      'Verifier notification en main propre ou domicile',
      'Preparer recours refere (violation manifeste)',
      'Constituer avocat en urgence',
      'Rassembler preuves presence France',
      'Verifier si OQTF peut etre executee (assignation a residence?)',
    ],
    keywords: ['sans delai', 'immediatement', 'sans delai de depart volontaire'],
  },

  // Article L.511-1 CESEDA - OQTF avec delai de depart volontaire 30 jours
  OQTF_30J_AVEC_DELAI: {
    name: 'OQTF avec delai de depart (30 jours)',
    delaiRecours: 30, // jours
    delaiDepart: 30,
    articles: ['L.511-1', 'L.512-1'],
    checklist: [
      'Recours contentieux au TA (30 jours)',
      'evaluer recours gracieux prefecture',
      'Preparer depart volontaire si pertinent',
      'Verifier possibilite regularisation',
      'Documents : preuves attaches France, vie privee/familiale',
      'Consultation juridique CESEDA',
    ],
    keywords: ['delai de depart volontaire', '30 jours', 'trente jours'],
  },

  // Refus de titre de sejour - 2 mois
  REFUS_TITRE_2MOIS: {
    name: 'Refus titre de sejour',
    delaiRecours: 60, // jours (2 mois)
    articles: ['L.313-11', 'R.421-1 CJA'],
    checklist: [
      'Recours contentieux au TA (2 mois)',
      'Analyser motivation refus',
      'Rassembler pieces complementaires',
      'evaluer recours gracieux',
      'Verifier maintien recepisse pendant recours',
    ],
    keywords: ['refus de titre', 'refus de sejour', 'refuse de vous delivrer'],
  },
};

/**
 * Detecte le template OQTF applicable au document
 */
function detectOQTFTemplate(documentText: string): keyof typeof OQTF_TEMPLATES | null {
  const lowerText = documentText.toLowerCase();

  // Recherche OQTF sans delai (priorite haute)
  if (
    (lowerText.includes('oqtf') || lowerText.includes('obligation de quitter')) &&
    (lowerText.includes('sans delai') ||
      lowerText.includes('immediatement') ||
      lowerText.includes('sans delai de depart volontaire'))
  ) {
    return 'OQTF_48H_SANS_DELAI';
  }

  // OQTF avec delai
  if (
    (lowerText.includes('oqtf') || lowerText.includes('obligation de quitter')) &&
    (lowerText.includes('delai de depart volontaire') ||
      lowerText.includes('30 jours') ||
      lowerText.includes('trente jours'))
  ) {
    return 'OQTF_30J_AVEC_DELAI';
  }

  // Refus de titre
  if (
    lowerText.includes('refus') &&
    (lowerText.includes('titre de sejour') || lowerText.includes('sejour'))
  ) {
    return 'REFUS_TITRE_2MOIS';
  }

  return null;
}

/**
 * Genere la checklist automatique selon le template
 */
function generateAutoChecklist(
  template: keyof typeof OQTF_TEMPLATES | null,
  deadline: Partial<ExtractedDeadline>
): string[] {
  if (!template) {
    // Checklist generique
    return [
      'Verifier date de notification',
      'Calculer delai de recours',
      'Consulter avocat specialise',
      'Rassembler documents justificatifs',
    ];
  }

  const templateData = OQTF_TEMPLATES[template];
  return [...templateData.checklist];
}

/**
 * Calcule le niveau de confiance (high/medium/low)
 */
function calculateConfidenceLevel(aiConfidence: number): 'high' | 'medium' | 'low' {
  if (aiConfidence >= 0.9) return 'high';
  if (aiConfidence >= 0.7) return 'medium';
  return 'low';
}

/**
 * Enrichit le delai avec template OQTF et checklist
 */
function enrichDeadlineWithTemplate(
  deadline: ExtractedDeadline,
  templateKey: keyof typeof OQTF_TEMPLATES | null,
  documentText: string
): ExtractedDeadline {
  const enriched = { ...deadline };

  if (templateKey) {
    const template = OQTF_TEMPLATES[templateKey];

    // Ajouter template match
    enriched.templateMatch = templateKey;

    // Generer checklist automatique
    enriched.autoChecklist = generateAutoChecklist(templateKey, deadline);

    // Enrichir metadata
    enriched.metadata = {
      ...enriched.metadata,
      delaiStandard: `${template.delaiRecours}${templateKey.includes('48H') ? 'h' : 'j'} pour ${template.name}`,
      articlesApplicables: template.articles,
      templateName: template.name,
    };

    // Ajuster la confiance si le template match est fort
    const hasStrongKeywords = template.keywords.some(kw =>
      documentText.toLowerCase().includes(kw.toLowerCase())
    );

    if (hasStrongKeywords && enriched.aiConfidence < 0.9) {
      enriched.aiConfidence = Math.min(0.95, enriched.aiConfidence + 0.15);
    }
  }

  // Calculer confidence level
  enriched.confidenceLevel = calculateConfidenceLevel(enriched.aiConfidence);

  return enriched;
}

const DEADLINE_EXTRACTION_PROMPT = `Tu es un assistant juridique expert en droit des etrangers (CESEDA).
Ta mission est d'analyser des documents administratifs et judiciaires pour extraire TOUS les delais et echeances.

Types de delais a rechercher :
- delai_recours_contentieux : recours devant le tribunal administratif (generalement 48h pour OQTF, 2 mois standard)
- delai_recours_gracieux : recours gracieux aupres de la prefecture
- audience : dates d'audience devant CNDA, TA, CAA, CE
- depot_memoire : depot de memoires complementaires
- reponse_prefecture : delai de reponse de la prefecture
- expiration_titre : expiration titre de sejour, recepisse, APS
- oqtf_execution : delai d'execution volontaire OQTF
- prescription : delais de prescription
- convocation : convocations prefecture, police
- autre : autres types de delais

Pour chaque delai trouve, extrais :
1. Le type exact
2. La date d'echeance (format ISO 8601)
3. La date de reference (notification, decision) si mentionnee
4. Le nombre de jours du delai
5. La priorite (critique si < 7j, haute si < 30j, normale sinon)
6. Le texte exact ou tu as trouve cette information
7. Le niveau de confiance (0-1) dans ton extraction

Reponds UNIQUEMENT avec un JSON valide suivant ce format :
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
      "extractedText": "Vous disposez d'un delai de 48 heures a compter de la notification...",
      "metadata": {
        "juridiction": "Tribunal administratif de Paris",
        "typeRecours": "refere-liberte",
        "article": "L.512-1 CESEDA"
      }
    }
  ]
}

Si aucun delai n'est trouve, reponds : {"deadlines": []}`;

/**
 * Appel a l'IA pour analyser le document
 * Utilise Ollama en local ou OpenAI selon la configuration
 */
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  // Verifier la configuration IA
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
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || '';
    } catch (error) {
      logger.error('Erreur appel Ollama pour extraction delais', error, {
        ollamaUrl: process.env.OLLAMA_URL,
        model: 'llama3.2:3b',
      });
      throw new Error('IA non disponible (Ollama)');
    }
  } else {
    throw new Error('Ollama non configure - definissez OLLAMA_URL dans .env');
  }
}

/**
 * Extrait les delais d'un document texte - Version amelioree avec templates
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
        error: 'Texte du document vide',
      };
    }

    // Detecter le template OQTF applicable
    const templateDetected = detectOQTFTemplate(documentText);

    // Construire le prompt avec contexte
    let contextHint = '';
    if (templateDetected) {
      const template = OQTF_TEMPLATES[templateDetected];
      contextHint = `\n\nCONTEXTE DeTECTe : ${template.name}
Delai standard : ${template.delaiRecours}${templateDetected.includes('48H') ? 'h' : 'j'}
Articles applicables : ${template.articles.join(', ')}
Assure-toi d'appliquer ce delai standard si mentionne dans le document.`;
    }

    const userPrompt = `Analyse le document suivant${documentType ? ` (type: ${documentType})` : ''} et extrais tous les delais et echeances :${contextHint}

---DOCUMENT---
${documentText}
---FIN DOCUMENT---

Reponds avec le JSON structure des delais trouves.`;

    // Appel a l'IA
    const aiResponse = await callAI(DEADLINE_EXTRACTION_PROMPT, userPrompt);

    // Parser la reponse JSON
    let parsedResponse;
    try {
      // Nettoyer la reponse (enlever markdown code blocks si presents)
      const cleanedResponse = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      logger.error("Erreur parsing reponse JSON de l'IA", parseError, {
        aiResponse: aiResponse.substring(0, 200),
        documentType,
      });
      return {
        success: false,
        deadlines: [],
        rawText: aiResponse,
        error: 'Format de reponse IA invalide',
      };
    }

    // Valider et transformer les dates + enrichir avec templates
    const deadlines: ExtractedDeadline[] = (parsedResponse.deadlines || []).map((dl: any) => {
      const baseDeadline: ExtractedDeadline = {
        type: dl.type || 'autre',
        titre: dl.titre || 'echeance',
        description: dl.description,
        dateEcheance: new Date(dl.dateEcheance),
        dateReference: dl.dateReference ? new Date(dl.dateReference) : undefined,
        delaiJours: dl.delaiJours,
        priorite: dl.priorite || 'normale',
        aiConfidence: dl.aiConfidence || 0.5,
        extractedText: dl.extractedText || '',
        metadata: dl.metadata,
      };

      // Enrichir avec template et checklist
      return enrichDeadlineWithTemplate(baseDeadline, templateDetected, documentText);
    });

    // Generer actions suggerees globales
    const suggestedActions: string[] = [];
    if (templateDetected) {
      const template = OQTF_TEMPLATES[templateDetected];
      suggestedActions.push(`Template detecte : ${template.name}`);
      suggestedActions.push(
        `Delai legal : ${template.delaiRecours}${templateDetected.includes('48H') ? 'h' : 'j'}`
      );

      if (deadlines.some(d => d.priorite === 'critique')) {
        suggestedActions.push('️ URGENCE : Contacter avocat immediatement');
      }
    }

    return {
      success: true,
      deadlines,
      templateDetected: templateDetected || undefined,
      rawText: aiResponse,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
    };
  } catch (error: any) {
    logger.error("Erreur lors de l'extraction automatique des delais", error, {
      documentType,
      textLength: documentText?.length,
    });
    return {
      success: false,
      deadlines: [],
      error: error.message || 'Erreur inconnue',
    };
  }
}

/**
 * Extrait les delais depuis un fichier uploade
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
      // Extraction PDF avec pdf-parse si disponible
      try {
        const pdfParseModule: any = await import('pdf-parse');
        const pdfParse = pdfParseModule.default ?? pdfParseModule;
        const pdfData = await pdfParse(fileBuffer);
        documentText = pdfData.text;
      } catch (pdfError) {
        logger.warn('pdf-parse non disponible, extraction basique', { error: pdfError });
        documentText = await extractTextFromPDF(fileBuffer);
      }
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // Extraction DOCX avec mammoth si disponible
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        documentText = result.value;
      } catch (docxError) {
        logger.warn('mammoth non disponible, extraction basique', { error: docxError });
        documentText = await extractTextFromDOCX(fileBuffer);
      }
    } else if (mimeType === 'text/plain') {
      documentText = fileBuffer.toString('utf-8');
    } else {
      return {
        success: false,
        deadlines: [],
        error: `Type de fichier non supporte: ${mimeType}`,
      };
    }

    // Detecter le type de document par le nom de fichier
    const documentType = detectDocumentType(fileName);

    // Extraire les delais du texte
    return await extractDeadlinesFromText(documentText, documentType);
  } catch (error: any) {
    logger.error('Erreur extraction delais depuis fichier', error, {
      fileName,
      mimeType,
    });
    return {
      success: false,
      deadlines: [],
      error: error.message || 'Erreur extraction fichier',
    };
  }
}

/**
 * Detecte le type de document CESEDA par le nom de fichier
 */
function detectDocumentType(fileName: string): string | undefined {
  const lowerName = fileName.toLowerCase();

  if (lowerName.includes('oqtf')) return 'OQTF';
  if (lowerName.includes('arrete')) return 'ARRETE_PREFECTORAL';
  if (lowerName.includes('decision') || lowerName.includes('decision'))
    return 'DECISION_ADMINISTRATIVE';
  if (lowerName.includes('convocation')) return 'CONVOCATION';
  if (lowerName.includes('audience')) return 'CONVOCATION_AUDIENCE';
  if (lowerName.includes('jugement')) return 'JUGEMENT';
  if (lowerName.includes('ordonnance')) return 'ORDONNANCE';
  if (
    lowerName.includes('titre') ||
    lowerName.includes('recepisse') ||
    lowerName.includes('recepisse')
  )
    return 'TITRE_SEJOUR';

  return undefined;
}

/**
 * Extrait le texte d'un PDF
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Utiliser pdf2json comme alternative sécurisée à pdf-parse
    const PDFParser = require('pdf2json');

    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();

      pdfParser.on(
        'pdfParser_dataReady',
        (pdfData: { Pages: Array<{ Texts: Array<{ R: Array<{ T: string }> }> }> }) => {
          let text = '';
          pdfData.Pages.forEach(page => {
            page.Texts.forEach(textItem => {
              textItem.R.forEach(r => {
                text += decodeURIComponent(r.T) + ' ';
              });
            });
            text += '\n';
          });
          resolve(text);
        }
      );

      pdfParser.on('pdfParser_dataError', (errData: Error) => {
        reject(errData);
      });

      pdfParser.parseBuffer(buffer);
    });
  } catch (error) {
    logger.error('Erreur extraction texte depuis PDF', error, {
      bufferSize: buffer.length,
    });
    throw new Error("Impossible d'extraire le texte du PDF");
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
      bufferSize: buffer.length,
    });
    throw new Error("Impossible d'extraire le texte du DOCX");
  }
}

/**
 * Calcule le statut d'une echeance en fonction de la date
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
 * Calcule la priorite automatique en fonction du delai restant
 */
export function calculateDeadlinePriority(dateEcheance: Date, type: string): string {
  const now = new Date();
  const diffMs = dateEcheance.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Delais OQTF/expulsion sont toujours critiques
  if (type.includes('oqtf') || type.includes('expulsion')) {
    return 'critique';
  }

  // Delais de recours contentieux courts = critique
  if (type === 'delai_recours_contentieux' && diffDays <= 7) {
    return 'critique';
  }

  // Calcul standard
  if (diffDays < 0) return 'critique'; // Depasse
  if (diffDays <= 3) return 'critique';
  if (diffDays <= 7) return 'haute';
  if (diffDays <= 30) return 'normale';
  return 'basse';
}

export const deadlineExtractor = {
  extractDeadlinesFromText,
  extractDeadlinesFromFile,
  calculateDeadlineStatus,
  calculateDeadlinePriority,
};
