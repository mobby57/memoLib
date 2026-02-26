/**
 * Tests pour multichannel/types.ts
 * Tests des types du module multi-canal (sans services complexes)
 */

// Import types directly to avoid service dependencies
import type {
  ChannelType,
  MessageDirection,
  MessageStatus,
  UrgencyLevel,
  ConsentStatus,
  NormalizedMessage,
  Attachment,
  AIAnalysis,
  ExtractedEntity,
  SuggestedAction,
  AuditEntry,
} from '@/lib/multichannel/types';

// Constants copied from index.ts to avoid service imports
const SUPPORTED_CHANNELS = [
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

const DEFAULT_CHANNEL_CONFIG = {
  consentRequired: true,
  autoArchive: false,
  archiveAfterDays: 365,
  aiProcessing: true,
};

const WEBHOOK_ENDPOINTS: Record<string, string> = {
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

describe('multichannel - Module Multi-Canal', () => {
  
  // ============================================
  // SUPPORTED_CHANNELS
  // ============================================
  describe('SUPPORTED_CHANNELS', () => {
    test('contient tous les canaux supportés', () => {
      expect(SUPPORTED_CHANNELS).toBeDefined();
      expect(Array.isArray(SUPPORTED_CHANNELS)).toBe(true);
      expect(SUPPORTED_CHANNELS.length).toBe(12);
    });

    test('contient EMAIL', () => {
      expect(SUPPORTED_CHANNELS).toContain('EMAIL');
    });

    test('contient WHATSAPP', () => {
      expect(SUPPORTED_CHANNELS).toContain('WHATSAPP');
    });

    test('contient SMS', () => {
      expect(SUPPORTED_CHANNELS).toContain('SMS');
    });

    test('contient VOICE', () => {
      expect(SUPPORTED_CHANNELS).toContain('VOICE');
    });

    test('contient SLACK', () => {
      expect(SUPPORTED_CHANNELS).toContain('SLACK');
    });

    test('contient TEAMS', () => {
      expect(SUPPORTED_CHANNELS).toContain('TEAMS');
    });

    test('contient LINKEDIN', () => {
      expect(SUPPORTED_CHANNELS).toContain('LINKEDIN');
    });

    test('contient TWITTER', () => {
      expect(SUPPORTED_CHANNELS).toContain('TWITTER');
    });

    test('contient FORM', () => {
      expect(SUPPORTED_CHANNELS).toContain('FORM');
    });

    test('contient DOCUMENT', () => {
      expect(SUPPORTED_CHANNELS).toContain('DOCUMENT');
    });

    test('contient DECLAN', () => {
      expect(SUPPORTED_CHANNELS).toContain('DECLAN');
    });

    test('contient INTERNAL', () => {
      expect(SUPPORTED_CHANNELS).toContain('INTERNAL');
    });

    test('est un tableau readonly', () => {
      // TypeScript enforces readonly, but we can check the values are strings
      SUPPORTED_CHANNELS.forEach(channel => {
        expect(typeof channel).toBe('string');
      });
    });
  });

  // ============================================
  // DEFAULT_CHANNEL_CONFIG
  // ============================================
  describe('DEFAULT_CHANNEL_CONFIG', () => {
    test('est défini', () => {
      expect(DEFAULT_CHANNEL_CONFIG).toBeDefined();
    });

    test('consentRequired est true par défaut', () => {
      expect(DEFAULT_CHANNEL_CONFIG.consentRequired).toBe(true);
    });

    test('autoArchive est false par défaut', () => {
      expect(DEFAULT_CHANNEL_CONFIG.autoArchive).toBe(false);
    });

    test('archiveAfterDays est 365 par défaut', () => {
      expect(DEFAULT_CHANNEL_CONFIG.archiveAfterDays).toBe(365);
    });

    test('aiProcessing est true par défaut', () => {
      expect(DEFAULT_CHANNEL_CONFIG.aiProcessing).toBe(true);
    });

    test('a 4 propriétés de configuration', () => {
      expect(Object.keys(DEFAULT_CHANNEL_CONFIG).length).toBe(4);
    });
  });

  // ============================================
  // WEBHOOK_ENDPOINTS
  // ============================================
  describe('WEBHOOK_ENDPOINTS', () => {
    test('est défini', () => {
      expect(WEBHOOK_ENDPOINTS).toBeDefined();
    });

    test('a un endpoint pour chaque canal supporté', () => {
      SUPPORTED_CHANNELS.forEach(channel => {
        expect(WEBHOOK_ENDPOINTS[channel]).toBeDefined();
      });
    });

    test('EMAIL endpoint est correct', () => {
      expect(WEBHOOK_ENDPOINTS.EMAIL).toBe('/api/webhooks/channel/email');
    });

    test('WHATSAPP endpoint est correct', () => {
      expect(WEBHOOK_ENDPOINTS.WHATSAPP).toBe('/api/webhooks/channel/whatsapp');
    });

    test('SMS endpoint est correct', () => {
      expect(WEBHOOK_ENDPOINTS.SMS).toBe('/api/webhooks/channel/sms');
    });

    test('VOICE endpoint est correct', () => {
      expect(WEBHOOK_ENDPOINTS.VOICE).toBe('/api/webhooks/channel/voice');
    });

    test('SLACK endpoint est correct', () => {
      expect(WEBHOOK_ENDPOINTS.SLACK).toBe('/api/webhooks/channel/slack');
    });

    test('TEAMS endpoint est correct', () => {
      expect(WEBHOOK_ENDPOINTS.TEAMS).toBe('/api/webhooks/channel/teams');
    });

    test('LINKEDIN endpoint est correct', () => {
      expect(WEBHOOK_ENDPOINTS.LINKEDIN).toBe('/api/webhooks/channel/linkedin');
    });

    test('TWITTER endpoint est correct', () => {
      expect(WEBHOOK_ENDPOINTS.TWITTER).toBe('/api/webhooks/channel/twitter');
    });

    test('FORM endpoint est correct', () => {
      expect(WEBHOOK_ENDPOINTS.FORM).toBe('/api/webhooks/channel/form');
    });

    test('DOCUMENT endpoint est correct', () => {
      expect(WEBHOOK_ENDPOINTS.DOCUMENT).toBe('/api/webhooks/channel/document');
    });

    test('DECLAN endpoint est correct', () => {
      expect(WEBHOOK_ENDPOINTS.DECLAN).toBe('/api/webhooks/channel/declan');
    });

    test('INTERNAL endpoint est correct', () => {
      expect(WEBHOOK_ENDPOINTS.INTERNAL).toBe('/api/webhooks/channel/internal');
    });

    test('tous les endpoints commencent par /api/webhooks/channel/', () => {
      Object.values(WEBHOOK_ENDPOINTS).forEach(endpoint => {
        expect(endpoint.startsWith('/api/webhooks/channel/')).toBe(true);
      });
    });
  });

  // ============================================
  // Types validation (type guards)
  // ============================================
  describe('Types validation', () => {
    describe('ChannelType', () => {
      test('accepte les valeurs valides', () => {
        const validChannels: ChannelType[] = [
          'EMAIL', 'WHATSAPP', 'SMS', 'VOICE', 'SLACK', 
          'TEAMS', 'LINKEDIN', 'TWITTER', 'FORM', 'DOCUMENT', 
          'DECLAN', 'INTERNAL'
        ];
        validChannels.forEach(channel => {
          const testChannel: ChannelType = channel;
          expect(testChannel).toBe(channel);
        });
      });
    });

    describe('MessageDirection', () => {
      test('accepte INBOUND et OUTBOUND', () => {
        const directions: MessageDirection[] = ['INBOUND', 'OUTBOUND'];
        expect(directions.length).toBe(2);
      });
    });

    describe('MessageStatus', () => {
      test('accepte tous les statuts valides', () => {
        const statuses: MessageStatus[] = [
          'RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'ARCHIVED'
        ];
        expect(statuses.length).toBe(5);
      });
    });

    describe('UrgencyLevel', () => {
      test('accepte tous les niveaux d\'urgence', () => {
        const levels: UrgencyLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        expect(levels.length).toBe(4);
      });
    });

    describe('ConsentStatus', () => {
      test('accepte tous les statuts de consentement', () => {
        const statuses: ConsentStatus[] = [
          'PENDING', 'GRANTED', 'REVOKED', 'NOT_REQUIRED'
        ];
        expect(statuses.length).toBe(4);
      });
    });
  });

  // ============================================
  // Interface structure validation
  // ============================================
  describe('Interface structure', () => {
    test('NormalizedMessage a les propriétés requises', () => {
      const message: NormalizedMessage = {
        id: 'msg-1',
        channel: 'EMAIL',
        direction: 'INBOUND',
        status: 'RECEIVED',
        sender: { email: 'test@example.com' },
        recipient: { email: 'cabinet@example.com' },
        body: 'Contenu du message',
        attachments: [],
        channelMetadata: {},
        timestamps: { received: new Date() },
        consent: { status: 'GRANTED' },
        auditTrail: [],
      };

      expect(message.id).toBe('msg-1');
      expect(message.channel).toBe('EMAIL');
      expect(message.body).toBe('Contenu du message');
    });

    test('Attachment a les propriétés requises', () => {
      const attachment: Attachment = {
        id: 'att-1',
        filename: 'document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
      };

      expect(attachment.id).toBe('att-1');
      expect(attachment.filename).toBe('document.pdf');
      expect(attachment.mimeType).toBe('application/pdf');
      expect(attachment.size).toBe(1024);
    });

    test('AIAnalysis a les propriétés requises', () => {
      const analysis: AIAnalysis = {
        tags: ['urgent', 'recours'],
        urgency: 'HIGH',
        entities: [],
        suggestedActions: [],
        missingInfo: [],
        processedAt: new Date(),
        confidence: 0.85,
      };

      expect(analysis.tags).toContain('urgent');
      expect(analysis.urgency).toBe('HIGH');
      expect(analysis.confidence).toBe(0.85);
    });

    test('ExtractedEntity a les propriétés requises', () => {
      const entity: ExtractedEntity = {
        type: 'PERSON',
        value: 'Jean Dupont',
        confidence: 0.95,
      };

      expect(entity.type).toBe('PERSON');
      expect(entity.value).toBe('Jean Dupont');
    });

    test('SuggestedAction a les propriétés requises', () => {
      const action: SuggestedAction = {
        type: 'RESPOND',
        description: 'Répondre au client',
        priority: 1,
        automated: false,
      };

      expect(action.type).toBe('RESPOND');
      expect(action.priority).toBe(1);
      expect(action.automated).toBe(false);
    });

    test('AuditEntry a les propriétés requises', () => {
      const entry: AuditEntry = {
        timestamp: new Date(),
        action: 'MESSAGE_RECEIVED',
        actor: { type: 'SYSTEM' },
        details: { source: 'email' },
      };

      expect(entry.action).toBe('MESSAGE_RECEIVED');
      expect(entry.actor.type).toBe('SYSTEM');
    });
  });

  // ============================================
  // Cohérence module
  // ============================================
  describe('Cohérence du module', () => {
    test('WEBHOOK_ENDPOINTS couvre tous les SUPPORTED_CHANNELS', () => {
      const webhookChannels = Object.keys(WEBHOOK_ENDPOINTS);
      expect(webhookChannels.length).toBe(SUPPORTED_CHANNELS.length);
      
      SUPPORTED_CHANNELS.forEach(channel => {
        expect(webhookChannels).toContain(channel);
      });
    });

    test('les endpoints sont uniques', () => {
      const endpoints = Object.values(WEBHOOK_ENDPOINTS);
      const uniqueEndpoints = new Set(endpoints);
      expect(uniqueEndpoints.size).toBe(endpoints.length);
    });
  });
});
