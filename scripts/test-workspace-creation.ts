/**
 * Test Création Workspace Client Unifié
 * 
 * Teste la création complète d'un workspace client avec :
 * - Client
 * - Workspace unique
 * - Procédure juridique
 * - Email
 * - Timeline
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWorkspaceCreation() {
  console.log('\n🧪 Test Création Workspace Client Unifié\n');
  console.log('=========================================\n');

  try {
    // 1. Créer un tenant de test
    console.log('1️⃣ Création tenant test...');
    const tenant = await prisma.tenant.findFirst({
      where: { subdomain: 'cabinet-test' }
    }) || await prisma.tenant.create({
      data: {
        name: 'Cabinet Test',
        subdomain: 'cabinet-test',
        planId: (await prisma.plan.findFirst())!.id,
      },
    });
    console.log(`   ✅ Tenant: ${tenant.name}`);

    // 2. Créer un client
    console.log('\n2️⃣ Création client...');
    const client = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Jean',
        lastName: 'DUPONT',
        email: 'jean.dupont@example.com',
        phone: '06 12 34 56 78',
        address: '123 rue de la Paix',
        codePostal: '75001',
        ville: 'Paris',
        pays: 'France',
        status: 'actif',
        dateOfBirth: new Date('1985-03-15'),
        nationality: 'Française',
        prefCommunication: 'email',
        accepteNotifications: true,
      },
    });
    console.log(`   ✅ Client: ${client.firstName} ${client.lastName} (${client.email})`);

    // 3. Créer workspace unique pour ce client
    console.log('\n3️⃣ Création workspace unifié...');
    const workspace = await prisma.workspace.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        title: `Espace ${client.firstName} ${client.lastName}`,
        description: `Workspace unifié centralisant tous les échanges avec ${client.firstName} ${client.lastName}`,
        reference: `WS-${Date.now()}`,
        status: 'active',
        globalPriority: 'normale',
        firstContactDate: new Date(),
        lastActivityDate: new Date(),
        createdById: 'test-script',
        preferredChannel: 'email',
        notificationsEnabled: true,
        totalProcedures: 0,
        activeProcedures: 0,
        totalEmails: 0,
        totalDocuments: 0,
      },
    });
    console.log(`   ✅ Workspace: ${workspace.title} (Ref: ${workspace.reference})`);

    // 4. Créer une procédure OQTF
    console.log('\n4️⃣ Création procédure OQTF...');
    const procedure = await prisma.procedure.create({
      data: {
        workspaceId: workspace.id,
        procedureType: 'OQTF',
        title: 'OQTF - Recours contentieux',
        description: 'Recours contre OQTF notifiée le 15/01/2026',
        reference: `PROC-OQTF-${Date.now()}`,
        status: 'active',
        urgencyLevel: 'critique',
        notificationDate: new Date('2026-01-15'),
        deadlineDate: new Date('2026-01-30'), // 48h + délais
        startedAt: new Date(),
        metadata: JSON.stringify({
          oqtfType: 'sans_delai',
          juridiction: 'TA Paris',
          modeNotification: 'courrier_recommande',
        }),
      },
    });
    console.log(`   ✅ Procédure: ${procedure.title}`);

    // 5. Créer une checklist pour la procédure
    console.log('\n5️⃣ Création checklist procédure...');
    const checklistItems = [
      { category: 'verifications', label: 'Vérifier notification OQTF', required: true },
      { category: 'pieces', label: 'Rassembler justificatifs', required: true },
      { category: 'pieces', label: 'Passeport client', required: true },
      { category: 'actions', label: 'Rédiger recours contentieux', required: true },
      { category: 'actions', label: 'Déposer au tribunal', required: true },
    ];

    for (const item of checklistItems) {
      await prisma.procedureChecklistItem.create({
        data: {
          procedureId: procedure.id,
          category: item.category,
          label: item.label,
          required: item.required,
          completed: false,
        },
      });
    }
    console.log(`   ✅ Checklist: ${checklistItems.length} items créés`);

    // 6. Ajouter un email au workspace
    console.log('\n6️⃣ Ajout email au workspace...');
    const email = await prisma.workspaceEmail.create({
      data: {
        workspaceId: workspace.id,
        messageId: `msg-${Date.now()}`,
        threadId: `thread-${Date.now()}`,
        from: client.email,
        to: 'cabinet@avocat.com',
        subject: 'Urgent - OQTF reçue',
        bodyText: 'Bonjour, j\'ai reçu une OQTF et j\'ai besoin de votre aide urgente.',
        receivedDate: new Date(),
        direction: 'inbound',
        category: 'urgent',
        priority: 'critical',
        hasAttachments: false,
        aiProcessed: true,
        aiClassified: 'ceseda',
        aiConfidence: 0.95,
        aiSummary: 'Client a reçu OQTF, demande assistance urgente',
        aiActionNeeded: 'Créer procédure OQTF et fixer RDV urgent',
        isRead: false,
        needsResponse: true,
      },
    });
    console.log(`   ✅ Email: "${email.subject}" (priorité: ${email.priority})`);

    // 7. Ajouter un message interne
    console.log('\n7️⃣ Ajout message interne...');
    const message = await prisma.workspaceMessage.create({
      data: {
        workspaceId: workspace.id,
        type: 'internal_note',
        senderId: 'avocat-1',
        senderName: 'Maître MARTIN',
        senderType: 'lawyer',
        subject: 'Note interne - OQTF urgente',
        content: 'Client fiable, dossier à traiter en priorité absolue. Délai très court.',
        priority: 'high',
        visibility: 'team',
        isRead: false,
        procedureId: procedure.id,
      },
    });
    console.log(`   ✅ Message: "${message.subject}"`);

    // 8. Créer timeline events
    console.log('\n8️⃣ Création timeline...');
    const timelineEvents = [
      {
        eventType: 'created',
        title: 'Workspace créé',
        description: `Espace client créé pour ${client.firstName} ${client.lastName}`,
      },
      {
        eventType: 'email_received',
        title: 'Email reçu',
        description: 'Email urgent concernant OQTF',
      },
      {
        eventType: 'procedure_created',
        title: 'Procédure OQTF créée',
        description: 'Dossier OQTF ouvert suite à notification',
      },
    ];

    for (const event of timelineEvents) {
      await prisma.timelineEvent.create({
        data: {
          workspaceId: workspace.id,
          eventType: event.eventType,
          title: event.title,
          description: event.description,
          actorType: 'system',
        },
      });
    }
    console.log(`   ✅ Timeline: ${timelineEvents.length} événements créés`);

    // 9. Ajouter une note privée
    console.log('\n9️⃣ Ajout note privée...');
    const note = await prisma.workspaceNote.create({
      data: {
        workspaceId: workspace.id,
        title: 'Stratégie de défense',
        content: 'Points forts: attaches familiales solides, emploi stable. À exploiter dans le recours.',
        authorId: 'avocat-1',
        authorName: 'Maître MARTIN',
        isPrivate: true,
        isPinned: true,
        tags: JSON.stringify(['strategie', 'defense', 'oqtf']),
      },
    });
    console.log(`   ✅ Note: "${note.title}" (privée, épinglée)`);

    // 10. Mettre à jour stats workspace
    console.log('\n🔟 Mise à jour statistiques workspace...');
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        totalProcedures: 1,
        activeProcedures: 1,
        totalEmails: 1,
        totalDocuments: 0,
        lastActivityDate: new Date(),
      },
    });
    console.log(`   ✅ Stats mises à jour`);

    // 11. Créer une alerte critique
    console.log('\n1️⃣1️⃣ Création alerte délai critique...');
    const alert = await prisma.workspaceAlert.create({
      data: {
        workspaceId: workspace.id,
        alertType: 'deadline_critical',
        level: 'critical',
        title: 'Délai OQTF imminent',
        message: 'Recours contentieux à déposer avant le 30/01/2026 (dans 11 jours)',
        read: false,
        resolved: false,
      },
    });
    console.log(`   ✅ Alerte: "${alert.title}" (niveau: ${alert.level})`);

    // 12. Résumé final
    console.log('\n=========================================');
    console.log('📊 RÉSUMÉ WORKSPACE CRÉÉ\n');
    
    const workspaceComplete = await prisma.workspace.findUnique({
      where: { id: workspace.id },
      include: {
        client: true,
        procedures: true,
        emails: true,
        messages: true,
        timeline: true,
        notes: true,
        alerts: true,
      },
    });

    console.log(`👤 Client         : ${workspaceComplete!.client.firstName} ${workspaceComplete!.client.lastName}`);
    console.log(`📧 Email          : ${workspaceComplete!.client.email}`);
    console.log(`🏢 Workspace      : ${workspaceComplete!.title}`);
    console.log(`📁 Procédures     : ${workspaceComplete!.procedures.length}`);
    console.log(`📧 Emails         : ${workspaceComplete!.emails.length}`);
    console.log(`💬 Messages       : ${workspaceComplete!.messages.length}`);
    console.log(`📊 Timeline       : ${workspaceComplete!.timeline.length} événements`);
    console.log(`📝 Notes          : ${workspaceComplete!.notes.length}`);
    console.log(`⚠️  Alertes       : ${workspaceComplete!.alerts.length}`);
    console.log(`\n✨ ID Workspace   : ${workspace.id}`);

    console.log('\n🎉 Test réussi! Workspace client unifié créé avec succès.\n');

    return {
      success: true,
      workspaceId: workspace.id,
      clientId: client.id,
    };

  } catch (error) {
    console.error('\n❌ ERREUR lors du test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
if (require.main === module) {
  testWorkspaceCreation()
    .then((result) => {
      console.log('✅ Test terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test échoué:', error);
      process.exit(1);
    });
}

export { testWorkspaceCreation };
