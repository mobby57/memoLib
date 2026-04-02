/**
 * Types pour le système multi-canal
 * Tous les canaux de communication normalisés
 */

export type ChannelType =
  | 'EMAIL'
  | 'WHATSAPP'
  | 'SMS'
  | 'VOICE'
  | 'SLACK'
  | 'TEAMS'
  | 'LINKEDIN'
  | 'TWITTER'
  | 'FORM'
  | 'DOCUMENT'
  | 'DECLAN'
  | 'INTERNAL';

export type MessageDirection = 'INBOUND' | 'OUTBOUND';

export type MessageStatus = 'RECEIVED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'ARCHIVED';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ConsentStatus = 'PENDING' | 'GRANTED' | 'REVOKED' | 'NOT_REQUIRED';

/**
 * Message normalisé - format unifié pour tous les canaux
 */
export interface NormalizedMessage {
  id: string;
  externalId?: string; // ID unique du message source (Gmail messageId, WhatsApp messageId, etc.)
  checksum: string; // Hash SHA-256 pour détection doublons
  channel: ChannelType;
  direction: MessageDirection;
  status: MessageStatus;

  // Métadonnées expéditeur/destinataire
  sender: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    externalId?: string; // ID externe (WhatsApp, Slack, etc.)
  };
  recipient: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };

  // Contenu
  subject?: string;
  body: string;
  bodyHtml?: string;

  // Pièces jointes
  attachments: Attachment[];

  // Métadonnées canal
  channelMetadata: Record<string, unknown>;

  // IA / ML
  aiAnalysis?: AIAnalysis;

  // Audit
  timestamps: {
    received: Date;
    processed?: Date;
    archived?: Date;
  };

  // RGPD
  consent: {
    status: ConsentStatus;
    grantedAt?: Date;
    revokedAt?: Date;
    purpose?: string;
  };

  // Liens métier
  tenantId?: string;
  clientId?: string;
  dossierId?: string;

  // Audit trail
  auditTrail: AuditEntry[];
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  blobPath?: string;
  checksum?: string;
  scannedAt?: Date;
  scanResult?: 'CLEAN' | 'SUSPICIOUS' | 'INFECTED';
}

export interface AIAnalysis {
  summary?: string;
  category?: string;
  tags: string[];
  urgency: UrgencyLevel;
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  language?: string;
  entities: ExtractedEntity[];
  suggestedActions: SuggestedAction[];
  missingInfo: string[];
  processedAt: Date;
  confidence: number;
}

export interface ExtractedEntity {
  type: 'PERSON' | 'ORGANIZATION' | 'DATE' | 'AMOUNT' | 'REFERENCE' | 'ADDRESS' | 'PHONE' | 'EMAIL';
  value: string;
  confidence: number;
}

export interface SuggestedAction {
  type: 'RESPOND' | 'ESCALATE' | 'ARCHIVE' | 'CREATE_DOSSIER' | 'LINK_CLIENT' | 'ALERT';
  description: string;
  priority: number;
  automated: boolean;
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  actor: {
    type: 'SYSTEM' | 'USER' | 'AI';
    id?: string;
    name?: string;
  };
  details: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Configuration canal
 */
export interface ChannelConfig {
  channel: ChannelType;
  enabled: boolean;
  consentRequired: boolean;
  autoArchive: boolean;
  archiveAfterDays: number;
  aiProcessing: boolean;
  webhookUrl?: string;
  credentials?: {
    keyVaultSecretName: string;
  };
}

/**
 * Webhook payload pour chaque canal
 */
export interface WebhookPayload {
  channel: ChannelType;
  timestamp: string;
  signature?: string;
  payload: Record<string, unknown>;
}

/**
 * Réponse API normalisée
 */
export interface ChannelResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * Stats multi-canal
 */
export interface ChannelStats {
  channel: ChannelType;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalMessages: number;
    inbound: number;
    outbound: number;
    processed: number;
    failed: number;
    avgProcessingTime: number;
    urgencyBreakdown: Record<UrgencyLevel, number>;
  };
}
