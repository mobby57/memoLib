import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { requireApiPermission, RBAC_PERMISSIONS } from '@/lib/auth/rbac';
import { canAccessDossier } from '@/lib/auth/dossier-access';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const smsSchema = z.object({
  dossierId: z.string().min(1),
  message: z.string().trim().min(1).max(1600),
  urgence: z.boolean().optional(),
});

export const POST = withRateLimit(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const permission = requireApiPermission(session, RBAC_PERMISSIONS.DOSSIERS_MANAGE);
  if (!permission.ok) {
    return permission.response;
  }

  const user = session.user;
  if (!user.id || !user.tenantId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const parsed = smsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête SMS invalide' }, { status: 400 });
  }

  const access = await canAccessDossier({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    groups: user.groups,
    dossierId: parsed.data.dossierId,
    action: 'write',
  });
  if (!access.allowed) {
    return NextResponse.json({ error: 'Accès refusé au dossier' }, { status: 403 });
  }

  const dossier = await prisma.dossier.findFirst({
    where: { id: parsed.data.dossierId, tenantId: user.tenantId },
    select: { id: true, clientId: true, Client: { select: { phone: true } } },
  });
  const recipient = dossier?.Client.phone;
  if (!dossier || !recipient) {
    return NextResponse.json({ error: 'Destinataire SMS introuvable' }, { status: 404 });
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) {
    return NextResponse.json({ error: 'Service SMS indisponible' }, { status: 503 });
  }

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: recipient, From: from, Body: parsed.data.message }),
    });
    if (!response.ok) {
      return NextResponse.json({ error: 'Échec de l’envoi SMS' }, { status: 502 });
    }

    const result = await response.json() as { sid?: string };
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email ?? '',
        userRole: user.role ?? '',
        action: 'UPDATE',
        entityType: 'Dossier',
        entityId: dossier.id,
        channel: 'SMS',
        clientId: dossier.clientId,
        details: { providerMessageId: result.sid ?? null, urgent: parsed.data.urgence === true },
      },
    });

    return NextResponse.json({ success: true, sid: result.sid, status: 'sent' });
  } catch {
    return NextResponse.json({ error: 'Service SMS indisponible' }, { status: 503 });
  }
}, { type: 'email' });
