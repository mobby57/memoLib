import type { LegalPack, MatchResult } from '../types';
import { ALL_PACKS } from '../pack-registry';

/**
 * Détecte le ou les packs applicables à partir d'un texte
 * (email, courrier, note). Retourne les matches triés par confiance.
 */
export function matchProcedures(text: string): MatchResult[] {
  if (!text || text.trim().length === 0) return [];

  const results: MatchResult[] = [];

  for (const pack of ALL_PACKS) {
    const matchedPatterns: string[] = [];
    let confidence = 0;

    for (const pattern of pack.riskPatterns) {
      const regex = new RegExp(pattern.regex, 'i');
      if (regex.test(text)) {
        matchedPatterns.push(pattern.regex);
        confidence += pattern.level === 'critical' ? 0.5 : 0.3;
      }
    }

    // Bonus si le label du pack apparaît
    if (text.toLowerCase().includes(pack.label.toLowerCase())) {
      confidence += 0.4;
    }

    if (matchedPatterns.length > 0) {
      results.push({
        pack,
        confidence: Math.min(confidence, 1),
        matchedPatterns,
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Retourne le pack le plus probable (ou null).
 */
export function guessProcedure(text: string): LegalPack | null {
  const results = matchProcedures(text);
  return results.length > 0 ? results[0].pack : null;
}