/**
 * TEST AI LEGAL ASSISTANT - Phase 8
 * 
 * Validation assistant IA juridique avec RAG:
 * - Requête juridique (OQTF, délais recours)
 * - RAG retrieval (jurisprudence, code)
 * - Multi-turn conversation
 * - EventLog AI_QUERY_SUBMITTED / AI_RESPONSE_GENERATED
 * - Citations correctes
 */

import { PrismaClient } from '@prisma/client';
import { AIAssistantService } from '../src/frontend/lib/services/ai-assistant.service';

const prisma = new PrismaClient();
const aiAssistant = new AIAssistantService();

async function testAIAssistant() {
  console.log('🧪 TEST AI LEGAL ASSISTANT - Phase 8\n');

  let tenantId: string;
  let userId: string;
  let dossierId: string;
  let sessionId: string;

  try {
    // Setup
    console.log('📦 Setup: Création tenant + user + dossier...');

    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test AI Tenant',
        subdomain: `ai-test-${Date.now()}`,
        planId: (await prisma.plan.findFirst())!.id,
      },
    });
    tenantId = tenant.id;
    console.log(`✅ Tenant: ${tenantId}`);

    const user = await prisma.user.create({
      data: {
        email: `ai-test-${Date.now()}@test.com`,
        name: 'Test AI User',
        password: 'test123',
        role: 'lawyer',
        tenantId,
      },
    });
    userId = user.id;
    console.log(`✅ User: ${userId}`);

    const client = await prisma.client.create({
      data: {
        nom: 'DURAND',
        prenom: 'Sophie',
        email: 'sophie.durand@test.com',
        tenantId,
      },
    });

    const dossier = await prisma.dossier.create({
      data: {
        numero: `OQTF-${Date.now()}`,
        typeDossier: 'contentieux_administratif',
        objet: 'Recours OQTF',
        tenantId,
        clientId: client.id,
      },
    });
    dossierId = dossier.id;
    console.log(`✅ Dossier: ${dossierId}\n`);

    // Créer document OCR pour RAG
    console.log('📄 Setup: Document OCR pour RAG...');
    await prisma.document.create({
      data: {
        tenantId,
        dossierId,
        filename: 'jugement-ta.pdf',
        originalName: 'Jugement TA Paris OQTF.pdf',
        mimeType: 'application/pdf',
        size: 150000,
        storageKey: 'test-doc-rag',
        category: 'decision_justice',
        ocrProcessed: true,
        ocrText: `TRIBUNAL ADMINISTRATIF DE PARIS
Jugement du 15 mars 2024
N° 2400567

OQTF - Recours contre obligation de quitter le territoire

Le Tribunal administratif annule la décision préfectorale au motif que:
1. La situation familiale n'a pas été suffisamment prise en compte (article 8 CEDH)
2. L'intéressé justifie d'une présence en France depuis plus de 10 ans
3. Violation du principe du contradictoire

Article L. 511-1 CESEDA - Délai de recours: 30 jours`,
        ocrConfidence: 0.95,
        extractedData: JSON.stringify({
          dates: ['15/03/2024'],
          caseNumber: '2400567',
        }),
        uploadedById: userId,
      },
    });
    console.log('✅ Document RAG créé\n');

    // ===========================================
    // TEST 1: Requête OQTF (nouvelle session)
    // ===========================================
    console.log('💬 TEST 1: Requête juridique OQTF...');

    const query1 = 'Comment contester une OQTF ? Quels sont les motifs de recours ?';

    const result1 = await aiAssistant.submitQuery({
      query: query1,
      userId,
      tenantId,
      dossierId,
    });

    sessionId = result1.sessionId;

    console.log(`✅ Session créée: ${sessionId}`);
    console.log(`   Réponse: ${result1.response.content.substring(0, 150)}...`);
    console.log(`   Model: ${result1.response.model}`);
    console.log(`   Confidence: ${(result1.response.confidence * 100).toFixed(1)}%`);
    console.log(`   RAG docs utilisés: ${result1.response.ragDocuments.length}`);
    console.log(`   Citations: ${result1.response.citations.length}\n`);

    // ===========================================
    // TEST 2: Vérifier RAG retrieval
    // ===========================================
    console.log('🔍 TEST 2: Vérifier documents RAG...');

    const ragDocs = result1.response.ragDocuments;

    console.log(`✅ Documents RAG: ${ragDocs.length}`);
    ragDocs.forEach((doc, idx) => {
      console.log(
        `   ${idx + 1}. ${doc.title} (${doc.source}) - Score: ${(doc.relevanceScore * 100).toFixed(0)}%`
      );
    });
    console.log('');

    // ===========================================
    // TEST 3: Vérifier citations
    // ===========================================
    console.log('📚 TEST 3: Vérifier citations...');

    const citations = result1.response.citations;

    console.log(`✅ Citations trouvées: ${citations.length}`);
    citations.forEach((cit, idx) => {
      console.log(`   ${idx + 1}. ${cit.text} (${cit.source})`);
    });
    console.log('');

    // ===========================================
    // TEST 4: Vérifier EventLog AI_QUERY_SUBMITTED
    // ===========================================
    console.log('🔐 TEST 4: Vérifier EventLog AI_QUERY_SUBMITTED...');

    const queryEvents = await prisma.eventLog.findMany({
      where: {
        tenantId,
        eventType: 'AI_QUERY_SUBMITTED',
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`✅ Events AI_QUERY_SUBMITTED: ${queryEvents.length}`);
    if (queryEvents.length > 0) {
      const evt = queryEvents[0];
      const meta = evt.metadata as any;
      console.log(`   Query: ${meta.query}`);
      console.log(`   SessionId: ${meta.sessionId}`);
      console.log(`   DossierId: ${meta.dossierId}\n`);
    }

    // ===========================================
    // TEST 5: Vérifier EventLog AI_RESPONSE_GENERATED
    // ===========================================
    console.log('🔐 TEST 5: Vérifier EventLog AI_RESPONSE_GENERATED...');

    const responseEvents = await prisma.eventLog.findMany({
      where: {
        tenantId,
        eventType: 'AI_RESPONSE_GENERATED',
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`✅ Events AI_RESPONSE_GENERATED: ${responseEvents.length}`);
    if (responseEvents.length > 0) {
      const evt = responseEvents[0];
      const meta = evt.metadata as any;
      console.log(`   Model: ${meta.model}`);
      console.log(`   Tokens: ${meta.tokensUsed}`);
      console.log(`   Response length: ${meta.responseLength} chars`);
      console.log(`   RAG docs: ${meta.ragDocumentsUsed}`);
      console.log(`   Citations: ${meta.citationsCount}\n`);
    }

    // ===========================================
    // TEST 6: Requête multi-turn (même session)
    // ===========================================
    console.log('💬 TEST 6: Requête multi-turn...');

    const query2 = 'Quels sont les délais de recours ?';

    const result2 = await aiAssistant.submitQuery({
      query: query2,
      userId,
      tenantId,
      sessionId, // Même session
      dossierId,
    });

    console.log(`✅ Session ID identique: ${result2.sessionId === sessionId}`);
    console.log(`   Réponse: ${result2.response.content.substring(0, 150)}...\n`);

    // ===========================================
    // TEST 7: Vérifier ChatSession en DB
    // ===========================================
    console.log('🗄️ TEST 7: Vérifier ChatSession en DB...');

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    console.log(`✅ Session trouvée: ${session?.id}`);
    console.log(`   Title: ${session?.title}`);
    console.log(`   Messages: ${session?.messages.length}`);
    console.log(`   User messages: ${session?.messages.filter((m) => m.role === 'user').length}`);
    console.log(`   Assistant messages: ${session?.messages.filter((m) => m.role === 'assistant').length}\n`);

    // ===========================================
    // TEST 8: getSession()
    // ===========================================
    console.log('📖 TEST 8: getSession()...');

    const sessionData = await aiAssistant.getSession(sessionId);

    console.log(`✅ Session récupérée: ${sessionData?.session.id}`);
    console.log(`   Messages count: ${sessionData?.messages.length}\n`);

    // ===========================================
    // TEST 9: listUserSessions()
    // ===========================================
    console.log('📋 TEST 9: listUserSessions()...');

    const sessions = await aiAssistant.listUserSessions({ userId, tenantId });

    console.log(`✅ Sessions utilisateur: ${sessions.length}`);
    sessions.forEach((s, idx) => {
      console.log(`   ${idx + 1}. ${s.title} - ${s.messages.length} msg`);
    });
    console.log('');

    // ===========================================
    // TEST 10: endSession()
    // ===========================================
    console.log('🔚 TEST 10: endSession()...');

    await aiAssistant.endSession({ sessionId, userId, tenantId });

    const endedSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    console.log(`✅ Session terminée: ${endedSession?.endedAt !== null}`);
    console.log(`   EndedAt: ${endedSession?.endedAt?.toISOString()}\n`);

    // ===========================================
    // TEST 11: Vérifier EventLog AI_SESSION_ENDED
    // ===========================================
    console.log('🔐 TEST 11: Vérifier EventLog AI_SESSION_ENDED...');

    const sessionEndEvents = await prisma.eventLog.findMany({
      where: {
        tenantId,
        eventType: 'AI_SESSION_ENDED',
      },
    });

    console.log(`✅ Events AI_SESSION_ENDED: ${sessionEndEvents.length}\n`);

    // ===========================================
    // VALIDATIONS
    // ===========================================
    console.log('🧪 VALIDATIONS...\n');

    const validations = [
      { test: 'Session créée', pass: !!sessionId },
      { test: 'Réponse IA générée', pass: result1.response.content.length > 100 },
      { test: 'Model défini', pass: !!result1.response.model },
      { test: 'Confidence score valide', pass: result1.response.confidence > 0 && result1.response.confidence <= 1 },
      { test: 'RAG documents récupérés (≥2)', pass: ragDocs.length >= 2 },
      { test: 'Citations extraites (≥1)', pass: citations.length >= 1 },
      { test: 'EventLog AI_QUERY_SUBMITTED créé', pass: queryEvents.length >= 2 }, // 2 queries
      { test: 'EventLog AI_RESPONSE_GENERATED créé', pass: responseEvents.length >= 2 },
      { test: 'Multi-turn conversation (même session)', pass: result2.sessionId === sessionId },
      { test: 'ChatMessage en DB (≥4)', pass: (session?.messages.length || 0) >= 4 }, // 2 users + 2 assistants
      { test: 'Session title auto-générée', pass: !!session?.title },
      { test: 'Session terminée', pass: endedSession?.endedAt !== null },
      { test: 'EventLog AI_SESSION_ENDED créé', pass: sessionEndEvents.length >= 1 },
    ];

    validations.forEach((v) => {
      console.log(`${v.pass ? '✅' : '❌'} ${v.test}`);
    });

    const passedCount = validations.filter((v) => v.pass).length;
    console.log(`\n📊 Résultat: ${passedCount}/${validations.length} validations passées\n`);

    if (passedCount === validations.length) {
      console.log('🎉 AI LEGAL ASSISTANT VALIDÉ - Tous les tests passent !');
    } else {
      console.log('❌ ÉCHEC - Certains tests ont échoué');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur test:', error);
    throw error;
  } finally {
    // Cleanup (partiel - garder EventLog)
    console.log('\n🧹 Cleanup (partiel - EventLog conservés)...');

    if (sessionId) {
      await prisma.chatMessage.deleteMany({ where: { sessionId } });
      await prisma.chatSession.delete({ where: { id: sessionId } });
    }

    if (dossierId) {
      await prisma.document.deleteMany({ where: { dossierId } });
      await prisma.dossier.delete({ where: { id: dossierId } });
    }

    if (userId) {
      await prisma.user.delete({ where: { id: userId } });
    }

    if (tenantId) {
      await prisma.client.deleteMany({ where: { tenantId } });
      await prisma.tenant.delete({ where: { id: tenantId } });
    }

    console.log('✅ Cleanup terminé\n');

    await prisma.$disconnect();
  }
}

testAIAssistant().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
