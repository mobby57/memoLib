/**
 * AI Session Detail API (Phase 8)
 *
 * GET /api/ai/sessions/[id]
 * - Récupère historique complet d'une session
 *
 * DELETE /api/ai/sessions/[id]
 * - Termine une session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AIAssistantService } from '@/lib/services/ai-assistant.service';

const aiAssistant = new AIAssistantService();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const sessionData = await aiAssistant.getSession(params.id);

    if (!sessionData) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    // Vérifier ownership
    if (sessionData.session.userId !== session.user.id) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: sessionData.session.id,
        title: sessionData.session.title,
        dossierId: sessionData.session.dossierId,
        dossier: sessionData.session.dossier,
        createdAt: sessionData.session.createdAt,
        updatedAt: sessionData.session.updatedAt,
        endedAt: sessionData.session.endedAt,
      },
      messages: sessionData.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: m.metadata,
        createdAt: m.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await aiAssistant.endSession({
      sessionId: params.id,
      userId: session.user.id,
      tenantId: session.user.tenantId || 'default',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('End session error:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
