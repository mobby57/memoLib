import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * POST /api/emails/paste
 * Body: { from?, subject?, body }
 * 
 * L'avocat colle le contenu d'un email. L'app l'analyse automatiquement.
 * C'est la méthode la plus simple : copier-coller depuis Gmail/Outlook.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { from, subject, body } = await req.json();
  if (!body) return NextResponse.json({ error: 'Collez le contenu de l\'email' }, { status: 400 });

  const tenantId = (session.user as any).tenantId;
  const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/email-inbound`;

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': process.env.INCOMING_EMAIL_WEBHOOK_SECRET || process.env.EMAIL_WEBHOOK_SECRET || 'demo',
    },
    body: JSON.stringify({
      from: from || 'Client <client@email.com>',
      subject: subject || '(sans objet)',
      body,
      tenantId,
      date: new Date().toISOString(),
      messageId: `paste-${Date.now()}@memolib.local`,
    }),
  });

  const result = await res.json();
  return NextResponse.json({ success: true, ...result });
}
