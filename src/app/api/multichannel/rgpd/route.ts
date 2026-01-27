/**
 * API RGPD - Consentement et droits des clients
 * Export données, suppression, gestion consentements
 */

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';
import { auditService } from '@/lib/multichannel/audit-service';
import { ChannelType } from '@/lib/multichannel/types';
import { getServerSession } from 'next-auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/multichannel/rgpd
 * Obtenir les informations RGPD d'un client
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId requis' }, { status: 400 });
    }

    // Exporter les données
    const exportData = await auditService.exportClientData(clientId);

    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    logger.error('Erreur export RGPD', error instanceof Error ? error : undefined, {
      route: '/api/multichannel/rgpd',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/multichannel/rgpd
 * Enregistrer un consentement
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 'unknown';

    const body = await request.json();
    const { clientId, channel, purpose, granted, expiresAt, proofDocument } = body;

    if (!clientId || !channel || !purpose || granted === undefined) {
      return NextResponse.json(
        { error: 'clientId, channel, purpose et granted requis' },
        { status: 400 }
      );
    }

    const consent = await auditService.recordConsent({
      clientId,
      channel: channel as ChannelType,
      purpose,
      granted,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      proofDocument,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      consent,
    });
  } catch (error) {
    logger.error('Erreur enregistrement consentement', error instanceof Error ? error : undefined, {
      route: '/api/multichannel/rgpd',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/multichannel/rgpd
 * Droit à l'oubli - supprimer les données d'un client
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = session.user as any;

    // Seuls les admins peuvent supprimer
    if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
    }

    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    const reason = url.searchParams.get('reason');
    const keepAuditLogs = url.searchParams.get('keepAuditLogs') === 'true';

    if (!clientId) {
      return NextResponse.json({ error: 'clientId requis' }, { status: 400 });
    }

    const result = await auditService.deleteClientData(clientId, {
      keepAuditLogs,
      reason: reason || 'Demande RGPD',
      requestedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    logger.error('Erreur suppression RGPD', error instanceof Error ? error : undefined, {
      route: '/api/multichannel/rgpd',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
