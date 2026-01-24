/**
 * CESEDA Case Analyzer - AI-Powered Legal Analysis
 * 
 * Uses Ollama to analyze immigration law cases and provide:
 * - Risk assessment
 * - Deadline detection
 * - Required documents
 * - Success probability
 */

import { OllamaClient } from '@/lib/ai/ollama-client';
import { logger } from '@/lib/logger';

interface CESEDAAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  urgentActions: string[];
  requiredDocuments: string[];
  deadlines: {
    type: string;
    description: string;
    daysRemaining: number;
  }[];
  successProbability: number;
  recommendations: string[];
  legalBasis: string[];
}

export class CESEDAAnalyzer {
  private ai: OllamaClient;

  constructor() {
    this.ai = new OllamaClient(
      process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      process.env.OLLAMA_MODEL || 'llama3.2:3b'
    );
  }

  /**
   * Analyze a CESEDA case with AI
   */
  async analyzeCase(params: {
    caseType: 'OQTF' | 'NATURALISATION' | 'ASILE' | 'TITRE_SEJOUR';
    clientSituation: string;
    documents: string[];
    notificationDate?: Date;
  }): Promise<CESEDAAnalysis> {
    logger.info('Starting CESEDA case analysis', {
      caseType: params.caseType,
      documentCount: params.documents.length,
    });

    // Check AI availability
    const isAvailable = await this.ai.isAvailable();
    if (!isAvailable) {
      logger.warn('Ollama not available, using fallback analysis');
      return this.fallbackAnalysis(params);
    }

    try {
      const systemPrompt = `Tu es un expert en droit francais des etrangers (CESEDA).
Analyse les cas d'immigration avec precision juridique.
Fournis toujours des recommandations conformes au CESEDA.
Reponds UNIQUEMENT en JSON valide.`;

      const userPrompt = `Analyse ce dossier CESEDA:

Type: ${params.caseType}
Situation: ${params.clientSituation}
Documents disponibles: ${params.documents.join(', ')}
${params.notificationDate ? `Date de notification: ${params.notificationDate.toISOString()}` : ''}

Fournis une analyse JSON avec:
{
  "riskLevel": "low|medium|high|critical",
  "confidence": 0.0-1.0,
  "urgentActions": ["action1", "action2"],
  "requiredDocuments": ["doc1", "doc2"],
  "deadlines": [{"type": "recours", "description": "Delai CESEDA", "daysRemaining": 30}],
  "successProbability": 0.0-1.0,
  "recommendations": ["recommandation1"],
  "legalBasis": ["Article L313-11 CESEDA"]
}`;

      const analysis = await this.ai.generateJSON<CESEDAAnalysis>(
        userPrompt,
        systemPrompt
      );

      logger.info('CESEDA analysis completed', {
        riskLevel: analysis.riskLevel,
        confidence: analysis.confidence,
        urgentActionsCount: analysis.urgentActions.length,
      });

      return analysis;
    } catch (error) {
      logger.error('AI analysis failed, using fallback', error);
      return this.fallbackAnalysis(params);
    }
  }

  /**
   * Quick risk assessment without full analysis
   */
  async quickRiskCheck(caseType: string, urgencyLevel: string): Promise<{
    risk: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  }> {
    // Critical cases
    if (caseType === 'OQTF' || urgencyLevel === 'critique') {
      return {
        risk: 'critical',
        message: 'Delais CESEDA critiques - Action immediate requise',
      };
    }

    // High risk cases
    if (caseType === 'ASILE' || urgencyLevel === 'haute') {
      return {
        risk: 'high',
        message: 'Priorite elevee - Traitement rapide recommande',
      };
    }

    // Medium risk
    if (urgencyLevel === 'normale') {
      return {
        risk: 'medium',
        message: 'Traitement standard dans les delais reglementaires',
      };
    }

    return {
      risk: 'low',
      message: 'Cas standard - Suivi regulier',
    };
  }

  /**
   * Extract deadlines from case description
   */
  async extractDeadlines(description: string, notificationDate?: Date): Promise<{
    type: string;
    date: Date;
    daysRemaining: number;
  }[]> {
    const deadlines: { type: string; date: Date; daysRemaining: number }[] = [];

    // OQTF deadlines (48h or 30 days)
    if (description.toLowerCase().includes('oqtf')) {
      if (notificationDate) {
        const deadline48h = new Date(notificationDate);
        deadline48h.setHours(deadline48h.getHours() + 48);
        
        const deadline30j = new Date(notificationDate);
        deadline30j.setDate(deadline30j.getDate() + 30);

        const now = new Date();
        deadlines.push({
          type: 'Depart volontaire (si applicable)',
          date: deadline48h,
          daysRemaining: Math.ceil((deadline48h.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        });

        deadlines.push({
          type: 'Recours contentieux',
          date: deadline30j,
          daysRemaining: Math.ceil((deadline30j.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        });
      }
    }

    return deadlines;
  }

  /**
   * Fallback analysis when AI is unavailable
   */
  private fallbackAnalysis(params: {
    caseType: string;
    clientSituation: string;
    documents: string[];
  }): CESEDAAnalysis {
    const isCritical = params.caseType === 'OQTF';
    const isUrgent = params.caseType === 'ASILE';

    return {
      riskLevel: isCritical ? 'critical' : isUrgent ? 'high' : 'medium',
      confidence: 0.6,
      urgentActions: isCritical
        ? ['Verifier delais de recours', 'Preparer recours contentieux']
        : ['Rassembler documents', 'Preparer rendez-vous'],
      requiredDocuments: this.getDefaultDocuments(params.caseType),
      deadlines: [],
      successProbability: 0.5,
      recommendations: [
        'Consultation juridique recommandee',
        'Verifier conformite dossier',
      ],
      legalBasis: this.getLegalBasis(params.caseType),
    };
  }

  private getDefaultDocuments(caseType: string): string[] {
    const common = ['Passeport', 'Justificatif de domicile', 'Photos d\'identite'];

    switch (caseType) {
      case 'OQTF':
        return [...common, 'Decision OQTF', 'Justificatifs d\'attaches en France'];
      case 'NATURALISATION':
        return [...common, 'Acte de naissance', 'Justificatifs de revenus', 'Diplomes'];
      case 'ASILE':
        return [...common, 'Recit de persecution', 'Preuves de menaces'];
      case 'TITRE_SEJOUR':
        return [...common, 'Contrat de travail ou attestation', 'Bulletins de salaire'];
      default:
        return common;
    }
  }

  private getLegalBasis(caseType: string): string[] {
    switch (caseType) {
      case 'OQTF':
        return ['Art. L511-1 CESEDA', 'Art. L512-1 CESEDA'];
      case 'NATURALISATION':
        return ['Art. 21-2 Code civil', 'Art. L111-1 CESEDA'];
      case 'ASILE':
        return ['Art. L711-1 CESEDA', 'Convention de Geneve'];
      case 'TITRE_SEJOUR':
        return ['Art. L313-11 CESEDA', 'Art. L313-10 CESEDA'];
      default:
        return ['CESEDA'];
    }
  }
}

// Singleton export
export const cesedaAnalyzer = new CESEDAAnalyzer();
