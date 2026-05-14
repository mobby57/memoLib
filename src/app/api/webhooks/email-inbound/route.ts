import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

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
  // Auth par webhook secret
  const secret = req.headers.get('x-webhook-secret') || req.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.EMAIL_WEBHOOK_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type') || '';
  let emailData: { from: string; to?: string; subject: string; body: string; html?: string; date?: string; messageId?: string; attachments?: any[]; tenantId?: string };

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
    emailData = await req.json();
  }

  if (!emailData.from || !emailData.body) {
    return NextResponse.json({ error: 'from et body requis' }, { status: 400 });
  }

  // Déterminer le tenant (par le "to" address ou header)
  const tenantId = emailData.tenantId || await resolveTenant(emailData.to);
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant non résolu. Ajoutez tenantId ou configurez le routage.' }, { status: 400 });
  }

  // Déduplication par checksum
  const checksum = crypto.createHash('sha256').update(`${emailData.messageId || ''}${emailData.from}${emailData.subject}${emailData.body.slice(0, 500)}`).digest('hex');

  const existing = await prisma.email.findFirst({ where: { tenantId, checksum } });
  if (existing) {
    return NextResponse.json({ success: true, duplicate: true, emailId: existing.id });
  }

  // Créer l'email
  const email = await prisma.email.create({
    data: {
      tenantId,
      from: emailData.from,
      to: emailData.to || '',
      subject: emailData.subject || '(sans objet)',
      body: emailData.body,
      htmlBody: emailData.html || null,
      messageId: emailData.messageId || null,
      checksum,
      direction: 'INCOMING',
      status: 'PENDING',
      receivedAt: emailData.date ? new Date(emailData.date) : new Date(),
    },
  });

  // Lancer l'analyse IA en arrière-plan (fire-and-forget)
  analyzeEmailAsync(email.id, emailData.subject, emailData.body, emailData.from).catch(() => {});

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
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
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
