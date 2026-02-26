/**
 * API Route - Inbox Priorisée (Smart Inbox)
 * GET /api/inbox/prioritized - Retourne emails triés par score de priorité
 */

import { NextRequest, NextResponse } from 'next/server';
import { smartInboxService } from '@/lib/services/smart-inbox.service';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // TODO: Récupérer tenant depuis auth session
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : 0;
    const category = searchParams.get('category') || undefined;
    const urgency = searchParams.get('urgency') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const emails = await smartInboxService.getPrioritizedInbox(tenantId, {
      minScore,
      category,
      urgency,
      limit,
      offset,
    });

    const total = await prisma.email.count({
      where: {
        tenantId,
        isArchived: false,
        ...(category && { category }),
        ...(urgency && { urgency }),
        inboxScore: {
          score: { gte: minScore },
        },
      },
    });

    return NextResponse.json({
      success: true,
      total,
      limit,
      offset,
      emails: emails.map((e) => ({
        id: e.id,
        from: e.from,
        to: e.to,
        subject: e.subject,
        preview: e.preview,
        category: e.category,
        urgency: e.urgency,
        sentiment: e.sentiment,
        isRead: e.isRead,
        isStarred: e.isStarred,
        receivedAt: e.receivedAt,
        score: e.inboxScore?.score || 0,
        scoreFactors: e.inboxScore?.factors || {},
        client: e.client
          ? {
              name: `${e.client.firstName} ${e.client.lastName}`,
              email: e.client.email,
            }
          : null,
        dossier: e.dossier
          ? {
              numero: e.dossier.numero,
              objet: e.dossier.objet,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error('[INBOX-PRIORITIZED] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: String(error) }, { status: 500 });
  }
}
