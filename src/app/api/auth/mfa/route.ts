import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { generateTOTPSecret, verifyTOTP } from '@/lib/security/midway-auth';

/**
 * POST /api/auth/mfa/setup — Génère un secret TOTP (QR code)
 * POST /api/auth/mfa/verify — Vérifie un code TOTP et active le MFA
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const user = session.user as any;
  const { action, code } = await req.json();

  if (action === 'setup') {
    const { secret, otpauthUrl } = generateTOTPSecret(user.email);

    // Sauvegarder le secret (non activé tant que pas vérifié)
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaSecret: secret, mfaEnabled: false },
    });

    return NextResponse.json({
      success: true,
      otpauthUrl, // Le frontend génère un QR code avec ça
      message: 'Scannez ce QR code avec Google Authenticator ou Microsoft Authenticator, puis vérifiez avec un code.',
    });
  }

  if (action === 'verify') {
    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Code à 6 chiffres requis' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mfaSecret: true },
    });

    if (!dbUser?.mfaSecret) {
      return NextResponse.json({ error: 'MFA non configuré. Appelez setup d\'abord.' }, { status: 400 });
    }

    const valid = verifyTOTP(dbUser.mfaSecret, code);
    if (!valid) {
      return NextResponse.json({ error: 'Code invalide. Réessayez.' }, { status: 401 });
    }

    // Activer le MFA
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: true },
    });

    return NextResponse.json({
      success: true,
      message: 'MFA activé. Votre compte est maintenant protégé par double authentification.',
    });
  }

  return NextResponse.json({ error: 'action requis: setup ou verify' }, { status: 400 });
}
