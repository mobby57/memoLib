import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { auth } from '@clerk/nextjs/server';
import { withTenantContext, withTenantContextBatch } from '@/lib/prisma';
import { generateInvitationToken } from '@/lib/invitations';
import { isValidEmail, normalizeEmail } from '@/lib/email-validator';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const invitationRequestSchema = z.object({
  email: z.string().trim().email().max(254),
  expiresInDays: z.coerce.number().int().min(1).max(30).default(7),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const rateLimit = await checkRateLimit(userId, 'auth');
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Trop de demandes. Réessayez plus tard.' }, { status: 429 });
  }

  const session = await getServerSessionCompat();
  const allowedRoles = new Set(['ADMIN', 'AVOCAT', 'ASSOCIE', 'COLLABORATEUR', 'SECRETAIRE']);
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

  const { id: dossierId } = await params;
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const parsedBody = invitationRequestSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Paramètres d’invitation invalides' }, { status: 400 });
  }

  const email = normalizeEmail(parsedBody.data.email);
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Format d’email invalide' }, { status: 400 });
  }

  const tenantId = session.user.tenantId;
  const dossier = await withTenantContext(tenantId, transaction =>
    transaction.dossier.findFirst({
      where: { id: dossierId, tenantId, responsableId: session.user.id },
      select: { id: true },
    })
  );
  if (!dossier) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + parsedBody.data.expiresInDays * 24 * 60 * 60 * 1000);
  const { plainToken, tokenHash } = generateInvitationToken();
  const invitationId = randomUUID();
  const lockKey = `${tenantId}:${dossierId}:${email}`;

  try {
    const [, insertResult] = await withTenantContextBatch(tenantId, transaction => [
      transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`,
      transaction.$queryRaw<Array<{ id: string }>>`
        WITH expired AS (
          UPDATE "Invitation"
          SET "status" = 'EXPIRED'::"InvitationStatus", "updatedAt" = NOW()
          WHERE "tenantId" = ${tenantId}
            AND "dossierId" = ${dossierId}
            AND "email" = ${email}
            AND "status" = 'PENDING'::"InvitationStatus"
            AND "expiresAt" <= NOW()
          RETURNING "id"
        ),
        created AS (
          INSERT INTO "Invitation" (
            "id", "email", "tenantId", "dossierId", "lawyerId",
            "tokenHash", "expiresAt", "status", "createdAt", "updatedAt"
          )
          SELECT
            ${invitationId}, ${email}, ${tenantId}, ${dossierId}, ${session.user.id},
            ${tokenHash}, ${expiresAt}, 'PENDING'::"InvitationStatus", NOW(), NOW()
          WHERE NOT EXISTS (
            SELECT 1
            FROM "Invitation"
            WHERE "tenantId" = ${tenantId}
              AND "dossierId" = ${dossierId}
              AND "email" = ${email}
              AND "status" = 'PENDING'::"InvitationStatus"
              AND "expiresAt" > NOW()
          )
          RETURNING "id"
        )
        SELECT "id" FROM created
      `,
    ]);

    const created: unknown = Array.isArray(insertResult) ? insertResult[0] : undefined;
    if (
      typeof created !== 'object' ||
      created === null ||
      !('id' in created) ||
      typeof created.id !== 'string' ||
      created.id !== invitationId
    ) {
      return NextResponse.json(
        { error: 'Une invitation est déjà en cours pour cet email' },
        { status: 409 }
      );
    }
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json({ error: 'Une invitation est déjà en cours pour cet email' }, { status: 409 });
    }
    throw error;
  }

  const inviteLink = `${baseUrl}/fr/invitation/${plainToken}`;

  let emailStatus = 'not_sent';
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const result = await resend.emails.send({
        from: 'MemoLib <onboarding@resend.dev>',
        to: email,
        subject: 'Votre avocat vous invite à compléter votre dossier',
        html: `<p>Votre avocat vous invite à compléter votre dossier.</p><p><a href="${inviteLink}">Accéder à mon dossier</a></p><p>Expire le ${expiresAt.toLocaleDateString('fr-FR')}.</p>`,
      });
      if (!result.error) emailStatus = 'sent';
    } catch (error) {
      console.error('Échec de l’envoi de l’invitation', error instanceof Error ? error.name : 'UnknownError');
      emailStatus = 'failed';
    }
  }

  return NextResponse.json({
    success: true,
    invitationId,
    expiresAt,
    inviteLink,
    emailStatus,
  });
}
