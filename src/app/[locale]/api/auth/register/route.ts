import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { parseJsonBody } from '@/lib/middleware/parse-json';
import { registerUser, RegistrationInput } from '@/lib/services/registration-service';
import { sendVerificationEmail } from '@/lib/auth/email-verification';

export const dynamic = 'force-dynamic';

/**
 * POST /[locale]/api/auth/register
 * Rate-limited: 5 req / 15 min par IP (protection anti-spam/bots)
 * Flow: validation -> creation compte (status: pending) -> envoi email verification
 */
export const POST = withRateLimit(async function registerHandler(request: NextRequest) {
  const parsed = await parseJsonBody<RegistrationInput>(request);
  if (!parsed.success) return parsed.response;

  try {
    const result = await registerUser(parsed.data, {
      requireEmailVerification: true,
      createSubscription: true,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, ...(result.details && { details: result.details }) },
        { status: result.status }
      );
    }

    // Envoi email de vérification (non-bloquant en cas d'échec)
    const emailSent = await sendVerificationEmail(result.user.email, result.user.name);
    if (!emailSent) {
      logger.warn(`[REGISTER] Email de vérification non envoyé pour: ${result.user.email}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Inscription réussie. Un email de vérification a été envoyé.',
      requiresVerification: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[REGISTER] Erreur inscription', error);

    if (message.includes("Can't reach database server")) {
      return NextResponse.json(
        { error: "Service d'inscription temporairement indisponible." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}, {
  type: 'login', // 5 req / 15 min par IP
});
