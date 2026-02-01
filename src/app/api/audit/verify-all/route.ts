/**
 * API Route - Verify All EventLog Integrity
 * POST /api/audit/verify-all
 *
 * Scan tous les EventLog du tenant et vérifie les checksums
 * Admin-only (opération lourde)
 */

import { eventLogService } from '@/lib/services/event-log.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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

    // Vérifier tous les events (peut être lent sur large dataset)
    const result = await eventLogService.verifyAllIntegrity(tenantId);

    return NextResponse.json({
      tenantId,
      totalEvents: result.total,
      corruptedEvents: result.corrupted.length,
      corrupted: result.corrupted,
      status: result.corrupted.length === 0 ? 'OK' : 'ISSUES_FOUND',
      message:
        result.corrupted.length === 0
          ? 'Tous les checksums sont valides'
          : `${result.corrupted.length} event(s) avec checksum invalide`,
    });
  } catch (error: any) {
    console.error('Error verifying all integrity:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
