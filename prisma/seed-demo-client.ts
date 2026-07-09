/**
 * 🧪 Seed Demo Client — Données réalistes pour test client
 *
 * Usage : npx ts-node prisma/seed-demo-client.ts
 *
 * Crée :
 * - 1 tenant "Cabinet Test"
 * - 1 compte avocat (demo@memolib.fr / Demo2026!)
 * - 3 clients fictifs avec profils complets
 * - 5 emails entrants réalistes (dont urgences)
 * - 3 dossiers en cours avec différents statuts
 * - 2 deadlines (1 urgente, 1 normale)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const nodeCrypto = require('crypto');

const prisma = new PrismaClient();

function uuid() {
  return nodeCrypto.randomUUID();
}

async function main() {
  console.log('🚀 Seed Demo Client — Préparation environnement de test...\n');

  // ============================================================
  // 1. PLAN — s'assurer qu'un plan Pro existe
  // ============================================================
  console.log('📦 Vérification des plans...');

  const plan = await prisma.plan.upsert({
    where: { name: 'pro' },
    update: {},
    create: {
      id: uuid(),
      name: 'pro',
      displayName: 'Pro',
      description: 'Pour les cabinets en croissance',
      priceMonthly: 99,
      priceYearly: 990,
      currency: 'EUR',
      maxWorkspaces: 3,
      maxDossiers: 500,
      maxClients: 100,
      maxStorageGb: 50,
      maxUsers: 10,
      aiAutonomyLevel: 2,
      humanValidation: true,
      advancedAnalytics: true,
      externalAiAccess: false,
      prioritySupport: true,
      customBranding: false,
      apiAccess: true,
      isActive: true,
      updatedAt: new Date(),
    },
  });

  // ============================================================
  // 2. TENANT — Cabinet de démonstration
  // ============================================================
  console.log('🏢 Création du cabinet de démonstration...');

  const tenantId = uuid();
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo-client' },
    update: {},
    create: {
      id: tenantId,
      name: 'Cabinet Martin & Associés',
      subdomain: 'demo-client',
      planId: plan.id,
      status: 'active',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      updatedAt: new Date(),
    },
  });

  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      id: uuid(),
      tenantId: tenant.id,
      ollamaEnabled: true,
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2:latest',
      emailEnabled: true,
      maxDossiers: 500,
      maxUsers: 10,
      storageLimit: 50000,
      updatedAt: new Date(),
    },
  });

  console.log(`   ✅ Cabinet créé : ${tenant.name} (${tenant.subdomain})`);

  // ============================================================
  // 3. UTILISATEUR — Compte avocat de démo
  // ============================================================
  console.log('👤 Création du compte avocat...');

  const avocatId = uuid();
  const avocat = await prisma.user.upsert({
    where: { email: 'demo@memolib.fr' },
    update: {
      password: await bcrypt.hash('Demo2026!', 10),
      role: 'LAWYER',
      tenantId: tenant.id,
    },
    create: {
      id: avocatId,
      email: 'demo@memolib.fr',
      name: 'Maître Sophie Martin',
      password: await bcrypt.hash('Demo2026!', 10),
      role: 'LAWYER',
      tenantId: tenant.id,
      status: 'active',
      language: 'fr',
      timezone: 'Europe/Paris',
      updatedAt: new Date(),
    },
  });

  console.log(`   ✅ Avocat : demo@memolib.fr / Demo2026!`);

  // ============================================================
  // 4. CLIENTS — 3 profils réalistes
  // ============================================================
  console.log('👥 Création des clients...');

  const clientIds = [uuid(), uuid(), uuid()];

  const clients = [
    {
      id: clientIds[0],
      tenantId: tenant.id,
      civilite: 'M.',
      firstName: 'Ahmed',
      lastName: 'BENALI',
      email: 'ahmed.benali@email.com',
      phone: '06 12 34 56 78',
      dateOfBirth: new Date('1985-03-15'),
      nationality: 'Algérienne',
      address: '12 rue de la Paix',
      codePostal: '75002',
      ville: 'Paris',
      pays: 'France',
      status: 'actif',
      updatedAt: new Date(),
    },
    {
      id: clientIds[1],
      tenantId: tenant.id,
      civilite: 'Mme',
      firstName: 'Fatima',
      lastName: 'DIALLO',
      email: 'fatima.diallo@email.com',
      phone: '07 98 76 54 32',
      dateOfBirth: new Date('1990-07-22'),
      nationality: 'Sénégalaise',
      address: '5 avenue Victor Hugo',
      codePostal: '93100',
      ville: 'Montreuil',
      pays: 'France',
      status: 'actif',
      updatedAt: new Date(),
    },
    {
      id: clientIds[2],
      tenantId: tenant.id,
      civilite: 'M.',
      firstName: 'Dmitri',
      lastName: 'PETROV',
      email: 'dmitri.petrov@email.com',
      phone: '06 55 44 33 22',
      dateOfBirth: new Date('1978-11-03'),
      nationality: 'Russe',
      address: '28 boulevard Haussmann',
      codePostal: '75009',
      ville: 'Paris',
      pays: 'France',
      status: 'actif',
      updatedAt: new Date(),
    },
  ];

  for (const client of clients) {
    await prisma.client.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: client.email } },
      update: {},
      create: client,
    });
  }

  console.log(`   ✅ ${clients.length} clients créés`);

  // ============================================================
  // 5. DOSSIERS — 3 dossiers avec statuts différents
  // ============================================================
  console.log('📁 Création des dossiers...');

  const dossierIds = [uuid(), uuid(), uuid()];

  const dossiers = [
    {
      id: dossierIds[0],
      tenantId: tenant.id,
      numero: 'DOS-2026-001',
      clientId: clientIds[0],
      typeDossier: 'oqtf',
      articleCeseda: 'L511-1',
      statut: 'en_cours',
      priorite: 'urgente',
      phase: 'recours',
      dateCreation: new Date('2026-06-20'),
      dateOuverture: new Date('2026-06-20'),
      dateEcheance: new Date('2026-07-20'),
      juridiction: 'TA Paris',
      typeRecours: 'contentieux',
      responsableId: avocat.id,
      objet: 'Recours OQTF — M. BENALI Ahmed',
      description: 'Contestation OQTF notifiée le 20/06/2026. Délai de recours 30 jours. Client présent en France depuis 8 ans, vie familiale établie.',
      updatedAt: new Date(),
    },
    {
      id: dossierIds[1],
      tenantId: tenant.id,
      numero: 'DOS-2026-002',
      clientId: clientIds[1],
      typeDossier: 'titre_sejour',
      articleCeseda: 'L313-11',
      statut: 'en_cours',
      priorite: 'normale',
      phase: 'instruction',
      dateCreation: new Date('2026-06-01'),
      dateOuverture: new Date('2026-06-01'),
      dateEcheance: new Date('2026-10-01'),
      juridiction: 'Préfecture 93',
      typeRecours: 'gracieux',
      responsableId: avocat.id,
      objet: 'Titre de séjour salarié — Mme DIALLO Fatima',
      description: 'Demande de titre de séjour mention "salarié". Contrat CDI entreprise locale. Dossier complet, en attente de convocation préfecture.',
      updatedAt: new Date(),
    },
    {
      id: dossierIds[2],
      tenantId: tenant.id,
      numero: 'DOS-2026-003',
      clientId: clientIds[2],
      typeDossier: 'naturalisation',
      statut: 'en_cours',
      priorite: 'normale',
      phase: 'instruction',
      dateCreation: new Date('2026-05-15'),
      dateOuverture: new Date('2026-05-15'),
      dateEcheance: new Date('2027-05-15'),
      juridiction: 'Préfecture 75',
      responsableId: avocat.id,
      objet: 'Naturalisation — M. PETROV Dmitri',
      description: 'Demande de naturalisation par décret. Résidence en France depuis 12 ans, maîtrise de la langue, emploi stable.',
      updatedAt: new Date(),
    },
  ];

  for (const dossier of dossiers) {
    await prisma.dossier.upsert({
      where: { tenantId_numero: { tenantId: tenant.id, numero: dossier.numero } },
      update: {},
      create: dossier,
    });
  }

  console.log(`   ✅ ${dossiers.length} dossiers créés`);

  // ============================================================
  // 6. EMAILS — 5 emails réalistes
  // ============================================================
  console.log('📧 Création des emails...');

  const emails = [
    {
      id: uuid(),
      tenantId: tenant.id,
      messageId: `msg-demo-001@email.com`,
      from: 'Ahmed BENALI <ahmed.benali@email.com>',
      to: 'cabinet@martin-avocats.fr',
      subject: 'URGENT — Notification OQTF reçue ce matin',
      body: `Maître,\n\nJe viens de recevoir ce matin une notification d'obligation de quitter le territoire français (OQTF). Le courrier est daté du 18 juin 2026.\n\nJe suis en France depuis 2018, j'ai un emploi stable et mes enfants sont scolarisés ici. Je suis très inquiet.\n\nPouvez-vous me recevoir en urgence pour préparer un recours ?\n\nMerci,\nAhmed BENALI\n06 12 34 56 78`,
      category: 'oqtf',
      urgency: 'critical',
      sentiment: 'anxious',
      isRead: true,
      isProcessed: true,
      clientId: clientIds[0],
      dossierId: dossierIds[0],
      receivedAt: new Date('2026-06-20T09:15:00'),
      aiAnalysis: JSON.stringify({
        client: 'Ahmed BENALI',
        type: 'OQTF',
        urgency: 'critical',
        deadline: '2026-07-20',
        summary: 'Client notifié OQTF le 18/06. En France depuis 2018, emploi stable, enfants scolarisés. Demande RDV urgent pour recours.',
        confidence: 0.92,
      }),
      updatedAt: new Date(),
    },
    {
      id: uuid(),
      tenantId: tenant.id,
      messageId: `msg-demo-002@email.com`,
      from: 'Fatima DIALLO <fatima.diallo@email.com>',
      to: 'cabinet@martin-avocats.fr',
      subject: 'Suivi dossier titre de séjour — documents complémentaires',
      body: `Bonjour Maître Martin,\n\nSuite à notre dernier échange, je vous envoie les documents demandés :\n- 3 derniers bulletins de salaire\n- Attestation employeur\n- Quittances de loyer\n\nMon employeur me confirme que le contrat CDI est bien en cours. La préfecture m'a dit qu'il fallait compter 3-4 mois pour le traitement.\n\nBien cordialement,\nFatima DIALLO`,
      category: 'titre_sejour',
      urgency: 'medium',
      sentiment: 'neutral',
      isRead: true,
      isProcessed: true,
      clientId: clientIds[1],
      dossierId: dossierIds[1],
      receivedAt: new Date('2026-06-28T14:30:00'),
      aiAnalysis: JSON.stringify({
        client: 'Fatima DIALLO',
        type: 'Titre de séjour',
        urgency: 'medium',
        summary: 'Envoi documents complémentaires (bulletins salaire, attestation employeur, quittances). Préfecture annonce 3-4 mois de traitement.',
        confidence: 0.88,
      }),
      updatedAt: new Date(),
    },
    {
      id: uuid(),
      tenantId: tenant.id,
      messageId: `msg-demo-003@email.com`,
      from: 'Préfecture de Paris <noreply@prefecture-paris.gouv.fr>',
      to: 'cabinet@martin-avocats.fr',
      subject: 'Convocation entretien — Dossier PETROV Dmitri',
      body: `Cabinet Martin & Associés,\n\nNous avons l'honneur de vous informer que M. PETROV Dmitri est convoqué pour un entretien dans le cadre de sa demande de naturalisation.\n\nDate : 15 septembre 2026 à 10h00\nLieu : Préfecture de Paris, Bureau des naturalisations, 2ème étage\n\nDocuments à apporter :\n- Pièce d'identité\n- Justificatif de domicile récent\n- Attestation de niveau de français (B1 minimum)\n\nCordialement,\nService des naturalisations`,
      category: 'naturalisation',
      urgency: 'low',
      sentiment: 'neutral',
      isRead: false,
      isProcessed: false,
      clientId: clientIds[2],
      receivedAt: new Date('2026-07-03T11:00:00'),
      updatedAt: new Date(),
    },
    {
      id: uuid(),
      tenantId: tenant.id,
      messageId: `msg-demo-004@email.com`,
      from: 'Tribunal Administratif <greffe@ta-paris.fr>',
      to: 'cabinet@martin-avocats.fr',
      subject: 'Accusé de réception recours n°2607890 — BENALI',
      body: `Maître,\n\nNous accusons réception de votre requête en annulation de l'OQTF concernant M. BENALI Ahmed, enregistrée sous le numéro 2607890.\n\nL'audience est fixée au 12 août 2026 à 14h00, salle 3.\n\nVeuillez produire votre mémoire complémentaire avant le 1er août 2026.\n\nLe Greffier en chef`,
      category: 'oqtf',
      urgency: 'high',
      sentiment: 'neutral',
      isRead: false,
      isProcessed: false,
      clientId: clientIds[0],
      dossierId: dossierIds[0],
      receivedAt: new Date('2026-07-04T08:45:00'),
      updatedAt: new Date(),
    },
    {
      id: uuid(),
      tenantId: tenant.id,
      messageId: `msg-demo-005@email.com`,
      from: 'nouveau.client@gmail.com',
      to: 'cabinet@martin-avocats.fr',
      subject: 'Demande de RDV — refus de visa regroupement familial',
      body: `Bonjour,\n\nJe me permets de vous contacter sur recommandation de M. Petrov.\n\nJe suis M. Youssef KADDOURI, de nationalité marocaine, résidant à Lyon. Mon épouse et mes deux enfants se sont vu refuser le visa de regroupement familial par le consulat de Casablanca.\n\nLe refus date du 25 juin 2026. J'ai un CDI depuis 4 ans et un logement adapté.\n\nPouvez-vous me dire si un recours est possible et quels sont les délais ?\n\nCordialement,\nYoussef KADDOURI\n07 66 55 44 33`,
      category: 'regroupement_familial',
      urgency: 'high',
      sentiment: 'worried',
      isRead: false,
      isProcessed: false,
      receivedAt: new Date('2026-07-03T17:20:00'),
      updatedAt: new Date(),
    },
  ];

  for (const email of emails) {
    await prisma.email.upsert({
      where: { tenantId_messageId: { tenantId: tenant.id, messageId: email.messageId } },
      update: {},
      create: email,
    });
  }

  console.log(`   ✅ ${emails.length} emails créés`);

  // ============================================================
  // 7. DEADLINES — Alertes délais légaux
  // ============================================================
  console.log('⏰ Création des deadlines...');

  const deadlines = [
    {
      id: uuid(),
      tenantId: tenant.id,
      dossierId: dossierIds[0],
      clientId: clientIds[0],
      type: 'RECOURS_CONTENTIEUX',
      label: 'Délai recours OQTF — M. BENALI',
      description: 'Délai de 30 jours pour recours contentieux contre OQTF',
      referenceDate: new Date('2026-06-20'),
      dueDate: new Date('2026-07-20'),
      status: 'PENDING',
      legalBasis: 'L512-1 CESEDA',
      legalDays: 30,
      createdBy: avocat.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuid(),
      tenantId: tenant.id,
      dossierId: dossierIds[0],
      clientId: clientIds[0],
      type: 'PRODUCTION_PIECES',
      label: 'Mémoire complémentaire — BENALI',
      description: 'Production du mémoire complémentaire avant audience du 12/08',
      referenceDate: new Date('2026-07-04'),
      dueDate: new Date('2026-08-01'),
      status: 'PENDING',
      legalBasis: 'Ordonnance du juge',
      legalDays: 28,
      createdBy: avocat.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const deadline of deadlines) {
    await prisma.legalDeadline.create({ data: deadline });
  }

  console.log(`   ✅ ${deadlines.length} deadlines créées`);

  // ============================================================
  // RÉSUMÉ
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('🎉 ENVIRONNEMENT DE DÉMO PRÊT !');
  console.log('='.repeat(60));
  console.log('');
  console.log('🔑 ACCÈS :');
  console.log('   URL     : https://memolib.space (ou http://localhost:3000)');
  console.log('   Email   : demo@memolib.fr');
  console.log('   Mot de passe : Demo2026!');
  console.log('');
  console.log('📊 DONNÉES CRÉÉES :');
  console.log(`   • Cabinet  : ${tenant.name}`);
  console.log(`   • Clients  : ${clients.length} (BENALI, DIALLO, PETROV)`);
  console.log(`   • Dossiers : ${dossiers.length} (OQTF, titre séjour, naturalisation)`);
  console.log(`   • Emails   : ${emails.length} (dont 2 non lus à traiter)`);
  console.log(`   • Deadlines: ${deadlines.length} (dont 1 urgente J-16)`);
  console.log('');
  console.log('🎯 SCÉNARIO DE TEST SUGGÉRÉ :');
  console.log('   1. Se connecter → voir le dashboard avec alertes');
  console.log('   2. Ouvrir les emails non lus → voir le résumé IA');
  console.log('   3. Email "nouveau client" → créer dossier en 1 clic');
  console.log('   4. Dossier BENALI → générer un document (mémoire)');
  console.log('   5. Recherche jurisprudence → "OQTF vie familiale"');
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
