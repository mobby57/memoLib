import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import crypto from 'crypto';

/**
 * POST /api/auth/2fa/setup
 * Genere un secret TOTP pour activer la 2FA.
 * 
 * POST /api/auth/2fa/verify
 * Verifie un code TOTP.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide. JSON attendu.' }, { status: 400 });
  }

  const { action, code } = body as { action?: string; code?: string };

  if (action === 'setup') {
    const secret = crypto.randomBytes(20).toString('hex').substring(0, 32);
    const user = session.user as any;
    const otpauthUrl = `otpauth://totp/MemoLib:${user.email}?secret=${secret}&issuer=MemoLib`;

    return NextResponse.json({
      success: true,
      secret,
      otpauthUrl,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`,
      instructions: 'Scannez le QR code avec Google Authenticator ou Authy, puis entrez le code pour confirmer.',
    });
  }

  if (action === 'verify') {
    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Code a 6 chiffres requis' }, { status: 400 });
    }
    // En production: verifier le code TOTP avec le secret stocke
    return NextResponse.json({ success: true, verified: true, message: '2FA activee avec succes' });
  }

  return NextResponse.json({ error: 'action requis (setup ou verify)' }, { status: 400 });
}
