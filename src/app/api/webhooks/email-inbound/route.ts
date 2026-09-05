import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { encryptEmailBody } from '@/lib/security/email-encryption';
import { getClientIP, checkRateLimit } from '@/lib/rate-limit';
import { verifyWebhookRequest } from '@/lib/security/webhook-verification';
import { notifyEmailReceived } from '@/lib/ws-emit';
import { z } from 'zod';

const MAX_WEBHOOK_BODY_BYTES = 2_100_000;

const inboundEmailSchema = z.object({
  from: z.string().min(1).max(320),
  to: z.string().max(320).optional(),
  subject: z.string().max(998).optional(),
  body: z.string().min(1).max(1_000_000),
  html: z.string().max(2_000_000).optional(),
  date: z.string().datetime().optional(),
  messageId: z.string().max(998).optional(),
  tenantId: z.string().min(1).max(128).optional(),
}).strict();

const eventIdSchema = z.string().trim().min(1).max(255).regex(/^[A-Za-z0-9._:-]+$/);

/**
 * Webhook pour recevoir des emails forwardés.
 * Compatible avec:
 * - Gmail forwarding (via Google Apps Script ou Zapier)
 * - Outlook Power Automate
 * - SendGrid Inbound Parse
 * - Mailgun Routes
 * - Forward direct (POST JSON)
 */
export async function POST(req: NextRequest) {
  const expectedSecret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const eventIdResult = eventIdSchema.safeParse(req.headers.get('x-webhook-id'));
  if (!eventIdResult.success) {
    return NextResponse.json({ error: 'Identifiant d’événement invalide' }, { status: 400 });
  }

  const declaredContentLength = Number(req.headers.get('content-length'));
  if (Number.isFinite(declaredContentLength) && declaredContentLength > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload trop volumineux' }, { status: 413 });
  }

  const rateLimit = await checkRateLimit(getClientIP(req), 'webhook');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.reset.getTime() - Date.now()) / 1000)) } }
    );
  }

  const contentType = req.headers.get('content-type') || '';
  const rawRequestBody = await req.clone().text();
  if (Buffer.byteLength(rawRequestBody, 'utf8') > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload trop volumineux' }, { status: 413 });
  }

  const verification = verifyWebhookRequest(req, rawRequestBody, expectedSecret);
  if (!verification.valid) {
    return verification.response;
  }

  let emailData: unknown;

  if (contentType.includes('multipart/form-data')) {
    // SendGrid Inbound Parse format
    const formData = await req.formData();
    emailData = {
      from: formData.get('from') as string || '',
      to: formData.get('to') as string || '',
      subject: formData.get('subject') as string || '',
      body: formData.get('text') as string || '',
      html: formData.get('html') as string || '',
      messageId: formData.get('Message-ID') as string || undefined,
    };
  } else {
    // JSON format (Gmail Apps Script, Power Automate, direct)
    try {
      emailData = JSON.parse(rawRequestBody);
    } catch {
      return NextResponse.json({ error: 'Corps de requête invalide. JSON attendu.' }, { status: 400 });
    }
  }

  const parsedEmail = inboundEmailSchema.safeParse(emailData);
  if (!parsedEmail.success) {
    return NextResponse.json(
      { error: 'Payload invalide', details: parsedEmail.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const validatedEmail = parsedEmail.data;

  // Déterminer le tenant (par le "to" address ou header)
  const tenantId = validatedEmail.tenantId || await resolveTenant(validatedEmail.to);
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant non résolu. Ajoutez tenantId ou configurez le routage.' }, { status: 400 });
  }

  // Déduplication par checksum
  const checksum = crypto.createHash('sha256').update(`${validatedEmail.messageId || ''}${validatedEmail.from}${validatedEmail.subject || ''}${validatedEmail.body.slice(0, 500)}`).digest('hex');

  const existing = await prisma.email.findFirst({
    where: {
      tenantId,
      OR: [{ checksum }, { providerMessageId: eventIdResult.data }],
    },
  });
  if (existing) {
    return NextResponse.json({ success: true, duplicate: true, emailId: existing.id });
  }

  // Créer l'email (chiffrement at-rest)
  const { body: storedBody, bodyEncrypted, htmlBody: storedHtml, htmlBodyEncrypted } = encryptEmailBody(
    validatedEmail.body,
    validatedEmail.html || null
  );

  const email = await prisma.email.create({
    data: {
      tenantId,
      from: validatedEmail.from,
      to: validatedEmail.to || '',
      subject: validatedEmail.subject || '(sans objet)',
      body: storedBody,
      bodyEncrypted,
      htmlBody: storedHtml,
      htmlBodyEncrypted,
      messageId: validatedEmail.messageId || null,
      providerMessageId: eventIdResult.data,
      checksum,
      direction: 'INCOMING',
      status: 'PENDING',
      receivedAt: validatedEmail.date ? new Date(validatedEmail.date) : new Date(),
    },
  });

  // Lancer l'analyse IA en arrière-plan (fire-and-forget)
  analyzeEmailAsync(email.id, validatedEmail.subject || '', validatedEmail.body, validatedEmail.from).catch(() => {});

  // Notification temps réel (best-effort)
  notifyEmailReceived(tenantId, {
    id: email.id,
    type: 'email',
    from: validatedEmail.from,
    subject: validatedEmail.subject || '(sans objet)',
    priority: 'high',
    timestamp: email.receivedAt ?? new Date(),
  }).catch(() => {});

  // Horodatage certifié RFC 3161 (preuve tierce de la date de réception)
  import('@/lib/services/certified-timestamp').then(({ certifyEmailReception }) => {
    certifyEmailReception({
      tenantId,
      userId: 'system',
      emailId: email.id,
      emailHash: checksum,
    }).catch(() => {});
  }).catch(() => {});

  return NextResponse.json({ success: true, emailId: email.id });
}

async function resolveTenant(toAddress?: string): Promise<string | null> {
  if (!toAddress) return null;
  // Chercher un tenant dont l'email de réception matche
  const match = toAddress.match(/([^<\s]+@[^>\s]+)/);
  if (!match) return null;

  const tenant = await prisma.tenant.findFirst({
    where: { OR: [{ email: match[1] }, { inboundEmail: match[1] }] },
    select: { id: true },
  });
  return tenant?.id || null;
}

async function analyzeEmailAsync(emailId: string, subject: string, body: string, from: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/ai/summarize-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal': 'true' },
      body: JSON.stringify({ subject, body, from }),
    });
    if (res.ok) {
      const summary = await res.json();
      await prisma.email.update({
        where: { id: emailId },
        data: { aiSummary: JSON.stringify(summary), aiAnalyzedAt: new Date() },
      });
    }
  } catch {}
}
