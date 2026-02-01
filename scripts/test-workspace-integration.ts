/**
 * Script de test d'intégration complète du Workspace Reasoning
 * Teste le flux complet : Création → Transitions → Validation finale
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWorkspaceIntegration() {
  console.log('🧪 Test d\'intégration complet du Workspace Reasoning\n');
  
  try {
    // ============================================
    // ÉTAPE 0 : Créer un tenant de test (foreign key)
    // ============================================
    console.log('0️⃣ Création du tenant de test...');
    
    // Vérifier si le tenant existe déjà
    let tenant = await prisma.tenant.findFirst({
      where: { subdomain: 'test-integration' }
    });
    
    if (!tenant) {
      // Créer un plan de test si nécessaire
      let plan = await prisma.plan.findFirst({
        where: { name: 'TEST' }
      });
      
      if (!plan) {
        plan = await prisma.plan.create({
          data: {
            name: 'TEST',
            displayName: 'Plan de Test',
            priceMonthly: 0,
            priceYearly: 0,
            maxWorkspaces: 100,
            maxDossiers: 1000,
            maxClients: 1000,
            maxStorageGb: 10,
            maxUsers: 10,
          }
        });
        console.log(`   → Plan de test créé: ${plan.id}`);
      }
      
      tenant = await prisma.tenant.create({
        data: {
          name: 'Cabinet de Test',
          subdomain: 'test-integration',
          planId: plan.id,
          status: 'active',
        }
      });
      console.log(`✅ Tenant créé: ${tenant.id}`);
    } else {
      console.log(`✅ Tenant existant: ${tenant.id}`);
    }
    
    // ============================================
    // ÉTAPE 1 : Créer un workspace de test
    // ============================================
    console.log('\n1️⃣ Création du workspace...');
    
    const workspace = await prisma.workspaceReasoning.create({
      data: {
        tenantId: tenant.id,
        currentState: 'RECEIVED',
        stateChangedAt: new Date(),
        stateChangedBy: 'TEST_USER',
        
        sourceType: 'EMAIL',
        sourceId: 'test-email-123',
        sourceRaw: `Objet: OQTF - Madame TEST

Je viens de recevoir une OQTF. Pouvez-vous m'aider ?

Cordialement,
Madame TEST`,
        sourceMetadata: JSON.stringify({
          from: 'test@example.com',
          subject: 'OQTF - Madame TEST',
          receivedAt: new Date().toISOString(),
        }),
        
        procedureType: 'OQTF',
        ownerUserId: 'test-user',
        
        uncertaintyLevel: 1.0,
        reasoningQuality: 0.0,
        confidenceScore: 0.0,
        locked: false,
      },
      include: {
        facts: true,
        contexts: true,
        obligations: true,
        missingElements: true,
        risks: true,
        proposedActions: true,
        reasoningTraces: true,
        transitions: true,
      }
    });
    
    console.log(`✅ Workspace créé: ${workspace.id}`);
    console.log(`   État initial: ${workspace.currentState}`);
    console.log(`   Incertitude: ${workspace.uncertaintyLevel}`);
    
    // ============================================
    // ÉTAPE 2 : Ajouter des faits
    // ============================================
    console.log('\n2️⃣ Ajout de faits...');
    
    const fact1 = await prisma.fact.create({
      data: {
        workspaceId: workspace.id,
        label: 'Date notification OQTF',
        value: '20 janvier 2026',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Email',
        confidence: 1.0,
        extractedBy: 'AI',
      }
    });
    
    const fact2 = await prisma.fact.create({
      data: {
        workspaceId: workspace.id,
        label: 'Délai de départ',
        value: '30 jours',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Email',
        confidence: 1.0,
        extractedBy: 'AI',
      }
    });
    
    console.log(`✅ Faits créés: ${fact1.label}, ${fact2.label}`);
    
    // Créer trace pour les faits
    await prisma.reasoningTrace.create({
      data: {
        workspaceId: workspace.id,
        step: 'FACTS_EXTRACTED',
        explanation: 'Extraction de 2 faits du message source',
        metadata: JSON.stringify({ factIds: [fact1.id, fact2.id] }),
        createdBy: 'AI',
      }
    });
    
    // ============================================
    // ÉTAPE 3 : Transition vers FACTS_EXTRACTED
    // ============================================
    console.log('\n3️⃣ Transition RECEIVED → FACTS_EXTRACTED...');
    
    await prisma.workspaceReasoning.update({
      where: { id: workspace.id },
      data: {
        currentState: 'FACTS_EXTRACTED',
        stateChangedAt: new Date(),
        stateChangedBy: 'TEST_USER',
        uncertaintyLevel: 0.8,
        reasoningQuality: 0.2,
      }
    });
    
    await prisma.reasoningTransition.create({
      data: {
        workspaceId: workspace.id,
        fromState: 'RECEIVED',
        toState: 'FACTS_EXTRACTED',
        triggeredBy: 'TEST_USER',
        triggeredAt: new Date(),
        reason: 'Test transition',
        stateBefore: JSON.stringify({ currentState: 'RECEIVED', uncertaintyLevel: 1.0 }),
        stateAfter: JSON.stringify({ currentState: 'FACTS_EXTRACTED', uncertaintyLevel: 0.8 }),
      }
    });
    
    console.log('✅ Transition effectuée');
    
    // ============================================
    // ÉTAPE 4 : Ajouter des contextes
    // ============================================
    console.log('\n4️⃣ Ajout de contextes...');
    
    const context = await prisma.contextHypothesis.create({
      data: {
        workspaceId: workspace.id,
        type: 'LEGAL',
        description: 'OQTF avec délai (Art. L511-1 CESEDA)',
        reasoning: 'Délai de 30 jours mentionné',
        certaintyLevel: 'PROBABLE',
        identifiedBy: 'AI',
      }
    });
    
    console.log(`✅ Contexte créé: ${context.description}`);
    
    // ============================================
    // ÉTAPE 5 : Transition vers CONTEXT_IDENTIFIED
    // ============================================
    console.log('\n5️⃣ Transition FACTS_EXTRACTED → CONTEXT_IDENTIFIED...');
    
    await prisma.workspaceReasoning.update({
      where: { id: workspace.id },
      data: {
        currentState: 'CONTEXT_IDENTIFIED',
        stateChangedAt: new Date(),
        uncertaintyLevel: 0.6,
        reasoningQuality: 0.4,
      }
    });
    
    await prisma.reasoningTransition.create({
      data: {
        workspaceId: workspace.id,
        fromState: 'FACTS_EXTRACTED',
        toState: 'CONTEXT_IDENTIFIED',
        triggeredBy: 'TEST_USER',
        triggeredAt: new Date(),
        reason: 'Contexte identifié',
      }
    });
    
    console.log('✅ Transition effectuée');
    
    // ============================================
    // ÉTAPE 6 : Confirmer le contexte
    // ============================================
    console.log('\n6️⃣ Confirmation du contexte...');
    
    await prisma.contextHypothesis.update({
      where: { id: context.id },
      data: { certaintyLevel: 'CONFIRMED' }
    });
    
    await prisma.reasoningTrace.create({
      data: {
        workspaceId: workspace.id,
        step: 'CONTEXT_CONFIRMED',
        explanation: `Contexte confirmé: ${context.description}`,
        metadata: JSON.stringify({ contextId: context.id }),
        createdBy: 'TEST_USER',
      }
    });
    
    console.log('✅ Contexte confirmé');
    
    // ============================================
    // ÉTAPE 7 : Ajouter une obligation
    // ============================================
    console.log('\n7️⃣ Ajout d\'une obligation...');
    
    const obligation = await prisma.obligation.create({
      data: {
        workspaceId: workspace.id,
        contextId: context.id,
        description: 'Déposer un recours contentieux',
        mandatory: true,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
        critical: true,
        legalRef: 'Art. L512-1 CESEDA',
        deducedBy: 'AI',
      }
    });
    
    console.log(`✅ Obligation créée: ${obligation.description}`);
    
    // ============================================
    // ÉTAPE 8 : Transition vers OBLIGATIONS_DEDUCED
    // ============================================
    console.log('\n8️⃣ Transition CONTEXT_IDENTIFIED → OBLIGATIONS_DEDUCED...');
    
    await prisma.workspaceReasoning.update({
      where: { id: workspace.id },
      data: {
        currentState: 'OBLIGATIONS_DEDUCED',
        stateChangedAt: new Date(),
        uncertaintyLevel: 0.5,
        reasoningQuality: 0.5,
      }
    });
    
    console.log('✅ Transition effectuée');
    
    // ============================================
    // ÉTAPE 9 : Ajouter des éléments manquants
    // ============================================
    console.log('\n9️⃣ Ajout d\'éléments manquants...');
    
    const missing1 = await prisma.missingElement.create({
      data: {
        workspaceId: workspace.id,
        type: 'DOCUMENT',
        description: 'Copie intégrale OQTF',
        why: 'Vérifier les motifs exacts',
        blocking: true,
        resolved: false,
        identifiedBy: 'AI',
      }
    });
    
    const missing2 = await prisma.missingElement.create({
      data: {
        workspaceId: workspace.id,
        type: 'INFORMATION',
        description: 'Statut titre de séjour',
        why: 'Stratégie de recours',
        blocking: false,
        resolved: false,
        identifiedBy: 'AI',
      }
    });
    
    console.log(`✅ Éléments manquants créés: 1 bloquant, 1 non-bloquant`);
    
    // ============================================
    // ÉTAPE 10 : Transition vers MISSING_IDENTIFIED
    // ============================================
    console.log('\n🔟 Transition OBLIGATIONS_DEDUCED → MISSING_IDENTIFIED...');
    
    await prisma.workspaceReasoning.update({
      where: { id: workspace.id },
      data: {
        currentState: 'MISSING_IDENTIFIED',
        stateChangedAt: new Date(),
        uncertaintyLevel: 0.7, // Augmente car éléments manquants
        reasoningQuality: 0.6,
      }
    });
    
    console.log('✅ Transition effectuée');
    
    // ============================================
    // ÉTAPE 11 : Résoudre l'élément bloquant
    // ============================================
    console.log('\n1️⃣1️⃣ Résolution de l\'élément bloquant...');
    
    await prisma.missingElement.update({
      where: { id: missing1.id },
      data: {
        resolved: true,
        resolution: 'Document reçu du client',
        resolvedBy: 'TEST_USER',
        resolvedAt: new Date(),
      }
    });
    
    await prisma.reasoningTrace.create({
      data: {
        workspaceId: workspace.id,
        step: 'MISSING_RESOLVED',
        explanation: `Élément bloquant résolu: ${missing1.description}`,
        metadata: JSON.stringify({ missingId: missing1.id, wasBlocking: true }),
        createdBy: 'TEST_USER',
      }
    });
    
    console.log('✅ Élément bloquant résolu');
    
    // ============================================
    // ÉTAPE 12 : Ajouter des risques
    // ============================================
    console.log('\n1️⃣2️⃣ Ajout de risques...');
    
    const risk = await prisma.risk.create({
      data: {
        workspaceId: workspace.id,
        description: 'Expulsion avant recours',
        impact: 'HIGH',
        probability: 'MEDIUM',
        riskScore: 6,
        irreversible: true,
        evaluatedBy: 'AI',
      }
    });
    
    console.log(`✅ Risque créé: score ${risk.riskScore}`);
    
    // ============================================
    // ÉTAPE 13 : Ajouter des actions proposées
    // ============================================
    console.log('\n1️⃣3️⃣ Ajout d\'actions proposées...');
    
    const action = await prisma.proposedAction.create({
      data: {
        workspaceId: workspace.id,
        type: 'DOCUMENT_REQUEST',
        content: 'Demander copie OQTF au client',
        reasoning: 'Document nécessaire pour recours',
        target: 'CLIENT',
        priority: 'CRITICAL',
        executed: false,
        proposedBy: 'AI',
      }
    });
    
    console.log(`✅ Action créée: ${action.content}`);
    
    // ============================================
    // ÉTAPE 14 : Transitions finales
    // ============================================
    console.log('\n1️⃣4️⃣ Transitions vers READY_FOR_HUMAN...');
    
    // RISK_EVALUATED
    await prisma.workspaceReasoning.update({
      where: { id: workspace.id },
      data: {
        currentState: 'RISK_EVALUATED',
        uncertaintyLevel: 0.4,
        reasoningQuality: 0.7,
      }
    });
    console.log('   → RISK_EVALUATED');
    
    // ACTION_PROPOSED
    await prisma.workspaceReasoning.update({
      where: { id: workspace.id },
      data: {
        currentState: 'ACTION_PROPOSED',
        uncertaintyLevel: 0.3,
        reasoningQuality: 0.8,
      }
    });
    console.log('   → ACTION_PROPOSED');
    
    // READY_FOR_HUMAN
    await prisma.workspaceReasoning.update({
      where: { id: workspace.id },
      data: {
        currentState: 'READY_FOR_HUMAN',
        uncertaintyLevel: 0.2,
        reasoningQuality: 0.9,
      }
    });
    console.log('   → READY_FOR_HUMAN');
    
    console.log('✅ Workspace prêt pour validation humaine');
    
    // ============================================
    // ÉTAPE 15 : Validation finale (LOCK)
    // ============================================
    console.log('\n1️⃣5️⃣ Validation finale et verrouillage...');
    
    await prisma.workspaceReasoning.update({
      where: { id: workspace.id },
      data: {
        locked: true,
        validatedBy: 'TEST_USER',
        validatedAt: new Date(),
        validationNote: 'Test de validation complète',
        completedAt: new Date(),
      }
    });
    
    await prisma.reasoningTrace.create({
      data: {
        workspaceId: workspace.id,
        step: 'WORKSPACE_VALIDATED',
        explanation: 'Workspace validé et verrouillé',
        metadata: JSON.stringify({
          validatedBy: 'TEST_USER',
          uncertaintyFinal: 0.2,
          qualityFinal: 0.9,
        }),
        createdBy: 'TEST_USER',
      }
    });
    
    console.log('✅ Workspace verrouillé');
    
    // ============================================
    // RÉSUMÉ FINAL
    // ============================================
    console.log('\n📊 RÉSUMÉ FINAL\n');
    
    const finalWorkspace = await prisma.workspaceReasoning.findUnique({
      where: { id: workspace.id },
      include: {
        facts: true,
        contexts: true,
        obligations: true,
        missingElements: true,
        risks: true,
        proposedActions: true,
        reasoningTraces: { orderBy: { createdAt: 'desc' }, take: 5 },
        transitions: { orderBy: { triggeredAt: 'desc' }, take: 3 },
      }
    });
    
    if (!finalWorkspace) {
      throw new Error('Workspace not found');
    }
    
    console.log(`ID: ${finalWorkspace.id}`);
    console.log(`État: ${finalWorkspace.currentState}`);
    console.log(`Verrouillé: ${finalWorkspace.locked ? 'OUI' : 'NON'}`);
    console.log(`Incertitude finale: ${finalWorkspace.uncertaintyLevel}`);
    console.log(`Qualité finale: ${finalWorkspace.reasoningQuality}`);
    console.log(`\nEntités créées:`);
    console.log(`  - Faits: ${finalWorkspace.facts.length}`);
    console.log(`  - Contextes: ${finalWorkspace.contexts.length}`);
    console.log(`  - Obligations: ${finalWorkspace.obligations.length}`);
    console.log(`  - Éléments manquants: ${finalWorkspace.missingElements.length}`);
    console.log(`  - Risques: ${finalWorkspace.risks.length}`);
    console.log(`  - Actions: ${finalWorkspace.proposedActions.length}`);
    console.log(`  - Traces: ${finalWorkspace.reasoningTraces.length}`);
    console.log(`  - Transitions: ${finalWorkspace.transitions.length}`);
    
    console.log('\n✅ Test d\'intégration complété avec succès!');
    console.log('🎉 Système de raisonnement workspace opérationnel!\n');
    
    // Nettoyer
    console.log('🧹 Nettoyage...');
    await prisma.workspaceReasoning.delete({ where: { id: workspace.id } });
    console.log('✅ Données de test supprimées\n');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testWorkspaceIntegration()
  .then(() => {
    console.log('Test terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test échoué:', error);
    process.exit(1);
  });
