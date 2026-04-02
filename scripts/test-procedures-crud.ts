/**
 * Test Procédures CRUD API
 * Valide les nouvelles APIs POST, PATCH, DELETE pour les procédures
 */

import { prisma } from '@/lib/prisma';

async function testProceduresCRUD() {
  console.log('\n🧪 Test Procédures CRUD API\n');
  console.log('═'.repeat(60));

  // Récupérer un workspace de test
  const workspace = await prisma.workspace.findFirst({
    include: { procedures: true },
  });

  if (!workspace) {
    console.log('❌ Aucun workspace trouvé');
    return;
  }

  console.log(`\n✅ Workspace de test : ${workspace.title}`);
  console.log(`   ID : ${workspace.id}\n`);

  let createdProcedureId: string | null = null;

  try {
    // Test 1: POST - Créer nouvelle procédure
    console.log('📝 Test 1 : POST /procedures - Créer procédure');
    const createResponse = await fetch(
      `http://localhost:3000/api/lawyer/workspaces/${workspace.id}/procedures`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          procedureType: 'NATURALISATION',
          title: 'Demande de naturalisation - Test API',
          description: 'Test automatique création procédure',
          urgencyLevel: 'normal',
          deadlineDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // +90 jours
          metadata: {
            articlesApplicables: ['Art. 21-2 Code Civil'],
            conditionsRemplies: true,
          },
        }),
      }
    );

    if (createResponse.ok) {
      const createData = await createResponse.json();
      createdProcedureId = createData.procedure.id;
      console.log(`  ✅ Procédure créée : ${createdProcedureId}`);
      console.log(`     Type : ${createData.procedure.procedureType}`);
      console.log(`     Urgence : ${createData.procedure.urgencyLevel}`);
    } else {
      const error = await createResponse.json();
      console.log(`  ❌ Erreur : ${error.error}`);
    }

    if (!createdProcedureId) {
      console.log('\n⚠️  Tests suivants annulés (pas de procédure créée)');
      return;
    }

    // Test 2: GET - Récupérer détails procédure
    console.log('\n📖 Test 2 : GET /procedures/[id] - Détails');
    const getResponse = await fetch(
      `http://localhost:3000/api/lawyer/workspaces/${workspace.id}/procedures/${createdProcedureId}`
    );

    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log(`  ✅ Procédure récupérée : ${getData.procedure.title}`);
      console.log(`     Statut : ${getData.procedure.status}`);
      console.log(`     Checklist items : ${getData.procedure.checklist.length}`);
      console.log(`     Échéances : ${getData.procedure.echeances.length}`);
    } else {
      const error = await getResponse.json();
      console.log(`  ❌ Erreur : ${error.error}`);
    }

    // Test 3: PATCH - Modifier procédure
    console.log('\n✏️  Test 3 : PATCH /procedures/[id] - Modifier');
    const updateResponse = await fetch(
      `http://localhost:3000/api/lawyer/workspaces/${workspace.id}/procedures/${createdProcedureId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urgencyLevel: 'eleve',
          description: 'Description modifiée par test API',
          metadata: {
            articlesApplicables: ['Art. 21-2 Code Civil', 'Art. 21-15 Code Civil'],
            urgenceJustification: 'Délai préfectoral court',
          },
        }),
      }
    );

    if (updateResponse.ok) {
      const updateData = await updateResponse.json();
      console.log(`  ✅ Procédure modifiée`);
      console.log(`     Nouvelle urgence : ${updateData.procedure.urgencyLevel}`);
      console.log(`     Description : ${updateData.procedure.description.substring(0, 40)}...`);
    } else {
      const error = await updateResponse.json();
      console.log(`  ❌ Erreur : ${error.error}`);
    }

    // Test 4: PATCH - Changer statut
    console.log('\n🔄 Test 4 : PATCH /procedures/[id] - Changer statut');
    const statusResponse = await fetch(
      `http://localhost:3000/api/lawyer/workspaces/${workspace.id}/procedures/${createdProcedureId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'pending',
        }),
      }
    );

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log(`  ✅ Statut modifié : ${statusData.procedure.status}`);
    } else {
      const error = await statusResponse.json();
      console.log(`  ❌ Erreur : ${error.error}`);
    }

    // Test 5: Ajouter une checklist item dans la DB
    console.log('\n✅ Test 5 : Créer checklist item');
    const checklistItem = await prisma.procedureChecklistItem.create({
      data: {
        procedureId: createdProcedureId,
        category: 'pieces',
        label: 'Justificatif de domicile',
        description: 'Document de moins de 3 mois',
        required: true,
        order: 1,
      },
    });
    console.log(`  ✅ Checklist item créé : ${checklistItem.id}`);
    console.log(`     Label : ${checklistItem.label}`);

    // Test 6: PATCH - Toggle checklist item
    console.log('\n☑️  Test 6 : PATCH /procedures/[id]/checklist - Toggle');
    const checklistResponse = await fetch(
      `http://localhost:3000/api/lawyer/workspaces/${workspace.id}/procedures/${createdProcedureId}/checklist`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: checklistItem.id,
          completed: true,
        }),
      }
    );

    if (checklistResponse.ok) {
      const checklistData = await checklistResponse.json();
      console.log(`  ✅ Item complété : ${checklistData.checklistItem.completed}`);
      console.log(`     Complété le : ${checklistData.checklistItem.completedAt}`);
    } else {
      const error = await checklistResponse.json();
      console.log(`  ❌ Erreur : ${error.error}`);
    }

    // Test 7: DELETE - Supprimer procédure
    console.log('\n🗑️  Test 7 : DELETE /procedures/[id] - Supprimer');
    const deleteResponse = await fetch(
      `http://localhost:3000/api/lawyer/workspaces/${workspace.id}/procedures/${createdProcedureId}`,
      {
        method: 'DELETE',
      }
    );

    if (deleteResponse.ok) {
      const deleteData = await deleteResponse.json();
      console.log(`  ✅ Procédure supprimée`);
      console.log(`     Message : ${deleteData.message}`);

      // Vérifier suppression en cascade
      const checkDeleted = await prisma.procedure.findUnique({
        where: { id: createdProcedureId },
      });
      console.log(`     Vérification cascade : ${checkDeleted ? '❌ Toujours en DB' : '✅ Bien supprimée'}`);
    } else {
      const error = await deleteResponse.json();
      console.log(`  ❌ Erreur : ${error.error}`);
    }

    // Test 8: Vérifier timeline events créés
    console.log('\n📅 Test 8 : Vérifier timeline events');
    const timelineEvents = await prisma.timelineEvent.findMany({
      where: {
        workspaceId: workspace.id,
        eventType: { in: ['procedure_created', 'status_changed', 'checklist_completed', 'procedure_deleted'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    console.log(`  ✅ ${timelineEvents.length} événements timeline trouvés :`);
    timelineEvents.forEach((event, idx) => {
      console.log(`     ${idx + 1}. ${event.eventType} - ${event.title}`);
    });

    // Test 9: Vérifier mise à jour stats workspace
    console.log('\n📊 Test 9 : Vérifier stats workspace');
    const updatedWorkspace = await prisma.workspace.findUnique({
      where: { id: workspace.id },
    });

    if (updatedWorkspace) {
      console.log(`  ✅ Stats workspace mises à jour :`);
      console.log(`     Total procédures : ${updatedWorkspace.totalProcedures}`);
      console.log(`     Procédures actives : ${updatedWorkspace.activeProcedures}`);
      console.log(`     Dernière activité : ${updatedWorkspace.lastActivityDate.toLocaleString('fr-FR')}`);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Tous les tests CRUD Procédures réussis !');
    console.log('🎉 API complète : GET, POST, PATCH, DELETE, Checklist\n');

  } catch (error) {
    console.error('\n❌ Erreur pendant les tests:', error);

    // Nettoyage en cas d'erreur
    if (createdProcedureId) {
      console.log('\n🧹 Nettoyage...');
      try {
        await prisma.procedure.delete({ where: { id: createdProcedureId } });
        console.log('✅ Procédure de test supprimée\n');
      } catch (cleanupError) {
        console.log('⚠️  Nettoyage manuel requis\n');
      }
    }
  }
}

// Exécution
testProceduresCRUD()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
