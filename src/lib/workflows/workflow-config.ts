/**
 * ️ CONFIGURATION AVANCeE DES WORKFLOWS INTELLIGENTS
 * Personnalisation complete du comportement du systeme
 */

export interface WorkflowConfig {
  // Activation/Desactivation
  enabled: boolean;
  autoTrigger: boolean;
  
  // Intelligence Artificielle
  ai: {
    provider: 'ollama' | 'openai' | 'anthropic';
    model: string;
    temperature: number;
    maxTokens: number;
    fallbackEnabled: boolean;
    confidenceThreshold: number; // 0-1
    analysisDepth: 'quick' | 'standard' | 'deep';
  };
  
  // Notifications
  notifications: {
    enabled: boolean;
    channels: ('web' | 'email' | 'sms' | 'webhook')[];
    priority: {
      critical: NotificationSettings;
      high: NotificationSettings;
      medium: NotificationSettings;
      low: NotificationSettings;
    };
    quietHours: {
      enabled: boolean;
      start: string; // "22:00"
      end: string;   // "08:00"
    };
  };
  
  // Formulaires Dynamiques
  forms: {
    autofill: boolean;
    aiSuggestions: boolean;
    conditionalLogic: boolean;
    saveProgress: boolean;
    requiredFields: 'strict' | 'flexible';
    validationLevel: 'basic' | 'advanced';
  };
  
  // Calendrier & Planning
  calendar: {
    provider: 'google' | 'outlook' | 'internal';
    autoSchedule: boolean;
    bufferMinutes: number;
    workingHours: {
      start: string;
      end: string;
      daysOfWeek: number[]; // 0-6 (0=dimanche)
    };
    defaultDuration: number; // minutes
    reminderMinutes: number[];
  };
  
  // Emails Automatiques
  email: {
    autoReply: boolean;
    requireApproval: boolean;
    templates: EmailTemplateConfig[];
    signature: string;
    cc: string[];
    bcc: string[];
    replyTo: string;
  };
  
  // Regles de Routage
  routing: {
    rules: RoutingRule[];
    defaultAssignee: string;
    escalationRules: EscalationRule[];
    loadBalancing: 'round-robin' | 'least-busy' | 'skill-based';
  };
  
  // Performance & Limites
  performance: {
    maxConcurrentWorkflows: number;
    timeoutSeconds: number;
    retryAttempts: number;
    retryDelayMs: number;
    cacheDuration: number;
  };
  
  // Securite & Compliance
  security: {
    encryptData: boolean;
    auditLog: boolean;
    requireTwoFactor: boolean;
    allowedDomains: string[];
    blockedSenders: string[];
    dataRetentionDays: number;
  };
  
  // Integrations
  integrations: {
    gmail: IntegrationConfig;
    outlook: IntegrationConfig;
    slack: IntegrationConfig;
    teams: IntegrationConfig;
    webhook: WebhookConfig[];
  };
  
  // Analytics & Reporting
  analytics: {
    enabled: boolean;
    trackEvents: string[];
    dashboardRefreshMs: number;
    exportFormats: ('csv' | 'xlsx' | 'json')[];
  };
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  dismissible: boolean;
  timeoutMinutes: number;
  escalateAfterMinutes: number;
}

export interface EmailTemplateConfig {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  variables: string[];
  attachments: string[];
}

export interface RoutingRule {
  id: string;
  condition: {
    category?: string[];
    urgency?: string[];
    sender?: string[];
    keywords?: string[];
    customField?: Record<string, any>;
  };
  action: {
    assignTo: string;
    workflow: string;
    priority: number;
    tags: string[];
  };
}

export interface EscalationRule {
  id: string;
  trigger: {
    noResponseMinutes: number;
    priority: string[];
  };
  action: {
    escalateTo: string;
    notifyChannels: string[];
    increaseUrgency: boolean;
  };
}

export interface IntegrationConfig {
  enabled: boolean;
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  scopes?: string[];
  customConfig?: Record<string, any>;
}

export interface WebhookConfig {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT';
  headers: Record<string, string>;
  events: string[];
  retryOnFailure: boolean;
}

/**
 * CONFIGURATION PAR DeFAUT
 */
export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  enabled: true,
  autoTrigger: true,
  
  ai: {
    provider: 'ollama',
    model: 'llama3.2:latest',
    temperature: 0.7,
    maxTokens: 2000,
    fallbackEnabled: true,
    confidenceThreshold: 0.7,
    analysisDepth: 'standard',
  },
  
  notifications: {
    enabled: true,
    channels: ['web', 'email'],
    priority: {
      critical: {
        enabled: true,
        sound: true,
        vibration: true,
        dismissible: false,
        timeoutMinutes: 60,
        escalateAfterMinutes: 30,
      },
      high: {
        enabled: true,
        sound: true,
        vibration: false,
        dismissible: true,
        timeoutMinutes: 240,
        escalateAfterMinutes: 120,
      },
      medium: {
        enabled: true,
        sound: false,
        vibration: false,
        dismissible: true,
        timeoutMinutes: 1440,
        escalateAfterMinutes: 720,
      },
      low: {
        enabled: true,
        sound: false,
        vibration: false,
        dismissible: true,
        timeoutMinutes: 10080,
        escalateAfterMinutes: 5040,
      },
    },
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
    },
  },
  
  forms: {
    autofill: true,
    aiSuggestions: true,
    conditionalLogic: true,
    saveProgress: true,
    requiredFields: 'flexible',
    validationLevel: 'advanced',
  },
  
  calendar: {
    provider: 'internal',
    autoSchedule: false,
    bufferMinutes: 15,
    workingHours: {
      start: '09:00',
      end: '18:00',
      daysOfWeek: [1, 2, 3, 4, 5], // Lundi-Vendredi
    },
    defaultDuration: 60,
    reminderMinutes: [1440, 60, 15], // 1 jour, 1h, 15min
  },
  
  email: {
    autoReply: false,
    requireApproval: true,
    templates: [],
    signature: '',
    cc: [],
    bcc: [],
    replyTo: '',
  },
  
  routing: {
    rules: [],
    defaultAssignee: 'auto',
    escalationRules: [],
    loadBalancing: 'skill-based',
  },
  
  performance: {
    maxConcurrentWorkflows: 10,
    timeoutSeconds: 300,
    retryAttempts: 3,
    retryDelayMs: 5000,
    cacheDuration: 3600,
  },
  
  security: {
    encryptData: true,
    auditLog: true,
    requireTwoFactor: false,
    allowedDomains: [],
    blockedSenders: [],
    dataRetentionDays: 365,
  },
  
  integrations: {
    gmail: { enabled: false },
    outlook: { enabled: false },
    slack: { enabled: false },
    teams: { enabled: false },
    webhook: [],
  },
  
  analytics: {
    enabled: true,
    trackEvents: [
      'email_received',
      'workflow_triggered',
      'notification_sent',
      'form_submitted',
      'calendar_event_created',
    ],
    dashboardRefreshMs: 30000,
    exportFormats: ['csv', 'json'],
  },
};

/**
 * CONFIGURATIONS PReDeFINIES
 */
export const PRESET_CONFIGS = {
  /**
   * Mode Performance - Maximum de rapidite, minimum de validations
   */
  PERFORMANCE: {
    ...DEFAULT_WORKFLOW_CONFIG,
    ai: {
      ...DEFAULT_WORKFLOW_CONFIG.ai,
      analysisDepth: 'quick',
      temperature: 0.5,
      maxTokens: 1000,
    },
    forms: {
      ...DEFAULT_WORKFLOW_CONFIG.forms,
      requiredFields: 'flexible',
      validationLevel: 'basic',
    },
    performance: {
      maxConcurrentWorkflows: 50,
      timeoutSeconds: 120,
      retryAttempts: 1,
      retryDelayMs: 1000,
      cacheDuration: 7200,
    },
  },
  
  /**
   * Mode Securite - Maximum de controles et validations
   */
  SECURITY: {
    ...DEFAULT_WORKFLOW_CONFIG,
    ai: {
      ...DEFAULT_WORKFLOW_CONFIG.ai,
      analysisDepth: 'deep',
      confidenceThreshold: 0.9,
    },
    email: {
      ...DEFAULT_WORKFLOW_CONFIG.email,
      requireApproval: true,
      autoReply: false,
    },
    forms: {
      ...DEFAULT_WORKFLOW_CONFIG.forms,
      requiredFields: 'strict',
      validationLevel: 'advanced',
    },
    security: {
      encryptData: true,
      auditLog: true,
      requireTwoFactor: true,
      allowedDomains: [],
      blockedSenders: [],
      dataRetentionDays: 730,
    },
  },
  
  /**
   * Mode Automatique - Maximum d'automation, minimum d'intervention
   */
  AUTOMATED: {
    ...DEFAULT_WORKFLOW_CONFIG,
    autoTrigger: true,
    email: {
      ...DEFAULT_WORKFLOW_CONFIG.email,
      autoReply: true,
      requireApproval: false,
    },
    calendar: {
      ...DEFAULT_WORKFLOW_CONFIG.calendar,
      autoSchedule: true,
    },
    forms: {
      ...DEFAULT_WORKFLOW_CONFIG.forms,
      autofill: true,
      aiSuggestions: true,
    },
    routing: {
      ...DEFAULT_WORKFLOW_CONFIG.routing,
      loadBalancing: 'least-busy',
    },
  },
  
  /**
   * Mode Cabinet Juridique - Optimise pour avocats
   */
  LAW_FIRM: {
    ...DEFAULT_WORKFLOW_CONFIG,
    ai: {
      provider: 'ollama',
      model: 'llama3.2:latest',
      temperature: 0.3, // Plus conservateur pour juridique
      maxTokens: 3000,
      fallbackEnabled: true,
      confidenceThreshold: 0.85,
      analysisDepth: 'deep',
    },
    notifications: {
      ...DEFAULT_WORKFLOW_CONFIG.notifications,
      channels: ['web', 'email', 'sms'],
      priority: {
        ...DEFAULT_WORKFLOW_CONFIG.notifications.priority,
        critical: {
          ...DEFAULT_WORKFLOW_CONFIG.notifications.priority.critical,
          escalateAfterMinutes: 15, // Escalade rapide pour juridique
        },
      },
    },
    calendar: {
      provider: 'internal',
      autoSchedule: false, // Validation manuelle requise
      bufferMinutes: 30,
      workingHours: {
        start: '08:30',
        end: '19:00',
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      defaultDuration: 90, // Consultations plus longues
      reminderMinutes: [2880, 1440, 60], // 2 jours, 1 jour, 1h
    },
    security: {
      encryptData: true,
      auditLog: true,
      requireTwoFactor: true,
      allowedDomains: [],
      blockedSenders: [],
      dataRetentionDays: 2555, // 7 ans (obligation legale)
    },
  },
};

/**
 * Charge la configuration depuis la base de donnees ou utilise la config par defaut
 */
export async function loadWorkflowConfig(tenantId?: string): Promise<WorkflowConfig> {
  // TODO: Charger depuis DB si tenantId fourni
  return DEFAULT_WORKFLOW_CONFIG;
}

/**
 * Sauvegarde la configuration
 */
export async function saveWorkflowConfig(
  config: Partial<WorkflowConfig>,
  tenantId?: string
): Promise<void> {
  // TODO: Sauvegarder en DB
  console.log('Sauvegarde configuration:', config);
}

/**
 * Valide une configuration
 */
export function validateWorkflowConfig(config: Partial<WorkflowConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (config.ai?.temperature && (config.ai.temperature < 0 || config.ai.temperature > 1)) {
    errors.push('AI temperature doit etre entre 0 et 1');
  }
  
  if (config.performance?.maxConcurrentWorkflows && config.performance.maxConcurrentWorkflows < 1) {
    errors.push('maxConcurrentWorkflows doit etre >= 1');
  }
  
  if (config.security?.dataRetentionDays && config.security.dataRetentionDays < 30) {
    errors.push('dataRetentionDays doit etre >= 30 jours');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Merge deux configurations
 */
export function mergeConfigs(
  base: WorkflowConfig,
  override: Partial<WorkflowConfig>
): WorkflowConfig {
  return {
    ...base,
    ...override,
    ai: { ...base.ai, ...override.ai },
    notifications: { ...base.notifications, ...override.notifications },
    forms: { ...base.forms, ...override.forms },
    calendar: { ...base.calendar, ...override.calendar },
    email: { ...base.email, ...override.email },
    routing: { ...base.routing, ...override.routing },
    performance: { ...base.performance, ...override.performance },
    security: { ...base.security, ...override.security },
    integrations: { ...base.integrations, ...override.integrations },
    analytics: { ...base.analytics, ...override.analytics },
  };
}
