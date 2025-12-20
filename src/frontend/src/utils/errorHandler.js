/**
 * Gestionnaire d'erreurs centralisé pour IAPosteManager
 * Gère toutes les erreurs de manière cohérente et sécurisée
 */

// Types d'erreurs
export const ERROR_TYPES = {
  VALIDATION: 'VALIDATION_ERROR',
  API: 'API_ERROR',
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  FILE: 'FILE_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// Codes d'erreur spécifiques
export const ERROR_CODES = {
  INVALID_EMAIL: 'INVALID_EMAIL',
  MISSING_API_KEY: 'MISSING_API_KEY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT'
};

class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  /**
   * Traite et formate les erreurs
   */
  handleError(error, context = {}) {
    const processedError = this.processError(error, context);
    this.logError(processedError);
    
    // Notification utilisateur si nécessaire
    if (processedError.shouldNotifyUser) {
      this.notifyUser(processedError);
    }
    
    return processedError;
  }

  /**
   * Traite l'erreur brute
   */
  processError(error, context) {
    let processedError = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      context,
      original: error,
      shouldNotifyUser: true
    };

    // Traitement selon le type d'erreur
    if (error instanceof TypeError) {
      processedError = {
        ...processedError,
        type: ERROR_TYPES.VALIDATION,
        code: ERROR_CODES.INVALID_EMAIL,
        message: 'Données invalides',
        userMessage: 'Veuillez vérifier les informations saisies'
      };
    } else if (error.message?.includes('Rate limit')) {
      processedError = {
        ...processedError,
        type: ERROR_TYPES.RATE_LIMIT,
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: error.message,
        userMessage: 'Trop de requêtes. Veuillez patienter quelques instants.'
      };
    } else if (error.message?.includes('API key')) {
      processedError = {
        ...processedError,
        type: ERROR_TYPES.AUTH,
        code: ERROR_CODES.MISSING_API_KEY,
        message: error.message,
        userMessage: 'Erreur de configuration. Contactez l\'administrateur.',
        shouldNotifyUser: false // Erreur technique
      };
    } else if (error.message?.includes('timeout') || error.name === 'AbortError') {
      processedError = {
        ...processedError,
        type: ERROR_TYPES.NETWORK,
        code: ERROR_CODES.NETWORK_TIMEOUT,
        message: error.message,
        userMessage: 'Connexion lente. Veuillez réessayer.'
      };
    } else if (error.status === 401 || error.status === 403) {
      processedError = {
        ...processedError,
        type: ERROR_TYPES.AUTH,
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Non autorisé',
        userMessage: 'Accès non autorisé. Veuillez vous reconnecter.'
      };
    } else {
      processedError = {
        ...processedError,
        type: ERROR_TYPES.UNKNOWN,
        message: error.message || 'Erreur inconnue',
        userMessage: 'Une erreur inattendue s\'est produite'
      };
    }

    return processedError;
  }

  /**
   * Enregistre l'erreur
   */
  logError(error) {
    // Nettoyer les données sensibles
    const cleanError = {
      ...error,
      context: this.sanitizeContext(error.context),
      original: {
        message: error.original?.message,
        stack: error.original?.stack?.split('\n').slice(0, 5).join('\n') // Limiter la stack trace
      }
    };

    this.errorLog.push(cleanError);

    // Limiter la taille du log
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log en console pour le développement
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', cleanError);
    }
  }

  /**
   * Notifie l'utilisateur
   */
  notifyUser(error) {
    if (typeof window !== 'undefined') {
      // Émettre un événement personnalisé
      window.dispatchEvent(new CustomEvent('app-error', {
        detail: {
          message: error.userMessage,
          type: error.type,
          code: error.code
        }
      }));
    }
  }

  /**
   * Nettoie le contexte des données sensibles
   */
  sanitizeContext(context) {
    if (!context || typeof context !== 'object') return context;

    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'api_key'];
    const cleaned = { ...context };

    for (const key of Object.keys(cleaned)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        cleaned[key] = '[REDACTED]';
      }
    }

    return cleaned;
  }

  /**
   * Génère un ID unique pour l'erreur
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Récupère les erreurs récentes
   */
  getRecentErrors(limit = 10) {
    return this.errorLog.slice(-limit);
  }

  /**
   * Efface le log d'erreurs
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Statistiques d'erreurs
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      byCode: {},
      recent: this.errorLog.slice(-5)
    };

    this.errorLog.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
    });

    return stats;
  }
}

// Instance globale
const errorHandler = new ErrorHandler();

// Wrapper pour les fonctions async
export const withErrorHandling = (fn, context = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const processedError = errorHandler.handleError(error, { ...context, args });
      throw processedError;
    }
  };
};

// Wrapper pour les promesses
export const handlePromise = (promise, context = {}) => {
  return promise.catch(error => {
    const processedError = errorHandler.handleError(error, context);
    throw processedError;
  });
};

export { errorHandler };
export default errorHandler;