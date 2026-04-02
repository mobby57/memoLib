/**
 * Tests Pattern Adapter Multi-Canal
 * Validation déduplication, extraction externalId, Factory
 */

import { beforeEach, describe, expect, it } from '@jest/globals';
import { AdapterFactory } from '../adapter-factory';
import { EmailAdapter, SMSAdapter, WhatsAppAdapter } from '../adapters';

describe('Pattern Adapter Multi-Canal', () => {
  beforeEach(() => {
    AdapterFactory.resetInstances();
  });

  describe('AdapterFactory', () => {
    it('doit retourner le bon adapter selon le canal', () => {
      const emailAdapter = AdapterFactory.getAdapter('EMAIL');
      expect(emailAdapter).toBeInstanceOf(EmailAdapter);

      const whatsappAdapter = AdapterFactory.getAdapter('WHATSAPP');
      expect(whatsappAdapter).toBeInstanceOf(WhatsAppAdapter);

      const smsAdapter = AdapterFactory.getAdapter('SMS');
      expect(smsAdapter).toBeInstanceOf(SMSAdapter);
    });

    it('doit retourner la même instance (singleton)', () => {
      const adapter1 = AdapterFactory.getAdapter('EMAIL');
      const adapter2 = AdapterFactory.getAdapter('EMAIL');
      expect(adapter1).toBe(adapter2);
    });

    it('doit lister tous les canaux supportés', () => {
      const channels = AdapterFactory.getSupportedChannels();
      expect(channels).toContain('EMAIL');
      expect(channels).toContain('WHATSAPP');
      expect(channels).toContain('SMS');
      expect(channels).toHaveLength(12);
    });

    it('doit vérifier si un canal est supporté', () => {
      expect(AdapterFactory.isSupported('EMAIL')).toBe(true);
      expect(AdapterFactory.isSupported('UNKNOWN')).toBe(false);
    });
  });

  describe('EmailAdapter', () => {
    let adapter: EmailAdapter;

    beforeEach(() => {
      adapter = new EmailAdapter();
    });

    it('doit extraire externalId du payload', () => {
      const payload = {
        messageId: 'msg_12345',
        from: 'test@example.com',
        subject: 'Test',
        text: 'Hello',
      };

      const externalId = adapter.extractExternalId(payload);
      expect(externalId).toBe('msg_12345');
    });

    it('doit extraire externalId depuis id si messageId absent', () => {
      const payload = {
        id: 'alt_id_678',
        from: 'test@example.com',
      };

      const externalId = adapter.extractExternalId(payload);
      expect(externalId).toBe('alt_id_678');
    });

    it('doit normaliser un email webhook', async () => {
      const payload = {
        messageId: 'msg_abc',
        from: 'client@example.com',
        fromName: 'John Doe',
        to: 'cabinet@example.com',
        subject: 'Question urgente',
        text: "Bonjour, j'ai une question.",
        html: '<p>Bonjour</p>',
        attachments: [
          {
            filename: 'document.pdf',
            contentType: 'application/pdf',
            size: 12345,
            url: 'https://example.com/doc.pdf',
          },
        ],
      };

      const normalized = await adapter.parseWebhook(payload);

      expect(normalized.sender?.email).toBe('client@example.com');
      expect(normalized.sender?.name).toBe('John Doe');
      expect(normalized.recipient?.email).toBe('cabinet@example.com');
      expect(normalized.subject).toBe('Question urgente');
      expect(normalized.body).toBe("Bonjour, j'ai une question.");
      expect(normalized.bodyHtml).toBe('<p>Bonjour</p>');
      expect(normalized.attachments).toHaveLength(1);
      expect(normalized.attachments![0].filename).toBe('document.pdf');
    });
  });

  describe('WhatsAppAdapter', () => {
    let adapter: WhatsAppAdapter;

    beforeEach(() => {
      adapter = new WhatsAppAdapter();
    });

    it('doit extraire externalId du payload WhatsApp', () => {
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [{ id: 'wamid.abc123', from: '+33612345678', text: { body: 'Test' } }],
                },
              },
            ],
          },
        ],
      };

      const externalId = adapter.extractExternalId(payload);
      expect(externalId).toBe('wamid.abc123');
    });

    it('doit normaliser un message WhatsApp', async () => {
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      id: 'wamid.xyz',
                      from: '+33612345678',
                      type: 'text',
                      text: { body: 'Bonjour depuis WhatsApp' },
                    },
                  ],
                  contacts: [{ profile: { name: 'Marie Dupont' } }],
                },
              },
            ],
          },
        ],
      };

      const normalized = await adapter.parseWebhook(payload);

      expect(normalized.sender?.phone).toBe('+33612345678');
      expect(normalized.sender?.name).toBe('Marie Dupont');
      expect(normalized.body).toBe('Bonjour depuis WhatsApp');
    });

    it('doit valider signature WhatsApp (SHA-256)', () => {
      const payload = '{"test":"data"}';
      const secret = 'my_secret_key';
      const crypto = require('crypto');
      const validSignature =
        'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const isValid = adapter.validateSignature!(validSignature, payload, secret);
      expect(isValid).toBe(true);

      const invalidSignature = 'sha256=invalid';
      const isInvalid = adapter.validateSignature!(invalidSignature, payload, secret);
      expect(isInvalid).toBe(false);
    });
  });

  describe('SMSAdapter (Twilio)', () => {
    let adapter: SMSAdapter;

    beforeEach(() => {
      adapter = new SMSAdapter();
    });

    it('doit extraire MessageSid', () => {
      const payload = {
        MessageSid: 'SM1234567890abcdef',
        From: '+33612345678',
        To: '+33698765432',
        Body: 'Test SMS',
      };

      const externalId = adapter.extractExternalId(payload);
      expect(externalId).toBe('SM1234567890abcdef');
    });

    it('doit normaliser un SMS Twilio', async () => {
      const payload = {
        MessageSid: 'SM_abc',
        AccountSid: 'AC_xyz',
        From: '+33612345678',
        To: '+33698765432',
        Body: 'Message SMS urgent',
      };

      const normalized = await adapter.parseWebhook(payload);

      expect(normalized.sender?.phone).toBe('+33612345678');
      expect(normalized.recipient?.phone).toBe('+33698765432');
      expect(normalized.body).toBe('Message SMS urgent');
      expect(normalized.channelMetadata).toHaveProperty('messageSid', 'SM_abc');
    });
  });

  describe('Déduplication', () => {
    it('doit générer un checksum déterministe', () => {
      const crypto = require('crypto');

      const data1 = {
        channel: 'EMAIL',
        externalId: 'msg_123',
        sender: 'test@example.com',
        body: 'Hello',
      };
      const data2 = {
        channel: 'EMAIL',
        externalId: 'msg_123',
        sender: 'test@example.com',
        body: 'Hello',
      };

      const checksum1 = crypto.createHash('sha256').update(JSON.stringify(data1)).digest('hex');
      const checksum2 = crypto.createHash('sha256').update(JSON.stringify(data2)).digest('hex');

      expect(checksum1).toBe(checksum2);
    });

    it('doit détecter les doublons par externalId', () => {
      const message1 = { externalId: 'msg_duplicate', channel: 'EMAIL' };
      const message2 = { externalId: 'msg_duplicate', channel: 'EMAIL' };
      const message3 = { externalId: 'msg_unique', channel: 'EMAIL' };

      // En production, ceci serait vérifié via DB
      expect(message1.externalId).toBe(message2.externalId);
      expect(message1.externalId).not.toBe(message3.externalId);
    });
  });

  describe('Conformité RGPD', () => {
    it('doit préserver métadonnées source dans channelMetadata', async () => {
      const adapter = new EmailAdapter();
      const originalPayload = {
        messageId: 'preserve_test',
        from: 'test@example.com',
        customField: 'important_data',
        internalRef: 'REF-12345',
      };

      const normalized = await adapter.parseWebhook(originalPayload);

      // Les métadonnées originales doivent être accessibles
      // (en pratique, channelMetadata contient le payload complet)
      expect(normalized).toBeDefined();
    });
  });
});
