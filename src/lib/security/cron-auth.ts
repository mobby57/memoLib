import { NextRequest, NextResponse } from 'next/server';

/**
 * Verifie le secret de cron. Retourne une NextResponse si l'acces est refuse,
 * ou null si l'acces est autorise.
 *
 * Regles :
 *   - 503 si CRON_SECRET n'est pas configure (aucune exception dev).
 *   - 401 si le secret est absent ou incorrect.
 *   - Accepte : Bearer <secret>, ?token=<secret>, ou header x-vercel-cron.
 */
export function requireCronSecret(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET non configure' },
      { status: 503 },
    );
  }
  const authHeader = request.headers.get('authorization') || '';
  const tokenParam = request.nextUrl.searchParams.get('token') || '';
  const cronHeader = request.headers.get('x-vercel-cron') || '';
  const ok =
    authHeader === `Bearer ${secret}` ||
    tokenParam === secret ||
    cronHeader === '1';
  if (!ok) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }
  return null;
}
