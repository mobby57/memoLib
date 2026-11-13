import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { generateInvitationToken } from '@/lib/invitations';

export async function POST(request: Request, { params }: { params: Promise<{ dossierId: string }> }) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const { dossierId } = await params;
  const { email, expiresInDays = 7 } = await request.json();

  // Vérification de sécurité : l'avocat est-il bien le propriétaire ?
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, lawyerId: userId },
  });
  if (!dossier) return new NextResponse('Forbidden', { status: 403 });

  const { plainToken, tokenHash } = generateInvitationToken();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  await prisma.invitation.create({
    data: { email, dossierId, lawyerId: userId, tokenHash, expiresAt },
  });

  // 👇 MOCK EMAIL (remplace par Resend/SendGrid plus tard)
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/fr/invitation/${plainToken}`;
  console.log('\n=============================================');
  console.log(`📧 EMAIL ENVOYÉ À : ${email}`);
  console.log(`🔗 LIEN D'INVITATION : ${inviteLink}`);
  console.log(`⏳ EXPIRE LE : ${expiresAt.toLocaleDateString()}`);
  console.log('=============================================\n');

  return NextResponse.json({ success: true });
}
