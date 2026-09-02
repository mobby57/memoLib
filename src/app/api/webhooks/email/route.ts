import { emailMonitor } from '@/lib/email/email-monitor-service';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { verifyWebhookRequest } from '@/lib/security/webhook-verification';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const MAX_WEBHOOK_BODY_BYTES = 1_100_000;

const emailWebhookPayloadSchema = z
  .object({
    tenantId: z.string().trim().min(1).max(128),
    rawEmail: z.string().min(1).max(1_000_000).optional(),
    text: z.string().min(1).max(1_000_000).optional(),
  })
  .strict()
  .refine(payload => Boolean(payload.rawEmail || payload.text), {
    message: 'Un email brut ou un contenu texte est requis',
  });

const eventIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/^[A-Za-z0-9._:-]+$/);

function rateLimitedResponse(reset: Date): NextResponse {
  return NextResponse.json(
    { error: 'Trop de requêtes. Réessayez plus tard.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.max(1, Math.ceil((reset.getTime() - Date.now()) / 1000))),
      },
    }
  );
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

/**
 * POST /api/webhooks/email
 * Reçoit un email brut signé. Les données sont exclusivement enregistrées pour
 * triage et nécessitent une validation humaine avant toute action métier.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('[EMAIL_WEBHOOK] Secret non configuré');
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const eventIdResult = eventIdSchema.safeParse(request.headers.get('x-webhook-id'));
  if (!eventIdResult.success) {
    return NextResponse.json({ error: 'Identifiant d’événement invalide' }, { status: 400 });
  }

  const declaredContentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredContentLength) && declaredContentLength > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload trop volumineux' }, { status: 413 });
  }

  const rateLimit = await checkRateLimit(`email-webhook:${getClientIP(request)}`, 'webhook');
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit.reset);
  }

  const rawRequestBody = await request.text();
  if (Buffer.byteLength(rawRequestBody, 'utf8') > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload trop volumineux' }, { status: 413 });
  }

  const verification = verifyWebhookRequest(request, rawRequestBody, secret);
  if (!verification.valid) {
    logger.warn('[EMAIL_WEBHOOK] Signature ou horodatage invalide');
    return verification.response;
  }

  let requestBody: unknown;
  try {
    requestBody = JSON.parse(rawRequestBody);
  } catch {
    return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 });
  }

  const payload = emailWebhookPayloadSchema.safeParse(requestBody);
  if (!payload.success) {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
  }

  const rawEmail = payload.data.rawEmail || payload.data.text!;
  const contentHash = createHash('sha256').update(rawEmail, 'utf8').digest('hex');
  const duplicate = await prisma.email.findFirst({
    where: {
      tenantId: payload.data.tenantId,
      OR: [{ providerMessageId: eventIdResult.data }, { contentHash }],
    },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json({ success: true, duplicate: true, emailId: duplicate.id });
  }

  try {
    const result = await emailMonitor.processEmail(payload.data.tenantId, rawEmail, eventIdResult.data);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const existing = await prisma.email.findFirst({
        where: {
          tenantId: payload.data.tenantId,
          OR: [{ providerMessageId: eventIdResult.data }, { contentHash }],
        },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json({ success: true, duplicate: true, emailId: existing.id });
      }
    }

    logger.error('[EMAIL_WEBHOOK] Échec du traitement');
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
