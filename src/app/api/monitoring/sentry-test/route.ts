import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/monitoring/sentry-test',
    method: 'POST',
    description: 'Emit a test Sentry event and return the eventId.',
  });
}

export async function POST(_req: NextRequest) {
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
