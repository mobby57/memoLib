import { auth } from '@clerk/nextjs/server';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { generateInvitationToken } from '@/lib/invitations';
import { normalizeEmail } from '@/lib/email-validator';
import { checkRateLimit } from '@/lib/rate-limit';
import { withTenantContext, withTenantContextBatch } from '@/lib/prisma';

const requestSchema = z.object({
  clientEmail: z.string().trim().email().max(254),
  typeDossier: z.string().trim().min(1).max(120),
  objet: z.string().trim().max(1000).optional(),
});

const allowedRoles = new Set(['ADMIN', 'AVOCAT', 'ASSOCIE', 'COLLABORATEUR', 'SECRETAIRE']);

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(userId, 'auth');
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Trop de demandes. Réessayez plus tard.' }, { status: 429 });
  }

  const session = await getServerSessionCompat();
  if (
    !session?.user.tenantId ||
    !allowedRoles.has(session.user.role)
  ) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'URL de l’application non configurée' }, { status: 500 });
  }
  const baseUrl = new URL(appUrl || 'http://localhost:3000').origin;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const parsedBody = requestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Données d’invitation invalides' }, { status: 400 });
  }

  const email = normalizeEmail(parsedBody.data.clientEmail);
  const { plainToken, tokenHash } = generateInvitationToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const tenantId = session.user.tenantId;
  const client = await withTenantContext<{ id: string } | null>(tenantId, transaction =>
    transaction.client.findUnique({
      where: { tenantId_email: { tenantId, email } },
      select: { id: true },
    })
  );
  const clientId = client?.id ?? randomUUID();
  const dossierId = randomUUID();
  const invitationId = randomUUID();

  try {
    await withTenantContextBatch(tenantId, transaction => [
      transaction.client.upsert({
        where: { tenantId_email: { tenantId, email } },
        update: {},
        create: {
          id: clientId,
          email,
          firstName: 'En attente',
          lastName: 'En attente',
          tenantId,
          updatedAt: now,
        },
        select: { id: true },
      }),
      transaction.dossier.create({
        data: {
          id: dossierId,
          tenantId,
          clientId,
          responsableId: session.user.id,
          typeDossier: parsedBody.data.typeDossier,
          objet: parsedBody.data.objet || `Dossier ${parsedBody.data.typeDossier}`,
          numero: `DOS-${randomUUID().slice(0, 12)}`,
          statut: 'en_attente_client',
          updatedAt: now,
        },
      }),
      transaction.invitation.create({
        data: {
          id: invitationId,
          email,
          tenantId,
          dossierId,
          lawyerId: session.user.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      dossierId,
      invitationId,
      inviteLink: `${baseUrl}/fr/invitation/${plainToken}`,
      expiresAt,
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Une invitation est déjà en cours pour cette adresse.' },
        { status: 409 }
      );
    }
    throw error;
  }
}
