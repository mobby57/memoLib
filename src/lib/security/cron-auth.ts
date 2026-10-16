import { NextRequest, NextResponse } from 'next/server';

/**
 * Vérifie le secret de cron. Retourne une NextResponse si l'accès est refusé,
 * ou null si l'accès est autorisé.
 *
 * Règles :
 *   - 503 si CRON_SECRET n'est pas configuré.
 *   - 401 si le secret est absent ou incorrect.
 *   - Accepte uniquement Bearer <secret> ou ?token=<secret>.
 *
 * Le header x-vercel-cron n'est pas une preuve d'authentification :
 * un client peut le forger et il ne doit jamais suffire à autoriser un cron.
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
  const ok = authHeader === `Bearer ${secret}` || tokenParam === secret;

  if (!ok) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }

  return null;
}
