import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken, resendVerificationEmail } from '@/lib/auth/email-verification';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /[locale]/api/auth/verify-email?token=xxx
 * Verifie le token et active le compte
 * Rate-limited: 10 req / 15 min par IP
 */
export const GET = withRateLimit(async function verifyHandler(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 400 }
      );
    }

    // Validation basique du format (hex 64 chars)
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 400 }
      );
    }

    const result = await verifyEmailToken(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    logger.info(`[VERIFY-EMAIL] Email verifie: ${result.email}`);

    return NextResponse.json({
      success: true,
      message: 'Email verifie avec succes. Vous pouvez maintenant vous connecter.',
    });
  } catch (error) {
    logger.error('[VERIFY-EMAIL] Erreur verification', error);
    return NextResponse.json(
      { error: 'Erreur lors de la verification' },
      { status: 500 }
    );
  }
}, { type: 'api' });

/**
 * POST /[locale]/api/auth/verify-email
 * Renvoyer l'email de verification
 * Rate-limited: 3 req / 15 min par IP (anti-spam)
 */
export const POST = withRateLimit(async function resendHandler(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    await resendVerificationEmail(email);

    // Toujours repondre succes (anti-enumeration)
    return NextResponse.json({
      success: true,
      message: 'Si un compte existe avec cet email, un nouveau lien de verification a ete envoye.',
    });
  } catch (error) {
    logger.error('[VERIFY-EMAIL] Erreur renvoi', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi' },
      { status: 500 }
    );
  }
}, {
  customConfig: {
    windowMs: 15 * 60 * 1000, // 15 min
    maxRequests: 3, // 3 renvois max par fenetre
  },
});
