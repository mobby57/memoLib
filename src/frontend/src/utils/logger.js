/**
 * Système de logging professionnel pour IAPosteManager
 * Remplace tous les console.log/error/warn en production
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Niveau de log selon l'environnement
const getLogLevel = () => {
  const envLevel = import.meta.env.VITE_LOG_LEVEL?.toUpperCase();
  if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
    return LOG_LEVELS[envLevel];
  }
  return isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;
};

const currentLogLevel = getLogLevel();

/**
 * Formate un message de log avec timestamp et contexte
 */
const formatMessage = (level, message, context = {}) => {
  const timestamp = new Date().toISOString();
  const contextStr = Object.keys(context).length > 0 
    ? ` [${JSON.stringify(context)}]` 
    : '';
  
  return `[${timestamp}] [${level}] ${message}${contextStr}`;
};

/**
 * Envoie les erreurs critiques au backend (optionnel)
 */
const sendToBackend = async (level, message, error = null) => {
  if (level !== 'ERROR' || !isProduction) return;
  
  try {
    // En production, envoyer les erreurs critiques au backend
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        error: error?.message,
        stack: error?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      })
    }).catch(() => {
      // Ignorer les erreurs d'envoi de logs
    });
  } catch {
    // Ignorer silencieusement
  }
};

/**
 * Logger professionnel
 */
class Logger {
  debug(message, context = {}) {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      console.debug(formatMessage('DEBUG', message, context));
    }
  }

  info(message, context = {}) {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      console.info(formatMessage('INFO', message, context));
    }
  }

  warn(message, context = {}) {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      console.warn(formatMessage('WARN', message, context));
    }
  }

  error(message, error = null, context = {}) {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      const errorContext = {
        ...context,
        ...(error && {
          errorMessage: error.message,
          errorStack: error.stack,
          errorName: error.name
        })
      };
      
      console.error(formatMessage('ERROR', message, errorContext));
      
      // En production, envoyer les erreurs critiques
      if (isProduction) {
        sendToBackend('ERROR', message, error);
      }
    }
  }

  /**
   * Log une erreur API avec contexte complet
   */
  apiError(endpoint, error, requestData = {}) {
    this.error(
      `API Error [${endpoint}]`,
      error,
      {
        endpoint,
        method: requestData.method || 'GET',
        status: error.status || error.response?.status,
        ...requestData
      }
    );
  }

  /**
   * Log une action utilisateur (pour analytics)
   */
  userAction(action, data = {}) {
    if (isDevelopment) {
      this.debug(`User Action: ${action}`, data);
    }
    // En production, pourrait être envoyé à un service d'analytics
  }
}

// Instance singleton
const logger = new Logger();

export default logger;
export { Logger, LOG_LEVELS };


