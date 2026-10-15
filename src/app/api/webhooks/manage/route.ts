import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { EncryptionService } from '@/lib/security/encryption';
import crypto from 'crypto';

const ALLOWED_EVENTS = new Set([
  'dossier.created',
  'dossier.updated',
  'dossier.deleted',
  'client.created',
  'client.updated',
  'document.uploaded',
  'payment.completed',
  'payment.failed',
  'deadline.approaching',
  'email.received',
]);

interface AuthContext {
  tenantId: string;
  userId: string;
}

async function ensureAdminAccess(): Promise<AuthContext | NextResponse> {
  const { user } = await auth();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }
  const role = String((user as { role?: string }).role || '').toUpperCase();
  if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Acces interdit' }, { status: 403 });
  }
  const tenantId = (user as { tenantId?: string }).tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId manquant' }, { status: 400 });
  }
  return { tenantId, userId: (user as { id: string }).id };
}

function isNextResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}

function isValidHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseEvents(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const events = raw.filter((e): e is string => typeof e === 'string');
  if (events.length !== raw.length) return null;
  if (events.some((e) => !ALLOWED_EVENTS.has(e))) return null;
  return Array.from(new Set(events));
}

export async function GET() {
  const access = await ensureAdminAccess();
  if (isNextResponse(access)) return access;

  const rows = await prisma.webhook.findMany({
    where: { tenantId: access.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    rows.map((w) => ({
      id: w.id,
      url: w.url,
      events: JSON.parse(w.events) as string[],
      description: w.description,
      active: w.active,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      lastDelivery: w.lastDelivery,
      lastError: w.lastError,
    })),
  );
}

export async function POST(request: NextRequest) {
  const access = await ensureAdminAccess();
  if (isNextResponse(access)) return access;

  let body: { url?: unknown; events?: unknown; description?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { url, events, description } = body || {};
  if (typeof url !== 'string' || !isValidHttpsUrl(url)) {
    return NextResponse.json(
      { error: 'url invalide (https obligatoire)' },
      { status: 400 },
    );
  }
  const parsedEvents = parseEvents(events);
  if (!parsedEvents) {
    return NextResponse.json(
      { error: 'events invalide' },
      { status: 400 },
    );
  }

  const rawSecret = crypto.randomBytes(32).toString('hex');
  const encryptedSecret = EncryptionService.encrypt(rawSecret);

  const created = await prisma.webhook.create({
    data: {
      id: crypto.randomUUID(),
      tenantId: access.tenantId,
      url,
      events: JSON.stringify(parsedEvents),
      secret: encryptedSecret,
      description: typeof description === 'string' ? description : null,
      active: true,
      updatedAt: new Date(),
    },
  });

  logger.info('[Webhooks] Cree', {
    id: created.id,
    tenantId: access.tenantId,
  });

  return NextResponse.json(
    {
      id: created.id,
      url: created.url,
      events: parsedEvents,
      description: created.description,
      active: created.active,
      createdAt: created.createdAt,
      secret: rawSecret,
    },
    { status: 201 },
  );
}

export async function PATCH(request: NextRequest) {
  const access = await ensureAdminAccess();
  if (isNextResponse(access)) return access;

  let body: {
    id?: unknown;
    active?: unknown;
    url?: unknown;
    events?: unknown;
    description?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { id, active, url, events, description } = body || {};
  if (typeof id !== 'string') {
    return NextResponse.json({ error: 'id manquant' }, { status: 400 });
  }

  const existing = await prisma.webhook.findFirst({
    where: { id, tenantId: access.tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Webhook introuvable' }, { status: 404 });
  }

  const data: {
    updatedAt: Date;
    active?: boolean;
    url?: string;
    events?: string;
    description?: string | null;
  } = { updatedAt: new Date() };

  if (typeof active === 'boolean') data.active = active;
  if (typeof url === 'string') {
    if (!isValidHttpsUrl(url)) {
      return NextResponse.json({ error: 'url invalide' }, { status: 400 });
    }
    data.url = url;
  }
  if (events !== undefined) {
    const parsed = parseEvents(events);
    if (!parsed) {
      return NextResponse.json({ error: 'events invalide' }, { status: 400 });
    }
    data.events = JSON.stringify(parsed);
  }
  if (typeof description === 'string' || description === null) {
    data.description = description;
  }

  const updated = await prisma.webhook.update({
    where: { id: existing.id },
    data,
  });

  logger.info('[Webhooks] Modifie', {
    id: updated.id,
    tenantId: access.tenantId,
  });

  return NextResponse.json({
    id: updated.id,
    url: updated.url,
    events: JSON.parse(updated.events),
    description: updated.description,
    active: updated.active,
    updatedAt: updated.updatedAt,
  });
}

export async function DELETE(request: NextRequest) {
  const access = await ensureAdminAccess();
  if (isNextResponse(access)) return access;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id manquant' }, { status: 400 });
  }

  const existing = await prisma.webhook.findFirst({
    where: { id, tenantId: access.tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Webhook introuvable' }, { status: 404 });
  }

  await prisma.webhook.delete({ where: { id: existing.id } });

  logger.info('[Webhooks] Supprime', {
    id: existing.id,
    tenantId: access.tenantId,
  });

  return NextResponse.json({ success: true });
}
