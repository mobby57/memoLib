/**
 * API Route - Inbox Priorisée (Smart Inbox)
 * GET /api/inbox/prioritized - Retourne emails triés par score de priorité
 */

import { NextRequest, NextResponse } from 'next/server';
import { smartInboxService } from '@/lib/services/smart-inbox.service';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/server-session';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const userRole = String((session.user as any).role || '');
    const sessionTenantId = String((session.user as any).tenantId || '');
    const queryTenantId = searchParams.get('tenantId') || '';

    const tenantId = userRole === 'SUPER_ADMIN' ? queryTenantId || sessionTenantId : sessionTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    if (userRole !== 'SUPER_ADMIN' && queryTenantId && queryTenantId !== sessionTenantId) {
      return NextResponse.json({ error: 'Accès refusé pour ce tenant' }, { status: 403 });
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
