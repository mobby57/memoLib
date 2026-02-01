/**
 * AI Legal Assistant Chat API (Phase 8)
 *
 * POST /api/ai/chat
 * - Soumet requête juridique à l'assistant IA
 * - Retourne réponse avec RAG (documents pertinents)
 * - Support multi-turn conversation
 *
 * GET /api/ai/sessions
 * - Liste sessions chat utilisateur
 *
 * GET /api/ai/sessions/[id]
 * - Récupère historique session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AIAssistantService } from '@/lib/services/ai-assistant.service';

const aiAssistant = new AIAssistantService();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { query, sessionId, dossierId } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query requise' }, { status: 400 });
    }

    // Soumettre requête IA
    const result = await aiAssistant.submitQuery({
      query,
      userId: session.user.id,
      tenantId: session.user.tenantId || 'default',
      sessionId,
      dossierId,
    });

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      response: {
        content: result.response.content,
        model: result.response.model,
        confidence: result.response.confidence,
        citations: result.response.citations,
        ragDocuments: result.response.ragDocuments.map(d => ({
          id: d.id,
          title: d.title,
          source: d.source,
          relevanceScore: d.relevanceScore,
        })),
      },
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Liste sessions utilisateur
    const sessions = await aiAssistant.listUserSessions({
      userId: session.user.id,
      tenantId: session.user.tenantId || 'default',
      limit: 50,
    });

    return NextResponse.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s.id,
        title: s.title,
        dossierId: s.dossierId,
        dossier: s.dossier,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        messageCount: s.messages.length,
      })),
    });
  } catch (error: any) {
    console.error('List sessions error:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
