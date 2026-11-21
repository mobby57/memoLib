import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { getSecurePrisma } from '@/lib/prisma';
import { sendSms } from '@/lib/notifications/sms-service';

const smsSchema = z.object({
  to: z.string().regex(/^\+[1-9]\d{7,14}$/),
  message: z.string().trim().min(1).max(1600),
  dossierId: z.string().min(1).optional(),
});

/**
 * POST /api/notifications/sms
 * Envoie un SMS d'urgence a l'avocat (OQTF 48h, refere, retention).
 * Envoie reellement via Twilio.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSessionCompat();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }
  if (!session.user.tenantId) {
    return NextResponse.json({ error: 'Tenant requis' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = smsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Donnees SMS invalides' }, { status: 400 });
  }

  if (parsed.data.dossierId) {
    const prisma = await getSecurePrisma();
    const dossier = await prisma.dossier.findFirst({
      where: { id: parsed.data.dossierId, tenantId: session.user.tenantId },
      select: { id: true },
    });
    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });
    }
  }

  const result = await sendSms(parsed.data.to, parsed.data.message);
  if (!result.success) {
    return NextResponse.json({ error: 'Envoi SMS impossible' }, { status: 503 });
  }
  return NextResponse.json({ success: true, status: 'sent' });
}
