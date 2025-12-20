/**
 * Service de sécurité pour IAPosteManager
 * Gère les en-têtes de sécurité et la protection contre les attaques
 */

// Configuration des en-têtes de sécurité
export const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://api.openai.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.openai.com wss:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'microphone=(), camera=(), geolocation=()'
};

// Validation des origines autorisées
const ALLOWED_ORIGINS = [
  'http://localhost:3001',
  'http://localhost:5000',
  'https://api.openai.com'
];

/**
 * Valide l'origine d'une requête
 */
export const validateOrigin = (origin) => {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin) || 
         (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost'));
};

/**
 * Génère un nonce pour les scripts inline
 */
export const generateNonce = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
};

/**
 * Sanitise les URLs pour éviter les redirections malveillantes
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const parsed = new URL(url);
    
    // Autoriser seulement HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    
    // Vérifier les domaines autorisés
    const allowedDomains = ['api.openai.com', 'localhost'];
    const isAllowed = allowedDomains.some(domain => 
      parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
    
    if (!isAllowed && process.env.NODE_ENV === 'production') {
      return '';
    }
    
    return parsed.toString();
  } catch {
    return '';
  }
};

/**
 * Vérifie si une chaîne contient du contenu potentiellement dangereux
 */
export const containsMaliciousContent = (content) => {
  if (!content || typeof content !== 'string') return false;
  
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(content));
};

/**
 * Encode les entités HTML pour éviter les injections XSS
 */
export const escapeHtml = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };
  
  return text.replace(/[&<>"'\/]/g, (s) => map[s]);
};

/**
 * Génère un token CSRF
 */
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Valide un token CSRF
 */
export const validateCSRFToken = (token, expectedToken) => {
  if (!token || !expectedToken) return false;
  if (token.length !== expectedToken.length) return false;
  
  // Comparaison sécurisée pour éviter les attaques de timing
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }
  
  return result === 0;
};

/**
 * Applique les en-têtes de sécurité à une réponse
 */
export const applySecurityHeaders = (response) => {
  if (!response || !response.headers) return response;
  
  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    response.headers.set(header, value);
  });
  
  return response;
};

/**
 * Middleware de sécurité pour les requêtes
 */
export const securityMiddleware = (request) => {
  // Vérifier l'origine
  const origin = request.headers.get('Origin');
  if (origin && !validateOrigin(origin)) {
    throw new Error('Origin not allowed');
  }
  
  // Vérifier le Content-Type pour les requêtes POST/PUT
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid Content-Type');
    }
  }
  
  return request;
};

export default {
  validateOrigin,
  generateNonce,
  sanitizeUrl,
  containsMaliciousContent,
  escapeHtml,
  generateCSRFToken,
  validateCSRFToken,
  applySecurityHeaders,
  securityMiddleware
};