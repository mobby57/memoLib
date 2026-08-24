import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

/**
 * Ancien callback OAuth désactivé : il exposait un refresh token dans la réponse.
 */
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
