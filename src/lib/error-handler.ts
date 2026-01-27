/**
 * Error Handler - Error Classification & User-Friendly Messages
 * - Categorizes errors (network, auth, validation, server, unknown)
 * - Maps to user-friendly messages
 * - Detects retry eligibility
 * - Provides error reporting helpers
 */

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  RATE_LIMIT = 'RATE_LIMIT',
  CONFLICT = 'CONFLICT',
  UNKNOWN = 'UNKNOWN',
}

export interface ClassifiedError {
  category: ErrorCategory;
  message: string;
  userMessage: string;
  canRetry: boolean;
  retryDelay?: number; // milliseconds
  statusCode?: number;
  originalError: Error;
  suggestions?: string[];
}

/**
 * Classify an error based on its type, message, and status code
 */
export function classifyError(error: unknown): ClassifiedError {
  // Default error object
  const defaultError: ClassifiedError = {
    category: ErrorCategory.UNKNOWN,
    message: 'Unknown error',
    userMessage: 'Une erreur inattendue est survenue. Veuillez reessayer.',
    canRetry: true,
    originalError: error instanceof Error ? error : new Error(String(error)),
  };

  // Handle non-Error objects
  if (!(error instanceof Error)) {
    return defaultError;
  }

  const errorMessage = error.message.toLowerCase();

  // Network errors (fetch failed, no internet, timeout)
  if (
    errorMessage.includes('fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('enotfound')
  ) {
    return {
      category: ErrorCategory.NETWORK,
      message: error.message,
      userMessage: 'Erreur de connexion. Verifiez votre connexion Internet.',
      canRetry: true,
      retryDelay: 3000,
      originalError: error,
      suggestions: [
        'Verifiez votre connexion Internet',
        'Reessayez dans quelques secondes',
        'Contactez le support si le probleme persiste',
      ],
    };
  }

  // Authentication errors (401)
  if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
    return {
      category: ErrorCategory.AUTHENTICATION,
      message: error.message,
      userMessage: 'Session expiree. Veuillez vous reconnecter.',
      canRetry: false,
      statusCode: 401,
      originalError: error,
      suggestions: ['Reconnectez-vous', 'Verifiez vos identifiants'],
    };
  }

  // Authorization errors (403)
  if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
    return {
      category: ErrorCategory.AUTHORIZATION,
      message: error.message,
      userMessage: "Vous n'avez pas les droits necessaires pour cette action.",
      canRetry: false,
      statusCode: 403,
      originalError: error,
      suggestions: ['Contactez votre administrateur', 'Verifiez vos permissions'],
    };
  }

  // Not found errors (404)
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return {
      category: ErrorCategory.NOT_FOUND,
      message: error.message,
      userMessage: 'Ressource introuvable.',
      canRetry: false,
      statusCode: 404,
      originalError: error,
      suggestions: ['Verifiez que la ressource existe', 'Actualisez la page'],
    };
  }

  // Validation errors (400)
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('400')
  ) {
    return {
      category: ErrorCategory.VALIDATION,
      message: error.message,
      userMessage: 'Donnees invalides. Verifiez votre saisie.',
      canRetry: false,
      statusCode: 400,
      originalError: error,
      suggestions: [
        'Verifiez les champs du formulaire',
        'Assurez-vous que les donnees sont au bon format',
      ],
    };
  }

  // Rate limit errors (429)
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return {
      category: ErrorCategory.RATE_LIMIT,
      message: error.message,
      userMessage: 'Trop de requetes. Veuillez patienter.',
      canRetry: true,
      retryDelay: 60000, // 1 minute
      statusCode: 429,
      originalError: error,
      suggestions: [
        'Attendez quelques instants avant de reessayer',
        'Reduisez la frequence de vos actions',
      ],
    };
  }

  // Conflict errors (409)
  if (errorMessage.includes('conflict') || errorMessage.includes('409')) {
    return {
      category: ErrorCategory.CONFLICT,
      message: error.message,
      userMessage: 'Conflit detecte. La ressource a peut-etre ete modifiee.',
      canRetry: true,
      retryDelay: 2000,
      statusCode: 409,
      originalError: error,
      suggestions: ['Actualisez la page', 'Verifiez les modifications recentes'],
    };
  }

  // Server errors (500, 502, 503, 504)
  if (
    errorMessage.includes('server') ||
    errorMessage.includes('500') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503') ||
    errorMessage.includes('504')
  ) {
    return {
      category: ErrorCategory.SERVER,
      message: error.message,
      userMessage: 'Erreur serveur. Reessayez dans quelques instants.',
      canRetry: true,
      retryDelay: 5000,
      statusCode: 500,
      originalError: error,
      suggestions: [
        'Reessayez dans quelques minutes',
        'Contactez le support si le probleme persiste',
      ],
    };
  }

  // Unknown error
  return defaultError;
}

/**
 * Extract status code from fetch response error
 */
export function getErrorStatusCode(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error) {
    return error.status as number;
  }
  return undefined;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: ClassifiedError): boolean {
  return error.canRetry;
}

/**
 * Get retry delay for an error
 */
export function getRetryDelay(error: ClassifiedError): number {
  return error.retryDelay || 3000; // Default 3 seconds
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: ClassifiedError): {
  category: string;
  message: string;
  statusCode?: number;
  stack?: string;
  timestamp: string;
} {
  return {
    category: error.category,
    message: error.message,
    statusCode: error.statusCode,
    stack: error.originalError.stack,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create error from fetch response
 */
export async function createErrorFromResponse(response: Response): Promise<Error> {
  let message = `HTTP ${response.status}: ${response.statusText}`;

  try {
    const data = await response.json();
    if (data.error) {
      message = data.error;
    } else if (data.message) {
      message = data.message;
    }
  } catch {
    // Failed to parse JSON, use default message
  }

  const error = new Error(message);
  (error as any).status = response.status;
  return error;
}

/**
 * Report error to external service (Sentry, etc.)
 */
export function reportError(error: ClassifiedError, context?: Record<string, any>) {
  // In development, just log
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Handler]', {
      ...formatErrorForLogging(error),
      context,
    });
    return;
  }

  // In production, send to Sentry
  import('@sentry/nextjs')
    .then(Sentry => {
      Sentry.captureException(error.originalError, {
        tags: {
          category: error.category,
          canRetry: String(error.canRetry),
        },
        extra: {
          userMessage: error.userMessage,
          statusCode: error.statusCode,
          suggestions: error.suggestions,
          context,
        },
      });
    })
    .catch(() => {
      // Sentry non disponible, log serveur uniquement
      console.error('[Error Handler - Sentry unavailable]', error.message);
    });
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  onError?: (error: ClassifiedError) => void
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      const classified = classifyError(error);
      reportError(classified, { functionName: fn.name, args });
      if (onError) {
        onError(classified);
      }
      throw classified;
    }
  }) as T;
}
