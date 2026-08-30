import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getEmailIngestionMetricsSnapshot, resetEmailIngestionMetrics } from '@/lib/email/ingestion-metrics';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }

  const role = String((session.user as any).role || '').toUpperCase();
  if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Acces interdit' }, { status: 403 });
  }

  return null;
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) {
    return authError;
  }

  const snapshot = getEmailIngestionMetricsSnapshot();
  return NextResponse.json({
    success: true,
    status: snapshot.health.status,
    data: snapshot,
  });
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) {
    return authError;
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'reset';

  if (action !== 'reset') {
    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  }

  resetEmailIngestionMetrics();
  const snapshot = getEmailIngestionMetricsSnapshot();

  return NextResponse.json({
    success: true,
    status: snapshot.health.status,
    message: 'Compteurs ingestion email reinitialises',
    data: snapshot,
  });
}
