import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { parseJsonBody } from '@/lib/middleware/parse-json';
import { registerUser, RegistrationInput } from '@/lib/services/registration-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/register
 * Rate-limited: 5 req / 15 min par IP
 * Route legacy (crée subscription + settings, status active immédiatement)
 */
export const POST = withRateLimit(async function registerHandler(request: NextRequest) {
  const parsed = await parseJsonBody<RegistrationInput>(request);
  if (!parsed.success) return parsed.response;

  try {
    const result = await registerUser(parsed.data, {
      requireEmailVerification: false,
      createSubscription: true,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, ...(result.details && { details: result.details }) },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Inscription réussie',
      user: result.user,
      tenant: result.tenant,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[REGISTER] Erreur inscription', error);

    if (message.includes("Can't reach database server")) {
      return NextResponse.json(
        { error: "Service d'inscription temporairement indisponible (base de données)." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
});
