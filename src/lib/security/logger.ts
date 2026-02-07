type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  tenantId?: string;
  ip?: string;
  userAgent?: string;
  action?: string;
}

class SecureLogger {
  private logLevel: LogLevel;
  private sensitiveDataLogging: boolean;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.sensitiveDataLogging = process.env.SENSITIVE_DATA_LOGGING === 'true';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  private sanitizeData(data: any): any {
    if (!this.sensitiveDataLogging) {
      const sensitiveKeys = [
        'password', 'token', 'secret', 'key', 'auth', 'credential',
        'passportNumber', 'phone', 'address', 'email'
      ];
      
      if (typeof data === 'object' && data !== null) {
        const sanitized = { ...data };
        Object.keys(sanitized).forEach(key => {
          if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
            sanitized[key] = '[REDACTED]';
          }
        });
        return sanitized;
      }
      
      if (typeof data === 'string') {
        // Masquer les emails et mots de passe dans les strings
        return data
          .replace(/password[=:]\s*[^\s&]+/gi, 'password=[REDACTED]')
          .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
      }
    }
    
    return data;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, data?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(this.sanitizeData(context)) : '';
    const dataStr = data ? JSON.stringify(this.sanitizeData(data)) : '';
    
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${contextStr} ${dataStr}`.trim();
  }

  debug(message: string, context?: LogContext, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context, data));
    }
  }

  info(message: string, context?: LogContext, data?: any): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context, data));
    }
  }

  warn(message: string, context?: LogContext, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context, data));
    }
  }

  error(message: string, context?: LogContext, data?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context, data));
    }
  }

  // Méthodes spécialisées pour l'audit de sécurité
  securityEvent(event: string, context: LogContext, details?: any): void {
    this.warn(`SECURITY_EVENT: ${event}`, context, details);
  }

  authEvent(event: string, context: LogContext): void {
    this.info(`AUTH_EVENT: ${event}`, {
      ...context,
      // Ne jamais logger les mots de passe
      password: undefined,
      credentials: undefined
    });
  }

  auditTrail(action: string, context: LogContext, changes?: any): void {
    this.info(`AUDIT: ${action}`, context, this.sanitizeData(changes));
  }
}

export const logger = new SecureLogger();

// Helper pour remplacer console.log dans l'authentification
export const authLogger = {
  attempt: (email: string, method: string) => {
    logger.authEvent('LOGIN_ATTEMPT', { 
      action: 'login_attempt',
      userId: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Masquer l'email partiellement
      method 
    });
  },
  
  success: (userId: string, method: string) => {
    logger.authEvent('LOGIN_SUCCESS', { 
      action: 'login_success',
      userId,
      method 
    });
  },
  
  failure: (email: string, reason: string) => {
    logger.authEvent('LOGIN_FAILURE', { 
      action: 'login_failure',
      userId: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      reason 
    });
  }
};