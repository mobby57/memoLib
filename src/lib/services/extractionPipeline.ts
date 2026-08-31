/**
 * Pipeline d'extraction avec validation avancée
 * Orchestre : extraction → normalisation → validation → correction → décision
 */

import { logger } from '@/lib/logger';
import { dateValidator, getViolatedRuleIds } from '@/lib/legal/dateValidator';
import { dateCorrector } from '@/lib/legal/dateCorrector';
import type { ExtractedDates, ValidationResult } from '@/lib/legal/dateValidator';

export interface ExtractionResult {
  raw: ExtractedDates;
  validated: ExtractedDates;
  validation: ValidationResult;
  correctionsApplied: string[];
  humanReviewRequired: boolean;
  finalConfidence: number;
}

export class ExtractionPipeline {
  /**
   * Exécute le pipeline complet
   */
  process(
    rawDates: ExtractedDates,
    context?: { source?: string; confidence?: number; documentType?: string }
  ): ExtractionResult {
    // 0. Normalisation : s'assurer qu'une deadline existe (défaut si manquante)
    let normalized = { ...rawDates };
    const corrections: string[] = [];

    if (!normalized.deadlineDate && normalized.notificationDate) {
      const notif = new Date(normalized.notificationDate);
      notif.setDate(notif.getDate() + 30);
      normalized.deadlineDate = notif.toISOString().split('T')[0];
      corrections.push('DEADLINE_DEFAULT_30_DAYS');
      logger.info('Deadline par défaut ajoutée', { deadline: normalized.deadlineDate });
    }

    // 1. Validation initiale
    const validation = dateValidator.validate(normalized, context);
    const violatedRules = getViolatedRuleIds(validation);

    let finalDates = { ...normalized };
    let correctionsApplied = [...corrections];
    let finalConfidence = validation.confidence;

    // 2. Si des règles sont violées, tenter une correction
    if (violatedRules.length > 0) {
      logger.warn('Dates extraites incohérentes, tentative de correction', {
        violatedRules,
        raw: normalized,
        context,
      });

      const correction = dateCorrector.correct(normalized, violatedRules);
      finalDates = correction.corrected;
      correctionsApplied.push(...correction.applied);
      finalConfidence = Math.min(validation.confidence, correction.confidence);

      // 3. Re‑validation après correction
      const revalidated = dateValidator.validate(finalDates, {
        ...context,
        corrected: true,
      });
      const revalidatedViolated = getViolatedRuleIds(revalidated);
      if (revalidatedViolated.length === 0) {
        logger.info('Dates corrigées avec succès', {
          applied: correction.applied,
          finalDates,
          confidence: finalConfidence,
        });
      } else {
        logger.error('Échec de la correction automatique', {
          stillViolated: revalidatedViolated,
          finalDates,
        });
      }
    }

    // 4. Décision : revue humaine ?
    const humanReviewRequired = finalConfidence < 0.7 || validation.errors.length > 0;

    return {
      raw: rawDates,
      validated: finalDates,
      validation,
      correctionsApplied,
      humanReviewRequired,
      finalConfidence,
    };
  }
}

export const extractionPipeline = new ExtractionPipeline();
