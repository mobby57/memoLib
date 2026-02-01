/**
 * API Route - Audit Integrity Check
 * GET /api/audit/verify/{eventId}
 * POST /api/audit/verify-all
 *
 * Vérifie l'intégrité des EventLog via checksum SHA-256
 * Implémentation RULE-006
 */

import { eventLogService } from '@/lib/services/event-log.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

type RouteParams = {
  params: {
    eventId: string;
  };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { eventId } = params;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId est obligatoire' }, { status: 400 });
    }

    // Vérifier intégrité
    const isValid = await eventLogService.verifyIntegrity(eventId);

    return NextResponse.json({
      eventId,
      verified: isValid,
      status: isValid ? 'OK' : 'CORRUPTED',
      message: isValid ? 'Checksum valide' : 'Checksum invalide - données corrompues',
    });
  } catch (error: any) {
    console.error('Error verifying integrity:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
