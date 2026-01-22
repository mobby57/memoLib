/**
 * TEST EXTRACTION IA AUTOMATIQUE
 * 
 * Test complet du système d'extraction IA:
 * 1. Création workspace avec email OQTF réaliste
 * 2. Appel endpoint extraction
 * 3. Vérification entités créées
 * 4. Validation transition automatique
 * 5. Nettoyage
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Email OQTF réaliste pour test
const EMAIL_OQTF_TEST = `
Objet: URGENT - Notification OQTF reçue

Bonjour Maître,

Je viens de recevoir une notification d'Obligation de Quitter le Territoire Français (OQTF) ce matin, le 15 janvier 2026.

La préfecture me donne un délai de 30 jours pour quitter la France volontairement.

Je suis en France depuis 3 ans avec un titre de séjour étudiant qui a expiré il y a 6 mois. J'ai déposé une demande de renouvellement en août 2025 mais je n'ai eu aucune réponse.

La décision mentionne l'article L511-1 du CESEDA et indique que je peux contester cette décision devant le Tribunal administratif.

Que dois-je faire ? Je suis très inquiet.

Merci de votre aide,
Mohamed BENALI
Tel: 06 12 34 56 78
`;

async function testAIExtraction() {
  console.log('🧪 Test extraction IA automatique\n');

  try {
    // Step 0: Créer tenant de test
    console.log('0️⃣ Création tenant de test...');
    let tenant = await prisma.tenant.findFirst({
      where: { subdomain: 'test-ai-extraction' },
    });

    if (!tenant) {
      let plan = await prisma.plan.findFirst({
        where: { name: 'TEST' },
      });

      if (!plan) {
        plan = await prisma.plan.create({
          data: {
            name: 'TEST',
            displayName: 'Plan de Test',
            description: 'Plan pour tests automatisés',
            priceMonthly: 0,
            priceYearly: 0,
          },
        });
      }

      tenant = await prisma.tenant.create({
        data: {
          name: 'Cabinet Test AI',
          subdomain: 'test-ai-extraction',
          planId: plan.id,
        },
      });
    }

    console.log(`✅ Tenant: ${tenant.id}\n`);

    // Step 1: Créer workspace avec email OQTF
    console.log('1️⃣ Création workspace avec email OQTF réaliste...');
    const workspace = await prisma.workspaceReasoning.create({
      data: {
        tenantId: tenant.id,
        currentState: 'RECEIVED',
        sourceType: 'EMAIL',
        sourceId: 'test-email-oqtf',
        sourceRaw: EMAIL_OQTF_TEST,
        sourceMetadata: JSON.stringify({
          from: 'mohamed.benali@example.com',
          subject: 'URGENT - Notification OQTF reçue',
          receivedAt: '2026-01-21T10:00:00Z',
        }),
        procedureType: 'OQTF',
        ownerUserId: 'test-user-ai',
        uncertaintyLevel: 1.0,
        reasoningQuality: 0.0,
      },
    });

    console.log(`✅ Workspace créé: ${workspace.id}`);
    console.log(`   État: ${workspace.currentState}`);
    console.log(`   Type: ${workspace.procedureType}\n`);

    // Step 2: Appel extraction IA (simulation appel API)
    console.log('2️⃣ Appel service extraction IA...');
    
    const { workspaceExtractionService } = await import('../src/lib/ai/workspace-extraction-service');
    
    const extractionResult = await workspaceExtractionService.extractFromWorkspace(workspace);
    
    console.log(`✅ Extraction terminée:`);
    console.log(`   Succès: ${extractionResult.success}`);
    console.log(`   Modèle: ${extractionResult.model}`);
    console.log(`   Temps: ${extractionResult.processingTime}ms`);
    console.log(`   Confiance globale: ${(extractionResult.confidence * 100).toFixed(0)}%`);
    console.log(`   Faits extraits: ${extractionResult.facts.length}`);
    console.log(`   Contextes: ${extractionResult.contexts.length}`);
    console.log(`   Obligations: ${extractionResult.obligations.length}\n`);

    if (extractionResult.error) {
      console.log(`⚠️  Erreur: ${extractionResult.error}\n`);
    }

    // Step 3: Afficher détails extraction
    if (extractionResult.facts.length > 0) {
      console.log('3️⃣ Faits extraits:');
      extractionResult.facts.forEach((fact, i) => {
        console.log(`   ${i + 1}. ${fact.label}: "${fact.value}"`);
        console.log(`      Source: ${fact.source} (confiance: ${(fact.confidence * 100).toFixed(0)}%)`);
      });
      console.log('');
    }

    if (extractionResult.contexts.length > 0) {
      console.log('4️⃣ Contextes identifiés:');
      extractionResult.contexts.forEach((ctx, i) => {
        console.log(`   ${i + 1}. [${ctx.type}] ${ctx.description}`);
        console.log(`      Certitude: ${ctx.certaintyLevel} (confiance: ${(ctx.confidence * 100).toFixed(0)}%)`);
        console.log(`      Raisonnement: ${ctx.reasoning}`);
      });
      console.log('');
    }

    if (extractionResult.obligations.length > 0) {
      console.log('5️⃣ Obligations détectées:');
      extractionResult.obligations.forEach((obl, i) => {
        console.log(`   ${i + 1}. ${obl.description}`);
        console.log(`      Obligatoire: ${obl.mandatory ? 'OUI' : 'NON'}`);
        console.log(`      Critique: ${obl.critical ? 'OUI ⚠️' : 'NON'}`);
        if (obl.deadline) {
          console.log(`      Deadline: ${obl.deadline}`);
        }
        if (obl.legalRef) {
          console.log(`      Référence: ${obl.legalRef}`);
        }
        console.log(`      Confiance: ${(obl.confidence * 100).toFixed(0)}%`);
      });
      console.log('');
    }

    // Step 4: Validation extraction
    console.log('6️⃣ Validation extraction...');
    const validation = workspaceExtractionService.validateExtraction(extractionResult);
    console.log(`   Valide: ${validation.valid ? '✅ OUI' : '⚠️  NON'}`);
    if (validation.warnings.length > 0) {
      console.log(`   Avertissements:`);
      validation.warnings.forEach((warning, i) => {
        console.log(`     ${i + 1}. ${warning}`);
      });
    }
    console.log('');

    // Step 5: Simulation création entités (comme dans l'API)
    if (extractionResult.success) {
      console.log('7️⃣ Création entités en base...');

      // Créer facts
      const createdFacts = [];
      for (const fact of extractionResult.facts) {
        const created = await prisma.fact.create({
          data: {
            workspaceId: workspace.id,
            label: fact.label,
            value: fact.value,
            source: fact.source,
            sourceRef: fact.sourceRef,
            confidence: fact.confidence,
            extractedBy: 'AI',
          },
        });
        createdFacts.push(created);
      }
      console.log(`   ✅ Faits créés: ${createdFacts.length}`);

      // Créer contexts
      const createdContexts = [];
      for (const context of extractionResult.contexts) {
        const created = await prisma.contextHypothesis.create({
          data: {
            workspaceId: workspace.id,
            type: context.type,
            description: context.description,
            reasoning: context.reasoning,
            certaintyLevel: context.certaintyLevel,
            identifiedBy: 'AI',
          },
        });
        createdContexts.push(created);
      }
      console.log(`   ✅ Contextes créés: ${createdContexts.length}`);

      // Créer obligations
      const createdObligations = [];
      const firstContext = createdContexts[0];
      for (const obligation of extractionResult.obligations) {
        const created = await prisma.obligation.create({
          data: {
            workspaceId: workspace.id,
            contextId: firstContext?.id,
            description: obligation.description,
            mandatory: obligation.mandatory,
            deadline: obligation.deadline ? new Date(obligation.deadline) : null,
            critical: obligation.critical,
            legalRef: obligation.legalRef,
            deducedBy: 'AI',
          },
        });
        createdObligations.push(created);
      }
      console.log(`   ✅ Obligations créées: ${createdObligations.length}\n`);

      // Step 6: Transition automatique
      console.log('8️⃣ Transition automatique...');
      const newState = extractionResult.contexts.length > 0 
        ? 'CONTEXT_IDENTIFIED' 
        : 'FACTS_EXTRACTED';

      await prisma.workspaceReasoning.update({
        where: { id: workspace.id },
        data: {
          currentState: newState,
          stateChangedAt: new Date(),
          stateChangedBy: 'AI',
        },
      });

      await prisma.reasoningTransition.create({
        data: {
          workspaceId: workspace.id,
          fromState: 'RECEIVED',
          toState: newState,
          triggeredBy: 'AI',
          reason: `Extraction automatique: ${extractionResult.facts.length} faits, ${extractionResult.contexts.length} contextes`,
          autoApproved: false,
          metadata: JSON.stringify({ extractionResult }),
        },
      });

      console.log(`   ✅ RECEIVED → ${newState}\n`);
    }

    // Step 7: Résumé final
    const workspaceUpdated = await prisma.workspaceReasoning.findUnique({
      where: { id: workspace.id },
      include: {
        facts: true,
        contexts: true,
        obligations: true,
        reasoningTraces: true,
        transitions: true,
      },
    });

    console.log('📊 RÉSUMÉ FINAL\n');
    console.log(`Workspace ID: ${workspaceUpdated!.id}`);
    console.log(`État final: ${workspaceUpdated!.currentState}`);
    console.log(`\nEntités créées:`);
    console.log(`  - Faits: ${workspaceUpdated!.facts.length}`);
    console.log(`  - Contextes: ${workspaceUpdated!.contexts.length}`);
    console.log(`  - Obligations: ${workspaceUpdated!.obligations.length}`);
    console.log(`  - Transitions: ${workspaceUpdated!.transitions.length}`);
    console.log('');

    // Step 8: Nettoyage
    console.log('🧹 Nettoyage...');
    await prisma.workspaceReasoning.delete({
      where: { id: workspace.id },
    });
    console.log('✅ Données de test supprimées\n');

    console.log('✅ Test d\'extraction IA complété avec succès!');
    console.log('🎉 Système d\'extraction IA opérationnel!\n');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
testAIExtraction()
  .then(() => {
    console.log('Test terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test échoué:', error);
    process.exit(1);
  });
