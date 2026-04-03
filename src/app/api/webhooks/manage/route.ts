import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from '@/lib/auth/server-session';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  tenantId: string;
}

const webhooks: WebhookConfig[] = [];

async function ensureAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }

  const role = String((session.user as any).role || '').toUpperCase();
  const allowedRoles = new Set(['ADMIN', 'SUPER_ADMIN']);
  if (!allowedRoles.has(role)) {
    return NextResponse.json({ error: 'Acces interdit' }, { status: 403 });
  }

  return null;
}

export async function GET() {
  const authError = await ensureAdminAccess();
  if (authError) {
    return authError;
  }

  return NextResponse.json(webhooks);
}

export async function POST(request: NextRequest) {
  const authError = await ensureAdminAccess();
  if (authError) {
    return authError;
  }

  const { url, events } = await request.json();
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url invalide' }, { status: 400 });
  }

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
  const authError = await ensureAdminAccess();
  if (authError) {
    return authError;
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const index = webhooks.findIndex(w => w.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Webhook introuvable' }, { status: 404 });
  }

  webhooks.splice(index, 1);
  return NextResponse.json({ success: true });
}
