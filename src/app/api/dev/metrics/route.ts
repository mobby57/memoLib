import { NextResponse } from 'next/server';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { logger } from '@/lib/dev/advanced-logger';

async function ensureAdminAccess() {
  const session = await getServerSessionCompat();
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

/**
 * GET /api/dev/metrics - Recupere les metriques de performance
 */
export async function GET() {
  try {
    const authError = await ensureAdminAccess();
    if (authError) {
      return authError;
    }

    const metrics = logger.getPerformanceMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur recuperation metriques' },
      { status: 500 }
    );
  }
}
