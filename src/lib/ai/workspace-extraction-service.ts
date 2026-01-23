/**
 * WORKSPACE EXTRACTION SERVICE
 * 
 * Service d'extraction automatique IA pour WorkspaceReasoning
 * Utilise Ollama (local) pour générer Facts, Contexts, Obligations depuis sourceRaw
 * 
 * Fonctionnalités:
 * - Extraction structurée depuis email brut
 * - Prompts spécialisés CESEDA (OQTF, Naturalisation, Asile, Titre séjour)
 * - Génération JSON validé
 * - Scoring de confiance par entité
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
// PROMPTS SPÉCIALISÉS CESEDA
// ============================================

const SYSTEM_PROMPT = `Tu es un assistant juridique spécialisé en droit des étrangers (CESEDA) pour avocats français.

Ta mission est d'extraire des informations structurées depuis des emails de clients pour créer un dossier juridique.

RÈGLES STRICTES:
1. Extrais UNIQUEMENT des faits certains (dates, noms, lieux explicites)
2. Propose des contextes juridiques POSSIBLES (pas de certitude absolue)
3. Identifie les obligations légales selon le type de procédure
4. Fournis un score de confiance (0-1) pour chaque élément extrait
5. Réponds UNIQUEMENT en JSON valide (pas de texte avant/après)

TYPES DE PROCÉDURES CESEDA:
- OQTF (Obligation de Quitter le Territoire Français) → Délais critiques 48h-30 jours
- Naturalisation → Procédure longue, nombreux documents
- Asile politique → OFPRA/CNDA, urgence variable
- Titre de séjour → Préfecture, renouvellement, première demande

FORMAT DE RÉPONSE (JSON strict):
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
      "description": "OQTF avec délai de départ volontaire (Art. L511-1 CESEDA)",
      "reasoning": "Mention explicite d'une obligation de quitter le territoire avec délai",
      "certaintyLevel": "PROBABLE",
      "confidence": 0.85
    }
  ],
  "obligations": [
    {
      "description": "Déposer un recours contentieux devant le Tribunal administratif",
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

Type de procédure détecté: {procedureType}

INSTRUCTIONS:
1. Identifie les FAITS certains (dates, noms, événements explicites)
2. Propose les CONTEXTES juridiques possibles (CESEDA)
3. Détermine les OBLIGATIONS légales (délais, recours, documents)
4. Score de confiance pour chaque élément

Réponds en JSON strict (aucun texte avant/après).`;

// ============================================
// SERVICE D'EXTRACTION
// ============================================

export class WorkspaceExtractionService {
  private ollama: OllamaClient;

  constructor() {
    this.ollama = new OllamaClient();
  }

  /**
   * Vérifie si Ollama est disponible
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
      // Vérifier disponibilité Ollama
      const available = await this.isAvailable();
      if (!available) {
        return this.fallbackExtraction(workspace);
      }

      // Construire le prompt avec contexte
      const userPrompt = USER_PROMPT_TEMPLATE
        .replace('{sourceRaw}', workspace.sourceRaw)
        .replace('{procedureType}', workspace.procedureType || 'Inconnu');

      // Appeler Ollama avec prompt spécialisé
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
   * Utilise des règles simples d'extraction
   */
  private fallbackExtraction(workspace: WorkspaceReasoning): ExtractionResult {
    const facts: ExtractedFact[] = [];
    const contexts: ExtractedContext[] = [];
    const obligations: ExtractedObligation[] = [];

    const sourceRaw = workspace.sourceRaw.toLowerCase();

    // Détection simple de dates (YYYY-MM-DD)
    const dateMatches = workspace.sourceRaw.match(/\d{4}-\d{2}-\d{2}/g);
    if (dateMatches && dateMatches.length > 0) {
      facts.push({
        label: 'Date détectée',
        value: dateMatches[0],
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Extraction automatique (regex)',
        confidence: 0.6,
      });
    }

    // Détection type procédure
    if (workspace.procedureType === 'OQTF') {
      contexts.push({
        type: 'LEGAL',
        description: 'Procédure OQTF détectée - Délais critiques',
        reasoning: 'Type de procédure spécifié',
        certaintyLevel: 'PROBABLE',
        confidence: 0.7,
      });

      obligations.push({
        description: 'Vérifier le délai de recours contentieux (48h ou 30 jours)',
        mandatory: true,
        critical: true,
        legalRef: 'Art. L512-1 CESEDA',
        confidence: 0.6,
      });
    }

    // Détection mots-clés urgence
    if (sourceRaw.includes('urgent') || sourceRaw.includes('expulsion') || sourceRaw.includes('délai')) {
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
   * Extraction avec prompts personnalisés par type
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

    // Vérifier confiance globale
    if (result.confidence < 0.5) {
      warnings.push(`Confiance globale faible: ${(result.confidence * 100).toFixed(0)}%`);
    }

    // Vérifier nombre d'entités
    if (result.facts.length === 0) {
      warnings.push('Aucun fait extrait - Vérification manuelle recommandée');
    }

    if (result.contexts.length === 0) {
      warnings.push('Aucun contexte identifié - Analyse juridique requise');
    }

    if (result.obligations.length === 0) {
      warnings.push('Aucune obligation détectée - Vérifier les délais manuellement');
    }

    // Vérifier cohérence des dates
    const futureDates = result.facts.filter(f => {
      if (f.label.toLowerCase().includes('date')) {
        const dateValue = new Date(f.value);
        return dateValue > new Date('2030-01-01');
      }
      return false;
    });

    if (futureDates.length > 0) {
      warnings.push('Dates futures suspectes détectées');
    }

    // Vérifier deadlines critiques
    const criticalDeadlines = result.obligations.filter(o => o.critical && o.deadline);
    const now = new Date();
    const urgentDeadlines = criticalDeadlines.filter(o => {
      const deadline = new Date(o.deadline!);
      const diffDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays < 7;
    });

    if (urgentDeadlines.length > 0) {
      warnings.push(`⚠️ ${urgentDeadlines.length} deadline(s) critique(s) < 7 jours`);
    }

    return {
      valid: warnings.length < 3, // Max 2 warnings = OK
      warnings,
    };
  }
}

// Singleton pour réutilisation
export const workspaceExtractionService = new WorkspaceExtractionService();
