/**
 * RGPD Export API (Phase 9)
 *
 * POST /api/rgpd/export
 * - Demande export données personnelles
 * - Retourne requestId pour suivi
 *
 * GET /api/rgpd/export/[id]
 * - Télécharge export (JSON)
 * - Vérifie expiration (7 jours)
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

    // Demande export données
    const result = await rgpdService.exportUserData({
      userId: session.user.id,
      tenantId: session.user.tenantId || 'default',
      requestedBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      requestId: result.requestId,
      message: 'Export en cours. Vous recevrez un email avec le lien de téléchargement.',
      expiresIn: '7 jours',
    });
  } catch (error: any) {
    console.error('Export RGPD error:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ error: 'requestId requis' }, { status: 400 });
    }

    const exportRequest = await rgpdService.getExportRequest(requestId);

    if (!exportRequest) {
      return NextResponse.json({ error: 'Export non trouvé' }, { status: 404 });
    }

    // Vérifier ownership
    if (exportRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    // Vérifier expiration
    if (exportRequest.expiresAt && new Date() > new Date(exportRequest.expiresAt)) {
      return NextResponse.json({ error: 'Export expiré' }, { status: 410 });
    }

    if (exportRequest.status !== 'completed') {
      return NextResponse.json({
        success: false,
        status: exportRequest.status,
        message: 'Export en cours de traitement',
      });
    }

    return NextResponse.json({
      success: true,
      exportRequest: {
        id: exportRequest.id,
        status: exportRequest.status,
        exportUrl: exportRequest.exportUrl,
        exportSize: exportRequest.exportSize,
        completedAt: exportRequest.completedAt,
        expiresAt: exportRequest.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('Get export error:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
