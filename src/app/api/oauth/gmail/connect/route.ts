import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/oauth/gmail/connect
 * Ancien flux OAuth désactivé au profit de /api/email/connect/gmail.
 */
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
