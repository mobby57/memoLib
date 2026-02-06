/**
 * Routes API Next.js pour le pipeline d'analyse
 * À créer dans: src/frontend/app/api/analysis/
 *
 * Endpoints:
 * - GET/POST /api/analysis/execute
 * - GET /api/analysis/fetch-units
 * - POST /api/analysis/create-events
 * - POST /api/analysis/propose-duplicate-link
 * - GET /api/analysis/find-duplicate-candidates
 */

import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/analysis/execute
 *
 * Lance le pipeline d'analyse complet
 *
 * Workflow:
 * 1. Valide le tenant
 * 2. Appelle le backend Python pour le pipeline
 * 3. Reçoit les résultats
 * 4. Persiste les EventLog via Prisma
 */
export async function POST(req: NextRequest) {
  try {
    const { tenantId, unitStatus = 'RECEIVED', limit = 100 } = await req.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    // Appelle le backend Python
    const pythonResponse = await fetch('http://localhost:5000/analysis/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenantId,
        unit_status: unitStatus,
        limit,
        persist: true,
      }),
    });

    if (!pythonResponse.ok) {
      throw new Error(`Python backend error: ${pythonResponse.statusText}`);
    }

    const result = await pythonResponse.json();

    return NextResponse.json({
      success: true,
      execution_id: result.execution_id,
      units_classified: result.units_classified,
      duplicates_detected: result.duplicates_detected,
      events_generated: result.events_generated,
      processing_time_seconds: result.processing_time_seconds,
    });
  } catch (error) {
    console.error('[ANALYSIS/EXECUTE]', error);
    return NextResponse.json({ error: 'Pipeline execution failed' }, { status: 500 });
  }
}

/**
 * GET /api/analysis/fetch-units
 *
 * Charge les InformationUnit depuis Prisma
 * pour le pipeline d'analyse
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status') || 'RECEIVED';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    // Charge les unités du statut spécifié
    const units = await prisma.informationUnit.findMany({
      where: {
        tenantId,
        currentStatus: status as any,
      },
      select: {
        id: true,
        source: true,
        content: true,
        contentHash: true,
        receivedAt: true,
        sourceMetadata: true,
        linkedWorkspaceId: true,
      },
      take: limit,
      orderBy: {
        receivedAt: 'desc',
      },
    });

    return NextResponse.json({
      count: units.length,
      units: units.map(u => ({
        id: u.id,
        tenantId,
        source: u.source,
        content: u.content,
        contentHash: u.contentHash,
        receivedAt: u.receivedAt.toISOString(),
        sourceMetadata: u.sourceMetadata,
        linkedWorkspaceId: u.linkedWorkspaceId,
      })),
    });
  } catch (error) {
    console.error('[ANALYSIS/FETCH-UNITS]', error);
    return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
  }
}

/**
 * POST /api/analysis/create-events
 *
 * Persiste les EventLog générés par le pipeline
 * dans la base de données Prisma
 */
export async function POST(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname === '/api/analysis/create-events') {
    try {
      const { tenantId, events } = await req.json();

      if (!tenantId || !events) {
        return NextResponse.json({ error: 'tenantId and events required' }, { status: 400 });
      }

      // Insère les événements
      const created = await Promise.all(
        events.map(event =>
          prisma.eventLog.create({
            data: {
              id: event.id,
              tenantId,
              timestamp: new Date(event.timestamp),
              eventType: event.eventType,
              entityType: event.entityType,
              entityId: event.entityId,
              actorType: event.actorType as any,
              actorId: event.actorId,
              metadata: event.metadata as any,
              immutable: event.immutable,
              checksum: event.checksum,
              previousEventId: event.previousEventId,
            },
          })
        )
      );

      return NextResponse.json({
        success: true,
        created_count: created.length,
        failed_count: 0,
        errors: [],
      });
    } catch (error) {
      console.error('[ANALYSIS/CREATE-EVENTS]', error);
      return NextResponse.json({ error: 'Failed to create events' }, { status: 500 });
    }
  }

  /**
   * POST /api/analysis/propose-duplicate-link
   *
   * Propose un lien entre deux InformationUnit
   */
  if (pathname === '/api/analysis/propose-duplicate-link') {
    try {
      const { tenantId, primaryUnitId, duplicateUnitId, reason } = await req.json();

      // Crée un EventLog pour la détection de doublon
      const event = await prisma.eventLog.create({
        data: {
          tenantId,
          timestamp: new Date(),
          eventType: 'DUPLICATE_DETECTED',
          entityType: 'information_unit',
          entityId: duplicateUnitId,
          actorType: 'SYSTEM',
          metadata: {
            primary_unit_id: primaryUnitId,
            duplicate_unit_id: duplicateUnitId,
            reason,
            status: 'PROPOSED_FOR_LINKING',
            action_required: true,
          } as any,
          immutable: true,
          checksum: '', // Sera calculé par le backend
        },
      });

      return NextResponse.json({
        success: true,
        event_id: event.id,
        status: 'PROPOSED_FOR_LINKING',
      });
    } catch (error) {
      console.error('[ANALYSIS/PROPOSE-LINK]', error);
      return NextResponse.json({ error: 'Failed to propose link' }, { status: 500 });
    }
  }

  /**
   * GET /api/analysis/find-duplicate-candidates
   *
   * Cherche les candidats doublons pour une unité
   */
  if (pathname === '/api/analysis/find-duplicate-candidates') {
    try {
      const { searchParams } = new URL(req.url);
      const tenantId = searchParams.get('tenantId');
      const contentHash = searchParams.get('contentHash');
      const senderEmail = searchParams.get('senderEmail');
      const receivedAt = searchParams.get('receivedAt');

      if (!tenantId) {
        return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
      }

      // Cherche les doublons exacts par hash
      let candidates = [];

      if (contentHash) {
        candidates = await prisma.informationUnit.findMany({
          where: {
            tenantId,
            contentHash,
          },
          select: {
            id: true,
            contentHash: true,
            sourceMetadata: true,
            receivedAt: true,
          },
          take: 10,
        });
      }

      // Enrichit avec les métadonnées
      const enriched = candidates.map(c => ({
        id: c.id,
        content_hash: c.contentHash,
        senderEmail: (c.sourceMetadata as any)?.sender_email,
        receivedAt: c.receivedAt.toISOString(),
        reason: contentHash === c.contentHash ? 'exact_hash_match' : 'metadata_match',
        timeDiffSeconds: receivedAt
          ? Math.abs((new Date(receivedAt).getTime() - c.receivedAt.getTime()) / 1000)
          : 0,
      }));

      return NextResponse.json({
        candidates: enriched,
      });
    } catch (error) {
      console.error('[ANALYSIS/FIND-DUPLICATES]', error);
      return NextResponse.json({ error: 'Failed to find duplicates' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
