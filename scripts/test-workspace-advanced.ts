/**
 * Tests Avancés - Workspace Client Unifié
 * 
 * Scénarios complexes avec :
 * - Multiples procédures par client
 * - Workflow emails complets
 * - Documents partagés et spécifiques
 * - Tous les types CESDA
 * - Communication client/avocat
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAdvancedWorkspaceScenarios() {
  console.log('\n🧪 TESTS AVANCÉS - Workspace Client Unifié\n');
  console.log('========================================================\n');

  try {
    // Récupérer tenant
    const tenant = await prisma.tenant.findFirst() || await createTestTenant();

    // ============================================
    // SCÉNARIO 1 : Client Multi-Procédures
    // ============================================
    console.log('📋 SCÉNARIO 1: Client avec Multiples Procédures CESDA\n');
    
    const client1 = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Marie',
        lastName: 'MARTIN',
        email: 'marie.martin@example.com',
        phone: '06 98 76 54 32',
        address: '45 avenue des Champs',
        codePostal: '75008',
        ville: 'Paris',
        pays: 'France',
        status: 'actif',
        dateOfBirth: new Date('1990-05-20'),
        nationality: 'Marocaine',
        situationFamiliale: 'marie',
        nombreEnfants: 2,
        profession: 'Infirmière',
        prefCommunication: 'email',
      },
    });

    const workspace1 = await prisma.workspace.create({
      data: {
        tenantId: tenant.id,
        clientId: client1.id,
        title: `Espace ${client1.firstName} ${client1.lastName}`,
        reference: `WS-${Date.now()}-001`,
        status: 'active',
        globalPriority: 'haute',
        firstContactDate: new Date('2025-12-01'),
        lastActivityDate: new Date(),
        createdById: 'avocat-principal',
        primaryLawyerId: 'avocat-1',
        teamMemberIds: JSON.stringify(['avocat-1', 'assistant-1']),
        metadata: JSON.stringify({
          source: 'recommandation',
          vip: true,
        }),
      },
    });

    // Procédure 1: OQTF (CRITIQUE)
    const proc1_oqtf = await prisma.procedure.create({
      data: {
        workspaceId: workspace1.id,
        procedureType: 'OQTF',
        title: 'OQTF - Sans délai de départ volontaire',
        description: 'OQTF notifiée suite à refus titre de séjour',
        reference: 'OQTF-2026-001',
        status: 'active',
        urgencyLevel: 'critique',
        notificationDate: new Date('2026-01-10'),
        deadlineDate: new Date('2026-01-27'), // 48h + délais
        assignedToId: 'avocat-1',
        metadata: JSON.stringify({
          oqtfType: 'sans_delai',
          juridiction: 'TA Paris',
          modeNotification: 'main_propre',
          articlesCeseda: ['L.511-1', 'L.742-1'],
        }),
      },
    });

    // Procédure 2: ASILE POLITIQUE (en parallèle)
    const proc2_asile = await prisma.procedure.create({
      data: {
        workspaceId: workspace1.id,
        procedureType: 'ASILE',
        title: 'Demande d\'asile politique',
        description: 'Demande d\'asile suite persécutions politiques au Maroc',
        reference: 'ASILE-2026-001',
        status: 'active',
        urgencyLevel: 'eleve',
        notificationDate: new Date('2025-12-15'),
        deadlineDate: new Date('2026-02-15'),
        assignedToId: 'avocat-1',
        metadata: JSON.stringify({
          motifAsile: 'opinion_politique',
          juridiction: 'OFPRA',
          audienceDate: '2026-03-01',
        }),
      },
    });

    // Procédure 3: REGROUPEMENT FAMILIAL (en attente)
    const proc3_regroupement = await prisma.procedure.create({
      data: {
        workspaceId: workspace1.id,
        procedureType: 'REGROUPEMENT_FAMILIAL',
        title: 'Regroupement familial - Époux',
        description: 'Demande de regroupement familial pour conjoint resté au Maroc',
        reference: 'RF-2026-001',
        status: 'pending',
        urgencyLevel: 'moyen',
        notificationDate: new Date('2026-01-05'),
        deadlineDate: new Date('2026-04-05'),
        assignedToId: 'assistant-1',
        metadata: JSON.stringify({
          beneficiaire: 'Conjoint',
          pays: 'Maroc',
          enfantsMineurs: 2,
        }),
      },
    });

    console.log(`✅ Client: ${client1.firstName} ${client1.lastName}`);
    console.log(`✅ Workspace: ${workspace1.title}`);
    console.log(`✅ 3 Procédures créées:`);
    console.log(`   - ${proc1_oqtf.title} (${proc1_oqtf.urgencyLevel})`);
    console.log(`   - ${proc2_asile.title} (${proc2_asile.urgencyLevel})`);
    console.log(`   - ${proc3_regroupement.title} (${proc3_regroupement.urgencyLevel})`);

    // Workflow emails complet
    console.log('\n📧 Workflow Emails Complet...');

    // Email 1: Premier contact client
    await prisma.workspaceEmail.create({
      data: {
        workspaceId: workspace1.id,
        messageId: `msg-${Date.now()}-1`,
        from: client1.email,
        to: 'cabinet@avocat.com',
        subject: 'Demande urgente - OQTF reçue',
        bodyText: 'Bonjour, j\'ai reçu une OQTF hier. Je suis très inquiète, j\'ai deux enfants scolarisés. Pouvez-vous m\'aider ?',
        receivedDate: new Date('2026-01-11T09:30:00'),
        direction: 'inbound',
        category: 'urgent',
        priority: 'critical',
        aiProcessed: true,
        aiClassified: 'ceseda',
        aiConfidence: 0.98,
        aiSummary: 'Client a reçu OQTF, situation urgente avec enfants',
        aiActionNeeded: 'Fixer RDV urgent, analyser OQTF, préparer recours contentieux',
        isRead: true,
        needsResponse: true,
      },
    });

    // Email 2: Réponse avocat
    await prisma.workspaceEmail.create({
      data: {
        workspaceId: workspace1.id,
        messageId: `msg-${Date.now()}-2`,
        from: 'avocat@cabinet.com',
        to: client1.email,
        subject: 'RE: Demande urgente - OQTF reçue',
        bodyText: 'Madame Martin, votre situation est effectivement urgente. Je vous propose un RDV demain 14h. Apportez l\'OQTF et vos justificatifs.',
        receivedDate: new Date('2026-01-11T10:15:00'),
        sentDate: new Date('2026-01-11T10:15:00'),
        direction: 'outbound',
        category: 'general',
        priority: 'high',
        isRead: true,
        needsResponse: false,
        respondedAt: new Date('2026-01-11T10:15:00'),
      },
    });

    // Email 3: Confirmation RDV client
    await prisma.workspaceEmail.create({
      data: {
        workspaceId: workspace1.id,
        messageId: `msg-${Date.now()}-3`,
        from: client1.email,
        to: 'avocat@cabinet.com',
        subject: 'RE: Demande urgente - OQTF reçue',
        bodyText: 'Merci beaucoup. Je serai là demain à 14h. J\'apporte tous mes documents.',
        receivedDate: new Date('2026-01-11T11:00:00'),
        direction: 'inbound',
        category: 'general',
        priority: 'normal',
        isRead: true,
        needsResponse: false,
      },
    });

    // Email 4: Documents complémentaires
    await prisma.workspaceEmail.create({
      data: {
        workspaceId: workspace1.id,
        messageId: `msg-${Date.now()}-4`,
        from: client1.email,
        to: 'avocat@cabinet.com',
        subject: 'Documents demandés',
        bodyText: 'Bonjour, voici en pièce jointe les justificatifs de domicile et bulletins de salaire.',
        receivedDate: new Date('2026-01-12T15:30:00'),
        direction: 'inbound',
        category: 'administrative',
        priority: 'normal',
        hasAttachments: true,
        attachments: JSON.stringify([
          { filename: 'justificatif_domicile.pdf', size: 245000, mimeType: 'application/pdf' },
          { filename: 'bulletins_salaire_2025.pdf', size: 890000, mimeType: 'application/pdf' },
        ]),
        aiProcessed: true,
        isRead: false,
        needsResponse: false,
      },
    });

    console.log(`✅ 4 emails créés (workflow complet)`);

    // Documents workspace (globaux)
    console.log('\n📄 Documents Globaux...');

    const docs = [
      {
        filename: 'passeport.pdf',
        originalName: 'Passeport Marie MARTIN.pdf',
        documentType: 'passeport',
        category: 'identite',
        description: 'Passeport marocain valide jusqu\'en 2028',
      },
      {
        filename: 'carte_sejour_expiree.pdf',
        originalName: 'Ancien titre de séjour.pdf',
        documentType: 'titre_sejour',
        category: 'juridique',
        description: 'Ancienne carte de séjour expirée',
      },
      {
        filename: 'acte_naissance_enfant1.pdf',
        originalName: 'Acte naissance Yasmine.pdf',
        documentType: 'etat_civil',
        category: 'identite',
        description: 'Acte de naissance fille aînée (12 ans)',
      },
      {
        filename: 'certificat_scolarite.pdf',
        originalName: 'Certificats scolarité enfants.pdf',
        documentType: 'justificatif_scolarite',
        category: 'administratif',
        description: 'Certificats de scolarité des 2 enfants',
      },
      {
        filename: 'contrat_travail.pdf',
        originalName: 'Contrat CDI Hôpital.pdf',
        documentType: 'contrat_travail',
        category: 'financier',
        description: 'CDI infirmière depuis 2020',
      },
    ];

    for (const doc of docs) {
      await prisma.workspaceDocument.create({
        data: {
          tenantId: tenant.id,
          workspaceId: workspace1.id,
          filename: doc.filename,
          originalName: doc.originalName,
          mimeType: 'application/pdf',
          sizeBytes: Math.floor(Math.random() * 500000) + 100000,
          storagePath: `/uploads/${workspace1.id}/${doc.filename}`,
          documentType: doc.documentType,
          category: doc.category,
          description: doc.description,
          source: 'manual',
          aiProcessed: true,
          aiConfidence: 0.92,
          verified: true,
          verifiedAt: new Date(),
          verifiedBy: 'avocat-1',
        },
      });
    }

    console.log(`✅ ${docs.length} documents globaux créés`);

    // Documents spécifiques procédures
    console.log('\n📑 Documents Spécifiques Procédures...');

    // Doc OQTF
    await prisma.procedureDocument.create({
      data: {
        procedureId: proc1_oqtf.id,
        filename: 'oqtf_originale.pdf',
        originalName: 'OQTF Prefecture Paris.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 450000,
        storagePath: `/uploads/${workspace1.id}/procedures/${proc1_oqtf.id}/oqtf.pdf`,
        documentType: 'decision_administrative',
        description: 'OQTF originale notifiée le 10/01/2026',
        required: true,
        displayOrder: 1,
      },
    });

    // Doc ASILE
    await prisma.procedureDocument.create({
      data: {
        procedureId: proc2_asile.id,
        filename: 'recit_persecutions.pdf',
        originalName: 'Récit détaillé persécutions.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 680000,
        storagePath: `/uploads/${workspace1.id}/procedures/${proc2_asile.id}/recit.pdf`,
        documentType: 'piece_jointe',
        description: 'Récit détaillé des persécutions subies',
        required: true,
        displayOrder: 1,
      },
    });

    console.log(`✅ Documents spécifiques procédures créés`);

    // Messages équipe
    console.log('\n💬 Messages Internes & Client...');

    // Message équipe
    await prisma.workspaceMessage.create({
      data: {
        workspaceId: workspace1.id,
        type: 'team_discussion',
        senderId: 'avocat-1',
        senderName: 'Me DURAND',
        senderType: 'lawyer',
        recipientIds: JSON.stringify(['assistant-1', 'avocat-2']),
        recipientType: 'team',
        subject: 'Stratégie OQTF - Mme MARTIN',
        content: 'Dossier solide : CDI, enfants scolarisés, attaches familiales. Je recommande recours contentieux + référé suspension. Dossier asile peut renforcer notre position.',
        priority: 'high',
        visibility: 'team',
        isRead: false,
        procedureId: proc1_oqtf.id,
      },
    });

    // Message client (notification automatique)
    await prisma.workspaceMessage.create({
      data: {
        workspaceId: workspace1.id,
        type: 'system_notification',
        senderId: 'system',
        senderName: 'Système IA Poste Manager',
        senderType: 'system',
        recipientIds: JSON.stringify([client1.id]),
        recipientType: 'client',
        subject: 'Votre dossier OQTF est en cours de traitement',
        content: 'Madame Martin, votre dossier OQTF est actuellement traité par Me DURAND. Un recours contentieux sera déposé avant le 27/01/2026. Nous restons à votre disposition.',
        priority: 'normal',
        visibility: 'client',
        isRead: false,
      },
    });

    console.log(`✅ Messages créés (équipe + client)`);

    // Timeline complète
    console.log('\n📊 Timeline Unifiée...');

    const timelineEvents = [
      { type: 'created', title: 'Workspace créé', desc: 'Premier contact avec le cabinet' },
      { type: 'email_received', title: 'Email urgent reçu', desc: 'Demande assistance OQTF' },
      { type: 'procedure_created', title: 'Procédure OQTF créée', desc: 'Dossier OQTF ouvert' },
      { type: 'procedure_created', title: 'Procédure ASILE créée', desc: 'Demande asile politique' },
      { type: 'document_added', title: 'Documents identité ajoutés', desc: '5 documents uploadés' },
      { type: 'email_sent', title: 'Réponse envoyée au client', desc: 'Confirmation RDV' },
      { type: 'meeting_scheduled', title: 'RDV programmé', desc: 'Consultation 12/01 à 14h' },
      { type: 'document_added', title: 'Pièces complémentaires', desc: 'Justificatifs reçus par email' },
      { type: 'ai_suggestion', title: 'IA recommande action', desc: 'Référé suspension suggéré' },
    ];

    for (const event of timelineEvents) {
      await prisma.timelineEvent.create({
        data: {
          workspaceId: workspace1.id,
          eventType: event.type,
          title: event.title,
          description: event.desc,
          actorType: event.type.includes('ai') ? 'ai' : event.type.includes('email') ? 'user' : 'system',
          actorId: event.type.includes('email') ? 'avocat-1' : undefined,
        },
      });
    }

    console.log(`✅ Timeline: ${timelineEvents.length} événements`);

    // Notes avocat
    console.log('\n📝 Notes Privées Avocat...');

    await prisma.workspaceNote.create({
      data: {
        workspaceId: workspace1.id,
        title: 'Stratégie globale',
        content: `**Points forts:**
- CDI depuis 2020 (infirmière)
- 2 enfants scolarisés en France
- Vie privée et familiale établie
- Aucun antécédent judiciaire

**Stratégie:**
1. Recours contentieux OQTF (Art. 8 CEDH)
2. Référé suspension en parallèle
3. Utiliser dossier asile comme élément renforçant
4. Demande de titre de séjour "vie privée et familiale"

**Jurisprudence pertinente:**
- CE 2024, attaches familiales prépondérantes
- CAA Paris 2025, protection enfants scolarisés`,
        authorId: 'avocat-1',
        authorName: 'Me DURAND',
        isPrivate: true,
        isPinned: true,
        tags: JSON.stringify(['strategie', 'juridique', 'oqtf', 'asile']),
      },
    });

    console.log(`✅ Note stratégique créée`);

    // Alertes
    console.log('\n⚠️  Alertes Critiques...');

    await prisma.workspaceAlert.create({
      data: {
        workspaceId: workspace1.id,
        alertType: 'deadline_critical',
        level: 'critical',
        title: '⏰ Délai OQTF - 8 jours restants',
        message: 'Le recours contentieux OQTF doit être déposé avant le 27/01/2026 (dans 8 jours). Référé suspension à déposer simultanément.',
        read: false,
      },
    });

    await prisma.workspaceAlert.create({
      data: {
        workspaceId: workspace1.id,
        alertType: 'document_missing',
        level: 'warning',
        title: 'Document manquant - ASILE',
        message: 'Certificat médical attestant des séquelles des persécutions manquant pour le dossier OFPRA.',
        read: false,
      },
    });

    console.log(`✅ 2 alertes créées`);

    // Mettre à jour stats workspace
    await prisma.workspace.update({
      where: { id: workspace1.id },
      data: {
        totalProcedures: 3,
        activeProcedures: 2,
        totalEmails: 4,
        totalDocuments: docs.length,
        lastActivityDate: new Date(),
      },
    });

    // ============================================
    // SCÉNARIO 2 : Client Naturalisation Simple
    // ============================================
    console.log('\n\n📋 SCÉNARIO 2: Client Naturalisation Standard\n');

    const client2 = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Ahmed',
        lastName: 'BENALI',
        email: 'ahmed.benali@example.com',
        phone: '07 11 22 33 44',
        address: '78 rue de la République',
        codePostal: '69002',
        ville: 'Lyon',
        pays: 'France',
        status: 'actif',
        dateOfBirth: new Date('1988-11-03'),
        nationality: 'Algérienne',
        situationFamiliale: 'marie',
        nombreEnfants: 1,
        profession: 'Ingénieur informatique',
        revenusAnnuels: 55000,
      },
    });

    const workspace2 = await prisma.workspace.create({
      data: {
        tenantId: tenant.id,
        clientId: client2.id,
        title: `Espace ${client2.firstName} ${client2.lastName}`,
        reference: `WS-${Date.now()}-002`,
        status: 'active',
        globalPriority: 'normale',
        firstContactDate: new Date('2026-01-08'),
        createdById: 'avocat-2',
        primaryLawyerId: 'avocat-2',
      },
    });

    await prisma.procedure.create({
      data: {
        workspaceId: workspace2.id,
        procedureType: 'NATURALISATION',
        title: 'Demande de naturalisation française',
        description: 'Résidence en France depuis 6 ans, conjoint français',
        reference: 'NAT-2026-001',
        status: 'active',
        urgencyLevel: 'moyen',
        notificationDate: new Date('2026-01-08'),
        deadlineDate: new Date('2026-07-08'),
        assignedToId: 'avocat-2',
        metadata: JSON.stringify({
          dureeResidence: 6,
          conjointFrancais: true,
          niveauFrancais: 'B1',
        }),
      },
    });

    console.log(`✅ Client: ${client2.firstName} ${client2.lastName}`);
    console.log(`✅ Workspace: Naturalisation simple`);

    // ============================================
    // SCÉNARIO 3 : Client Refus Titre Complexe
    // ============================================
    console.log('\n\n📋 SCÉNARIO 3: Client Refus Titre + Contentieux\n');

    const client3 = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Sofia',
        lastName: 'PETROVA',
        email: 'sofia.petrova@example.com',
        phone: '06 55 44 33 22',
        address: '12 boulevard Saint-Michel',
        codePostal: '75005',
        ville: 'Paris',
        pays: 'France',
        status: 'actif',
        dateOfBirth: new Date('1995-07-15'),
        nationality: 'Ukrainienne',
        situationFamiliale: 'celibataire',
        profession: 'Étudiante doctorat',
      },
    });

    const workspace3 = await prisma.workspace.create({
      data: {
        tenantId: tenant.id,
        clientId: client3.id,
        title: `Espace ${client3.firstName} ${client3.lastName}`,
        reference: `WS-${Date.now()}-003`,
        status: 'active',
        globalPriority: 'haute',
        firstContactDate: new Date('2026-01-15'),
        createdById: 'avocat-1',
        primaryLawyerId: 'avocat-1',
      },
    });

    await prisma.procedure.create({
      data: {
        workspaceId: workspace3.id,
        procedureType: 'REFUS_TITRE',
        title: 'Recours refus titre de séjour étudiant',
        description: 'Refus renouvellement titre étudiant - Ressources insuffisantes',
        reference: 'REFUS-2026-001',
        status: 'active',
        urgencyLevel: 'eleve',
        notificationDate: new Date('2026-01-10'),
        deadlineDate: new Date('2026-03-10'),
        assignedToId: 'avocat-1',
        metadata: JSON.stringify({
          motifRefus: 'ressources_insuffisantes',
          juridiction: 'TA Paris',
          typeRecours: 'contentieux',
        }),
      },
    });

    console.log(`✅ Client: ${client3.firstName} ${client3.lastName}`);
    console.log(`✅ Workspace: Refus titre étudiant`);

    // ============================================
    // STATISTIQUES GLOBALES
    // ============================================
    console.log('\n\n========================================================');
    console.log('📊 STATISTIQUES FINALES\n');

    const allWorkspaces = await prisma.workspace.findMany({
      include: {
        client: true,
        procedures: true,
        emails: true,
        messages: true,
        documents: true,
        timeline: true,
        notes: true,
        alerts: true,
      },
    });

    console.log(`✅ Workspaces créés      : ${allWorkspaces.length}`);
    console.log(`✅ Procédures totales    : ${allWorkspaces.reduce((sum, w) => sum + w.procedures.length, 0)}`);
    console.log(`✅ Emails totaux         : ${allWorkspaces.reduce((sum, w) => sum + w.emails.length, 0)}`);
    console.log(`✅ Documents totaux      : ${allWorkspaces.reduce((sum, w) => sum + w.documents.length, 0)}`);
    console.log(`✅ Messages totaux       : ${allWorkspaces.reduce((sum, w) => sum + w.messages.length, 0)}`);
    console.log(`✅ Événements timeline   : ${allWorkspaces.reduce((sum, w) => sum + w.timeline.length, 0)}`);
    console.log(`✅ Notes privées         : ${allWorkspaces.reduce((sum, w) => sum + w.notes.length, 0)}`);
    console.log(`✅ Alertes actives       : ${allWorkspaces.reduce((sum, w) => sum + w.alerts.length, 0)}`);

    console.log('\n📋 DÉTAIL PAR WORKSPACE:\n');
    
    for (const ws of allWorkspaces) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`👤 ${ws.client.firstName} ${ws.client.lastName} (${ws.client.email})`);
      console.log(`📁 ${ws.title} - Référence: ${ws.reference}`);
      console.log(`🎯 Priorité: ${ws.globalPriority}`);
      console.log(`\nContenu:`);
      console.log(`   📁 Procédures: ${ws.procedures.length}`);
      ws.procedures.forEach(p => {
        console.log(`      - ${p.title} (${p.urgencyLevel})`);
      });
      console.log(`   📧 Emails: ${ws.emails.length}`);
      console.log(`   📄 Documents: ${ws.documents.length}`);
      console.log(`   💬 Messages: ${ws.messages.length}`);
      console.log(`   📊 Timeline: ${ws.timeline.length} événements`);
      console.log(`   📝 Notes: ${ws.notes.length}`);
      console.log(`   ⚠️  Alertes: ${ws.alerts.length}`);
    }

    console.log('\n========================================================');
    console.log('🎉 TESTS AVANCÉS TERMINÉS AVEC SUCCÈS!\n');

    return {
      success: true,
      workspacesCreated: allWorkspaces.length,
      stats: {
        procedures: allWorkspaces.reduce((sum, w) => sum + w.procedures.length, 0),
        emails: allWorkspaces.reduce((sum, w) => sum + w.emails.length, 0),
        documents: allWorkspaces.reduce((sum, w) => sum + w.documents.length, 0),
      },
    };

  } catch (error) {
    console.error('\n❌ ERREUR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createTestTenant() {
  const plan = await prisma.plan.findFirst() || await prisma.plan.create({
    data: {
      name: 'PREMIUM',
      displayName: 'Premium',
      priceMonthly: 99,
      priceYearly: 999,
    },
  });

  return await prisma.tenant.create({
    data: {
      name: 'Cabinet Test Avancé',
      subdomain: 'cabinet-test-advanced',
      planId: plan.id,
    },
  });
}

// Exécution
if (require.main === module) {
  testAdvancedWorkspaceScenarios()
    .then(() => {
      console.log('✨ Tests avancés réussis');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Tests échoués:', error);
      process.exit(1);
    });
}

export { testAdvancedWorkspaceScenarios };
