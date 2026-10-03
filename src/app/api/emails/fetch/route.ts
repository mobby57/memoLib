import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { randomUUID } from 'node:crypto';
import { generateWebhookHeaders } from '@/lib/security/webhook-verification';

/**
 * POST /api/emails/fetch
 * Récupère les derniers emails depuis Gmail IMAP et les injecte dans MemoLib
 */
export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const imapUser = process.env.GMAIL_IMAP_USER;
  const pass = process.env.GMAIL_IMAP_PASSWORD;
  if (!imapUser || !pass) {
    return NextResponse.json({ error: 'Gmail non configuré' }, { status: 500 });
  }

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '10'), 50);
  const tenantId = user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant non identifié' }, { status: 403 });
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: imapUser, pass },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    const emails: any[] = [];
    // Fetch latest emails
    const mailbox = client.mailbox;
    const exists = mailbox ? (mailbox as any).exists || 0 : 0;
    const messages = client.fetch(`${Math.max(1, exists - limit + 1)}:*`, {
      envelope: true,
      source: true,
    });

    for await (const msg of messages) {
      const source = msg.source;
      if (!source) continue;
      const parsed = await simpleParser(source as any);
      emails.push({
        from: parsed.from?.text || '',
        subject: parsed.subject || '(sans objet)',
        body: parsed.text || parsed.html || '',
        date: parsed.date?.toISOString() || new Date().toISOString(),
        messageId: parsed.messageId || `imap-${msg.seq}`,
      });
    }

    lock.release();
    await client.logout();

    // Inject into MemoLib webhook
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/email-inbound`;
    const secret = process.env.EMAIL_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Service email indisponible' }, { status: 503 });
    }
    let imported = 0;

    for (const email of emails) {
      const payload = JSON.stringify({ ...email, tenantId });
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-id': randomUUID(),
          ...generateWebhookHeaders(payload, secret),
        },
        body: payload,
      });
      const r = await res.json();
      if (r.success || r.duplicate) imported++;
    }

    return NextResponse.json({
      success: true,
      message: `${imported} emails importés depuis Gmail`,
      total: emails.length,
      imported,
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Gmail: ${e.message}` }, { status: 500 });
  }
}


