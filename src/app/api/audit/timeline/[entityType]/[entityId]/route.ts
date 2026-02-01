/**
 * API Route - EventLog Timeline
 * GET /api/audit/timeline/[entityType]/[entityId]
 *
 * Récupère la timeline complète d'une entité (flux, dossier, client)
 * Implémentation RULE-005 : Tous événements tracés sont accessibles
 */

import { eventLogService } from '@/lib/services/event-log.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { entityType, entityId } = params;
    const tenantId = (session.user as any).tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 400 });
    }

    // Query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Récupérer timeline
    const timeline = await eventLogService.getTimeline({
      entityType,
      entityId,
      tenantId,
      limit,
      offset,
    });

    // Compter total (pour pagination)
    const total = await eventLogService.countEvents({
      tenantId,
      entityType,
      entityId,
    });

    return NextResponse.json({
      timeline,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
