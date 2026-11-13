import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/invitations';

export async function POST(request: Request) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) return new NextResponse('Unauthorized', { status: 401 });

  const { token } = await request.json();
  if (!token) return new NextResponse('Token is required', { status: 400 });

  const receivedTokenHash = hashToken(token);

  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: receivedTokenHash },
  });

  if (!invitation) return new NextResponse('Invalid token', { status: 404 });
  if (invitation.status !== 'PENDING') return new NextResponse('Invitation already used', { status: 410 });
  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
    return new NextResponse('Invitation has expired', { status: 410 });
  }

  // Vérification de l'email (le client doit être connecté avec le bon email)
  const userEmail = user.emailAddresses[0]?.emailAddress;
  if (userEmail !== invitation.email) {
    return new NextResponse('This invitation was not sent to your email address', { status: 403 });
  }

  // Création de l'accès et mise à jour de l'invitation
  await prisma.$transaction([
    prisma.accessGrant.create({
      data: { invitationId: invitation.id, clientUserId: userId, expiresAt: invitation.expiresAt },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    }),
  ]);

  return NextResponse.json({ success: true, dossierId: invitation.dossierId });
}
