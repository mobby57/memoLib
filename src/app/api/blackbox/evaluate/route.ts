import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { RBAC_PERMISSIONS, requireApiPermission } from '@/lib/auth/rbac';
import { addRateLimitHeaders, checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { runBlackbox } from '@/lib/blackbox/engine';
import { logger } from '@/lib/logger';

interface EvaluateRequestBody {
  value?: number;
  category?: string;
  riskFactor?: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const permissionCheck = requireApiPermission(session, RBAC_PERMISSIONS.DOSSIERS_MANAGE);
    if (!permissionCheck.ok) {
      return permissionCheck.response;
    }

    const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
    const rateLimitId = sessionUserId || getClientIP(request);
    const rateLimit = await checkRateLimit(`blackbox:${rateLimitId}`);

    if (!rateLimit.success) {
      return addRateLimitHeaders(
        NextResponse.json(
          { error: 'Too many requests. Please retry later.' },
          { status: 429 }
        ),
        rateLimit
      );
    }

    const body = (await request.json()) as EvaluateRequestBody;

    if (typeof body.value !== 'number' || Number.isNaN(body.value)) {
      return NextResponse.json(
        { error: 'Invalid input: value must be a valid number.' },
        { status: 400 }
      );
    }

    const result = runBlackbox({
      value: body.value,
      category: body.category,
      riskFactor: body.riskFactor,
    });

    return addRateLimitHeaders(
      NextResponse.json({
        ok: true,
        result,
      }),
      rateLimit
    );
  } catch (error) {
    logger.error('Blackbox evaluation failed', error);
    return NextResponse.json(
      { error: 'Blackbox execution failed.' },
      { status: 500 }
    );
  }
}
