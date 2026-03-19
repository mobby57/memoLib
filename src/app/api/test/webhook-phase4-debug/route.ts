import { checkWebhookRateLimit } from '@/lib/webhook-rate-limit';
import { checkPayloadSize } from '@/lib/webhook-size-limits';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function ensureAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }

  const role = String((session.user as any).role || '').toUpperCase();
  const allowedRoles = new Set(['ADMIN', 'SUPER_ADMIN']);
  if (!allowedRoles.has(role)) {
    return NextResponse.json({ error: 'Acces interdit' }, { status: 403 });
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const authError = await ensureAdminAccess();
    if (authError) {
      return authError;
    }

    // Test 1: Check payload size
    const testPayload = JSON.stringify({ channel: 'EMAIL', test: true });
    const sizeCheck = checkPayloadSize(testPayload, 'EMAIL');

    // Test 2: Check rate limit
    const rateLimitCheck = await checkWebhookRateLimit(req, 'EMAIL');

    return NextResponse.json({
      success: true,
      tests: {
        sizeCheck: {
          valid: sizeCheck.valid,
          size: sizeCheck.size,
          limit: sizeCheck.limit,
        },
        rateLimit: {
          success: rateLimitCheck.success,
          remaining: rateLimitCheck.remaining,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}
