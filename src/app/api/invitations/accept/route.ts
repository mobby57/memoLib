import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/invitations';
import { resolveActiveClerkUser } from '@/lib/auth/resolve-clerk-user';
import { normalizeEmail } from '@/lib/email-validator';
import { z } from 'zod';

export async function POST(request: Request) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }
  const parsedBody = z.object({ token: z.string().min(32).max(256) }).safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Jeton d’invitation invalide' }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(parsedBody.data.token) },
    select: {
      id: true,
      email: true,
      tenantId: true,
      dossierId: true,
      expiresAt: true,
      status: true,
    },
  });
  if (!invitation) return NextResponse.json({ error: 'Invitation invalide' }, { status: 404 });
  if (invitation.status !== 'PENDING') {
    return NextResponse.json({ error: 'Invitation déjà utilisée' }, { status: 410 });
  }
  const now = new Date();
  if (invitation.expiresAt <= now) {
    await prisma.invitation.updateMany({
      where: { id: invitation.id, status: 'PENDING', expiresAt: { lte: now } },
      data: { status: 'EXPIRED' },
    });
    return NextResponse.json({ error: 'Invitation expirée' }, { status: 410 });
  }

  const verifiedEmail = user.emailAddresses.find(
    email =>
      email.verification?.status === 'verified' &&
      normalizeEmail(email.emailAddress) === normalizeEmail(invitation.email)
  );
  if (!verifiedEmail) {
    return NextResponse.json(
      { error: 'Vérifiez l’adresse email qui a reçu cette invitation.' },
      { status: 403 }
    );
  }

  const dbUser = await resolveActiveClerkUser(userId);
  if (!dbUser) {
    return NextResponse.json({ error: 'Compte non synchronisé ou inactif' }, { status: 403 });
  }

  const grantId = randomUUID();
  const accepted = await prisma.$queryRaw<Array<{ id: string }>>`
    WITH claimed AS (
      UPDATE "Invitation"
      SET "status" = 'ACCEPTED'::"InvitationStatus", "updatedAt" = NOW()
      WHERE "id" = ${invitation.id}
        AND "tenantId" = ${invitation.tenantId}
        AND "status" = 'PENDING'::"InvitationStatus"
        AND "expiresAt" > ${now}
      RETURNING "id", "tenantId", "dossierId"
    )
    INSERT INTO "AccessGrant" (
      "id", "tenantId", "invitationId", "clientUserId", "dossierId",
      "expiresAt", "revokedAt", "status", "createdAt", "updatedAt"
    )
    SELECT
      ${grantId}, "tenantId", "id", ${dbUser.id}, "dossierId",
      NULL, NULL, 'ACTIVE'::"AccessGrantStatus", NOW(), NOW()
    FROM claimed
    RETURNING "id"
  `;
  if (accepted.length !== 1) {
    return NextResponse.json({ error: 'Invitation expirée ou déjà utilisée' }, { status: 410 });
  }

  return NextResponse.json({ success: true, dossierId: invitation.dossierId });
}
