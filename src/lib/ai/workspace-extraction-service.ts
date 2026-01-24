/**
 * WORKSPACE EXTRACTION SERVICE
 * 
 * Service d'extraction automatique IA pour WorkspaceReasoning
 * Utilise Ollama (local) pour generer Facts, Contexts, Obligations depuis sourceRaw
 * 
 * Fonctionnalites:
 * - Extraction structuree depuis email brut
 * - Prompts specialises CESEDA (OQTF, Naturalisation, Asile, Titre sejour)
 * - Generation JSON valide
 * - Scoring de confiance par entite
 * - Fallback gracieux si Ollama indisponible
 */

import type { WorkspaceReasoning } from '@prisma/client';

// Import Ollama depuis la racine lib/
import { OllamaClient } from '../../../lib/ai/ollama-client';

// ============================================
// TYPES D'EXTRACTION
// ============================================

export interface ExtractedFact {
  label: string;
  value: string;
  source: 'EXPLICIT_MESSAGE' | 'METADATA' | 'DOCUMENT';
  sourceRef?: string;
  confidence: number; // 0-1
}

export interface ExtractedContext {
  type: 'LEGAL' | 'ADMINISTRATIVE' | 'CONTRACTUAL' | 'TEMPORAL';
  description: string;
  reasoning: string;
  certaintyLevel: 'POSSIBLE' | 'PROBABLE' | 'CONFIRMED';
  confidence: number; // 0-1
}

export interface ExtractedObligation {
  description: string;
  mandatory: boolean;
  deadline?: string; // ISO date string
  critical: boolean;
  legalRef?: string; // Ex: "Art. L511-1 CESEDA"
  confidence: number; // 0-1
}

export interface ExtractionResult {
  success: boolean;
  facts: ExtractedFact[];
  contexts: ExtractedContext[];
  obligations: ExtractedObligation[];
  confidence: number; // Score global 0-1
  processingTime: number; // ms
  model: string; // llama3.2:3b, etc.
  error?: string;
}

// ============================================
// PROMPTS SPeCIALISeS CESEDA
// ============================================

const SYSTEM_PROMPT = `Tu es un assistant juridique specialise en droit des etrangers (CESEDA) pour avocats francais.

Ta mission est d'extraire des informations structurees depuis des emails de clients pour creer un dossier juridique.

ReGLES STRICTES:
1. Extrais UNIQUEMENT des faits certains (dates, noms, lieux explicites)
2. Propose des contextes juridiques POSSIBLES (pas de certitude absolue)
3. Identifie les obligations legales selon le type de procedure
4. Fournis un score de confiance (0-1) pour chaque element extrait
5. Reponds UNIQUEMENT en JSON valide (pas de texte avant/apres)

TYPES DE PROCeDURES CESEDA:
- OQTF (Obligation de Quitter le Territoire Francais) [Next] Delais critiques 48h-30 jours
- Naturalisation [Next] Procedure longue, nombreux documents
- Asile politique [Next] OFPRA/CNDA, urgence variable
- Titre de sejour [Next] Prefecture, renouvellement, premiere demande

FORMAT DE RePONSE (JSON strict):
{
  "facts": [
    {
      "label": "Date de notification",
      "value": "2026-01-15",
      "source": "EXPLICIT_MESSAGE",
      "sourceRef": "ligne 3 de l'email",
      "confidence": 0.95
    }
  ],
  "contexts": [
    {
      "type": "LEGAL",
      "description": "OQTF avec delai de depart volontaire (Art. L511-1 CESEDA)",
      "reasoning": "Mention explicite d'une obligation de quitter le territoire avec delai",
      "certaintyLevel": "PROBABLE",
      "confidence": 0.85
    }
  ],
  "obligations": [
    {
      "description": "Deposer un recours contentieux devant le Tribunal administratif",
      "mandatory": true,
      "deadline": "2026-02-15",
      "critical": true,
      "legalRef": "Art. L512-1 CESEDA",
      "confidence": 0.90
    }
  ]
}`;

const USER_PROMPT_TEMPLATE = `Analyse cet email de client et extrais les informations juridiques pertinentes:

=== EMAIL CLIENT ===
{sourceRaw}
===================

Type de procedure detecte: {procedureType}

INSTRUCTIONS:
1. Identifie les FAITS certains (dates, noms, evenements explicites)
2. Propose les CONTEXTES juridiques possibles (CESEDA)
3. Determine les OBLIGATIONS legales (delais, recours, documents)
4. Score de confiance pour chaque element

Reponds en JSON strict (aucun texte avant/apres).`;

// ============================================
// SERVICE D'EXTRACTION
// ============================================

export class WorkspaceExtractionService {
  private ollama: OllamaClient;

  constructor() {
    this.ollama = new OllamaClient();
  }

  /**
   * Verifie si Ollama est disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      return await this.ollama.isAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Extraction principale depuis workspace
   */
  async extractFromWorkspace(
    workspace: WorkspaceReasoning
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      // Verifier disponibilite Ollama
      const available = await this.isAvailable();
      if (!available) {
        return this.fallbackExtraction(workspace);
      }

      // Construire le prompt avec contexte
      const userPrompt = USER_PROMPT_TEMPLATE
        .replace('{sourceRaw}', workspace.sourceRaw)
        .replace('{procedureType}', workspace.procedureType || 'Inconnu');

      // Appeler Ollama avec prompt specialise
      const response = await this.ollama.generateJSON<{
        facts: ExtractedFact[];
        contexts: ExtractedContext[];
        obligations: ExtractedObligation[];
      }>(userPrompt, SYSTEM_PROMPT);

      // Calculer confiance globale
      const allConfidences = [
        ...response.facts.map(f => f.confidence),
        ...response.contexts.map(c => c.confidence),
        ...response.obligations.map(o => o.confidence),
      ];

      const globalConfidence = allConfidences.length > 0
        ? allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length
        : 0;

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        facts: response.facts || [],
        contexts: response.contexts || [],
        obligations: response.obligations || [],
        confidence: globalConfidence,
        processingTime,
        model: 'llama3.2:3b',
      };

    } catch (error) {
      console.error('Erreur extraction IA:', error);
      
      return {
        success: false,
        facts: [],
        contexts: [],
        obligations: [],
        confidence: 0,
        processingTime: Date.now() - startTime,
        model: 'none',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Extraction fallback si Ollama indisponible
   * Utilise des regles simples d'extraction
   */
  private fallbackExtraction(workspace: WorkspaceReasoning): ExtractionResult {
    const facts: ExtractedFact[] = [];
    const contexts: ExtractedContext[] = [];
    const obligations: ExtractedObligation[] = [];

    const sourceRaw = workspace.sourceRaw.toLowerCase();

    // Detection simple de dates (YYYY-MM-DD)
    const dateMatches = workspace.sourceRaw.match(/\d{4}-\d{2}-\d{2}/g);
    if (dateMatches && dateMatches.length > 0) {
      facts.push({
        label: 'Date detectee',
        value: dateMatches[0],
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Extraction automatique (regex)',
        confidence: 0.6,
      });
    }

    // Detection type procedure
    if (workspace.procedureType === 'OQTF') {
      contexts.push({
        type: 'LEGAL',
        description: 'Procedure OQTF detectee - Delais critiques',
        reasoning: 'Type de procedure specifie',
        certaintyLevel: 'PROBABLE',
        confidence: 0.7,
      });

      obligations.push({
        description: 'Verifier le delai de recours contentieux (48h ou 30 jours)',
        mandatory: true,
        critical: true,
        legalRef: 'Art. L512-1 CESEDA',
        confidence: 0.6,
      });
    }

    // Detection mots-cles urgence
    if (sourceRaw.includes('urgent') || sourceRaw.includes('expulsion') || sourceRaw.includes('delai')) {
      obligations.push({
        description: 'Analyser l\'urgence du dossier',
        mandatory: true,
        critical: true,
        confidence: 0.5,
      });
    }

    return {
      success: true,
      facts,
      contexts,
      obligations,
      confidence: 0.5, // Confiance basse (fallback)
      processingTime: 10,
      model: 'fallback-rules',
    };
  }

  /**
   * Extraction avec prompts personnalises par type
   */
  async extractWithCustomPrompt(
    workspace: WorkspaceReasoning,
    customPrompt: string
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      const available = await this.isAvailable();
      if (!available) {
        return this.fallbackExtraction(workspace);
      }

      const response = await this.ollama.generateJSON<{
        facts: ExtractedFact[];
        contexts: ExtractedContext[];
        obligations: ExtractedObligation[];
      }>(customPrompt, SYSTEM_PROMPT);

      const allConfidences = [
        ...response.facts.map(f => f.confidence),
        ...response.contexts.map(c => c.confidence),
        ...response.obligations.map(o => o.confidence),
      ];

      const globalConfidence = allConfidences.length > 0
        ? allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length
        : 0;

      return {
        success: true,
        facts: response.facts || [],
        contexts: response.contexts || [],
        obligations: response.obligations || [],
        confidence: globalConfidence,
        processingTime: Date.now() - startTime,
        model: 'llama3.2:3b',
      };

    } catch (error) {
      return {
        success: false,
        facts: [],
        contexts: [],
        obligations: [],
        confidence: 0,
        processingTime: Date.now() - startTime,
        model: 'none',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Validation de l'extraction avant sauvegarde
   */
  validateExtraction(result: ExtractionResult): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Verifier confiance globale
    if (result.confidence < 0.5) {
      warnings.push(`Confiance globale faible: ${(result.confidence * 100).toFixed(0)}%`);
    }

    // Verifier nombre d'entites
    if (result.facts.length === 0) {
      warnings.push('Aucun fait extrait - Verification manuelle recommandee');
    }

    if (result.contexts.length === 0) {
      warnings.push('Aucun contexte identifie - Analyse juridique requise');
    }

    if (result.obligations.length === 0) {
      warnings.push('Aucune obligation detectee - Verifier les delais manuellement');
    }

    // Verifier coherence des dates
    const futureDates = result.facts.filter(f => {
      if (f.label.toLowerCase().includes('date')) {
        const dateValue = new Date(f.value);
        return dateValue > new Date('2030-01-01');
      }
      return false;
    });

    if (futureDates.length > 0) {
      warnings.push('Dates futures suspectes detectees');
    }

    // Verifier deadlines critiques
    const criticalDeadlines = result.obligations.filter(o => o.critical && o.deadline);
    const now = new Date();
    const urgentDeadlines = criticalDeadlines.filter(o => {
      const deadline = new Date(o.deadline!);
      const diffDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays < 7;
    });

    if (urgentDeadlines.length > 0) {
      warnings.push(`️ ${urgentDeadlines.length} deadline(s) critique(s) < 7 jours`);
    }

    return {
      valid: warnings.length < 3, // Max 2 warnings = OK
      warnings,
    };
  }
}

// Singleton pour reutilisation
export const workspaceExtractionService = new WorkspaceExtractionService();
