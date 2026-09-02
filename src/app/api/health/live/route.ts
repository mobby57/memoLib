import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Liveness probe: confirms that the application process can answer requests.
 * Dependency health belongs to the readiness endpoint at /api/health.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
