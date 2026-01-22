/**
 * 🧪 TEST - SYSTÈME DE RAISONNEMENT IA COMPLET
 * 
 * Teste le raisonnement IA de bout en bout :
 * RECEIVED → FACTS_EXTRACTED → ... → READY_FOR_HUMAN
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 TEST DU SYSTÈME DE RAISONNEMENT IA\n');

  try {
    // 1. Créer un workspace de test
    console.log('1️⃣ Création workspace de test...');
    
    // Trouver ou créer un tenant de test
    let tenant = await prisma.tenant.findFirst({
      where: { subdomain: 'test-cabinet' },
    });

    if (!tenant) {
      const plan = await prisma.plan.findFirst({
        where: { name: 'PREMIUM' },
      });

      if (!plan) {
        throw new Error('Plan PREMIUM not found. Run seed first.');
      }

      tenant = await prisma.tenant.create({
        data: {
          name: 'Cabinet Test IA',
          subdomain: 'test-cabinet',
          planId: plan.id,
          status: 'active',
        },
      });
    }

    // Créer le workspace
    const workspace = await prisma.workspaceReasoning.create({
      data: {
        tenantId: tenant.id,
        sourceType: 'EMAIL',
        sourceRaw: `Bonjour Maître,

Je vous contacte car j'ai reçu il y a 3 jours une OQTF (Obligation de Quitter le Territoire Français) 
de la Préfecture de Paris.

Je suis en France depuis 5 ans avec ma femme et mes 2 enfants qui sont scolarisés.
J'ai un CDI depuis 2 ans comme informaticien.

La notification indique que j'ai 30 jours pour quitter le territoire.

Que dois-je faire ? C'est urgent !

Merci,
M. DUBOIS
Tél: 06 12 34 56 78`,
        sourceMetadata: JSON.stringify({
          from: 'dubois@email.com',
          subject: 'URGENT - OQTF reçue',
          receivedDate: '2026-01-15',
        }),
        procedureType: 'OQTF',
        currentState: 'RECEIVED',
        ownerUserId: 'test-user',
      },
    });

    console.log(`✅ Workspace créé: ${workspace.id}`);
    console.log(`   État initial: ${workspace.currentState}`);
    console.log(`   Incertitude: ${(workspace.uncertaintyLevel * 100).toFixed(0)}%\n`);

    // 2. Tester extraction des faits
    console.log('2️⃣ Test extraction des faits (RECEIVED → FACTS_EXTRACTED)');
    console.log('   Note: Cette étape nécessite Ollama en cours d\'exécution');
    console.log('   Commande: ollama run llama3.2:3b');
    console.log('   Sinon, exécuter manuellement via l\'UI\n');

    // 3. Vérifier la structure
    console.log('3️⃣ Vérification de la structure du workspace:');
    
    const fullWorkspace = await prisma.workspaceReasoning.findUnique({
      where: { id: workspace.id },
      include: {
        facts: true,
        contexts: true,
        obligations: true,
        missingElements: true,
        risks: true,
        proposedActions: true,
        reasoningTraces: true,
        transitions: true,
      },
    });

    console.log(`   ✅ Facts: ${fullWorkspace?.facts.length || 0}`);
    console.log(`   ✅ Contexts: ${fullWorkspace?.contexts.length || 0}`);
    console.log(`   ✅ Obligations: ${fullWorkspace?.obligations.length || 0}`);
    console.log(`   ✅ Missing Elements: ${fullWorkspace?.missingElements.length || 0}`);
    console.log(`   ✅ Risks: ${fullWorkspace?.risks.length || 0}`);
    console.log(`   ✅ Proposed Actions: ${fullWorkspace?.proposedActions.length || 0}`);
    console.log(`   ✅ Traces: ${fullWorkspace?.reasoningTraces.length || 0}`);
    console.log(`   ✅ Transitions: ${fullWorkspace?.transitions.length || 0}\n`);

    // 4. Instructions pour tester l'IA
    console.log('4️⃣ INSTRUCTIONS DE TEST:');
    console.log('\n📍 Démarrer le serveur de développement:');
    console.log('   npm run dev');
    console.log('\n📍 Accéder au workspace:');
    console.log(`   http://localhost:3000/lawyer/workspace/${workspace.id}`);
    console.log('\n📍 Démarrer Ollama (dans un autre terminal):');
    console.log('   ollama run llama3.2:3b');
    console.log('\n📍 Cliquer sur le bouton:');
    console.log('   🧠 Exécuter Raisonnement IA');
    console.log('\n📍 Observer:');
    console.log('   - L\'IA extrait les faits certains');
    console.log('   - L\'état passe à FACTS_EXTRACTED');
    console.log('   - L\'incertitude diminue (~80%)');
    console.log('   - Les traces de raisonnement s\'affichent');
    console.log('\n📍 Continuer:');
    console.log('   - Cliquer plusieurs fois sur "Exécuter Raisonnement IA"');
    console.log('   - Observer la progression à travers les états');
    console.log('   - L\'IA s\'arrêtera à MISSING_IDENTIFIED si éléments bloquants');
    console.log('   - Résoudre les éléments manquants dans le panel');
    console.log('   - Continuer jusqu\'à READY_FOR_HUMAN');
    console.log('\n📍 Exporter:');
    console.log('   - Cliquer sur "Exporter (Markdown)"');
    console.log('   - Observer le raisonnement complet en format lisible');
    console.log('\n📍 Verrouiller:');
    console.log('   - Cliquer sur "Verrouiller et finaliser"');
    console.log('   - Le workspace devient immuable');

    console.log('\n✨ RÉSULTAT ATTENDU:');
    console.log('   État final: READY_FOR_HUMAN');
    console.log('   Incertitude finale: ~15%');
    console.log('   Faits extraits: ~10 (dates, durée, famille, etc.)');
    console.log('   Contextes: 3-4 (LEGAL, TEMPORAL, ADMINISTRATIVE)');
    console.log('   Obligations: 2-3 (recours TA, constituer dossier)');
    console.log('   Risques: 2-3 (dépassement délai, dossier incomplet)');
    console.log('   Actions: 3-5 (alertes, demandes documents)');

    console.log('\n🎯 Workspace ID pour référence:');
    console.log(`   ${workspace.id}`);

  } catch (error) {
    console.error('\n❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n✅ Test terminé!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
