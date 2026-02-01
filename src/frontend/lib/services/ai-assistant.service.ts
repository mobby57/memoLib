/**
 * AI Legal Assistant Service (Phase 8)
 * 
 * Service IA juridique avec RAG (Retrieval-Augmented Generation):
 * - Chat multi-tour avec contexte juridique
 * - Recherche knowledge base (documents, jurisprudence)
 * - Citations et références légales
 * - EventLog pour audit des requêtes IA
 * 
 * Production note: Intégrer OpenAI GPT-4, Anthropic Claude, ou Llama local
 */

import { PrismaClient } from '@prisma/client';
import { EventLogService } from '@/lib/services/event-log.service';

const prisma = new PrismaClient();
const eventLogService = new EventLogService();

interface RAGDocument {
  id: string;
  content: string;
  source: string; // 'case_law', 'legal_code', 'user_document'
  title: string;
  relevanceScore: number;
  metadata?: {
    articleNumber?: string;
    courtName?: string;
    dateDecision?: string;
    caseNumber?: string;
  };
}

interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  confidence: number;
  citations: {
    text: string;
    source: string;
    documentId?: string;
  }[];
  ragDocuments: RAGDocument[];
}

interface ChatContext {
  sessionId: string;
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
  dossierId?: string;
}

export class AIAssistantService {
  /**
   * Soumet une requête IA juridique avec RAG
   */
  async submitQuery(params: {
    query: string;
    userId: string;
    tenantId: string;
    sessionId?: string;
    dossierId?: string;
  }): Promise<{ sessionId: string; response: AIResponse }> {
    const { query, userId, tenantId, sessionId, dossierId } = params;

    // 1. Créer ou récupérer session
    let session = sessionId
      ? await prisma.chatSession.findUnique({
          where: { id: sessionId },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        })
      : null;

    if (!session) {
      // Générer titre depuis première requête
      const title = this.generateSessionTitle(query);

      session = await prisma.chatSession.create({
        data: {
          tenantId,
          userId,
          dossierId,
          title,
        },
        include: { messages: true },
      });

      // EventLog: session started
      await eventLogService.createEventLog({
        tenantId,
        actorId: userId,
        actorType: 'USER',
        eventType: 'AI_SESSION_STARTED',
        metadata: {
          sessionId: session.id,
          dossierId,
          initialQuery: query.substring(0, 100),
        },
      });
    }

    // 2. Sauvegarder message utilisateur
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        userId,
        role: 'user',
        content: query,
      },
    });

    // EventLog: query submitted
    await eventLogService.createEventLog({
      tenantId,
      actorId: userId,
      actorType: 'USER',
      eventType: 'AI_QUERY_SUBMITTED',
      metadata: {
        sessionId: session.id,
        query: query.substring(0, 200),
        dossierId,
        queryLength: query.length,
      },
    });

    // 3. Recherche RAG (documents pertinents)
    const ragDocuments = await this.searchKnowledgeBase({
      query,
      tenantId,
      dossierId,
      limit: 5,
    });

    // 4. Construire contexte conversation
    const context: ChatContext = {
      sessionId: session.id,
      messages: session.messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      dossierId,
    };

    // 5. Générer réponse IA avec RAG
    const aiResponse = await this.generateResponse({
      query,
      context,
      ragDocuments,
      tenantId,
    });

    // 6. Sauvegarder réponse IA
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: aiResponse.content,
        metadata: {
          model: aiResponse.model,
          tokensUsed: aiResponse.tokensUsed,
          confidence: aiResponse.confidence,
          ragDocuments: ragDocuments.map((d) => ({
            id: d.id,
            title: d.title,
            relevanceScore: d.relevanceScore,
          })),
          citations: aiResponse.citations,
        },
      },
    });

    // EventLog: response generated
    await eventLogService.createEventLog({
      tenantId,
      actorId: userId,
      actorType: 'AI',
      eventType: 'AI_RESPONSE_GENERATED',
      metadata: {
        sessionId: session.id,
        model: aiResponse.model,
        tokensUsed: aiResponse.tokensUsed,
        responseLength: aiResponse.content.length,
        ragDocumentsUsed: ragDocuments.length,
        confidence: aiResponse.confidence,
        citationsCount: aiResponse.citations.length,
      },
    });

    return {
      sessionId: session.id,
      response: aiResponse,
    };
  }

  /**
   * Recherche dans la knowledge base (RAG retrieval)
   * 
   * Production: Utiliser embeddings vectoriels (OpenAI embeddings + Pinecone/Weaviate)
   * ou PostgreSQL pgvector pour similarité sémantique
   */
  private async searchKnowledgeBase(params: {
    query: string;
    tenantId: string;
    dossierId?: string;
    limit: number;
  }): Promise<RAGDocument[]> {
    const { query, tenantId, dossierId, limit } = params;

    // Simulation: recherche dans documents traités OCR
    const documents = await prisma.document.findMany({
      where: {
        tenantId,
        dossierId: dossierId || undefined,
        ocrProcessed: true,
        ocrText: {
          not: null,
        },
      },
      take: limit * 2, // Récupérer plus pour filtrage
      orderBy: { createdAt: 'desc' },
    });

    // Simulation scoring sémantique (en prod: embeddings cosine similarity)
    const scoredDocs = documents
      .map((doc) => {
        const relevanceScore = this.calculateRelevance(query, doc.ocrText || '');

        return {
          id: doc.id,
          content: (doc.ocrText || '').substring(0, 1000), // Extract pertinent
          source: 'user_document' as const,
          title: doc.filename,
          relevanceScore,
          metadata: {
            dateDecision: doc.createdAt.toISOString(),
          },
        };
      })
      .filter((d) => d.relevanceScore > 0.1) // Seuil pertinence
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    // Ajouter documents jurisprudence simulés (en prod: base données légale)
    const caseLawDocs = this.getRelevantCaseLaw(query);

    return [...scoredDocs, ...caseLawDocs].slice(0, limit);
  }

  /**
   * Calcule score de pertinence (simulation)
   * Production: embeddings vectoriels OpenAI/Cohere
   */
  private calculateRelevance(query: string, documentText: string): number {
    const queryTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 3);

    const docLower = documentText.toLowerCase();

    let matchCount = 0;
    queryTerms.forEach((term) => {
      if (docLower.includes(term)) {
        matchCount++;
      }
    });

    return matchCount / Math.max(queryTerms.length, 1);
  }

  /**
   * Récupère jurisprudence pertinente (simulation)
   * Production: API Légifrance, base JuriCA, etc.
   */
  private getRelevantCaseLaw(query: string): RAGDocument[] {
    const queryLower = query.toLowerCase();

    // Base de connaissances simulée
    const knowledgeBase: RAGDocument[] = [
      {
        id: 'case-law-1',
        content: `Conseil d'État, 10 avril 2015, n° 375081
        
En matière d'OQTF (Obligation de Quitter le Territoire Français), le préfet doit respecter le principe du contradictoire et permettre à l'étranger de présenter ses observations avant de prendre la décision.

L'article L. 511-1 du CESEDA impose que la décision soit motivée et prenne en compte la situation personnelle et familiale de l'intéressé, notamment au regard de l'article 8 de la CEDH (droit au respect de la vie privée et familiale).`,
        source: 'case_law',
        title: 'CE, 10 avril 2015, OQTF et principe du contradictoire',
        relevanceScore: 0.8,
        metadata: {
          courtName: "Conseil d'État",
          dateDecision: '2015-04-10',
          caseNumber: '375081',
        },
      },
      {
        id: 'case-law-2',
        content: `Cour Européenne des Droits de l'Homme, 2 août 2001, Boultif c. Suisse, n° 54273/00

L'expulsion d'un étranger peut constituer une violation de l'article 8 CEDH. Les critères d'évaluation incluent:
- La nature et la gravité de l'infraction
- La durée du séjour dans le pays
- Le temps écoulé depuis l'infraction
- La nationalité des personnes concernées
- La situation familiale (conjoint, enfants)
- Les liens avec le pays d'origine`,
        source: 'case_law',
        title: 'CEDH, Boultif c. Suisse, critères article 8',
        relevanceScore: 0.75,
        metadata: {
          courtName: 'CEDH',
          dateDecision: '2001-08-02',
          caseNumber: '54273/00',
        },
      },
      {
        id: 'legal-code-1',
        content: `Code de l'entrée et du séjour des étrangers et du droit d'asile (CESEDA)

Article L. 511-1: L'autorité administrative peut, par décision motivée, obliger un étranger à quitter le territoire français dans les cas suivants:
1° L'étranger se maintient en France sans être titulaire d'un titre de séjour
2° L'étranger s'est vu refuser la délivrance d'un titre de séjour
3° Le titre de séjour a été retiré ou n'a pas été renouvelé

La décision fixe le pays de destination et peut être assortie d'une interdiction de retour.`,
        source: 'legal_code',
        title: 'CESEDA, Article L. 511-1 (OQTF)',
        relevanceScore: 0.85,
        metadata: {
          articleNumber: 'L. 511-1',
        },
      },
    ];

    // Filtrage par mots-clés (simulation)
    if (queryLower.includes('oqtf') || queryLower.includes('obligation')) {
      return knowledgeBase.filter((d) => d.id.includes('case-law-1') || d.id.includes('legal-code-1'));
    }

    if (queryLower.includes('article 8') || queryLower.includes('vie privée') || queryLower.includes('familiale')) {
      return knowledgeBase.filter((d) => d.id.includes('case-law-2'));
    }

    if (queryLower.includes('recours') || queryLower.includes('tribunal')) {
      return [knowledgeBase[0]];
    }

    return knowledgeBase.slice(0, 2); // Par défaut: 2 docs
  }

  /**
   * Génère réponse IA avec RAG
   * Production: OpenAI GPT-4, Anthropic Claude, ou Llama local
   */
  private async generateResponse(params: {
    query: string;
    context: ChatContext;
    ragDocuments: RAGDocument[];
    tenantId: string;
  }): Promise<AIResponse> {
    const { query, context, ragDocuments } = params;

    // Construire prompt avec RAG context
    const ragContext = this.formatLegalContext(ragDocuments);

    const systemPrompt = `Tu es un assistant juridique expert en droit des étrangers français.

CONTEXTE JURIDIQUE PERTINENT:
${ragContext}

Instructions:
1. Réponds en français de manière précise et professionnelle
2. Cite les sources juridiques (articles de loi, jurisprudence)
3. Si tu n'es pas certain, indique-le clairement
4. Adapte ton langage au contexte juridique`;

    // Simulation réponse IA (en prod: appel API OpenAI/Claude/Llama)
    const simulatedResponse = this.generateSimulatedResponse(query, ragDocuments);

    // Extraire citations
    const citations = this.extractCitations(simulatedResponse, ragDocuments);

    return {
      content: simulatedResponse,
      model: 'gpt-4-simulated', // En prod: 'gpt-4', 'claude-3-opus', 'llama-3-70b'
      tokensUsed: Math.floor(simulatedResponse.length / 4) + 500, // Estimation
      confidence: 0.87,
      citations,
      ragDocuments,
    };
  }

  /**
   * Formate contexte juridique pour RAG prompt
   */
  private formatLegalContext(documents: RAGDocument[]): string {
    return documents
      .map((doc, idx) => {
        let formatted = `[Document ${idx + 1}] ${doc.title}\nSource: ${doc.source}\n`;

        if (doc.metadata?.articleNumber) {
          formatted += `Article: ${doc.metadata.articleNumber}\n`;
        }
        if (doc.metadata?.courtName) {
          formatted += `Juridiction: ${doc.metadata.courtName}\n`;
        }
        if (doc.metadata?.caseNumber) {
          formatted += `Numéro: ${doc.metadata.caseNumber}\n`;
        }

        formatted += `\n${doc.content}\n`;
        return formatted;
      })
      .join('\n---\n\n');
  }

  /**
   * Génère réponse simulée (remplacer par vraie IA en prod)
   */
  private generateSimulatedResponse(query: string, ragDocs: RAGDocument[]): string {
    const queryLower = query.toLowerCase();

    if (queryLower.includes('oqtf') || queryLower.includes('obligation')) {
      return `D'après l'article L. 511-1 du CESEDA et la jurisprudence du Conseil d'État (CE, 10 avril 2015, n° 375081), une Obligation de Quitter le Territoire Français (OQTF) peut être contestée dans les cas suivants:

**1. Motifs de légalité externe:**
- Défaut de motivation de la décision
- Non-respect du principe du contradictoire
- Incompétence de l'auteur de l'acte

**2. Motifs de légalité interne:**
- Erreur manifeste d'appréciation de la situation personnelle
- Violation de l'article 8 CEDH (droit au respect de la vie privée et familiale)
- Méconnaissance des garanties légales (durée de séjour, attaches familiales)

**Critères d'évaluation (jurisprudence Boultif c. Suisse, CEDH 2001):**
- Durée du séjour en France
- Situation familiale (conjoint français, enfants scolarisés)
- Intégration sociale et professionnelle
- Liens avec le pays d'origine

**Recours:**
Le recours doit être déposé devant le Tribunal Administratif dans un délai de 30 jours (15 jours en cas d'OQTF avec délai de départ volontaire).

Sources: CESEDA L. 511-1, CE n° 375081/2015, CEDH Boultif c. Suisse n° 54273/00.`;
    }

    if (queryLower.includes('délai') || queryLower.includes('recours')) {
      return `Les délais de recours contre une OQTF sont les suivants:

**Délai de droit commun:** 30 jours à compter de la notification
**Délai réduit:** 15 jours si OQTF avec délai de départ volontaire

Le recours doit être déposé devant le Tribunal Administratif territorialement compétent. Il est suspensif si déposé dans les délais.

En cas d'urgence, un référé-suspension peut être demandé (article L. 521-1 CJA).

Source: CESEDA, Code de Justice Administrative.`;
    }

    // Réponse générique
    return `Votre question concerne le droit des étrangers. D'après les documents juridiques disponibles, voici les éléments pertinents:

${ragDocs
  .slice(0, 2)
  .map((doc) => `- ${doc.title}: ${doc.content.substring(0, 200)}...`)
  .join('\n\n')}

Pour une analyse plus précise de votre situation, je vous recommande de consulter un avocat spécialisé en droit des étrangers.`;
  }

  /**
   * Extrait citations des sources utilisées
   */
  private extractCitations(
    response: string,
    ragDocs: RAGDocument[]
  ): { text: string; source: string; documentId?: string }[] {
    const citations: { text: string; source: string; documentId?: string }[] = [];

    // Chercher références dans la réponse
    ragDocs.forEach((doc) => {
      if (response.includes(doc.title) || (doc.metadata?.caseNumber && response.includes(doc.metadata.caseNumber))) {
        citations.push({
          text: doc.title,
          source: doc.source,
          documentId: doc.id,
        });
      }
    });

    return citations;
  }

  /**
   * Génère titre de session depuis première requête
   */
  private generateSessionTitle(query: string): string {
    const trimmed = query.trim().substring(0, 80);
    return trimmed.length < query.length ? trimmed + '...' : trimmed;
  }

  /**
   * Récupère historique d'une session
   */
  async getSession(sessionId: string): Promise<{
    session: any;
    messages: any[];
  } | null> {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        dossier: {
          select: { id: true, numero: true, objet: true },
        },
      },
    });

    if (!session) {
      return null;
    }

    return {
      session,
      messages: session.messages,
    };
  }

  /**
   * Liste sessions d'un utilisateur
   */
  async listUserSessions(params: { userId: string; tenantId: string; limit?: number }): Promise<any[]> {
    const { userId, tenantId, limit = 20 } = params;

    return prisma.chatSession.findMany({
      where: {
        userId,
        tenantId,
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
        dossier: {
          select: { numero: true, objet: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Termine une session
   */
  async endSession(params: { sessionId: string; userId: string; tenantId: string }): Promise<void> {
    const { sessionId, userId, tenantId } = params;

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });

    await eventLogService.createEventLog({
      tenantId,
      actorId: userId,
      actorType: 'USER',
      eventType: 'AI_SESSION_ENDED',
      metadata: { sessionId },
    });
  }
}
