/**
 * Monitoring IA – corrélation longueur de texte / confiance du modèle
 *
 * L'IA observe que la précision chute sur les textes longs, les scans mal OCRisés,
 * ou les textes avec beaucoup de caractères spéciaux.
 * Ce module permet de détecter ces patterns avant qu'ils n'impactent les utilisateurs.
 *
 * Usage :
 *   const result = await callOllama(prompt);
 *   logAIQuality({
 *     model: 'llama3.2',
 *     inputLength: prompt.length,
 *     outputLength: result.length,
 *     confidence: result.confidence,
 *     workflow: 'summarize_email',
 *     latencyMs: elapsed,
 *   });
 */

export type AIQualityEntry = {
  model: string;
  workflow: string;
  inputLength: number;
  outputLength: number;
  confidence: number;       // 0.0 – 1.0 ; estimé ou retourné par le modèle
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  hasSpecialChars?: boolean; // accents, caractères non-ASCII
  hasNumbers?: boolean;      // dates, numéros de dossier
  tenantId?: string;
  userId?: string;
  timestamp?: number;
};

type CorrelationStats = {
  totalCalls: number;
  avgConfidence: number;
  avgLatencyMs: number;
  confidenceByLength: Array<{ bucket: string; avgConfidence: number; count: number }>;
  slowCalls: number;  // > 8s
  lowConfidenceCalls: number; // < 0.6
};

const STORAGE_KEY = 'memolib:ai_quality';
const MAX_ENTRIES = 200;

// ─── Seuils de qualité ────────────────────────────────────────────────────────
const THRESHOLDS = {
  LOW_CONFIDENCE: 0.6,
  LONG_TEXT_CHARS: 4000,   // ~2000 mots en français
  SLOW_RESPONSE_MS: 8000,
  SPECIAL_CHAR_RATIO: 0.05, // 5% de caractères non-ASCII → texte suspect
};

/**
 * Calcule un score de confiance estimé basé sur les caractéristiques du texte.
 * Utile quand le modèle ne retourne pas de score de confiance.
 */
export function estimateConfidence(text: string, output: string): number {
  let score = 1.0;

  // Pénalité pour texte très long
  if (text.length > THRESHOLDS.LONG_TEXT_CHARS) {
    score -= 0.15;
  }
  if (text.length > THRESHOLDS.LONG_TEXT_CHARS * 2) {
    score -= 0.1;
  }

  // Pénalité pour ratio élevé de caractères spéciaux (scan mal OCRisé)
  const specialChars = (text.match(/[^\x00-\x7F\u00C0-\u024F]/g) || []).length;
  const ratio = specialChars / text.length;
  if (ratio > THRESHOLDS.SPECIAL_CHAR_RATIO) {
    score -= 0.2;
  }

  // Pénalité si l'output est trop court par rapport à l'input (modèle a peut-être abandonné)
  if (output.length < 50 && text.length > 500) {
    score -= 0.2;
  }

  // Pénalité si l'output contient des marqueurs d'incertitude
  const uncertaintyMarkers = [
    'je ne sais pas',
    "je n'ai pas",
    'insufficient',
    'unable to',
    'cannot determine',
    'unclear',
  ];
  const lowerOutput = output.toLowerCase();
  if (uncertaintyMarkers.some((m) => lowerOutput.includes(m))) {
    score -= 0.25;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Analyse les caractéristiques d'un texte pour enrichir les métriques.
 */
export function analyzeTextFeatures(text: string) {
  const specialCharsCount = (text.match(/[^\x00-\x7F\u00C0-\u024F]/g) || []).length;
  return {
    hasSpecialChars: specialCharsCount / text.length > 0.02,
    hasNumbers: /\d{4,}/.test(text), // séquences de 4+ chiffres (dates, numéros)
    estimatedWordCount: text.split(/\s+/).length,
    inputLength: text.length,
  };
}

/**
 * Enregistre une entrée de qualité IA.
 */
export function logAIQuality(entry: AIQualityEntry): void {
  const e: AIQualityEntry = { ...entry, timestamp: entry.timestamp ?? Date.now() };

  // Alertes en développement
  if (process.env.NODE_ENV === 'development') {
    if (entry.confidence < THRESHOLDS.LOW_CONFIDENCE) {
      console.warn(
        `[AI Quality] ⚠️  Confiance faible (${entry.confidence.toFixed(2)}) sur ${entry.workflow}`,
        `– texte: ${entry.inputLength} chars`
      );
    }
    if (entry.latencyMs > THRESHOLDS.SLOW_RESPONSE_MS) {
      console.warn(
        `[AI Quality] 🐢 Réponse lente (${entry.latencyMs}ms) sur ${entry.workflow}`
      );
    }
    if (entry.inputLength > THRESHOLDS.LONG_TEXT_CHARS) {
      console.info(
        `[AI Quality] 📏 Texte long (${entry.inputLength} chars) → risque de précision réduite`
      );
    }
  }

  // Persistance locale
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const entries: AIQualityEntry[] = raw ? JSON.parse(raw) : [];
      entries.push(e);
      if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Silencieux
    }
  }

  // Envoi asynchrone vers l'API metrics
  if (typeof fetch !== 'undefined') {
    fetch('/api/metrics/ai-quality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(e),
      keepalive: true,
    }).catch(() => {});
  }
}

/**
 * Calcule les statistiques de corrélation longueur / confiance.
 */
export function getAIQualityStats(): CorrelationStats {
  if (typeof window === 'undefined') {
    return {
      totalCalls: 0,
      avgConfidence: 0,
      avgLatencyMs: 0,
      confidenceByLength: [],
      slowCalls: 0,
      lowConfidenceCalls: 0,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const entries: AIQualityEntry[] = raw ? JSON.parse(raw) : [];

    if (entries.length === 0) {
      return {
        totalCalls: 0,
        avgConfidence: 0,
        avgLatencyMs: 0,
        confidenceByLength: [],
        slowCalls: 0,
        lowConfidenceCalls: 0,
      };
    }

    const buckets: Record<string, { sum: number; count: number }> = {
      '0-500': { sum: 0, count: 0 },
      '500-2000': { sum: 0, count: 0 },
      '2000-4000': { sum: 0, count: 0 },
      '4000-8000': { sum: 0, count: 0 },
      '8000+': { sum: 0, count: 0 },
    };

    let totalConf = 0;
    let totalLatency = 0;
    let slowCalls = 0;
    let lowConf = 0;

    for (const e of entries) {
      totalConf += e.confidence;
      totalLatency += e.latencyMs;
      if (e.latencyMs > THRESHOLDS.SLOW_RESPONSE_MS) slowCalls++;
      if (e.confidence < THRESHOLDS.LOW_CONFIDENCE) lowConf++;

      const len = e.inputLength;
      const bucket =
        len < 500 ? '0-500' :
        len < 2000 ? '500-2000' :
        len < 4000 ? '2000-4000' :
        len < 8000 ? '4000-8000' : '8000+';

      buckets[bucket].sum += e.confidence;
      buckets[bucket].count++;
    }

    return {
      totalCalls: entries.length,
      avgConfidence: totalConf / entries.length,
      avgLatencyMs: totalLatency / entries.length,
      confidenceByLength: Object.entries(buckets)
        .filter(([, v]) => v.count > 0)
        .map(([bucket, v]) => ({
          bucket,
          avgConfidence: v.sum / v.count,
          count: v.count,
        })),
      slowCalls,
      lowConfidenceCalls: lowConf,
    };
  } catch {
    return {
      totalCalls: 0,
      avgConfidence: 0,
      avgLatencyMs: 0,
      confidenceByLength: [],
      slowCalls: 0,
      lowConfidenceCalls: 0,
    };
  }
}
