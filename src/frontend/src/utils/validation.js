/**
 * Utilitaires de validation et sanitisation pour IAPosteManager
 * Sécurise toutes les entrées utilisateur et données API
 */

// Validation des emails
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
};

// Sanitisation des chaînes de caractères
export const sanitizeString = (str, maxLength = 1000) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Validation des données d'email
export const validateEmailData = (emailData) => {
  const errors = [];
  
  if (!emailData || typeof emailData !== 'object') {
    errors.push('Données email invalides');
    return { isValid: false, errors };
  }
  
  // Validation du destinataire
  if (!emailData.to || !validateEmail(emailData.to)) {
    errors.push('Adresse email destinataire invalide');
  }
  
  // Validation du sujet
  if (!emailData.subject || typeof emailData.subject !== 'string') {
    errors.push('Sujet requis');
  } else if (emailData.subject.length > 200) {
    errors.push('Sujet trop long (max 200 caractères)');
  }
  
  // Validation du corps
  if (!emailData.body || typeof emailData.body !== 'string') {
    errors.push('Corps de l\'email requis');
  } else if (emailData.body.length > 50000) {
    errors.push('Corps de l\'email trop long (max 50000 caractères)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      to: emailData.to?.trim(),
      subject: sanitizeString(emailData.subject, 200),
      body: sanitizeString(emailData.body, 50000),
      from: emailData.from ? sanitizeString(emailData.from, 100) : undefined
    }
  };
};

// Validation des prompts IA
export const validatePrompt = (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    return { isValid: false, error: 'Prompt requis' };
  }
  
  if (prompt.length > 10000) {
    return { isValid: false, error: 'Prompt trop long (max 10000 caractères)' };
  }
  
  // Détection de contenu potentiellement dangereux
  const dangerousPatterns = [
    /system\s*:/i,
    /ignore\s+previous\s+instructions/i,
    /forget\s+everything/i,
    /<script/i,
    /javascript:/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(prompt)) {
      return { isValid: false, error: 'Contenu non autorisé détecté' };
    }
  }
  
  return {
    isValid: true,
    sanitized: sanitizeString(prompt, 10000)
  };
};

// Validation des métadonnées
export const validateMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object') return {};
  
  const sanitized = {};
  const maxKeys = 16;
  const maxKeyLength = 64;
  const maxValueLength = 512;
  
  let keyCount = 0;
  for (const [key, value] of Object.entries(metadata)) {
    if (keyCount >= maxKeys) break;
    
    if (typeof key === 'string' && key.length <= maxKeyLength) {
      const sanitizedKey = sanitizeString(key, maxKeyLength);
      const sanitizedValue = sanitizeString(String(value), maxValueLength);
      
      if (sanitizedKey && sanitizedValue) {
        sanitized[sanitizedKey] = sanitizedValue;
        keyCount++;
      }
    }
  }
  
  return sanitized;
};

// Validation des fichiers
export const validateFile = (file, maxSize = 25 * 1024 * 1024) => { // 25MB par défaut
  const errors = [];
  
  if (!file || !(file instanceof File)) {
    errors.push('Fichier invalide');
    return { isValid: false, errors };
  }
  
  if (file.size > maxSize) {
    errors.push(`Fichier trop volumineux (max ${Math.round(maxSize / 1024 / 1024)}MB)`);
  }
  
  // Types de fichiers autorisés
  const allowedTypes = [
    'text/plain',
    'text/csv',
    'application/json',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'audio/mpeg',
    'audio/wav'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Type de fichier non autorisé');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Nettoyage sécurisé des données sensibles
export const sanitizeSensitiveData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'api_key'];
  const cleaned = { ...data };
  
  for (const key of Object.keys(cleaned)) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      cleaned[key] = '[REDACTED]';
    }
  }
  
  return cleaned;
};

// Rate limiting par utilisateur
const userRateLimits = new Map();

export const checkUserRateLimit = (userId, maxRequests = 100, windowMs = 60000) => {
  const now = Date.now();
  const userLimit = userRateLimits.get(userId) || { count: 0, resetTime: now + windowMs };
  
  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + windowMs;
  } else {
    userLimit.count++;
  }
  
  userRateLimits.set(userId, userLimit);
  
  return {
    allowed: userLimit.count <= maxRequests,
    remaining: Math.max(0, maxRequests - userLimit.count),
    resetTime: userLimit.resetTime
  };
};

export default {
  validateEmail,
  sanitizeString,
  validateEmailData,
  validatePrompt,
  validateMetadata,
  validateFile,
  sanitizeSensitiveData,
  checkUserRateLimit
};