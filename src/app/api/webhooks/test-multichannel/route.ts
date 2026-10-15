import { auth } from '@/lib/clerk-auth';
import { checkDuplicate, computeChecksum, storeChannelMessage } from '@/lib/deduplication-service';
import { captureWebhookHealth, trackMetric } from '@/lib/sentry-release-health';
import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

// ============================================================================
// Schemas Zod par canal
// ============================================================================

const emailSchema = z.object({
  channel: z.literal('EMAIL'),
  messageId: z.string().min(1).max(200),
  from: z.string().email().max(320),
  to: z.string().email().max(320),
  subject: z.string().max(500).optional().default(''),
  text: z.string().min(1).max(100_000),
});

const whatsappSchema = z.object({
  channel: z.literal('WHATSAPP'),
  entry: z.array(z.object({
    changes: z.array(z.object({
      value: z.object({
        messages: z.array(z.object({
          id: z.string().min(1),
          from: z.string().min(1),
          type: z.string(),
          text: z.object({ body: z.string() }).optional(),
        })).min(1),
        contacts: z.array(z.object({
          profile: z.object({ name: z.string().optional() }).optional(),
        })).optional(),
      }),
    })).min(1),
  })).min(1),
});

const smsSchema = z.object({
  channel: z.literal('SMS'),
  MessageSid: z.string().min(1).max(200),
  From: z.string().min(1).max(50),
  To: z.string().min(1).max(50),
  Body: z.string().min(1).max(10_000),
});

const formSchema = z.object({
  channel: z.literal('FORM'),
  submissionId: z.string().min(1).max(200),
  email: z.string().email(),
  name: z.string().max(200).optional(),
  subject: z.string().max(500).optional(),
  message: z.string().min(1).max(50_000),
  consentGiven: z.boolean(),
});

const CHANNEL_SCHEMAS = {
  EMAIL: emailSchema,
  WHATSAPP: whatsappSchema,
  SMS: smsSchema,
  FORM: formSchema,
} as const;

type ChannelName = keyof typeof CHANNEL_SCHEMAS;

const CHANNEL_LIMITS: Record<string, number> = {
  EMAIL: 200_000,
  WHATSAPP: 100_000,
  SMS: 20_000,
  FORM: 100_000,
};

const DEFAULT_LIMIT = 100_000;
const MAX_PAYLOAD = 1_000_000;

// ============================================================================
// 1. checkPayloadSize
// ============================================================================

function checkPayloadSize(data: unknown, channel: string): {
  valid: boolean;
  size: number;
  limit: number;
  message: string;
} {
  let size: number;
  try {
    if (typeof data === 'string') {
      size = Buffer.byteLength(data, 'utf-8');
    } else if (typeof data === 'number') {
      size = data;
    } else {
      size = Buffer.byteLength(JSON.stringify(data ?? ''), 'utf-8');
    }
  } catch {
    return { valid: false, size: 0, limit: DEFAULT_LIMIT, message: 'payload non serialisable' };
  }
  const limit = CHANNEL_LIMITS[channel] ?? DEFAULT_LIMIT;
  const effectiveLimit = Math.min(limit, MAX_PAYLOAD);
  if (size > effectiveLimit) {
    return {
      valid: false,
      size,
      limit: effectiveLimit,
      message: `Payload trop volumineux pour ${channel} : ${size} octets > ${effectiveLimit} octets`,
    };
  }
  return { valid: true, size, limit: effectiveLimit, message: '' };
}

// ============================================================================
// 2. validateWebhookPayloadSafe
// ============================================================================

type ValidationError = { path: Array<string | number>; message: string };
type ValidationResult =
  | { success: true; data: unknown; errors: null }
  | { success: false; data: null; errors: { errors: ValidationError[] } };

function validateWebhookPayloadSafe(data: unknown): ValidationResult {
  const channel = (data as { channel?: string } | null)?.channel;
  const schema = channel ? CHANNEL_SCHEMAS[channel as ChannelName] : undefined;
  if (!schema) {
    return {
      success: false,
      data: null,
      errors: {
        errors: [{ path: ['channel'], message: `Canal inconnu ou manquant : ${channel ?? 'null'}` }],
      },
    };
  }
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data, errors: null };
  const issues: ValidationError[] = result.error.issues.map((i) => ({
    path: i.path as Array<string | number>,
    message: i.message,
  }));
  return { success: false, data: null, errors: { errors: issues } };
}

// ============================================================================
// 3. checkWebhookRateLimit
// ============================================================================
//
// NOTE PRODUCTION : ce compteur est en memoire, donc par instance Node.
// Sur Vercel (serverless multi-instances), il ne partage rien entre instances.
// Pour la production, remplacer par Upstash Redis ou un equivalent partage.
// Ce compteur reste utile en dev et sur deploiement single-instance (Railway).

interface RateLimitEntry { count: number; resetTime: number; }

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  EMAIL: { max: 100, windowMs: 60_000 },
  WHATSAPP: { max: 100, windowMs: 60_000 },
  SMS: { max: 60, windowMs: 60_000 },
  FORM: { max: 30, windowMs: 60_000 },
  UNKNOWN: { max: 20, windowMs: 60_000 },
};

async function checkWebhookRateLimit(
  _req: NextRequest,
  channel: string,
): Promise<{ success: boolean; remaining: number; resetTime: Date }> {
  const config = RATE_LIMITS[channel] ?? RATE_LIMITS.UNKNOWN;
  const now = Date.now();
  const entry = rateLimitStore.get(channel);

  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(channel, { count: 1, resetTime });
    return { success: true, remaining: config.max - 1, resetTime: new Date(resetTime) };
  }

  if (entry.count >= config.max) {
    return { success: false, remaining: 0, resetTime: new Date(entry.resetTime) };
  }

  entry.count += 1;
  return {
    success: true,
    remaining: config.max - entry.count,
    resetTime: new Date(entry.resetTime),
  };
}

// ============================================================================
// 4. extractWebhookFields
// ============================================================================

interface ExtractedFields {
  externalId: string;
  channel: string;
  sender: Record<string, unknown>;
  body: string;
  subject: string;
  raw: unknown;
}

function extractWebhookFields(data: any): ExtractedFields {
  const channel = data?.channel || 'UNKNOWN';

  if (channel === 'EMAIL') {
    return {
      externalId: String(data.messageId ?? ''),
      channel,
      sender: { email: data.from, name: data.from },
      body: String(data.text ?? ''),
      subject: String(data.subject ?? ''),
      raw: data,
    };
  }

  if (channel === 'WHATSAPP') {
    const msg = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const contact = data.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];
    return {
      externalId: String(msg?.id ?? `wa_${Date.now()}`),
      channel,
      sender: { phone: msg?.from, name: contact?.profile?.name },
      body: String(msg?.text?.body ?? ''),
      subject: '',
      raw: data,
    };
  }

  if (channel === 'SMS') {
    return {
      externalId: String(data.MessageSid ?? ''),
      channel,
      sender: { phone: data.From },
      body: String(data.Body ?? ''),
      subject: '',
      raw: data,
    };
  }

  if (channel === 'FORM') {
    return {
      externalId: String(data.submissionId ?? ''),
      channel,
      sender: { email: data.email, name: data.name },
      body: String(data.message ?? ''),
      subject: String(data.subject ?? ''),
      raw: data,
    };
  }

  return {
    externalId: `ext_${Date.now()}`,
    channel: 'UNKNOWN',
    sender: {},
    body: '',
    subject: '',
    raw: data,
  };
}

// ============================================================================
// 5. sanitizeMessage
// ============================================================================

interface SanitizeOptions {
  maxBodyLength?: number;
  maskEmails?: boolean;
  maskPhones?: boolean;
}

function sanitizeMessage(fields: ExtractedFields, opts: SanitizeOptions = {}) {
  const maxLen = opts.maxBodyLength ?? 5000;
  const originalLength = fields.body.length;
  let body = fields.body.slice(0, maxLen);
  let subject = fields.subject.slice(0, 500);

  if (opts.maskEmails) {
    const re = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
    body = body.replace(re, '[email]');
    subject = subject.replace(re, '[email]');
  }
  if (opts.maskPhones) {
    const re = /\+?\d[\d\s.\-]{8,}/g;
    body = body.replace(re, '[phone]');
    subject = subject.replace(re, '[phone]');
  }

  return {
    externalId: fields.externalId,
    channel: fields.channel,
    sender: fields.sender,
    body,
    subject,
    raw: fields.raw,
    metadata: {
      language: 'fr',
      priority: 'normal',
      attachmentCount: 0,
      truncated: originalLength > maxLen,
      originalBodyLength: originalLength,
    },
  };
}

// ============================================================================
// 6. retryPrismaOperation
// ============================================================================

const TRANSIENT_PRISMA_CODES = new Set(['P2034', 'P2024', 'P1001', 'P1002', 'P1008', 'P1017']);

async function retryPrismaOperation<T>(
  fn: () => Promise<T>,
  retries: number,
  delayMs: number,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const code = (err as { code?: string })?.code;
      const isTransient = code && TRANSIENT_PRISMA_CODES.has(code);
      if (!isTransient || attempt === retries) throw err;
      const backoff = delayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

// ============================================================================
// 7. handlePrismaError
// ============================================================================

interface PrismaErrorResponse { code: string; status: number; message: string; }

const PRISMA_ERROR_MAP: Record<string, PrismaErrorResponse> = {
  P2002: { code: 'CONFLICT', status: 409, message: 'Doublon detecte en base.' },
  P2003: { code: 'FOREIGN_KEY', status: 400, message: 'Reference invalide.' },
  P2025: { code: 'NOT_FOUND', status: 404, message: 'Enregistrement introuvable.' },
  P2034: { code: 'TRANSACTION_CONFLICT', status: 409, message: 'Conflit de transaction.' },
  P1001: { code: 'DB_UNREACHABLE', status: 503, message: 'Base de donnees injoignable.' },
  P1017: { code: 'DB_CONNECTION_CLOSED', status: 503, message: 'Connexion base fermee.' },
};

function handlePrismaError(error: any, _ctx?: unknown): PrismaErrorResponse {
  const rawCode = error?.code;
  const mapped = PRISMA_ERROR_MAP[rawCode];
  if (mapped) return mapped;
  return {
    code: 'PRISMA_ERROR',
    status: 500,
    message: error?.message || 'Erreur base de donnees.',
  };
}

// ============================================================================
// 8. getUserFriendlyErrorMessage
// ============================================================================

const FRIENDLY_MESSAGES: Record<string, string> = {
  CONFLICT: 'Ce message existe deja.',
  FOREIGN_KEY: 'Reference invalide dans les donnees.',
  NOT_FOUND: 'Ressource introuvable.',
  TRANSACTION_CONFLICT: 'Conflit temporaire, veuillez reessayer.',
  DB_UNREACHABLE: 'Service temporairement indisponible.',
  DB_CONNECTION_CLOSED: 'Service temporairement indisponible.',
  PRISMA_ERROR: 'Une erreur de traitement est survenue.',
};

function getUserFriendlyErrorMessage(code: string): string {
  return FRIENDLY_MESSAGES[code] || 'Une erreur est survenue.';
}

// ============================================================================
// Auth
// ============================================================================

async function ensureAdminAccess() {
  const { user } = await auth();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }
  const role = String((user as { role?: string }).role || '').toUpperCase();
  const allowedRoles = new Set(['ADMIN', 'SUPER_ADMIN']);
  if (!allowedRoles.has(role)) {
    return NextResponse.json({ error: 'Acces interdit' }, { status: 403 });
  }
  return null;
}

// ============================================================================
// GET - documentation
// ============================================================================

export async function GET() {
  const authError = await ensureAdminAccess();
  if (authError) return authError;

  return NextResponse.json({
    endpoint: '/api/webhooks/test-multichannel',
    method: 'POST',
    description: 'Test webhook pour Pattern Adapter Multi-Canal',
    rateLimits: RATE_LIMITS,
    payloadLimits: CHANNEL_LIMITS,
    examples: {
      email: {
        channel: 'EMAIL',
        messageId: 'msg_' + Date.now(),
        from: 'client@example.com',
        to: 'cabinet@example.com',
        subject: 'Question urgente',
        text: "Bonjour, j'ai une question juridique...",
      },
      whatsapp: {
        channel: 'WHATSAPP',
        entry: [{
          changes: [{
            value: {
              messages: [{ id: 'wamid_' + Date.now(), from: '+33612345678', type: 'text', text: { body: 'Message via WhatsApp' } }],
              contacts: [{ profile: { name: 'Marie Client' } }],
            },
          }],
        }],
      },
      sms: {
        channel: 'SMS',
        MessageSid: 'SM' + Date.now(),
        From: '+33612345678',
        To: '+33698765432',
        Body: 'Message urgent via SMS',
      },
      form: {
        channel: 'FORM',
        submissionId: 'form_' + Date.now(),
        email: 'client@example.com',
        name: 'John Doe',
        subject: 'Contact formulaire',
        message: 'Demande via formulaire web',
        consentGiven: true,
      },
    },
  });
}

// ============================================================================
// POST - pipeline
// ============================================================================

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  let channel = 'UNKNOWN';

  try {
    const authError = await ensureAdminAccess();
    if (authError) return authError;

    // Step 1 : content-length grossier
    const contentLength = req.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (Number.isFinite(size) && size > MAX_PAYLOAD) {
        return NextResponse.json(
          { success: false, error: 'PAYLOAD_TOO_LARGE', message: `Payload trop volumineux (${size} octets)` },
          { status: 413 },
        );
      }
    }

    // Step 2 : parse JSON
    let rawPayload: any;
    try {
      rawPayload = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'INVALID_JSON', message: 'Corps JSON invalide' },
        { status: 400 },
      );
    }
    channel = rawPayload?.channel || 'UNKNOWN';

    // Step 3 : validation Zod par canal
    const validation = validateWebhookPayloadSafe(rawPayload);
    if (!validation.success) {
      const zodErrors = validation.errors.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');
      Sentry.captureMessage('Webhook validation failed', {
        level: 'warning',
        tags: { error: 'VALIDATION_ERROR', channel },
        contexts: { validation: { errors: zodErrors } },
      });
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Payload validation failed',
          details: process.env.NODE_ENV === 'development' ? zodErrors : undefined,
        },
        { status: 400 },
      );
    }

    const payload = validation.data as any;

    // Step 4 : rate limit
    const rateLimitCheck = await checkWebhookRateLimit(req, channel);
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests for ${channel} channel`,
          retryAfter: rateLimitCheck.resetTime.toISOString(),
        },
        { status: 429 },
      );
    }

    // Step 5 : payload size par canal
    const sizeValidation = checkPayloadSize(payload, channel);
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { success: false, error: 'PAYLOAD_TOO_LARGE', message: sizeValidation.message },
        { status: 413 },
      );
    }

    // Step 6 : checksum
    const checksum = await computeChecksum(payload);

    // Step 7 : dedup
    const isDuplicate = await checkDuplicate(checksum);
    if (isDuplicate) {
      captureWebhookHealth(channel, 'duplicate', performance.now() - startTime);
      trackMetric(`webhook_duplicate_${channel.toLowerCase()}`, 1, 'count', {
        channel, status: 'duplicate',
      });
      return NextResponse.json(
        { success: false, error: 'DUPLICATE_MESSAGE', message: 'Message deja traite (doublon detecte)', checksum },
        { status: 409 },
      );
    }

    // Step 8 : extraction + sanitization
    const normalized = extractWebhookFields(payload);
    const sanitized = sanitizeMessage(normalized, {
      maxBodyLength: 5000,
      maskEmails: false,
      maskPhones: false,
    });

    // Step 9 : store avec retry
    const message = await retryPrismaOperation(
      () => storeChannelMessage({
        externalId: sanitized.externalId,
        checksum,
        channel: sanitized.channel,
        sender: sanitized.sender,
        body: sanitized.body,
        subject: sanitized.subject,
        channelMetadata: {
          ...(sanitized.raw as object),
          normalizedData: {
            language: sanitized.metadata.language,
            priority: sanitized.metadata.priority,
            attachmentCount: sanitized.metadata.attachmentCount,
            truncated: sanitized.metadata.truncated,
          },
        },
      }),
      3,
      100,
    );

    const duration = performance.now() - startTime;

    // Step 10 : metrics
    captureWebhookHealth(message.channel, 'success', duration, message.id);
    trackMetric(`webhook_success_${message.channel.toLowerCase()}`, 1, 'count', {
      channel: message.channel, status: 'success',
    });
    trackMetric('webhook_processing_time_ms', duration, 'milliseconds', {
      channel: message.channel,
    });

    return NextResponse.json({
      success: true,
      messageId: message.id,
      externalId: message.externalId,
      checksum: message.checksum,
      channel: message.channel,
      status: message.status,
      duration,
      timestamp: message.receivedAt || new Date().toISOString(),
      processing: {
        validation: 'passed',
        rateLimit: `${rateLimitCheck.remaining}/${RATE_LIMITS[channel]?.max ?? 100} remaining`,
        deduplication: 'passed',
        normalized: true,
      },
    });
  } catch (error: any) {
    const duration = performance.now() - startTime;

    if (error instanceof ZodError) {
      const zodErrors = error.issues
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'Invalid webhook payload', details: zodErrors },
        { status: 400 },
      );
    }

    const isPrismaError = error?.code && String(error.code).startsWith('P');
    if (isPrismaError) {
      const errorResponse = handlePrismaError(error, { channel, duration: duration.toFixed(2) });
      captureWebhookHealth(channel, 'error', duration, undefined, error);
      trackMetric(`webhook_error_${channel.toLowerCase()}`, 1, 'count', {
        channel, status: 'error', errorCode: errorResponse.code,
      });
      return NextResponse.json(
        {
          success: false,
          error: errorResponse.code,
          message: getUserFriendlyErrorMessage(errorResponse.code),
          details: process.env.NODE_ENV === 'development' ? errorResponse.message : undefined,
        },
        { status: errorResponse.status },
      );
    }

    captureWebhookHealth(channel, 'error', duration, undefined, error);
    trackMetric(`webhook_error_${channel.toLowerCase()}`, 1, 'count', {
      channel, status: 'error',
    });
    Sentry.captureException(error, {
      tags: { error: 'WEBHOOK_ERROR', channel },
      contexts: { webhook: { duration: duration.toFixed(2), channel } },
    });
    console.error('[Webhook Error]', error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Une erreur est survenue lors du traitement',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
