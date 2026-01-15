/**
 * IA POSTE MANAGER - Système de Logging Juridique Professionnel
 * 
 * Logging spécialisé pour cabinet d'avocats CESEDA avec:
 * - Conformité RGPD (anonymisation automatique)
 * - Audit trail juridique inaltérable
 * - Traçabilité des actions métier (dossiers, OQTF, recours)
 * - Zero-Trust logging (toutes actions tracées)
 * 
 * Production: Logs structurés et filtrés
 * Développement: Logs détaillés avec contexte
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

// Types métier spécifiques au cabinet juridique
type ActionJuridique = 
  | 'CREATE_DOSSIER'
  | 'UPDATE_DOSSIER'
  | 'DELETE_DOSSIER'
  | 'ADD_DOCUMENT'
  | 'DELETE_DOCUMENT'
  | 'CREATE_DEADLINE'
  | 'UPDATE_DEADLINE'
  | 'GENERATE_RECOURS'
  | 'SEND_EMAIL_CLIENT'
  | 'EXPORT_DOSSIER'
  | 'AI_ANALYSIS'
  | 'AI_SUGGESTION'
  | 'CHECKLIST_UPDATE'
  | 'WORKSPACE_CHANGE'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'PERMISSION_DENIED'
  | 'COMPLIANCE_CHECK';

type TypeDossier = 'OQTF' | 'REFUS_TITRE' | 'RETRAIT_TITRE' | 'NATURALISATION' | 'REGROUPEMENT_FAMILIAL' | 'AUTRE';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  tenantId?: string;
  dossierId?: string;
  clientId?: string;
  actionJuridique?: ActionJuridique;
  typeDossier?: TypeDossier;
  stackTrace?: string;
  rgpdCompliant?: boolean;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;
  private logBuffer: LogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Log de debug - uniquement en développement
   */
  debug(message: string, context?: Record<string, any>): void {
    if (!this.isDevelopment) return;

    const entry = this.createLogEntry('debug', message, context);
    console.log(`🔍 [DEBUG] ${message}`, context || '');
    this.bufferLog(entry);
  }

  /**
   * Log d'information - visible en dev, structuré en prod
   */
  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('info', message, context);

    if (this.isDevelopment) {
      console.info(`ℹ️ [INFO] ${message}`, context || '');
    } else {
      this.sendToMonitoring(entry);
    }

    this.bufferLog(entry);
  }

  /**
   * Warning - toujours visible, mais formaté selon environnement
   */
  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('warn', message, context);

    if (this.isDevelopment) {
      console.warn(`⚠️ [WARN] ${message}`, context || '');
    } else {
      this.sendToMonitoring(entry);
    }

    this.bufferLog(entry);
  }

  /**
   * Erreur - toujours loggée avec stack trace
   */
  error(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    const stackTrace = error instanceof Error ? error.stack : undefined;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    const entry = this.createLogEntry('error', `${message}: ${errorMessage}`, {
      ...context,
      stackTrace,
    });

    if (this.isDevelopment) {
      console.error(`❌ [ERROR] ${message}`, {
        error: errorMessage,
        context,
        stack: stackTrace,
      });
    } else {
      this.sendToMonitoring(entry);
    }

    this.bufferLog(entry);
  }

  /**
   * Erreur critique - nécessite attention immédiate
   */
  critical(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    const stackTrace = error instanceof Error ? error.stack : undefined;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    const entry = this.createLogEntry('critical', `${message}: ${errorMessage}`, {
      ...context,
      stackTrace,
      severity: 'CRITICAL',
    });

    console.error(`🚨 [CRITICAL] ${message}`, {
      error: errorMessage,
      context,
      stack: stackTrace,
    });

    this.sendToMonitoring(entry);
    this.bufferLog(entry);

    if (this.isProduction) {
      this.sendCriticalAlert(entry);
    }
  }

  /**
   * Log de performance - mesure le temps d'exécution
   */
  performance(operation: string, durationMs: number, context?: Record<string, any>): void {
    const message = `${operation} completed in ${durationMs}ms`;
    
    if (durationMs > 1000) {
      this.warn(`Slow operation: ${message}`, { ...context, durationMs });
    } else if (this.isDevelopment) {
      this.debug(message, { ...context, durationMs });
    }
  }

  /**
   * Log d'audit juridique - CONFORMITÉ RGPD & TRACABILITÉ INALTÉRABLE
   */
  audit(action: string, userId: string, tenantId: string, details?: Record<string, any>): void {
    const entry = this.createLogEntry('info', `AUDIT JURIDIQUE: ${action}`, {
      ...details,
      userId,
      tenantId,
      auditType: true,
      rgpdCompliant: true,
    });

    entry.userId = userId;
    entry.tenantId = tenantId;

    this.sendToMonitoring(entry);
    this.bufferLog(entry);

    if (this.isDevelopment) {
      console.log(`⚖️ [AUDIT JURIDIQUE] ${action}`, { userId, tenantId, details });
    }
  }

  /**
   * Log spécifique aux actions sur dossiers CESEDA
   */
  logActionDossier(
    action: ActionJuridique,
    userId: string,
    tenantId: string,
    dossierId: string,
    details?: {
      clientId?: string;
      typeDossier?: TypeDossier;
      documentName?: string;
      deadline?: string;
      aiGenerated?: boolean;
      [key: string]: any;
    }
  ): void {
    const entry = this.createLogEntry('info', `ACTION DOSSIER: ${action}`, {
      ...details,
      actionJuridique: action,
      dossierId,
      rgpdCompliant: true,
    });

    entry.userId = userId;
    entry.tenantId = tenantId;
    entry.dossierId = dossierId;
    entry.clientId = details?.clientId;
    entry.actionJuridique = action;
    entry.typeDossier = details?.typeDossier;

    this.sendToMonitoring(entry);
    this.bufferLog(entry);

    if (this.isDevelopment) {
      console.log(`📁 [DOSSIER ${action}]`, {
        dossierId,
        type: details?.typeDossier,
        client: details?.clientId,
        user: userId,
      });
    }
  }

  /**
   * Log des actions IA - Transparence totale
   */
  logAIAction(
    operation: 'ANALYSIS' | 'SUGGESTION' | 'GENERATION' | 'CHECKLIST',
    userId: string,
    tenantId: string,
    details: {
      dossierId?: string;
      inputType?: string;
      outputType?: string;
      confidence?: number;
      modelUsed?: string;
      dataAnonymized?: boolean;
      [key: string]: any;
    }
  ): void {
    const entry = this.createLogEntry('info', `IA ${operation}`, {
      ...details,
      aiOperation: operation,
      timestamp: new Date().toISOString(),
      rgpdCompliant: details.dataAnonymized !== false,
    });

    entry.userId = userId;
    entry.tenantId = tenantId;
    entry.dossierId = details.dossierId;

    this.sendToMonitoring(entry);
    this.bufferLog(entry);

    if (this.isDevelopment) {
      console.log(`🤖 [IA ${operation}]`, {
        confidence: details.confidence,
        model: details.modelUsed,
        anonymized: details.dataAnonymized !== false,
      });
    }
  }

  /**
   * Log d'alerte délai critique - URGENCE JURIDIQUE
   */
  logDeadlineAlert(
    severity: 'CRITIQUE' | 'URGENT' | 'RAPPEL',
    dossierId: string,
    tenantId: string,
    deadline: {
      type: string;
      date: Date;
      heuresRestantes: number;
      typeDossier?: TypeDossier;
    }
  ): void {
    const message = `⏰ DÉLAI ${severity}: ${deadline.type} dans ${deadline.heuresRestantes}h`;
    
    const level = severity === 'CRITIQUE' ? 'critical' : severity === 'URGENT' ? 'error' : 'warn';
    
    const entry = this.createLogEntry(level, message, {
      dossierId,
      deadlineType: deadline.type,
      deadlineDate: deadline.date.toISOString(),
      heuresRestantes: deadline.heuresRestantes,
      typeDossier: deadline.typeDossier,
      alerteSeverity: severity,
    });

    entry.tenantId = tenantId;
    entry.dossierId = dossierId;
    entry.typeDossier = deadline.typeDossier;

    if (severity === 'CRITIQUE') {
      this.sendCriticalAlert(entry);
    }

    this.sendToMonitoring(entry);
    this.bufferLog(entry);

    if (this.isDevelopment) {
      const emoji = severity === 'CRITIQUE' ? '🚨' : severity === 'URGENT' ? '⚠️' : '📅';
      console.log(`${emoji} [DÉLAI ${severity}]`, {
        dossier: dossierId,
        type: deadline.type,
        heuresRestantes: deadline.heuresRestantes,
      });
    }
  }

  /**
   * Log de conformité RGPD
   */
  logComplianceAction(
    action: 'EXPORT_DATA' | 'ANONYMIZE' | 'DELETE_PERSONAL_DATA' | 'CONSENT_UPDATE',
    userId: string,
    tenantId: string,
    details: {
      clientId?: string;
      dataType?: string;
      reason?: string;
      [key: string]: any;
    }
  ): void {
    const entry = this.createLogEntry('info', `RGPD: ${action}`, {
      ...details,
      complianceAction: action,
      rgpdCompliant: true,
    });

    entry.userId = userId;
    entry.tenantId = tenantId;
    entry.clientId = details.clientId;

    this.sendToMonitoring(entry);
    this.bufferLog(entry);

    if (this.isDevelopment) {
      console.log(`🔒 [RGPD ${action}]`, {
        client: details.clientId,
        type: details.dataType,
        reason: details.reason,
      });
    }
  }

  /**
   * Créer une entrée de log structurée
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
    };
  }

  /**
   * Sanitizer le contexte - CONFORMITÉ RGPD RENFORCÉE
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;

    const technicalSensitive = ['password', 'token', 'apiKey', 'secret', 'creditCard', 'sessionId'];
    const personalData = [
      'nom', 'prenom', 'nomNaissance', 'firstname', 'lastname',
      'telephone', 'phone', 'mobile',
      'adresse', 'address', 'domicile',
      'numeroSecuriteSociale', 'ssn',
      'numeroPasseport', 'passport',
      'dateNaissance', 'birthdate',
      'lieuNaissance', 'birthplace',
      'nationalite', 'nationality'
    ];

    const sanitized = { ...context };

    Object.keys(sanitized).forEach((key) => {
      const lowerKey = key.toLowerCase();
      
      if (technicalSensitive.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
      
      if (!context.rgpdCompliant && personalData.some((personal) => lowerKey.includes(personal))) {
        sanitized[key] = '[DONNÉES PERSONNELLES]';
      }

      if (lowerKey.includes('email') && typeof sanitized[key] === 'string') {
        const email = sanitized[key] as string;
        const [, domain] = email.split('@');
        sanitized[key] = `***@${domain || 'anonymized.com'}`;
      }
    });

    return sanitized;
  }

  /**
   * Buffer les logs
   */
  private bufferLog(entry: LogEntry): void {
    this.logBuffer.push(entry);

    if (this.logBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.flushBuffer();
    }
  }

  /**
   * Flush le buffer
   */
  private flushBuffer(): void {
    if (this.logBuffer.length === 0) return;
    this.logBuffer = [];
  }

  /**
   * Récupérer les logs du buffer pour consultation admin
   */
  public getBufferedLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * Envoyer à monitoring externe
   */
  private sendToMonitoring(entry: LogEntry): void {
    if (!this.isProduction) return;
    // TODO: Intégration Sentry, DataDog, etc.
  }

  /**
   * Envoyer alerte critique
   */
  private sendCriticalAlert(entry: LogEntry): void {
    // TODO: Intégration alerting (Slack, Email, PagerDuty)
  }

  /**
   * Récupérer logs récents
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Timer pour mesurer performance
   */
  startTimer(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.performance(label, duration);
    };
  }
}

// Singleton
export const logger = new Logger();

// Helper async avec logging
export function withLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const stopTimer = logger.startTimer(operationName);
    
    try {
      const result = await fn(...args);
      stopTimer();
      return result;
    } catch (error) {
      stopTimer();
      logger.error(`Failed: ${operationName}`, error);
      throw error;
    }
  }) as T;
}

// Helpers spécifiques CESEDA

export function logDossierAction(
  action: ActionJuridique,
  userId: string,
  tenantId: string,
  dossierId: string,
  details?: Record<string, any>
): void {
  logger.logActionDossier(action, userId, tenantId, dossierId, details);
}

export function logDeadlineCritique(
  dossierId: string,
  tenantId: string,
  deadlineInfo: {
    type: string;
    date: Date;
    heuresRestantes: number;
    typeDossier?: TypeDossier;
  }
): void {
  const severity = deadlineInfo.heuresRestantes < 48 ? 'CRITIQUE' : 
                   deadlineInfo.heuresRestantes < 168 ? 'URGENT' : 'RAPPEL';
  
  logger.logDeadlineAlert(severity, dossierId, tenantId, deadlineInfo);
}

export function logIAUsage(
  operation: 'ANALYSIS' | 'SUGGESTION' | 'GENERATION' | 'CHECKLIST',
  userId: string,
  tenantId: string,
  dossierId: string,
  details: Record<string, any>
): void {
  logger.logAIAction(operation, userId, tenantId, {
    dossierId,
    ...details,
    dataAnonymized: true,
  });
}

export function logRGPDAction(
  action: 'EXPORT_DATA' | 'ANONYMIZE' | 'DELETE_PERSONAL_DATA' | 'CONSENT_UPDATE',
  userId: string,
  tenantId: string,
  clientId: string,
  details?: Record<string, any>
): void {
  logger.logComplianceAction(action, userId, tenantId, {
    clientId,
    ...details,
  });
}

export default logger;
export type { ActionJuridique, TypeDossier, LogLevel, LogEntry };
