/**
 * Structured Logging with JSON Format
 * Phase 5: Optimisations
 *
 * Logs all webhook operations in JSON format with:
 * - Timestamp
 * - Request ID (for tracing)
 * - Channel
 * - Duration
 * - Metrics
 * - Errors (with Sentry integration)
 */

import * as Sentry from '@sentry/nextjs';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  requestId: string;
  channel?: string;
  action: string;
  duration?: number;
  message: string;
  data?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

export interface WebhookLogContext {
  requestId: string;
  channel: string;
  startTime: number;
  userId?: string;
  externalId?: string;
  phase?: string;
}

/**
 * Structured Logger for webhook operations
 */
const PII_KEYS = [
  'password', 'token', 'secret', 'apikey', 'api_key', 'authorization',
  'ssn', 'passport', 'creditcard', 'credit_card',
  'phone', 'telephone', 'mobile', 'address', 'adresse', 'domicile',
  'dateNaissance', 'birthdate', 'lieuNaissance', 'birthplace',
  'nom', 'prenom', 'firstname', 'lastname', 'fullname',
  'numeroSecuriteSociale', 'nationalite', 'nationality',
];

function redactPII(data: Record<string, any> | undefined): Record<string, any> | undefined {
  if (!data) return data;
  const redacted = { ...data };
  for (const key of Object.keys(redacted)) {
    const lower = key.toLowerCase();
    if (PII_KEYS.some(p => lower.includes(p))) {
      redacted[key] = '[REDACTED]';
    } else if (lower.includes('email') && typeof redacted[key] === 'string') {
      const [, domain] = (redacted[key] as string).split('@');
      redacted[key] = `***@${domain || 'redacted'}`;
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null && !Array.isArray(redacted[key])) {
      redacted[key] = redactPII(redacted[key]);
    }
  }
  return redacted;
}

export class StructuredLogger {
  private context: WebhookLogContext;
  private logs: StructuredLogEntry[] = [];

  constructor(context: WebhookLogContext) {
    this.context = context;
  }

  /**
   * Log with automatic duration calculation
   */
  private createLogEntry(
    level: LogLevel,
    action: string,
    message: string,
    data?: Record<string, any>,
    error?: Error | null,
  ): StructuredLogEntry {
    const duration = performance.now() - this.context.startTime;

    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      requestId: this.context.requestId,
      channel: this.context.channel,
      action,
      duration: Math.round(duration * 100) / 100,
      message,
      data: redactPII(data),
    };

    if (error) {
      entry.error = {
        code: (error as any).code || 'UNKNOWN',
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      };
    }

    return entry;
  }

  /**
   * Log debug message
   */
  debug(action: string, message: string, data?: Record<string, any>): void {
    const entry = this.createLogEntry('debug', action, message, data);
    this.logs.push(entry);
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Log info message
   */
  info(action: string, message: string, data?: Record<string, any>): void {
    const entry = this.createLogEntry('info', action, message, data);
    this.logs.push(entry);
    console.log(JSON.stringify(entry));
  }

  /**
   * Log warning message
   */
  warn(action: string, message: string, data?: Record<string, any>): void {
    const entry = this.createLogEntry('warn', action, message, data);
    this.logs.push(entry);
    console.warn(JSON.stringify(entry));
  }

  /**
   * Log error message (with Sentry integration)
   */
  error(action: string, message: string, error?: Error | null, data?: Record<string, any>): void {
    const entry = this.createLogEntry('error', action, message, data, error);
    this.logs.push(entry);
    console.error(JSON.stringify(entry));

    // Report to Sentry
    if (error) {
      Sentry.captureException(error, {
        tags: {
          channel: this.context.channel,
          action,
          requestId: this.context.requestId,
        },
        extra: {
          ...data,
          duration: entry.duration,
          phase: this.context.phase,
        },
      });
    } else {
      Sentry.captureException(new Error(message), {
        level: 'error',
        tags: {
          channel: this.context.channel,
          action,
          requestId: this.context.requestId,
        },
        extra: {
          ...data,
          duration: entry.duration,
        },
      });
    }
  }

  /**
   * Get all logs collected
   */
  getLogs(): StructuredLogEntry[] {
    return this.logs;
  }

  /**
   * Get summary of all logs
   */
  getSummary() {
    const totalDuration = this.logs[this.logs.length - 1]?.duration || 0;
    const errorCount = this.logs.filter((l) => l.level === 'error').length;
    const warningCount = this.logs.filter((l) => l.level === 'warn').length;

    return {
      requestId: this.context.requestId,
      channel: this.context.channel,
      totalDuration: Math.round(totalDuration * 100) / 100,
      logCount: this.logs.length,
      errorCount,
      warningCount,
      status: errorCount > 0 ? 'error' : errorCount === 0 && warningCount > 0 ? 'warning' : 'success',
    };
  }
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(channel: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${channel.toLowerCase()}-${timestamp}-${random}`;
}

/**
 * Helper to create logger context
 */
export function createLoggerContext(
  channel: string,
  userId?: string,
  externalId?: string,
  phase?: string,
): WebhookLogContext {
  return {
    requestId: generateRequestId(channel),
    channel,
    startTime: performance.now(),
    userId,
    externalId,
    phase,
  };
}
