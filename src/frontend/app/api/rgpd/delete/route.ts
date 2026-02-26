/**
 * RGPD Delete API (Phase 9)
 *
 * POST /api/rgpd/delete
 * - Suppression complète compte utilisateur
 * - CASCADE sur toutes relations
 * - Irréversible - confirmation requise
 *
 * POST /api/rgpd/anonymize
 * - Anonymisation données (alternative suppression)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RGPDComplianceService } from '@/lib/services/rgpd-compliance.service';

const rgpdService = new RGPDComplianceService();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { action, confirmed } = body;

    if (!confirmed) {
      return NextResponse.json(
        {
          error: 'Confirmation requise',
          message: 'Vous devez confirmer la suppression en passant confirmed: true',
        },
        { status: 400 }
      );
    }

    if (action === 'anonymize') {
      // Anonymisation (droit à l'oubli sans suppression)
      const result = await rgpdService.anonymizeUser({
        userId: session.user.id,
        tenantId: session.user.tenantId || 'default',
        requestedBy: session.user.id,
      });

      return NextResponse.json({
        success: true,
        action: 'anonymized',
        result: {
          anonymizedFields: result.anonymizedFields,
          tablesAffected: result.tablesAffected,
          timestamp: result.timestamp,
        },
        message: 'Vos données ont été anonymisées avec succès',
      });
    } else {
      // Suppression complète (irréversible)
      const result = await rgpdService.deleteUserData({
        userId: session.user.id,
        tenantId: session.user.tenantId || 'default',
        requestedBy: session.user.id,
      });

      return NextResponse.json({
        success: true,
        action: 'deleted',
        result: {
          deletedRecords: result.deletedRecords,
          totalDeleted: result.totalDeleted,
          timestamp: result.timestamp,
        },
        message: 'Votre compte et toutes vos données ont été supprimés',
      });
    }
  } catch (error: any) {
    console.error('RGPD delete error:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
