/**
 * Module Multi-Canal - Export centralisé
 * Tous les canaux de communication pour cabinets d'avocats
 */

// Types
export * from './types';

// Services
export { AIService, aiService } from './ai-processor';
export { AuditService, auditService } from './audit-service';
export { MultiChannelService, multiChannelService } from './channel-service';

// Adapters & Factory
export { AdapterFactory } from './adapter-factory';
export * from './adapters';

// Canaux supportés
export const SUPPORTED_CHANNELS = [
  'EMAIL',
  'WHATSAPP',
  'SMS',
  'VOICE',
  'SLACK',
  'TEAMS',
  'LINKEDIN',
  'TWITTER',
  'FORM',
  'DOCUMENT',
  'DECLAN',
  'INTERNAL',
] as const;

// Configuration par défaut
export const DEFAULT_CHANNEL_CONFIG = {
  consentRequired: true,
  autoArchive: false,
  archiveAfterDays: 365,
  aiProcessing: true,
};

// Mapping webhooks
export const WEBHOOK_ENDPOINTS = {
  EMAIL: '/api/webhooks/channel/email',
  WHATSAPP: '/api/webhooks/channel/whatsapp',
  SMS: '/api/webhooks/channel/sms',
  VOICE: '/api/webhooks/channel/voice',
  SLACK: '/api/webhooks/channel/slack',
  TEAMS: '/api/webhooks/channel/teams',
  LINKEDIN: '/api/webhooks/channel/linkedin',
  TWITTER: '/api/webhooks/channel/twitter',
  FORM: '/api/webhooks/channel/form',
  DOCUMENT: '/api/webhooks/channel/document',
  DECLAN: '/api/webhooks/channel/declan',
  INTERNAL: '/api/webhooks/channel/internal',
};
