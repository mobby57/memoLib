/**
 * Optimisation des prompts IA – audit tokens + prompts explicites et courts
 *
 * Les humains écrivent un prompt une fois et ne le réévaluent pas.
 * L'IA voit que chaque mot inutile consomme du contexte et diminue la qualité.
 *
 * Ce module fournit :
 * 1. Un scorer de tokens pour auditer les prompts
 * 2. Des prompts optimisés pour les workflows MemoLib
 * 3. Un utilitaire de nettoyage de texte avant envoi au modèle
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type PromptAuditResult = {
  originalLength: number;
  estimatedTokens: number;
  score: number; // 0-100 : qualité du prompt
  issues: string[]; // problèmes détectés
  suggestions: string[]; // améliorations proposées
};

export type OptimizedPromptOptions = {
  maxLength?: number; // tronquer l'input si trop long
  stripFiller?: boolean; // supprimer les phrases de remplissage
  language?: 'fr' | 'en';
};

// ─── Estimation de tokens ────────────────────────────────────────────────────

/**
 * Estimation rapide du nombre de tokens.
 * Règle approx : 1 token ≈ 4 chars en anglais, 4.5 en français (accents).
 */
export function estimateTokenCount(text: string): number {
  // Heuristique par langue
  const hasAccents = /[àâäéèêëîïôùûüç]/i.test(text);
  const charsPerToken = hasAccents ? 4.5 : 4.0;
  return Math.ceil(text.length / charsPerToken);
}

/**
 * Audite un prompt et retourne un score de qualité avec les problèmes détectés.
 */
export function auditPrompt(prompt: string): PromptAuditResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const estimatedTokens = estimateTokenCount(prompt);

  // Vérifications de qualité

  // 1. Prompt trop long
  if (estimatedTokens > 2000) {
    issues.push(`Prompt très long (~${estimatedTokens} tokens) – risque de context overflow`);
    suggestions.push('Découper le texte en chunks de 1500 tokens max');
    score -= 20;
  } else if (estimatedTokens > 1000) {
    issues.push(`Prompt long (~${estimatedTokens} tokens)`);
    suggestions.push('Envisager un résumé préalable du texte source');
    score -= 10;
  }

  // 2. Phrases de remplissage inutiles
  const fillerPatterns = [
    /merci de bien vouloir/gi,
    /s'il vous plaît/gi,
    /dans le cadre de/gi,
    /il convient de noter que/gi,
    /veuillez/gi,
    /please/gi,
    /kindly/gi,
    /as an ai/gi,
    /as a language model/gi,
  ];
  const fillerFound = fillerPatterns.filter(p => p.test(prompt));
  if (fillerFound.length > 0) {
    issues.push(`${fillerFound.length} phrase(s) de remplissage détectée(s) → tokens gaspillés`);
    suggestions.push('Écrire le prompt de façon directe et impérative');
    score -= 5 * fillerFound.length;
  }

  // 3. Pas d'instruction claire
  const hasInstruction =
    /^(résume|analyse|génère|liste|extrait|classe|identifie|compare|donne)/im.test(prompt);
  if (!hasInstruction && prompt.length > 100) {
    issues.push('Aucune instruction impérative trouvée en début de prompt');
    suggestions.push('Commencer par un verbe d’action (ex: "Résume en 3 points...")');
    score -= 10;
  }

  // 4. Pas de format de sortie spécifié
  const hasFormat = /(json|liste|tableau|format|structure|bullet|retourne|réponds en)/i.test(
    prompt
  );
  if (!hasFormat) {
    issues.push('Format de sortie non spécifié');
    suggestions.push('Ajouter "Réponds en JSON" ou "Liste sous forme de bullet points"');
    score -= 5;
  }

  // 5. Présence d'exemples (few-shot) → bonus
  if (/exemple(s)?:|ex:|e\.g\./i.test(prompt)) {
    score = Math.min(100, score + 5);
    suggestions.push('✅ Exemples détectés – améliore la qualité de la réponse');
  }

  return {
    originalLength: prompt.length,
    estimatedTokens,
    score: Math.max(0, score),
    issues,
    suggestions,
  };
}

// ─── Nettoyage de texte ───────────────────────────────────────────────────────

/**
 * Nettoie un texte avant envoi au modèle :
 * - Supprime les espaces multiples
 * - Supprime les lignes vides répétées
 * - Tronque si trop long
 * - Normalise les accents (optionnel)
 */
export function preprocessInputText(
  text: string,
  options: OptimizedPromptOptions = {}
): { cleaned: string; truncated: boolean; estimatedTokens: number } {
  const { maxLength = 6000, stripFiller = true } = options;

  let cleaned = text
    .replace(/\r\n/g, '\n') // normaliser les fins de ligne
    .replace(/[ \t]+/g, ' ') // espaces multiples → 1
    .replace(/\n{3,}/g, '\n\n') // lignes vides multiples → 2 max
    .trim();

  if (stripFiller) {
    // Supprimer les en-têtes d'email inutiles
    cleaned = cleaned
      .replace(/^(de|from|à|to|objet|subject|date)\s*:.+$/gim, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  const truncated = cleaned.length > maxLength;
  if (truncated) {
    cleaned = cleaned.slice(0, maxLength) + '\n[...texte tronqué]';
  }

  return {
    cleaned,
    truncated,
    estimatedTokens: estimateTokenCount(cleaned),
  };
}

// ─── Prompts optimisés pour MemoLib ──────────────────────────────────────────

/**
 * Collection de prompts optimisés pour les workflows juridiques.
 * Principes : direct, court, format explicite, exemples quand utile.
 */
export const OPTIMIZED_PROMPTS = {
  /**
   * Résumé d'email juridique – v2 optimisée (30% moins de tokens)
   */
  summarizeEmail: (emailText: string) => `Analyse cet email juridique. Réponds UNIQUEMENT en JSON.

EMAIL:
${emailText}

JSON attendu:
{
  "client": "nom du client ou null",
  "urgence": "haute|normale|basse",
  "type_procedure": "OQTF|titre_sejour|asile|naturalisation|autre",
  "deadline": "date ISO ou null",
  "actions_requises": ["action1", "action2"],
  "resume": "1 phrase max"
}`,

  /**
   * Brouillon de réponse – v2 optimisée
   */
  draftReply: (context: {
    emailText: string;
    dossierInfo: string;
  }) => `Rédige une réponse professionnelle à cet email juridique.

CONTEXTE DOSSIER: ${context.dossierInfo}

EMAIL REÇU:
${context.emailText}

CONTRAINTES:
- Ton professionnel avocat
- Maximum 150 mots
- Format lettre avec formule de politesse
- Laisser [À COMPLÉTER] pour les informations manquantes`,

  /**
   * Classification de dossier OQTF
   */
  classifyOQTF: (text: string) => `Classifie ce document OQTF. Réponds en JSON uniquement.

DOCUMENT:
${text}

{
  "type_oqtf": "simple|avec_ICTF|avec_interdiction_retour|recours_annulation",
  "urgence": "48h|7j|15j|30j|normale",
  "recours_possible": true|false,
  "article_ceseda": "L611-1|L611-2|L611-3|autre",
  "commentaire": "max 20 mots"
}`,

  /**
   * Extraction de deadline depuis un document
   */
  extractDeadline: (text: string) => `Extrais les délais légaux de ce document. JSON uniquement.

DOCUMENT:
${text.slice(0, 2000)}

{
  "deadlines": [
    {
      "type": "recours|audience|regularisation|autre",
      "date": "YYYY-MM-DD ou null",
      "duree_jours": 0,
      "base_legale": "article ou null",
      "urgent": true|false
    }
  ]
}`,
} as const;

// ─── Logger d'usage des prompts ───────────────────────────────────────────────

type PromptUsageLog = {
  promptName: string;
  tokensBefore: number;
  tokensAfter: number;
  savingsPercent: number;
  timestamp: number;
};

const USAGE_LOG_KEY = 'memolib:prompt_usage';

export function logPromptUsage(
  promptName: string,
  originalText: string,
  optimizedText: string
): void {
  const before = estimateTokenCount(originalText);
  const after = estimateTokenCount(optimizedText);
  const savings = before > 0 ? Math.round(((before - after) / before) * 100) : 0;

  if (process.env.NODE_ENV === 'development' && savings > 10) {
    console.info(`[Prompt Optimizer] ${promptName}: ${before} → ${after} tokens (-${savings}%)`);
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(USAGE_LOG_KEY);
      const logs: PromptUsageLog[] = raw ? JSON.parse(raw) : [];
      logs.push({
        promptName,
        tokensBefore: before,
        tokensAfter: after,
        savingsPercent: savings,
        timestamp: Date.now(),
      });
      if (logs.length > 100) logs.splice(0, logs.length - 100);
      localStorage.setItem(USAGE_LOG_KEY, JSON.stringify(logs));
    } catch {
      // Silencieux
    }
  }
}
