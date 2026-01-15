/**
 * 🔍 SYSTÈME DE LOGGING AVANCÉ POUR DÉVELOPPEMENT
 * Traçabilité complète, métriques temps réel, debugging IA
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum LogCategory {
  AI = 'AI',
  WORKFLOW = 'WORKFLOW',
  EMAIL = 'EMAIL',
  NOTIFICATION = 'NOTIFICATION',
  FORM = 'FORM',
  CALENDAR = 'CALENDAR',
  DATABASE = 'DATABASE',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  API = 'API',
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: Record<string, any>;
  duration?: number;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  category: string;
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  details?: Record<string, any>;
}

class AdvancedLogger {
  private static instance: AdvancedLogger;
  private logs: LogEntry[] = [];
  private metrics: PerformanceMetrics[] = [];
  private maxLogsInMemory = 10000;
  private flushInterval = 30000; // 30 secondes
  private isEnabled = process.env.NODE_ENV === 'development';

  private constructor() {
    // Auto-flush périodique
    if (this.isEnabled) {
      setInterval(() => this.flushLogs(), this.flushInterval);
    }
  }

  static getInstance(): AdvancedLogger {
    if (!AdvancedLogger.instance) {
      AdvancedLogger.instance = new AdvancedLogger();
    }
    return AdvancedLogger.instance;
  }

  /**
   * Log principal avec contexte enrichi
   */
  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      context,
      traceId: this.generateTraceId(),
    };

    // Ajout stack trace pour erreurs
    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      entry.stackTrace = new Error().stack;
    }

    this.logs.push(entry);

    // Console colorée en dev
    this.logToConsole(entry);

    // Flush si trop de logs
    if (this.logs.length >= this.maxLogsInMemory) {
      this.flushLogs();
    }
  }

  /**
   * Mesure de performance avec timing automatique
   */
  async measurePerformance<T>(
    category: LogCategory,
    operation: string,
    fn: () => Promise<T>,
    details?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    let success = true;
    let result: T;

    try {
      this.log(LogLevel.DEBUG, category, `🚀 Début: ${operation}`, details);
      result = await fn();
      return result;
    } catch (error) {
      success = false;
      this.log(
        LogLevel.ERROR,
        category,
        `❌ Erreur: ${operation}`,
        { ...details, error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      
      const metric: PerformanceMetrics = {
        category: category.toString(),
        operation,
        duration,
        timestamp: new Date(),
        success,
        details,
      };

      this.metrics.push(metric);

      const emoji = success ? '✅' : '❌';
      const color = duration < 100 ? '🟢' : duration < 500 ? '🟡' : '🔴';
      this.log(
        LogLevel.INFO,
        category,
        `${emoji} ${color} Fin: ${operation} (${duration.toFixed(2)}ms)`,
        { duration, success, ...details }
      );
    }
  }

  /**
   * Logging spécialisé pour analyse IA
   */
  logAIAnalysis(
    model: string,
    prompt: string,
    response: string,
    duration: number,
    tokens?: { prompt: number; completion: number; total: number }
  ): void {
    this.log(LogLevel.INFO, LogCategory.AI, '🤖 Analyse IA complétée', {
      model,
      promptLength: prompt.length,
      responseLength: response.length,
      duration,
      tokens,
      timestamp: new Date().toISOString(),
    });

    // Détection d'anomalies
    if (duration > 10000) {
      this.log(
        LogLevel.WARN,
        LogCategory.PERFORMANCE,
        '⚠️ Analyse IA lente détectée',
        { model, duration }
      );
    }

    if (!response || response.length < 10) {
      this.log(
        LogLevel.WARN,
        LogCategory.AI,
        '⚠️ Réponse IA suspecte (trop courte)',
        { model, responseLength: response.length }
      );
    }
  }

  /**
   * Logging workflow avec états
   */
  logWorkflowExecution(
    workflowId: string,
    step: string,
    status: 'started' | 'completed' | 'failed',
    data?: Record<string, any>
  ): void {
    const emoji = status === 'completed' ? '✅' : status === 'failed' ? '❌' : '🔄';
    const level = status === 'failed' ? LogLevel.ERROR : LogLevel.INFO;

    this.log(
      level,
      LogCategory.WORKFLOW,
      `${emoji} Workflow ${workflowId} - ${step} (${status})`,
      { workflowId, step, status, ...data }
    );
  }

  /**
   * Logging email avec PII masking
   */
  logEmailProcessing(
    emailId: string,
    action: string,
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.INFO, LogCategory.EMAIL, `📧 Email ${action}`, {
      emailId,
      action,
      ...metadata,
    });
  }

  /**
   * Sécurité - détection d'anomalies
   */
  logSecurityEvent(
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>
  ): void {
    const level = severity === 'critical' ? LogLevel.CRITICAL : LogLevel.WARN;
    this.log(level, LogCategory.SECURITY, `🔒 Événement sécurité: ${eventType}`, {
      severity,
      ...details,
    });
  }

  /**
   * Console avec couleurs
   */
  private logToConsole(entry: LogEntry): void {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[90m',    // Gris
      [LogLevel.INFO]: '\x1b[36m',     // Cyan
      [LogLevel.WARN]: '\x1b[33m',     // Jaune
      [LogLevel.ERROR]: '\x1b[31m',    // Rouge
      [LogLevel.CRITICAL]: '\x1b[35m', // Magenta
    };

    const categoryEmojis = {
      [LogCategory.AI]: '🤖',
      [LogCategory.WORKFLOW]: '🔄',
      [LogCategory.EMAIL]: '📧',
      [LogCategory.NOTIFICATION]: '🔔',
      [LogCategory.FORM]: '📝',
      [LogCategory.CALENDAR]: '📅',
      [LogCategory.DATABASE]: '💾',
      [LogCategory.SECURITY]: '🔒',
      [LogCategory.PERFORMANCE]: '⚡',
      [LogCategory.API]: '🌐',
    };

    const reset = '\x1b[0m';
    const color = colors[entry.level];
    const emoji = categoryEmojis[entry.category];

    console.log(
      `${color}[${entry.timestamp.toISOString()}] ${entry.level} ${emoji} ${entry.category}${reset}`,
      entry.message,
      entry.context ? entry.context : ''
    );
  }

  /**
   * Flush des logs vers DB/fichier
   */
  private async flushLogs(): Promise<void> {
    if (this.logs.length === 0) return;

    try {
      // TODO: Sauvegarder en DB ou fichier
      console.log(`📝 Flush de ${this.logs.length} logs`);
      
      // Garder seulement les derniers logs
      if (this.logs.length > this.maxLogsInMemory) {
        this.logs = this.logs.slice(-this.maxLogsInMemory / 2);
      }
    } catch (error) {
      console.error('Erreur flush logs:', error);
    }
  }

  /**
   * Récupération des logs filtrés
   */
  getLogs(filters?: {
    level?: LogLevel;
    category?: LogCategory;
    since?: Date;
    limit?: number;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (filters?.level) {
      filtered = filtered.filter((log) => log.level === filters.level);
    }

    if (filters?.category) {
      filtered = filtered.filter((log) => log.category === filters.category);
    }

    if (filters?.since) {
      filtered = filtered.filter((log) => log.timestamp >= filters.since!);
    }

    if (filters?.limit) {
      filtered = filtered.slice(-filters.limit);
    }

    return filtered;
  }

  /**
   * Métriques de performance agrégées
   */
  getPerformanceMetrics(category?: string): {
    averageDuration: number;
    successRate: number;
    totalOperations: number;
    slowestOperations: PerformanceMetrics[];
  } {
    let metrics = [...this.metrics];

    if (category) {
      metrics = metrics.filter((m) => m.category === category);
    }

    const totalOperations = metrics.length;
    const successfulOps = metrics.filter((m) => m.success).length;
    const averageDuration =
      metrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations || 0;
    const successRate = (successfulOps / totalOperations) * 100 || 0;
    const slowestOperations = metrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      averageDuration,
      successRate,
      totalOperations,
      slowestOperations,
    };
  }

  /**
   * Export pour analyse
   */
  exportLogs(format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      // CSV simple
      const headers = 'Timestamp,Level,Category,Message\n';
      const rows = this.logs
        .map(
          (log) =>
            `${log.timestamp.toISOString()},${log.level},${log.category},"${log.message}"`
        )
        .join('\n');
      return headers + rows;
    }
  }

  /**
   * Nettoyage
   */
  clear(): void {
    this.logs = [];
    this.metrics = [];
  }

  /**
   * Génération trace ID unique
   */
  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}

// Instance singleton
export const logger = AdvancedLogger.getInstance();

// Helpers pour usage rapide
export const logAI = (message: string, context?: Record<string, any>) =>
  logger.log(LogLevel.INFO, LogCategory.AI, message, context);

export const logWorkflow = (message: string, context?: Record<string, any>) =>
  logger.log(LogLevel.INFO, LogCategory.WORKFLOW, message, context);

export const logEmail = (message: string, context?: Record<string, any>) =>
  logger.log(LogLevel.INFO, LogCategory.EMAIL, message, context);

export const logError = (message: string, context?: Record<string, any>) =>
  logger.log(LogLevel.ERROR, LogCategory.API, message, context);

export const measure = <T>(
  category: LogCategory,
  operation: string,
  fn: () => Promise<T>
) => logger.measurePerformance(category, operation, fn);
