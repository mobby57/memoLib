import {
  IncomingEmailPayloadSchema,
  normalizeIncomingEmailPayload,
} from '../../../lib/email/ingestion';

describe('email ingestion normalization', () => {
  it('normalizes a JSON payload and computes stable fields', () => {
    const payload = IncomingEmailPayloadSchema.parse({
      from: 'Client Test <client@example.com>',
      to: 'cabinet@memolib.space',
      subject: 'Demande consultation',
      body: 'Bonjour, je souhaite un rendez-vous.',
      headers: {
        'message-id': '<abc-123@example.com>',
      },
      attachments: [],
    });

    const raw = JSON.stringify(payload);
    const normalized = normalizeIncomingEmailPayload(payload, raw);

    expect(normalized.sourceChannel).toBe('email');
    expect(normalized.sourceDirection).toBe('inbound');
    expect(normalized.rawFormat).toBe('json');
    expect(normalized.fromAddress).toBe('client@example.com');
    expect(normalized.toAddresses).toBe(JSON.stringify(['cabinet@memolib.space']));
    expect(normalized.hasAttachments).toBe(false);
    expect(normalized.contentHash).toHaveLength(64);
  });

  it('infers rfc822 format when raw content is provided', () => {
    const payload = IncomingEmailPayloadSchema.parse({
      from: 'a@example.com',
      to: ['b@example.com', 'c@example.com'],
      subject: 'RFC822 test',
      body: 'Body',
      rawContent: 'From: a@example.com\nTo: b@example.com\nSubject: RFC822 test',
      references: '<ref1@example.com> <ref2@example.com>',
      cc: 'cc1@example.com; cc2@example.com',
    });

    const normalized = normalizeIncomingEmailPayload(payload, '{}');

    expect(normalized.rawFormat).toBe('rfc822');
    expect(normalized.to).toBe('b@example.com, c@example.com');
    expect(normalized.cc).toBe('cc1@example.com, cc2@example.com');
    expect(normalized.referenceIds).toBe(JSON.stringify(['<ref1@example.com>', '<ref2@example.com>']));
  });

  it('infers msg-base64 format and keeps attachment metadata', () => {
    const payload = IncomingEmailPayloadSchema.parse({
      from: 'sender@example.com',
      to: 'receiver@example.com',
      subject: 'MSG import',
      body: 'Pièce jointe incluse',
      msgBase64: 'U29tZUJhc2U2NE1lc3NhZ2U=',
      attachments: [
        {
          filename: 'piece.pdf',
          mimeType: 'application/pdf',
          size: 1200,
          checksum: 'sha256:abc',
          metadata: { source: 'outlook' },
        },
      ],
    });

    const normalized = normalizeIncomingEmailPayload(payload, '{}');

    expect(normalized.rawFormat).toBe('msg-base64');
    expect(normalized.hasAttachments).toBe(true);
    expect(normalized.attachments).toHaveLength(1);
    expect(normalized.attachments[0]).toMatchObject({
      filename: 'piece.pdf',
      mimeType: 'application/pdf',
      size: 1200,
      checksum: 'sha256:abc',
    });
    expect(normalized.attachments[0].metadata).toBe(JSON.stringify({ source: 'outlook' }));
  });
});
