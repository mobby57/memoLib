import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auditService } from '@/lib/ai/auditService';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 403 });
    }
    const stats = await auditService.getStats(tenantId);
    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Erreur stats audit', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
