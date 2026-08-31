/**
 * Service de fallback IA avec approche de vote
 * Combine : IA (Ollama/Cloudflare) + regex + règles métier
 * Retourne le résultat le plus fiable
 */

import { logger } from '@/lib/logger';

export interface ExtractionSource {
  value: any;
  confidence: number;
  source: 'ia' | 'regex' | 'rule';
  metadata?: any;
}

export interface VoteResult<T> {
  value: T | null;
  confidence: number;
  sources: ExtractionSource[];
  selectedSource: 'ia' | 'regex' | 'rule' | 'fallback';
  humanReviewRequired: boolean;
}

export class FallbackService {
  /**
   * Vote entre plusieurs sources pour une date
   */
  voteDate(
    iaValue: string | null,
    regexValue: string | null,
    ruleValue: string | null,
    context?: any
  ): VoteResult<string> {
    const sources: ExtractionSource[] = [];

    if (iaValue) {
      sources.push({
        value: iaValue,
        confidence: 0.9,
        source: 'ia',
        metadata: { model: 'ollama' },
      });
    }
    if (regexValue) {
      sources.push({
        value: regexValue,
        confidence: 0.8,
        source: 'regex',
        metadata: { pattern: 'date' },
      });
    }
    if (ruleValue) {
      sources.push({
        value: ruleValue,
        confidence: 0.7,
        source: 'rule',
        metadata: { rule: 'default_30_days' },
      });
    }

    // Cas : aucune source
    if (sources.length === 0) {
      return {
        value: null,
        confidence: 0,
        sources: [],
        selectedSource: 'fallback',
        humanReviewRequired: true,
      };
    }

    // Cas : une seule source → pas de désaccord
    if (sources.length === 1) {
      return {
        value: sources[0].value,
        confidence: sources[0].confidence,
        sources,
        selectedSource: sources[0].source,
        humanReviewRequired: false,
      };
    }

    // Cas : plusieurs sources
    const values = sources.map(s => s.value);
    const allSame = values.every(v => v === values[0]);

    if (allSame) {
      // Accord parfait
      const avgConfidence = sources.reduce((acc, s) => acc + s.confidence, 0) / sources.length;
      return {
        value: values[0],
        confidence: Math.min(1, avgConfidence + 0.1),
        sources,
        selectedSource: 'ia',
        humanReviewRequired: false,
      };
    }

    // Désaccord : on prend la valeur avec la plus haute confiance
    const best = sources.reduce((a, b) => (a.confidence > b.confidence ? a : b));
    return {
      value: best.value,
      confidence: best.confidence * 0.8,
      sources,
      selectedSource: best.source,
      humanReviewRequired: true,
    };
  }

  /**
   * Vote entre plusieurs sources pour un type de dossier
   */
  voteType(
    iaType: string | null,
    regexType: string | null,
    context?: any
  ): VoteResult<string> {
    const sources: ExtractionSource[] = [];

    if (iaType) {
      sources.push({ value: iaType, confidence: 0.85, source: 'ia' });
    }
    if (regexType) {
      sources.push({ value: regexType, confidence: 0.75, source: 'regex' });
    }

    if (sources.length === 0) {
      return {
        value: null,
        confidence: 0,
        sources: [],
        selectedSource: 'fallback',
        humanReviewRequired: true,
      };
    }

    if (sources.length === 1) {
      return {
        value: sources[0].value,
        confidence: sources[0].confidence,
        sources,
        selectedSource: sources[0].source,
        humanReviewRequired: false,
      };
    }

    const values = sources.map(s => s.value);
    const allSame = values.every(v => v === values[0]);

    if (allSame) {
      return {
        value: values[0],
        confidence: 0.9,
        sources,
        selectedSource: 'ia',
        humanReviewRequired: false,
      };
    }

    const best = sources.reduce((a, b) => (a.confidence > b.confidence ? a : b));
    return {
      value: best.value,
      confidence: best.confidence * 0.7,
      sources,
      selectedSource: best.source,
      humanReviewRequired: true,
    };
  }
}

export const fallbackService = new FallbackService();
