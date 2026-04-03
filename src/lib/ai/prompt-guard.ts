/**
 * AI Prompt Guard - Sanitization + PII Redaction
 *
 * P1 #1: Blocks prompt injection patterns (jailbreak, role override, system prompt leak)
 * P1 #2: Redacts PII before sending to any AI provider (Ollama, Cloudflare)
 */

// Prompt injection patterns to block
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(all\s+)?(previous|above|prior)/i,
  /you\s+are\s+now\s+(a|an|the)\s+/i,
  /act\s+as\s+(a|an|if)\s+/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /new\s+instructions?:/i,
  /system\s*prompt/i,
  /\bDAN\b/,
  /do\s+anything\s+now/i,
  /jailbreak/i,
  /bypass\s+(safety|filter|restriction|guard)/i,
  /reveal\s+(your|the)\s+(system|initial|original)\s+(prompt|instructions?)/i,
  /what\s+(are|were)\s+your\s+(original|system|initial)\s+instructions?/i,
  /repeat\s+(the|your)\s+(system|initial)\s+(prompt|message)/i,
  /\[\s*INST\s*\]/i,
  /<<\s*SYS\s*>>/i,
  /<\|im_start\|>/i,
];

// PII patterns to redact before sending to AI
const PII_REDACTIONS: Array<{ pattern: RegExp; replacement: string }> = [
  // French phone numbers
  { pattern: /(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/g, replacement: '[TELEPHONE]' },
  // International phone
  { pattern: /\+?\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}/g, replacement: '[TELEPHONE]' },
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
  // French SSN (numéro de sécurité sociale)
  { pattern: /[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}/g, replacement: '[NSS]' },
  // Passport numbers
  { pattern: /\b\d{2}[A-Z]{2}\d{5}\b/g, replacement: '[PASSEPORT]' },
  // IBAN
  { pattern: /\b[A-Z]{2}\d{2}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{0,4}\s?[\dA-Z]{0,4}\s?[\dA-Z]{0,4}\b/g, replacement: '[IBAN]' },
  // Credit card numbers
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARTE]' },
  // French postal addresses (simplified)
  { pattern: /\d{1,4}\s+(?:rue|avenue|boulevard|impasse|place|chemin|allée|passage)\s+[^\n,]{3,50}/gi, replacement: '[ADRESSE]' },
  // Date of birth patterns
  { pattern: /né(?:e)?\s+le\s+\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}/gi, replacement: 'né(e) le [DATE_NAISSANCE]' },
];

export interface PromptGuardResult {
  sanitized: string;
  blocked: boolean;
  injectionDetected: boolean;
  piiRedacted: number;
  warnings: string[];
}

/**
 * Sanitize user input before injecting into AI prompt.
 * Detects injection attempts and redacts PII.
 */
export function sanitizeForAI(input: string): PromptGuardResult {
  const warnings: string[] = [];
  let piiRedacted = 0;

  // Step 1: Detect prompt injection
  const injectionDetected = INJECTION_PATTERNS.some(p => p.test(input));
  if (injectionDetected) {
    warnings.push('Prompt injection pattern detected');
  }

  // Step 2: Redact PII
  let sanitized = input;
  for (const { pattern, replacement } of PII_REDACTIONS) {
    const matches = sanitized.match(pattern);
    if (matches) {
      piiRedacted += matches.length;
      sanitized = sanitized.replace(pattern, replacement);
    }
  }

  // Step 3: Truncate excessively long inputs (prevent token abuse)
  const MAX_INPUT_LENGTH = 10_000;
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.slice(0, MAX_INPUT_LENGTH);
    warnings.push(`Input truncated from ${input.length} to ${MAX_INPUT_LENGTH} chars`);
  }

  return {
    sanitized,
    blocked: injectionDetected,
    injectionDetected,
    piiRedacted,
    warnings,
  };
}

/**
 * Sanitize email content specifically before AI analysis.
 * Redacts PII but does NOT block (emails are trusted internal data).
 */
export function sanitizeEmailForAI(subject: string, body: string): {
  subject: string;
  body: string;
  piiRedacted: number;
} {
  const subjectResult = sanitizeForAI(subject);
  const bodyResult = sanitizeForAI(body);

  return {
    subject: subjectResult.sanitized,
    body: bodyResult.sanitized,
    piiRedacted: subjectResult.piiRedacted + bodyResult.piiRedacted,
  };
}
