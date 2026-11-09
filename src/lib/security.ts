/**
 * 🛡️ Utilitaires de sécurité pour le Frontend
 * =============================================
 *
 * Protection côté client contre:
 * - XSS (Cross-Site Scripting)
 * - Injection dans le DOM
 * - Données malformées
 * - CSRF (avec tokens)
 */

/**
 * Échappe les caractères HTML dangereux
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return '';

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Nettoie une chaîne pour une utilisation sûre dans le DOM
 */
export function sanitizeForDom(input: string): string {
  if (typeof input !== 'string') return '';

  // Supprimer les scripts et événements inline
  const dangerous = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:/gi,
    /vbscript:/gi,
  ];

  let sanitized = input;
  for (const pattern of dangerous) {
    sanitized = sanitized.replace(pattern, '');
  }

  return escapeHtml(sanitized);
}

/**
 * Valide et nettoie une URL
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') return null;

  try {
    const parsed = new URL(url, window.location.origin);

    // Bloquer les protocoles dangereux
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
    if (dangerousProtocols.some(p => parsed.protocol.toLowerCase().startsWith(p))) {
      console.warn('URL dangereuse bloquée:', url);
      return null;
    }

    // Autoriser uniquement http, https, et les URLs relatives
    if (!['http:', 'https:', ''].includes(parsed.protocol)) {
      return null;
    }

    return parsed.href;
  } catch {
    // Si ce n'est pas une URL valide, vérifier si c'est un chemin relatif
    if (url.startsWith('/') && !url.includes('..')) {
      return url;
    }
    return null;
  }
}

/**
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Valide la force d'un mot de passe
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Minimum 8 caractères');
  }

  if (password.length >= 12) score += 1;

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Au moins une minuscule');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Au moins une majuscule');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Au moins un chiffre');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Au moins un caractère spécial');
  }

  // Mots de passe courants
  const commonPasswords = [
    'password',
    '123456',
    'admin',
    'admin123',
    'root',
    'letmein',
    'welcome',
    'qwerty',
    'abc123',
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    score = 0;
    feedback.length = 0;
    feedback.push('Mot de passe trop commun');
  }

  return {
    valid: score >= 4 && password.length >= 8,
    score,
    feedback,
  };
}

/**
 * Nettoie un nom de fichier
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') return 'file';

  return filename
    .replace(/[^\w\s.-]/g, '_') // Remplacer les caractères spéciaux
    .replace(/\.{2,}/g, '.') // Supprimer les doubles points
    .replace(/^\./, '') // Pas de point au début
    .slice(0, 255); // Limiter la longueur
}

/**
 * Génère un token CSRF côté client
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Stocke le token CSRF de manière sécurisée
 */
export function setCsrfToken(token: string): void {
  sessionStorage.setItem('csrf_token', token);
}

/**
 * Récupère le token CSRF
 */
export function getCsrfToken(): string | null {
  return sessionStorage.getItem('csrf_token');
}

/**
 * Ajoute le token CSRF aux headers d'une requête
 */
export function addCsrfHeader(headers: Headers | Record<string, string>): void {
  const token = getCsrfToken();
  if (token) {
    if (headers instanceof Headers) {
      headers.set('X-CSRF-Token', token);
    } else {
      headers['X-CSRF-Token'] = token;
    }
  }
}

/**
 * Vérifie si une entrée contient des patterns d'injection SQL
 */
export function containsSqlInjection(input: string): boolean {
  if (typeof input !== 'string') return false;

  const sqlPatterns = [
    /(\bSELECT\b.*\bFROM\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bDROP\b.*\b(TABLE|DATABASE)\b)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /'\s*(OR|AND)\s*'?\d*'?\s*=\s*'?\d*/i,
    /(--|#|\/\*)/,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Vérifie si une entrée contient des patterns XSS
 */
export function containsXss(input: string): boolean {
  if (typeof input !== 'string') return false;

  const xssPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Valide une entrée utilisateur avant envoi
 */
export function validateUserInput(
  input: string,
  fieldName: string
): {
  valid: boolean;
  error?: string;
  sanitized: string;
} {
  if (containsSqlInjection(input)) {
    console.warn(`[SECURITY] SQL Injection détectée dans ${fieldName}`);
    return {
      valid: false,
      error: 'Caractères non autorisés détectés',
      sanitized: '',
    };
  }

  if (containsXss(input)) {
    console.warn(`[SECURITY] XSS détecté dans ${fieldName}`);
    return {
      valid: false,
      error: 'Contenu non autorisé détecté',
      sanitized: '',
    };
  }

  return {
    valid: true,
    sanitized: sanitizeForDom(input),
  };
}

/**
 * Wrapper sécurisé pour fetch avec protection CSRF
 */
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);

  // Ajouter le token CSRF pour les requêtes non-GET
  if (options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
    addCsrfHeader(headers);
  }

  // Désactiver le cache pour les données sensibles
  headers.set('Cache-Control', 'no-store');

  const safeUrl = sanitizeUrl(url);
  if (!safeUrl) {
    throw new Error('URL invalide');
  }

  return fetch(safeUrl, {
    ...options,
    headers,
    credentials: 'same-origin', // Envoyer les cookies uniquement sur le même domaine
  });
}

/**
 * Rate limiter côté client
 */
class ClientRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private limits: Record<string, { max: number; windowMs: number }> = {
    default: { max: 60, windowMs: 60000 },
    auth: { max: 5, windowMs: 60000 },
    search: { max: 30, windowMs: 60000 },
  };

  isLimited(action: string = 'default'): boolean {
    const now = Date.now();
    const config = this.limits[action] || this.limits.default;

    let attempts = this.attempts.get(action) || [];
    attempts = attempts.filter(t => t > now - config.windowMs);

    if (attempts.length >= config.max) {
      return true;
    }

    attempts.push(now);
    this.attempts.set(action, attempts);
    return false;
  }

  reset(action?: string): void {
    if (action) {
      this.attempts.delete(action);
    } else {
      this.attempts.clear();
    }
  }
}

export const rateLimiter = new ClientRateLimiter();

/**
 * Type guard pour vérifier les réponses API
 */
export function isApiError(response: unknown): response is { error: string; code?: string } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as Record<string, unknown>).error === 'string'
  );
}
