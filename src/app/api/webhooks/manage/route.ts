import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  tenantId: string;
}

const webhooks: WebhookConfig[] = [];

export async function GET() {
  return NextResponse.json(webhooks);
}

export async function POST(request: NextRequest) {
  const { url, events } = await request.json();
  
  const webhook: WebhookConfig = {
    id: crypto.randomUUID(),
    url,
    events: events || ['dossier.created', 'dossier.updated', 'payment.completed'],
    secret: crypto.randomBytes(32).toString('hex'),
    active: true,
    tenantId: 'cabinet-dupont'
  };

  webhooks.push(webhook);
  return NextResponse.json(webhook);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  const index = webhooks.findIndex(w => w.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Webhook introuvable' }, { status: 404 });
  }

  webhooks.splice(index, 1);
  return NextResponse.json({ success: true });
}
