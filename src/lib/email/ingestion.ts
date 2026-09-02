import crypto from 'crypto';
import { z } from 'zod';

const MAX_EMAIL_BODY_LENGTH = 1_000_000;
const MAX_RAW_EMAIL_LENGTH = 1_100_000;
const MAX_ATTACHMENTS = 20;

const AddressInputSchema = z.union([
  z.string().trim().min(1).max(4_000),
  z.array(z.string().trim().min(1).max(320)).max(50),
]);

const IncomingEmailAttachmentSchema = z
  .object({
    filename: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().max(255).optional(),
    size: z.number().int().nonnegative().max(25 * 1024 * 1024).optional(),
    storageKey: z.string().trim().max(1_024).optional(),
    contentId: z.string().trim().max(1_024).optional(),
    disposition: z.string().trim().max(100).optional(),
    checksum: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const IncomingEmailPayloadSchema = z
  .object({
    from: z.string().trim().min(1).max(4_000),
    to: AddressInputSchema,
    subject: z.string().trim().min(1).max(998),
    body: z.string().max(MAX_EMAIL_BODY_LENGTH).optional().default(''),
    htmlBody: z.string().max(MAX_EMAIL_BODY_LENGTH).nullable().optional(),
    messageId: z.string().trim().max(998).nullable().optional(),
    providerMessageId: z.string().trim().max(998).nullable().optional(),
    threadId: z.string().trim().max(998).nullable().optional(),
    provider: z.string().trim().max(100).nullable().optional(),
    sourceChannel: z.string().trim().max(100).nullable().optional(),
    sourceDirection: z.enum(['inbound', 'outbound']).optional().default('inbound'),
    rawFormat: z.string().trim().max(100).nullable().optional(),
    rawContent: z.string().max(MAX_RAW_EMAIL_LENGTH).nullable().optional(),
    rawMessage: z.string().max(MAX_RAW_EMAIL_LENGTH).nullable().optional(),
    msgBase64: z.string().max(MAX_RAW_EMAIL_LENGTH * 2).nullable().optional(),
    headers: z.record(z.string(), z.unknown()).optional(),
    cc: AddressInputSchema.optional(),
    bcc: AddressInputSchema.optional(),
    replyTo: AddressInputSchema.optional(),
    inReplyTo: z.string().trim().max(998).nullable().optional(),
    references: z.union([z.string().max(8_000), z.array(z.string().max(998)).max(50)]).optional(),
    receivedAt: z.union([z.string(), z.date()]).optional(),
    attachments: z.array(IncomingEmailAttachmentSchema).max(MAX_ATTACHMENTS).optional().default([]),
  })
  .strict();

export type IncomingEmailPayload = z.infer<typeof IncomingEmailPayloadSchema>;

type NormalizedAttachment = {
  filename: string;
  mimeType: string;
  size: number;
  storageKey?: string;
  contentId?: string;
  disposition?: string;
  checksum?: string;
  metadata?: string;
};

export type NormalizedIncomingEmail = {
  from: string;
  to: string;
  cc: string | null;
  bcc: string | null;
  replyTo: string | null;
  subject: string;
  body: string;
  htmlBody: string | null;
  preview: string;
  messageId: string | null;
  providerMessageId: string | null;
  threadId: string | null;
  internetMessageId: string | null;
  fromAddress: string | null;
  toAddresses: string | null;
  inReplyTo: string | null;
  referenceIds: string | null;
  sourceChannel: string;
  sourceProvider: string | null;
  sourceDirection: string;
  rawFormat: string | null;
  rawPayload: string | null;
  rawHeaders: string | null;
  rawContent: string | null;
  normalizedPayload: string;
  contentHash: string;
  bodyText: string;
  hasAttachments: boolean;
  receivedAt: Date;
  receivedDate: Date;
  attachments: NormalizedAttachment[];
  tenantLookupRecipients: string[];
};

function normalizeAddressInput(value?: string | string[]): string[] {
  if (!value) return [];
  const rawValues = Array.isArray(value) ? value : [value];

  return Array.from(
    new Set(
      rawValues
        .flatMap(item => item.split(/[;,]/g))
        .map(item => item.trim())
        .filter(Boolean)
    )
  );
}

function extractPrimaryEmail(value?: string | null): string | null {
  if (!value) return null;
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : null;
}

function serializeJson(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value);
}

function inferRawFormat(payload: IncomingEmailPayload, rawRequestBody: string): string | null {
  if (payload.rawFormat) return payload.rawFormat;
  if (payload.msgBase64) return 'msg-base64';
  if (payload.rawContent || payload.rawMessage) return 'rfc822';
  if (rawRequestBody) return 'json';
  return null;
}

function parseReceivedAt(receivedAt?: string | Date): Date {
  if (receivedAt instanceof Date) return receivedAt;
  if (typeof receivedAt === 'string') {
    const parsed = new Date(receivedAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function normalizeReferences(value?: string | string[]): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(item => item.trim()).filter(Boolean);
  return value
    .split(/\s+/g)
    .map(item => item.trim())
    .filter(Boolean);
}

export function normalizeIncomingEmailPayload(
  payload: IncomingEmailPayload,
  rawRequestBody: string
): NormalizedIncomingEmail {
  const toList = normalizeAddressInput(payload.to);
  const ccList = normalizeAddressInput(payload.cc);
  const bccList = normalizeAddressInput(payload.bcc);
  const replyToList = normalizeAddressInput(payload.replyTo);
  const references = normalizeReferences(payload.references);
  const rawContent = payload.rawContent || payload.rawMessage || payload.msgBase64 || null;
  const bodyText = payload.body || '';
  const receivedAt = parseReceivedAt(payload.receivedAt);
  const internetMessageId = payload.messageId || extractPrimaryEmail(String(payload.headers?.['message-id'] || ''));

  const normalizedPayload = {
    from: payload.from,
    to: toList,
    cc: ccList,
    bcc: bccList,
    replyTo: replyToList,
    subject: payload.subject,
    messageId: payload.messageId || null,
    providerMessageId: payload.providerMessageId || null,
    threadId: payload.threadId || null,
    inReplyTo: payload.inReplyTo || null,
    references,
    sourceChannel: payload.sourceChannel || 'email',
    sourceProvider: payload.provider || null,
    sourceDirection: payload.sourceDirection || 'inbound',
    rawFormat: inferRawFormat(payload, rawRequestBody),
    attachmentCount: payload.attachments.length,
  };

  const contentHash = crypto
    .createHash('sha256')
    .update(rawContent || rawRequestBody || `${payload.from}\n${payload.subject}\n${bodyText}`)
    .digest('hex');

  return {
    from: payload.from,
    to: toList.join(', '),
    cc: ccList.length > 0 ? ccList.join(', ') : null,
    bcc: bccList.length > 0 ? bccList.join(', ') : null,
    replyTo: replyToList.length > 0 ? replyToList.join(', ') : null,
    subject: payload.subject,
    body: bodyText,
    htmlBody: payload.htmlBody ?? null,
    preview: bodyText.substring(0, 200),
    messageId: payload.messageId ?? null,
    providerMessageId: payload.providerMessageId ?? null,
    threadId: payload.threadId ?? null,
    internetMessageId: internetMessageId ?? payload.messageId ?? null,
    fromAddress: extractPrimaryEmail(payload.from),
    toAddresses: serializeJson(toList),
    inReplyTo: payload.inReplyTo ?? null,
    referenceIds: references.length > 0 ? JSON.stringify(references) : null,
    sourceChannel: (payload.sourceChannel || 'email').toLowerCase(),
    sourceProvider: payload.provider?.toLowerCase() || null,
    sourceDirection: payload.sourceDirection || 'inbound',
    rawFormat: inferRawFormat(payload, rawRequestBody),
    rawPayload: rawRequestBody || null,
    rawHeaders: serializeJson(payload.headers),
    rawContent,
    normalizedPayload: JSON.stringify(normalizedPayload),
    contentHash,
    bodyText,
    hasAttachments: payload.attachments.length > 0,
    receivedAt,
    receivedDate: receivedAt,
    attachments: payload.attachments.map(attachment => ({
      filename: attachment.filename,
      mimeType: attachment.mimeType || 'application/octet-stream',
      size: attachment.size || 0,
      storageKey: attachment.storageKey,
      contentId: attachment.contentId,
      disposition: attachment.disposition,
      checksum: attachment.checksum,
      metadata: serializeJson(attachment.metadata) || undefined,
    })),
    tenantLookupRecipients: toList
      .map(extractPrimaryEmail)
      .filter((value): value is string => Boolean(value)),
  };
}
