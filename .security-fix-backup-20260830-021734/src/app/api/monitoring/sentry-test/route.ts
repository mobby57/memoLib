import * as Sentry from '@sentry/nextjs';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

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

export async function GET() {
  const authError = await ensureAdminAccess();
  if (authError) {
    return authError;
  }

  return NextResponse.json({
    endpoint: '/api/monitoring/sentry-test',
    method: 'POST',
    description: 'Emit a test Sentry event and return the eventId.',
  });
}

export async function POST(_req: NextRequest) {
  const authError = await ensureAdminAccess();
  if (authError) {
    return authError;
  }

  const testError = new Error('Sentry test error (manual trigger)');
  const eventId = Sentry.captureException(testError, {
    tags: {
      source: 'sentry-test-endpoint',
      env: process.env.NODE_ENV || 'unknown',
    },
  });

  Sentry.captureMessage('Sentry test message (manual trigger)', {
    level: 'info',
    tags: {
      source: 'sentry-test-endpoint',
    },
  });

  return NextResponse.json({
    success: true,
    eventId,
  });
}
