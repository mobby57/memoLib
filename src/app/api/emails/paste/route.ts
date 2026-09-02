import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { NextRequest, NextResponse } from 'next/server';
import { generateWebhookHeaders } from '@/lib/security/webhook-verification';
import { randomUUID } from 'node:crypto';
/**
 * POST /api/emails/paste
 * Body: { from?, subject?, body }
 * 
 * L'avocat colle le contenu d'un email. L'app l'analyse automatiquement.
 * C'est la méthode la plus simple : copier-coller depuis Gmail/Outlook.
 */
export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { from, subject, body } = await req.json();
  if (!body) return NextResponse.json({ error: 'Collez le contenu de l\'email' }, { status: 400 });

  const tenantId = (user as any).tenantId;
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/email-inbound`;
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Service email indisponible' }, { status: 503 });
  const payload = JSON.stringify({
    from: from || 'Client <client@email.com>',
    subject: subject || '(sans objet)',
    body,
    tenantId,
    date: new Date().toISOString(),
    messageId: `paste-${Date.now()}@memolib.local`,
  });

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-id': randomUUID(),
      ...generateWebhookHeaders(payload, secret),
    },
    body: payload,
  });

  const result = await res.json();
  return NextResponse.json({ success: true, ...result });
}


