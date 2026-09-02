/**
 * Middleware d'isolation IA — Appliqué automatiquement avant tout envoi au LLM.
 * 
 * OBLIGATION LÉGALE:
 * - Art. 66-5 Loi 71-1130 (secret professionnel avocat)
 * - Art. 9 RGPD (données sensibles)
 * - Privacy by design
 * 
 * Ce module intercepte les prompts AVANT envoi au modèle et :
 * 1. Détecte les données personnelles (regex patterns)
 * 2. Les remplace par des placeholders
 * 3. Conserve un mapping pour la re-identification côté serveur si nécessaire
 * 
 * IMPORTANT: Les données anonymisées ne quittent JAMAIS le serveur sous forme identifiable.
 */

// Patterns de détection PII (Personally Identifiable Information)
const PII_PATTERNS: { pattern: RegExp; replacement: string; category: string }[] = [
  // Emails
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL_REDACTED]', category: 'email' },
  // Téléphones français
  { pattern: /(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/g, replacement: '[TEL_REDACTED]', category: 'phone' },
  // Numéros de sécurité sociale
  { pattern: /[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}/g, replacement: '[NSS_REDACTED]', category: 'nss' },
  // IBAN
  { pattern: /[A-Z]{2}\d{2}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{0,4}/g, replacement: '[IBAN_REDACTED]', category: 'financial' },
  // Numéro de passeport
  { pattern: /\b\d{2}[A-Z]{2}\d{5}\b/g, replacement: '[PASSEPORT_REDACTED]', category: 'identity' },
  // Numéro carte titre de séjour
  { pattern: /\b\d{10}\b/g, replacement: '[TITRE_SEJOUR_REDACTED]', category: 'identity' },
  // Dates de naissance (format DD/MM/YYYY ou DD-MM-YYYY)
  { pattern: /\b(0[1-9]|[12]\d|3[01])[\/\-](0[1-9]|1[0-2])[\/\-](19|20)\d{2}\b/g, replacement: '[DATE_NAISSANCE_REDACTED]', category: 'personal' },
  // Adresses (numéro + rue — heuristique)
  { pattern: /\b\d{1,4}[\s,]+(rue|avenue|boulevard|impasse|place|chemin|allée|passage)\s+[A-Za-zÀ-ÿ\s-]{3,50}\b/gi, replacement: '[ADRESSE_REDACTED]', category: 'address' },
  // Code postal + ville
  { pattern: /\b\d{5}\s+[A-Za-zÀ-ÿ\s-]{2,30}\b/g, replacement: '[CP_VILLE_REDACTED]', category: 'address' },
  // --- NOM PROPRE DETECTION (NER-lite) ---
  // Patterns "M./Mme/Maître + Nom" (français)
  { pattern: /\b(?:M\.|Mme|Mlle|Mr|Mrs|Maître|Me|Docteur|Dr)[\s]+[A-ZÀ-Ÿ][a-zà-ÿ]+(?:[\s-][A-ZÀ-Ÿ][a-zà-ÿ]+){0,2}\b/g, replacement: '[NOM_REDACTED]', category: 'name' },
  // Patterns "mon client/ma cliente + Nom"
  { pattern: /\b(?:mon\s+client|ma\s+cliente|le\s+requérant|la\s+requérante|l'intéressé|l'intéressée)[\s,:]+[A-ZÀ-Ÿ][a-zà-ÿ]+(?:[\s-][A-ZÀ-Ÿ][a-zà-ÿ]+){0,2}/gi, replacement: '[CLIENT_REDACTED]', category: 'name' },
  // Patterns "Prénom Nom" (2+ mots commençant par majuscule, hors début de phrase)
  { pattern: /(?<=[\s,;:(])[A-ZÀ-Ÿ][a-zà-ÿ]+\s+[A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)?(?=[\s,;:).])/g, replacement: '[PERSONNE_REDACTED]', category: 'name' },
  // Numéro étranger AGDREF/ANEF
  { pattern: /\b\d{4}[A-Z]\d{5,7}\b/g, replacement: '[AGDREF_REDACTED]', category: 'identity' },
  // Numéro de visa
  { pattern: /\b[A-Z]{2}\d{7,9}\b/g, replacement: '[VISA_REDACTED]', category: 'identity' },
];

export interface SanitizationResult {
  sanitizedText: string;
  redactedCount: number;
  categories: string[];
  /** Mapping pour re-identification (à ne JAMAIS envoyer au LLM) */
  redactionMap: Map<string, string>;
}

/**
 * Anonymise un texte brut avant envoi au LLM.
 * Utilisé par le HybridAIClient comme couche obligatoire.
 */
export function sanitizePromptForAI(text: string): SanitizationResult {
  if (!text) return { sanitizedText: '', redactedCount: 0, categories: [], redactionMap: new Map() };

  let sanitized = text;
  let redactedCount = 0;
  const categories = new Set<string>();
  const redactionMap = new Map<string, string>();
  let placeholderIndex = 0;

  for (const { pattern, replacement, category } of PII_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
    
    sanitized = sanitized.replace(pattern, (match) => {
      redactedCount++;
      categories.add(category);
      const key = `${replacement}_${placeholderIndex++}`;
      redactionMap.set(key, match);
      return key;
    });
  }

  return {
    sanitizedText: sanitized,
    redactedCount,
    categories: [...categories],
    redactionMap,
  };
}

/**
 * Anonymise un objet structuré (dossier, client) avant envoi au LLM.
 * Conserve uniquement les champs métier non-identifiants.
 */
export function sanitizeStructuredDataForAI(data: Record<string, unknown>): Record<string, unknown> {
  if (!data) return {};

  const SENSITIVE_KEYS = new Set([
    'firstName', 'lastName', 'prenom', 'nom', 'nomNaissance',
    'email', 'emailSecondaire', 'telephone', 'phone', 'phoneSecondaire',
    'address', 'adresse', 'adresseCorrespondance',
    'passportNumber', 'idCardNumber', 'titreSejourNumber',
    'numeroSecuriteSociale', 'iban', 'bic', 'ssn',
    'lieuNaissance', 'contactUrgenceNom', 'contactUrgenceTel',
    'dateOfBirth', 'dateNaissance', 'nationality', 'nationalite',
    'password', 'hashedPassword', 'token', 'secret',
  ]);

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      result[key] = sanitizePromptForAI(value).sanitizedText;
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => {
        if (typeof item === 'string') return sanitizePromptForAI(item).sanitizedText;
        if (typeof item === 'object' && item !== null) {
          return sanitizeStructuredDataForAI(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeStructuredDataForAI(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Vérifie si un texte contient des PII non-anonymisées.
 * Utile pour un check de sécurité avant envoi.
 */
export function containsPII(text: string): { hasPII: boolean; categories: string[] } {
  const categories: string[] = [];

  for (const { pattern, category } of PII_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      categories.push(category);
    }
  }

  return { hasPII: categories.length > 0, categories };
}
