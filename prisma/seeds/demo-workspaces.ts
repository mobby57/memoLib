/**
 * SEED: Données de démo pour Workspace Reasoning
 * 
 * Génère 3 scénarios complets CESEDA :
 * 1. OQTF (Complete - READY_FOR_HUMAN)
 * 2. Demande d'Asile (Mid-process - MISSING_IDENTIFIED)
 * 3. Regroupement Familial (Almost complete - ACTION_PROPOSED)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDemoWorkspaces() {
  console.log('🌱 Génération des workspaces de démo...\n');

  // Trouver ou créer un tenant de démo
  let tenant = await prisma.tenant.findFirst({
    where: { subdomain: 'demo-cabinet' },
  });

  if (!tenant) {
    // Trouver le plan BASIC (ou créer un plan de démo)
    let plan = await prisma.plan.findFirst({
      where: { name: 'BASIC' },
    });

    if (!plan) {
      // Créer un plan de démo si aucun plan n'existe
      plan = await prisma.plan.create({
        data: {
          name: 'DEMO',
          displayName: 'Plan Démo',
          description: 'Plan de démonstration pour tests',
          priceMonthly: 0,
          priceYearly: 0,
          maxWorkspaces: 10,
          maxDossiers: 100,
          maxClients: 50,
          maxStorageGb: 10,
          maxUsers: 5,
        },
      });
    }

    tenant = await prisma.tenant.create({
      data: {
        name: 'Cabinet Démo CESEDA',
        subdomain: 'demo-cabinet',
        planId: plan.id,
        settings: {
          create: {
            maxUsers: 10,
            maxDossiers: 100,
            storageLimit: 10,
          },
        },
      },
    });
    console.log('✅ Tenant démo créé:', tenant.id);
  }

  // ==========================================
  // SCÉNARIO 1: OQTF (Complete)
  // ==========================================
  console.log('\n📋 Scénario 1: OQTF (Complete - READY_FOR_HUMAN)');

  const oqtfWorkspace = await prisma.workspaceReasoning.create({
    data: {
      tenantId: tenant.id,
      sourceType: 'EMAIL',
      sourceRaw: `Bonjour Maître,

Je vous contacte en urgence car j'ai reçu il y a 3 jours une OQTF (Obligation de Quitter le Territoire Français) de la Préfecture de Paris.

Voici ma situation :
- Je suis en France depuis 5 ans (arrivé en janvier 2021)
- Je vis avec ma femme (mariée en France en 2022) et nos 2 enfants (nés en France, 3 ans et 1 an)
- J'ai un CDI depuis 2 ans comme développeur informatique chez TechCorp (salaire 3200€/mois)
- Nous habitons un appartement T3 à Paris 13ème (bail à notre nom)
- Les enfants sont scolarisés à l'école maternelle du quartier

La notification OQTF indique que j'ai 30 jours pour quitter le territoire français. Le délai expire le 15 février 2026.

Motif invoqué : Titre de séjour expiré depuis 6 mois (j'ai fait une demande de renouvellement mais toujours en attente).

Je suis très inquiet pour ma famille. Que dois-je faire ?

Cordialement,
Monsieur Ahmed DUBOIS
Tél: 06 12 34 56 78
Email: ahmed.dubois@email.com`,
      sourceMetadata: JSON.stringify({
        from: 'ahmed.dubois@email.com',
        subject: 'URGENT - OQTF reçue - Besoin aide juridique',
        receivedDate: '2026-01-18T09:30:00Z',
        threadId: 'thread-oqtf-001',
      }),
      procedureType: 'OQTF',
      currentState: 'READY_FOR_HUMAN',
      uncertaintyLevel: 0.15,
      ownerUserId: 'demo-user',
      stateChangedAt: new Date('2026-01-18T14:30:00Z'),
      stateChangedBy: 'AI',
    },
  });

  console.log('✅ Workspace OQTF créé:', oqtfWorkspace.id);

  // Facts pour OQTF
  await prisma.fact.createMany({
    data: [
      {
        workspaceId: oqtfWorkspace.id,
        label: 'Date de réception OQTF',
        value: '2026-01-15',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 3: "il y a 3 jours" depuis le 2026-01-18',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        label: 'Durée de présence en France',
        value: '5 ans (depuis janvier 2021)',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 5: "Je suis en France depuis 5 ans"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        label: 'Situation familiale',
        value: 'Marié avec 2 enfants nés en France',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Lignes 6-7: "ma femme... nos 2 enfants (nés en France)"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        label: 'Situation professionnelle',
        value: 'CDI développeur informatique TechCorp, 3200€/mois',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 8: "CDI depuis 2 ans comme développeur"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        label: 'Délai OQTF',
        value: '30 jours - expire le 15 février 2026',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 12: "30 jours... expire le 15 février"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        label: 'Motif OQTF',
        value: 'Titre de séjour expiré depuis 6 mois',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 14: "Titre de séjour expiré depuis 6 mois"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        label: 'Demande de renouvellement',
        value: 'En attente (déposée)',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 14: "demande de renouvellement... en attente"',
        confidence: 0.9,
        extractedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        label: 'Préfecture émettrice',
        value: 'Préfecture de Paris',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 3: "Préfecture de Paris"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        label: 'Domicile stable',
        value: 'Appartement T3 Paris 13ème avec bail',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 9: "appartement T3... bail à notre nom"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        label: 'Scolarisation enfants',
        value: 'École maternelle du quartier',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 10: "enfants... scolarisés à l\'école maternelle"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
    ],
  });

  console.log('  ✅ 10 faits créés');

  // Contexts pour OQTF
  const oqtfContexts = await prisma.contextHypothesis.createMany({
    data: [
      {
        workspaceId: oqtfWorkspace.id,
        type: 'LEGAL',
        description: 'OQTF contestable - Vie privée et familiale (Art. L511-4 CESEDA)',
        reasoning: 'Présence de 5 ans, famille avec enfants nés en France, emploi stable CDI → Éléments constitutifs d\'une vie privée et familiale protégée par l\'art. 8 CEDH',
        certaintyLevel: 'CERTAIN',
        identifiedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        type: 'TEMPORAL',
        description: 'Délai de recours TA : 2 mois depuis notification OQTF',
        reasoning: 'OQTF reçue le 15/01/2026 → Délai TA expire le 15/03/2026 (art. R421-1 CJA)',
        certaintyLevel: 'CERTAIN',
        identifiedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        type: 'ADMINISTRATIVE',
        description: 'Situation régularisable - Demande de titre en cours',
        reasoning: 'Demande de renouvellement déposée → Droit au séjour maintenu pendant instruction (art. L311-4 CESEDA)',
        certaintyLevel: 'PROBABLE',
        identifiedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        type: 'TEMPORAL',
        description: 'Délai OQTF 30 jours - Expire 15/02/2026',
        reasoning: 'Délai constitutionnel court → Risque d\'exécution forcée si pas de recours',
        certaintyLevel: 'CERTAIN',
        identifiedBy: 'AI',
      },
    ],
  });

  console.log('  ✅ 4 contextes créés');

  // Obligations pour OQTF
  const oqtfObligationsData = [
    {
      description: 'Déposer recours en annulation devant le Tribunal Administratif de Paris',
      mandatory: true,
      deadline: new Date('2026-03-15'),
      critical: true,
      legalRef: 'Art. R421-1 Code de Justice Administrative',
      deducedBy: 'AI',
    },
    {
      description: 'Déposer référé-suspension en parallèle du recours (si urgence)',
      mandatory: false,
      deadline: new Date('2026-02-15'),
      critical: true,
      legalRef: 'Art. L521-1 CJA - Référé suspension',
      deducedBy: 'AI',
    },
    {
      description: 'Constituer dossier de régularisation "vie privée et familiale"',
      mandatory: true,
      deadline: new Date('2026-02-10'),
      critical: false,
      legalRef: 'Art. L423-23 CESEDA',
      deducedBy: 'AI',
    },
  ];

  for (const obligationData of oqtfObligationsData) {
    await prisma.obligation.create({
      data: {
        workspaceId: oqtfWorkspace.id,
        contextId: (await prisma.contextHypothesis.findFirst({ where: { workspaceId: oqtfWorkspace.id } }))!.id,
        ...obligationData,
      },
    });
  }

  console.log('  ✅ 3 obligations créées');

  // Missing Elements (tous résolus)
  await prisma.missingElement.createMany({
    data: [
      {
        workspaceId: oqtfWorkspace.id,
        type: 'DOCUMENT',
        description: 'Copie intégrale de l\'OQTF avec cachet préfecture',
        why: 'Nécessaire pour recours TA et vérifier motifs invoqués',
        blocking: true,
        resolved: true,
        resolvedAt: new Date('2026-01-18T11:00:00Z'),
        resolution: 'Document scanné reçu par email du client le 18/01',
        identifiedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        type: 'DOCUMENT',
        description: 'Justificatifs de domicile (bail + quittances loyer)',
        why: 'Prouver stabilité résidentielle pour régularisation',
        blocking: false,
        resolved: true,
        resolvedAt: new Date('2026-01-18T12:00:00Z'),
        resolution: 'Bail + 3 dernières quittances fournis',
        identifiedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        type: 'DOCUMENT',
        description: 'Bulletins de salaire (6 derniers mois)',
        why: 'Prouver stabilité professionnelle et revenus suffisants',
        blocking: false,
        resolved: true,
        resolvedAt: new Date('2026-01-18T12:30:00Z'),
        resolution: '6 bulletins de salaire + attestation employeur fournis',
        identifiedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        type: 'DOCUMENT',
        description: 'Certificats de scolarité des enfants',
        why: 'Prouver intégration familiale et scolarisation',
        blocking: false,
        resolved: true,
        resolvedAt: new Date('2026-01-18T13:00:00Z'),
        resolution: 'Certificats école maternelle obtenus',
        identifiedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        type: 'DOCUMENT',
        description: 'Acte de mariage + livret de famille',
        why: 'Prouver situation familiale',
        blocking: false,
        resolved: true,
        resolvedAt: new Date('2026-01-18T13:15:00Z'),
        resolution: 'Documents fournis (mariage France 2022)',
        identifiedBy: 'AI',
      },
    ],
  });

  console.log('  ✅ 5 éléments manquants créés (tous résolus)');

  // Risks pour OQTF
  await prisma.risk.createMany({
    data: [
      {
        workspaceId: oqtfWorkspace.id,
        description: 'Dépassement délai de recours TA (15/03/2026)',
        impact: 'HIGH',
        probability: 'LOW',
        riskScore: 27,
        irreversible: true,
        evaluatedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        description: 'Exécution forcée OQTF avant recours (arrestation, rétention)',
        impact: 'HIGH',
        probability: 'LOW',
        riskScore: 27,
        irreversible: false,
        evaluatedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        description: 'Dossier de régularisation incomplet ou mal argumenté',
        impact: 'MEDIUM',
        probability: 'LOW',
        riskScore: 18,
        irreversible: false,
        evaluatedBy: 'AI',
      },
    ],
  });

  console.log('  ✅ 3 risques créés');

  // Proposed Actions pour OQTF
  await prisma.proposedAction.createMany({
    data: [
      {
        workspaceId: oqtfWorkspace.id,
        type: 'ALERT',
        content: 'URGENT - Alerter avocat spécialisé CESEDA pour recours TA immédiat',
        reasoning: 'Délai court (30 jours OQTF) + Enjeux familiaux critiques',
        target: 'LAWYER',
        priority: 'URGENT',
        executed: true,
        executedAt: new Date('2026-01-18T10:00:00Z'),
        proposedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        type: 'DOCUMENT_REQUEST',
        content: 'Demander au client : Récépissé demande de renouvellement titre',
        reasoning: 'Prouver que demande renouvellement en cours → Droit au séjour maintenu',
        target: 'CLIENT',
        priority: 'HIGH',
        executed: true,
        executedAt: new Date('2026-01-18T11:30:00Z'),
        proposedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        type: 'CALENDAR',
        content: 'Créer alerte : Deadline recours TA 15/03/2026',
        reasoning: 'Éviter dépassement délai irréversible',
        target: 'INTERNAL',
        priority: 'URGENT',
        executed: true,
        executedAt: new Date('2026-01-18T10:15:00Z'),
        proposedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        type: 'PROCEDURE',
        content: 'Préparer requête TA + référé suspension (modèle standard OQTF)',
        reasoning: 'Suspendre exécution OQTF pendant instruction recours',
        target: 'LAWYER',
        priority: 'URGENT',
        executed: false,
        proposedBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        type: 'DOCUMENT_REQUEST',
        content: 'Demander avis médical/psychologique sur conséquences éloignement (enfants)',
        reasoning: 'Renforcer argumentation art. 8 CEDH (intérêt supérieur enfant)',
        target: 'CLIENT',
        priority: 'NORMAL',
        executed: false,
        proposedBy: 'AI',
      },
    ],
  });

  console.log('  ✅ 5 actions proposées créées');

  // Reasoning Traces pour OQTF
  await prisma.reasoningTrace.createMany({
    data: [
      {
        workspaceId: oqtfWorkspace.id,
        step: 'EXTRACT_FACTS',
        explanation: 'Extraction de 10 faits certains depuis le message client',
        metadata: JSON.stringify({ factsCount: 10, averageConfidence: 0.98 }),
        createdBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        step: 'IDENTIFY_CONTEXT',
        explanation: 'Identification de 4 contextes : LEGAL (vie privée familiale), TEMPORAL (2 délais), ADMINISTRATIVE (régularisation)',
        metadata: JSON.stringify({ contextsCount: 4, certainContexts: 3 }),
        createdBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        step: 'DEDUCE_OBLIGATIONS',
        explanation: 'Déduction de 3 obligations procédurales avec délais critiques',
        metadata: JSON.stringify({ obligationsCount: 3, criticalCount: 2 }),
        createdBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        step: 'IDENTIFY_MISSING',
        explanation: 'Identification de 5 documents manquants, tous fournis par le client',
        metadata: JSON.stringify({ missingCount: 5, blockingCount: 1, resolvedCount: 5 }),
        createdBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        step: 'EVALUATE_RISKS',
        explanation: 'Évaluation de 3 risques : 2 critiques (délais) atténués par actions rapides',
        metadata: JSON.stringify({ risksCount: 3, highImpactCount: 2, averageScore: 24 }),
        createdBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        step: 'PROPOSE_ACTIONS',
        explanation: 'Proposition de 5 actions : 3 urgentes exécutées, 2 en attente',
        metadata: JSON.stringify({ actionsCount: 5, urgentCount: 3, executedCount: 3 }),
        createdBy: 'AI',
      },
      {
        workspaceId: oqtfWorkspace.id,
        step: 'VALIDATE_READY',
        explanation: 'Validation complète : Tous documents obtenus, recours préparé, incertitude 15%',
        metadata: JSON.stringify({ uncertaintyLevel: 0.15, readyForHuman: true }),
        createdBy: 'AI',
      },
    ],
  });

  console.log('  ✅ 7 traces de raisonnement créées');

  // Transitions pour OQTF
  await prisma.reasoningTransition.createMany({
    data: [
      {
        workspaceId: oqtfWorkspace.id,
        fromState: 'RECEIVED',
        toState: 'FACTS_EXTRACTED',
        triggeredBy: 'AI',
        reason: 'Extraction automatique des faits depuis email client',
        autoApproved: true,
        triggeredAt: new Date('2026-01-18T10:05:00Z'),
      },
      {
        workspaceId: oqtfWorkspace.id,
        fromState: 'FACTS_EXTRACTED',
        toState: 'CONTEXT_IDENTIFIED',
        triggeredBy: 'AI',
        reason: 'Identification des contextes juridiques et temporels',
        autoApproved: true,
        triggeredAt: new Date('2026-01-18T10:10:00Z'),
      },
      {
        workspaceId: oqtfWorkspace.id,
        fromState: 'CONTEXT_IDENTIFIED',
        toState: 'OBLIGATIONS_DEDUCED',
        triggeredBy: 'AI',
        reason: 'Déduction des obligations procédurales CESEDA',
        autoApproved: true,
        triggeredAt: new Date('2026-01-18T10:15:00Z'),
      },
      {
        workspaceId: oqtfWorkspace.id,
        fromState: 'OBLIGATIONS_DEDUCED',
        toState: 'MISSING_IDENTIFIED',
        triggeredBy: 'AI',
        reason: 'Identification documents manquants pour dossier complet',
        autoApproved: true,
        triggeredAt: new Date('2026-01-18T10:20:00Z'),
      },
      {
        workspaceId: oqtfWorkspace.id,
        fromState: 'MISSING_IDENTIFIED',
        toState: 'RISK_EVALUATED',
        triggeredBy: 'HUMAN',
        reason: 'Résolution manuelle des éléments manquants par avocat',
        autoApproved: false,
        triggeredAt: new Date('2026-01-18T13:30:00Z'),
      },
      {
        workspaceId: oqtfWorkspace.id,
        fromState: 'RISK_EVALUATED',
        toState: 'ACTION_PROPOSED',
        triggeredBy: 'AI',
        reason: 'Proposition actions urgentes et normales',
        autoApproved: true,
        triggeredAt: new Date('2026-01-18T13:35:00Z'),
      },
      {
        workspaceId: oqtfWorkspace.id,
        fromState: 'ACTION_PROPOSED',
        toState: 'READY_FOR_HUMAN',
        triggeredBy: 'AI',
        reason: 'Validation finale : Dossier complet, incertitude < 20%',
        autoApproved: true,
        triggeredAt: new Date('2026-01-18T14:30:00Z'),
      },
    ],
  });

  console.log('  ✅ 7 transitions créées\n');

  // ==========================================
  // SCÉNARIO 2: Demande d'Asile (Mid-process)
  // ==========================================
  console.log('📋 Scénario 2: Demande d\'Asile (MISSING_IDENTIFIED - Beaucoup manque)\n');

  const asileWorkspace = await prisma.workspaceReasoning.create({
    data: {
      tenantId: tenant.id,
      sourceType: 'PHONE',
      sourceRaw: `Notes appel téléphonique - 17/01/2026 14h30

Client: Monsieur Youssef AL-HASSAN
Provenance: Syrie (Damas)
Arrivée France: Octobre 2025 (il y a 3 mois)

Situation:
- A fui Syrie pour persécutions politiques (militant opposition)
- Famille restée au pays (femme + 3 enfants, pas de nouvelles)
- Actuellement hébergé par association caritative Paris
- Aucun document d'identité (passeport perdu pendant trajet)
- Pas encore déposé demande asile OFPRA
- Très anxieux, troubles du sommeil, cauchemars

Persécution invoquée:
- Arrestations arbitraires 2 fois (2023, 2024)
- Menaces mort par services sécurité
- Frère disparu depuis 2024
- Photos manifestations utilisées contre lui

Besoins urgents:
- Déposer demande asile OFPRA avant expiration délai 90 jours
- Obtenir certificat demandeur asile
- Comprendre procédure
- Aide psychologique

Prochaine étape: RDV cabinet 20/01 avec interprète arabe`,
      sourceMetadata: JSON.stringify({
        callDate: '2026-01-17T14:30:00Z',
        duration: '45min',
        interpreter: false,
        clientPhone: '07 XX XX XX XX',
      }),
      procedureType: 'ASILE_POLITIQUE',
      currentState: 'MISSING_IDENTIFIED',
      uncertaintyLevel: 0.72,
      ownerUserId: 'demo-user',
      stateChangedAt: new Date('2026-01-17T16:00:00Z'),
      stateChangedBy: 'AI',
    },
  });

  console.log('✅ Workspace Asile créé:', asileWorkspace.id);

  // Facts pour Asile
  await prisma.fact.createMany({
    data: [
      {
        workspaceId: asileWorkspace.id,
        label: 'Pays d\'origine',
        value: 'Syrie (Damas)',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 3: "Provenance: Syrie (Damas)"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        label: 'Date d\'arrivée en France',
        value: 'Octobre 2025',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 4: "Arrivée France: Octobre 2025"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        label: 'Motif de fuite',
        value: 'Persécutions politiques - militant opposition',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 7: "persécutions politiques (militant opposition)"',
        confidence: 0.9,
        extractedBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        label: 'Situation familiale',
        value: 'Femme + 3 enfants restés en Syrie',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 8: "Famille restée au pays"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        label: 'Hébergement actuel',
        value: 'Association caritative Paris',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 9: "hébergé par association caritative"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        label: 'Documents d\'identité',
        value: 'Aucun - Passeport perdu',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 10: "Aucun document... passeport perdu"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        label: 'Persécutions subies',
        value: '2 arrestations arbitraires (2023, 2024) + menaces mort',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Lignes 14-15: "Arrestations... Menaces mort"',
        confidence: 0.8,
        extractedBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        label: 'État psychologique',
        value: 'Anxiété, troubles sommeil, cauchemars',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 11: "anxieux, troubles du sommeil"',
        confidence: 0.9,
        extractedBy: 'AI',
      },
    ],
  });

  console.log('  ✅ 8 faits créés');

  // Contexts pour Asile
  await prisma.contextHypothesis.createMany({
    data: [
      {
        workspaceId: asileWorkspace.id,
        type: 'LEGAL',
        description: 'Demande d\'asile probable - Convention de Genève (persécutions politiques)',
        reasoning: 'Fuite Syrie pour opposition politique + Arrestations + Menaces → Critères article 1A Convention Genève',
        certaintyLevel: 'PROBABLE',
        identifiedBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        type: 'TEMPORAL',
        description: 'Délai OFPRA 90 jours depuis arrivée - Expire janvier 2026',
        reasoning: 'Arrivée octobre 2025 → Délai expire fin janvier 2026 (90 jours)',
        certaintyLevel: 'CERTAIN',
        identifiedBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        type: 'ADMINISTRATIVE',
        description: 'Procédure OFPRA normale (pas procédure accélérée)',
        reasoning: 'Syrie = Pays origine significative asile → Procédure normale OFPRA',
        certaintyLevel: 'PROBABLE',
        identifiedBy: 'AI',
      },
    ],
  });

  console.log('  ✅ 3 contextes créés');

  // Obligations pour Asile
  const asileObligationsData = [
    {
      description: 'Déposer demande d\'asile OFPRA (formulaire + récit)',
      mandatory: true,
      deadline: new Date('2026-01-31'),
      critical: true,
      legalRef: 'Art. L741-1 CESEDA - Délai 90 jours',
      deducedBy: 'AI',
    },
    {
      description: 'Obtenir attestation demandeur d\'asile',
      mandatory: true,
      deadline: new Date('2026-01-25'),
      critical: false,
      legalRef: 'Art. L741-1 CESEDA',
      deducedBy: 'AI',
    },
  ];

  for (const obligationData of asileObligationsData) {
    await prisma.obligation.create({
      data: {
        workspaceId: asileWorkspace.id,
        contextId: (await prisma.contextHypothesis.findFirst({ where: { workspaceId: asileWorkspace.id } }))!.id,
        ...obligationData,
      },
    });
  }

  console.log('  ✅ 2 obligations créées');

  // Missing Elements (BEAUCOUP non résolus - bloque progression)
  await prisma.missingElement.createMany({
    data: [
      {
        workspaceId: asileWorkspace.id,
        type: 'DOCUMENT',
        description: 'Récit détaillé des persécutions subies (10-15 pages)',
        why: 'Élément central demande asile - Doit décrire chronologiquement faits, lieux, dates, personnes',
        blocking: true,
        resolved: false,
        identifiedBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        type: 'DOCUMENT',
        description: 'Preuves persécutions (photos, articles presse, convocations, certificats médicaux)',
        why: 'Étayer récit avec éléments tangibles - Crédibilité demande',
        blocking: true,
        resolved: false,
        identifiedBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        type: 'DOCUMENT',
        description: 'Certificat médical troubles psychologiques (PTSD, anxiété)',
        why: 'Prouver conséquences psychologiques persécutions + Besoin protection',
        blocking: true,
        resolved: false,
        identifiedBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        type: 'INFORMATION',
        description: 'Informations précises famille (noms, âges, localisation Syrie)',
        why: 'Demande regroupement familial ultérieur si asile accordé',
        blocking: false,
        resolved: false,
        identifiedBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        type: 'DOCUMENT',
        description: 'Justificatif identité (même sans passeport)',
        why: 'Prouver identité et nationalité syrienne',
        blocking: false,
        resolved: false,
        identifiedBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        type: 'INFORMATION',
        description: 'Détails parcours migratoire (pays traversés, dates, moyens)',
        why: 'Exigé par OFPRA - Cohérence récit',
        blocking: false,
        resolved: false,
        identifiedBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        type: 'DOCUMENT',
        description: 'Attestations témoins (famille, amis, associations)',
        why: 'Corroborer récit persécutions',
        blocking: false,
        resolved: false,
        identifiedBy: 'AI',
      },
    ],
  });

  console.log('  ✅ 7 éléments manquants créés (3 bloquants NON résolus)');

  // Reasoning Traces pour Asile
  await prisma.reasoningTrace.createMany({
    data: [
      {
        workspaceId: asileWorkspace.id,
        step: 'EXTRACT_FACTS',
        explanation: 'Extraction de 8 faits depuis notes téléphoniques',
        metadata: JSON.stringify({ factsCount: 8, averageConfidence: 0.91 }),
        createdBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        step: 'IDENTIFY_CONTEXT',
        explanation: 'Identification contexte asile politique + délai OFPRA critique',
        metadata: JSON.stringify({ contextsCount: 3, certainContexts: 1 }),
        createdBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        step: 'DEDUCE_OBLIGATIONS',
        explanation: 'Déduction 2 obligations critiques OFPRA',
        metadata: JSON.stringify({ obligationsCount: 2, criticalCount: 1 }),
        createdBy: 'AI',
      },
      {
        workspaceId: asileWorkspace.id,
        step: 'IDENTIFY_MISSING',
        explanation: 'Identification 7 éléments manquants dont 3 BLOQUANTS → STOP progression',
        metadata: JSON.stringify({ missingCount: 7, blockingCount: 3, resolvedCount: 0 }),
        createdBy: 'AI',
      },
    ],
  });

  console.log('  ✅ 4 traces créées');

  // Transitions pour Asile
  await prisma.reasoningTransition.createMany({
    data: [
      {
        workspaceId: asileWorkspace.id,
        fromState: 'RECEIVED',
        toState: 'FACTS_EXTRACTED',
        triggeredBy: 'AI',
        reason: 'Extraction faits depuis notes appel téléphonique',
        autoApproved: true,
        triggeredAt: new Date('2026-01-17T15:00:00Z'),
      },
      {
        workspaceId: asileWorkspace.id,
        fromState: 'FACTS_EXTRACTED',
        toState: 'CONTEXT_IDENTIFIED',
        triggeredBy: 'AI',
        reason: 'Identification contexte asile politique Syrie',
        autoApproved: true,
        triggeredAt: new Date('2026-01-17T15:15:00Z'),
      },
      {
        workspaceId: asileWorkspace.id,
        fromState: 'CONTEXT_IDENTIFIED',
        toState: 'OBLIGATIONS_DEDUCED',
        triggeredBy: 'AI',
        reason: 'Déduction obligations OFPRA',
        autoApproved: true,
        triggeredAt: new Date('2026-01-17T15:30:00Z'),
      },
      {
        workspaceId: asileWorkspace.id,
        fromState: 'OBLIGATIONS_DEDUCED',
        toState: 'MISSING_IDENTIFIED',
        triggeredBy: 'AI',
        reason: 'Identification éléments manquants bloquants - STOP',
        autoApproved: true,
        triggeredAt: new Date('2026-01-17T16:00:00Z'),
      },
    ],
  });

  console.log('  ✅ 4 transitions créées (ARRÊT à MISSING_IDENTIFIED)\n');

  // ==========================================
  // SCÉNARIO 3: Regroupement Familial (Almost complete)
  // ==========================================
  console.log('📋 Scénario 3: Regroupement Familial (ACTION_PROPOSED - Presque prêt)\n');

  const regroupementWorkspace = await prisma.workspaceReasoning.create({
    data: {
      tenantId: tenant.id,
      sourceType: 'FORM',
      sourceRaw: `Formulaire de contact - Regroupement familial

Demandeur: Madame Fatima BENNANI
Nationalité: Marocaine
Titre de séjour France: Carte de résident (10 ans) - Obtenue 2018
Domicile: Paris 18ème
Profession: Aide-soignante CHU Paris (CDI depuis 2019)
Revenus: 2400€ net/mois (>SMIC)

Conjoint au Maroc:
- Monsieur Hassan BENNANI (marié 2015 au Maroc)
- 2 enfants: Amina (8 ans), Youssef (5 ans)
- Actuellement à Casablanca

Objectif: Faire venir mari + enfants en France

Logement:
- Appartement T3 Paris 18ème (65m²)
- Bail à mon nom depuis 2020
- Loyer 1200€/mois

Documents disponibles:
- Acte de mariage (traduit + apostillé)
- Actes naissance enfants (traduits)
- Bulletins salaire 6 derniers mois
- Bail + quittances loyer
- Carte de résident

Question: Procédure à suivre ? Délais ? Conditions revenus/logement OK ?

Date soumission: 16/01/2026`,
      sourceMetadata: JSON.stringify({
        formDate: '2026-01-16T10:00:00Z',
        formType: 'contact-regroupement',
        clientEmail: 'fatima.bennani@email.com',
      }),
      procedureType: 'REGROUPEMENT_FAMILIAL',
      currentState: 'ACTION_PROPOSED',
      uncertaintyLevel: 0.25,
      ownerUserId: 'demo-user',
      stateChangedAt: new Date('2026-01-16T16:00:00Z'),
      stateChangedBy: 'AI',
    },
  });

  console.log('✅ Workspace Regroupement créé:', regroupementWorkspace.id);

  // Facts pour Regroupement
  await prisma.fact.createMany({
    data: [
      {
        workspaceId: regroupementWorkspace.id,
        label: 'Titre de séjour demandeur',
        value: 'Carte de résident 10 ans (depuis 2018)',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 4: "Carte de résident (10 ans) - Obtenue 2018"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        label: 'Revenus demandeur',
        value: '2400€ net/mois (CDI aide-soignante)',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 6: "Revenus: 2400€ net/mois"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        label: 'Composition famille',
        value: 'Conjoint + 2 enfants (8 ans, 5 ans)',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Lignes 9-10: "Monsieur Hassan... 2 enfants"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        label: 'Logement',
        value: 'T3 65m² Paris 18ème - Bail propre',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Lignes 17-18: "Appartement T3... 65m²"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        label: 'Date mariage',
        value: '2015 au Maroc',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 9: "marié 2015 au Maroc"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        label: 'Documents disponibles',
        value: 'Mariage, naissances, bulletins, bail, carte résident',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Lignes 22-26: Liste documents',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        label: 'Durée présence France',
        value: '8 ans minimum (carte résident 2018)',
        source: 'INFERRED',
        sourceRef: 'Déduction: Carte 2018 → Présence depuis au moins 2016',
        confidence: 0.9,
        extractedBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        label: 'Condition revenus',
        value: 'Revenus > SMIC confirmé (2400€ vs ~1400€)',
        source: 'EXPLICIT_MESSAGE',
        sourceRef: 'Ligne 6 + Note: ">SMIC"',
        confidence: 1.0,
        extractedBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        label: 'Condition logement',
        value: 'Surface suffisante: 65m² pour 4 personnes OK',
        source: 'INFERRED',
        sourceRef: 'Calcul: 65m²/4 = 16.25m²/pers > 10m² minimum',
        confidence: 0.95,
        extractedBy: 'AI',
      },
    ],
  });

  console.log('  ✅ 9 faits créés');

  // Contexts pour Regroupement
  await prisma.contextHypothesis.createMany({
    data: [
      {
        workspaceId: regroupementWorkspace.id,
        type: 'LEGAL',
        description: 'Regroupement familial éligible - Art. L411-1 CESEDA',
        reasoning: 'Carte résident + Revenus > SMIC + Logement adapté → Conditions réunies',
        certaintyLevel: 'CERTAIN',
        identifiedBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        type: 'ADMINISTRATIVE',
        description: 'Procédure OFII (Office Français Immigration Intégration)',
        reasoning: 'Regroupement familial = Compétence OFII (formulaire Cerfa + visite médicale)',
        certaintyLevel: 'CERTAIN',
        identifiedBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        type: 'TEMPORAL',
        description: 'Délai traitement OFII : 6-12 mois',
        reasoning: 'Délai moyen regroupement familial en France',
        certaintyLevel: 'PROBABLE',
        identifiedBy: 'AI',
      },
    ],
  });

  console.log('  ✅ 3 contextes créés');

  // Obligations pour Regroupement
  const regroupementObligationsData = [
    {
      description: 'Déposer dossier OFII complet (Cerfa 11436*05 + pièces)',
      mandatory: true,
      deadline: new Date('2026-02-28'),
      critical: false,
      legalRef: 'Art. R411-1 CESEDA',
      deducedBy: 'AI',
    },
    {
      description: 'Justifier revenus stables ≥ SMIC (12 derniers mois)',
      mandatory: true,
      deadline: new Date('2026-02-28'),
      critical: false,
      legalRef: 'Art. R411-5 CESEDA',
      deducedBy: 'AI',
    },
    {
      description: 'Justifier logement décent et suffisant',
      mandatory: true,
      deadline: new Date('2026-02-28'),
      critical: false,
      legalRef: 'Art. R411-5 CESEDA',
      deducedBy: 'AI',
    },
  ];

  for (const obligationData of regroupementObligationsData) {
    await prisma.obligation.create({
      data: {
        workspaceId: regroupementWorkspace.id,
        contextId: (await prisma.contextHypothesis.findFirst({ where: { workspaceId: regroupementWorkspace.id } }))!.id,
        ...obligationData,
      },
    });
  }

  console.log('  ✅ 3 obligations créées');

  // Missing Elements (tous résolus)
  await prisma.missingElement.createMany({
    data: [
      {
        workspaceId: regroupementWorkspace.id,
        type: 'DOCUMENT',
        description: 'Bulletins de salaire 12 derniers mois (actuellement 6)',
        why: 'OFII exige 12 mois pour prouver stabilité revenus',
        blocking: false,
        resolved: true,
        resolvedAt: new Date('2026-01-16T14:00:00Z'),
        resolution: '12 bulletins fournis par la cliente',
        identifiedBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        type: 'DOCUMENT',
        description: 'Attestation employeur avec ancienneté et salaire',
        why: 'Compléter dossier OFII - Prouver CDI stable',
        blocking: false,
        resolved: true,
        resolvedAt: new Date('2026-01-16T14:30:00Z'),
        resolution: 'Attestation CHU Paris obtenue',
        identifiedBy: 'AI',
      },
    ],
  });

  console.log('  ✅ 2 éléments manquants créés (tous résolus)');

  // Risks pour Regroupement
  await prisma.risk.createMany({
    data: [
      {
        workspaceId: regroupementWorkspace.id,
        description: 'Revenus insuffisants si perte emploi',
        impact: 'MEDIUM',
        probability: 'LOW',
        riskScore: 18,
        irreversible: false,
        evaluatedBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        description: 'Délai traitement long (6-12 mois) - Séparation familiale prolongée',
        impact: 'MEDIUM',
        probability: 'HIGH',
        riskScore: 54,
        irreversible: false,
        evaluatedBy: 'AI',
      },
    ],
  });

  console.log('  ✅ 2 risques créés');

  // Proposed Actions pour Regroupement
  await prisma.proposedAction.createMany({
    data: [
      {
        workspaceId: regroupementWorkspace.id,
        type: 'DOCUMENT_REQUEST',
        content: 'Demander à cliente: Certificat médical famille (Maroc)',
        reasoning: 'Visite médicale obligatoire OFII - Peut être anticipée au Maroc',
        target: 'CLIENT',
        priority: 'NORMAL',
        executed: false,
        proposedBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        type: 'CALENDAR',
        content: 'Prendre RDV OFII pour dépôt dossier',
        reasoning: 'RDV parfois longs - Anticiper',
        target: 'CLIENT',
        priority: 'HIGH',
        executed: false,
        proposedBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        type: 'PROCEDURE',
        content: 'Préparer dossier complet OFII (checklist Cerfa 11436*05)',
        reasoning: 'Dossier complet = Traitement rapide, éviter rejets',
        target: 'LAWYER',
        priority: 'NORMAL',
        executed: false,
        proposedBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        type: 'ALERT',
        content: 'Informer cliente: Délai moyen 6-12 mois',
        reasoning: 'Gestion attentes - Éviter frustration',
        target: 'CLIENT',
        priority: 'NORMAL',
        executed: false,
        proposedBy: 'AI',
      },
    ],
  });

  console.log('  ✅ 4 actions proposées créées');

  // Reasoning Traces pour Regroupement
  await prisma.reasoningTrace.createMany({
    data: [
      {
        workspaceId: regroupementWorkspace.id,
        step: 'EXTRACT_FACTS',
        explanation: 'Extraction 9 faits depuis formulaire de contact',
        metadata: JSON.stringify({ factsCount: 9, averageConfidence: 0.97 }),
        createdBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        step: 'IDENTIFY_CONTEXT',
        explanation: 'Contexte regroupement familial éligible confirmé',
        metadata: JSON.stringify({ contextsCount: 3, certainContexts: 2 }),
        createdBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        step: 'DEDUCE_OBLIGATIONS',
        explanation: 'Obligations OFII identifiées (dossier, revenus, logement)',
        metadata: JSON.stringify({ obligationsCount: 3, criticalCount: 0 }),
        createdBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        step: 'IDENTIFY_MISSING',
        explanation: 'Éléments manquants mineurs résolus rapidement',
        metadata: JSON.stringify({ missingCount: 2, blockingCount: 0, resolvedCount: 2 }),
        createdBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        step: 'EVALUATE_RISKS',
        explanation: 'Risques faibles : Délai long mais situation stable',
        metadata: JSON.stringify({ risksCount: 2, highImpactCount: 0, averageScore: 36 }),
        createdBy: 'AI',
      },
      {
        workspaceId: regroupementWorkspace.id,
        step: 'PROPOSE_ACTIONS',
        explanation: '4 actions proposées pour optimiser procédure OFII',
        metadata: JSON.stringify({ actionsCount: 4, urgentCount: 0, executedCount: 0 }),
        createdBy: 'AI',
      },
    ],
  });

  console.log('  ✅ 6 traces créées');

  // Transitions pour Regroupement
  await prisma.reasoningTransition.createMany({
    data: [
      {
        workspaceId: regroupementWorkspace.id,
        fromState: 'RECEIVED',
        toState: 'FACTS_EXTRACTED',
        triggeredBy: 'AI',
        reason: 'Extraction automatique depuis formulaire structuré',
        autoApproved: true,
        triggeredAt: new Date('2026-01-16T11:00:00Z'),
      },
      {
        workspaceId: regroupementWorkspace.id,
        fromState: 'FACTS_EXTRACTED',
        toState: 'CONTEXT_IDENTIFIED',
        triggeredBy: 'AI',
        reason: 'Identification contexte regroupement familial',
        autoApproved: true,
        triggeredAt: new Date('2026-01-16T11:15:00Z'),
      },
      {
        workspaceId: regroupementWorkspace.id,
        fromState: 'CONTEXT_IDENTIFIED',
        toState: 'OBLIGATIONS_DEDUCED',
        triggeredBy: 'AI',
        reason: 'Déduction obligations OFII',
        autoApproved: true,
        triggeredAt: new Date('2026-01-16T11:30:00Z'),
      },
      {
        workspaceId: regroupementWorkspace.id,
        fromState: 'OBLIGATIONS_DEDUCED',
        toState: 'MISSING_IDENTIFIED',
        triggeredBy: 'AI',
        reason: 'Identification éléments manquants mineurs',
        autoApproved: true,
        triggeredAt: new Date('2026-01-16T11:45:00Z'),
      },
      {
        workspaceId: regroupementWorkspace.id,
        fromState: 'MISSING_IDENTIFIED',
        toState: 'RISK_EVALUATED',
        triggeredBy: 'HUMAN',
        reason: 'Résolution rapide éléments manquants',
        autoApproved: false,
        triggeredAt: new Date('2026-01-16T15:00:00Z'),
      },
      {
        workspaceId: regroupementWorkspace.id,
        fromState: 'RISK_EVALUATED',
        toState: 'ACTION_PROPOSED',
        triggeredBy: 'AI',
        reason: 'Proposition actions optimisation dossier',
        autoApproved: true,
        triggeredAt: new Date('2026-01-16T16:00:00Z'),
      },
    ],
  });

  console.log('  ✅ 6 transitions créées (À 1 étape de READY_FOR_HUMAN)\n');

  console.log('✅ Génération terminée!\n');
  console.log('📊 Résumé:');
  console.log('  - Scénario 1 (OQTF): READY_FOR_HUMAN - 10 faits, 7 transitions');
  console.log('  - Scénario 2 (Asile): MISSING_IDENTIFIED - 8 faits, 4 transitions (BLOQUÉ)');
  console.log('  - Scénario 3 (Regroupement): ACTION_PROPOSED - 9 faits, 6 transitions\n');

  return {
    tenant,
    workspaces: [oqtfWorkspace, asileWorkspace, regroupementWorkspace],
  };
}

async function main() {
  try {
    await seedDemoWorkspaces();
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
