/**
 * API Route - Audit Trail (Admin)
 * GET /api/audit/trail
 *
 * Récupère tous les événements d'un tenant avec filtres
 * Réservé aux admins
 */

import { eventLogService } from '@/lib/services/event-log.service';
import { EventType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const tenantId = (session.user as any).tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 400 });
    }

    // Query params
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('eventType') as EventType | undefined;
    const actorId = searchParams.get('actorId') || undefined;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Récupérer audit trail
    const trail = await eventLogService.getAuditTrail({
      tenantId,
      eventType,
      actorId,
      startDate,
      endDate,
      limit,
      offset,
    });

    // Compter total
    const total = await eventLogService.countEvents({
      tenantId,
      ...(eventType && { eventType }),
    });

    return NextResponse.json({
      trail,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching audit trail:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
