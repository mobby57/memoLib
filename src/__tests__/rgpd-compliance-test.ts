/**
 * TEST RGPD COMPLIANCE - Phase 9 FINALE
 *
 * Validation conformité RGPD:
 * - Export données personnelles (Art. 15 + 20)
 * - Anonymisation utilisateur (Art. 17)
 * - Suppression données CASCADE (Art. 17)
 * - Consentements (Art. 7)
 * - EventLog traçabilité
 */

import { PrismaClient } from '@prisma/client';
import { RGPDComplianceService } from '../frontend/lib/services/rgpd-compliance.service';

const prisma = new PrismaClient();
const rgpdService = new RGPDComplianceService();

async function testRGPDCompliance() {
  console.log('🧪 TEST RGPD COMPLIANCE - Phase 9 FINALE\n');

  let tenantId: string;
  let userId: string;
  let dossierId: string;
  let documentId: string;
  let chatSessionId: string;
  let exportRequestId: string;

  try {
    // Setup
    console.log('📦 Setup: Création tenant + user complet...');

    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test RGPD Tenant',
        subdomain: `rgpd-test-${Date.now()}`,
        planId: (await prisma.plan.findFirst())!.id,
      },
    });
    tenantId = tenant.id;
    console.log(`✅ Tenant: ${tenantId}`);

    const user = await prisma.user.create({
      data: {
        email: `rgpd-test-${Date.now()}@test.com`,
        name: 'Jean DUPONT',
        password: 'test123',
        role: 'lawyer',
        phone: '+33612345678',
        tenantId,
      },
    });
    userId = user.id;
    console.log(`✅ User: ${userId}`);

    const client = await prisma.client.create({
      data: {
        firstName: 'Marie',
        lastName: 'MARTIN',
        email: 'marie.martin@test.com',
        phone: '+33698765432',
        tenantId,
      },
    });

    const dossier = await prisma.dossier.create({
      data: {
        numero: `RGPD-${Date.now()}`,
        typeDossier: 'contentieux_administratif',
        objet: 'Test RGPD',
        responsableId: userId,
        tenantId,
        clientId: client.id,
      },
    });
    dossierId = dossier.id;
    console.log(`✅ Dossier: ${dossierId}`);

    // Documents
    const document = await prisma.document.create({
      data: {
        tenant: { connect: { id: tenantId } },
        dossier: { connect: { id: dossierId } },
        filename: 'test-rgpd.pdf',
        originalName: 'Test RGPD.pdf',
        mimeType: 'application/pdf',
        size: 50000,
        storageKey: 'test-rgpd-key',
        category: 'general',
        uploader: { connect: { id: userId } },
      },
    });
    documentId = document.id;
    console.log(`✅ Document: ${documentId}`);

    // Commentaire
    await prisma.comment.create({
      data: {
        tenantId,
        content: 'Commentaire test RGPD avec données personnelles',
        entityType: 'dossier',
        entityId: dossierId,
        authorId: userId,
      },
    });

    // Session chat
    const chatSession = await prisma.chatSession.create({
      data: {
        tenantId,
        userId,
        dossierId,
        title: 'Session test RGPD',
        messages: {
          create: [
            {
              userId,
              role: 'user',
              content: 'Question juridique test',
            },
          ],
        },
      },
    });
    chatSessionId = chatSession.id;
    console.log(`✅ ChatSession: ${chatSessionId}\n`);

    // ===========================================
    // TEST 1: Grant Consent
    // ===========================================
    console.log('✅ TEST 1: Grant Consent...');

    const consent1 = await rgpdService.grantConsent({
      userId,
      tenantId,
      purpose: 'data_processing',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 Test',
    });

    console.log(`✅ Consent accordé: ${consent1.id}`);
    console.log(`   Purpose: ${consent1.purpose}`);
    console.log(`   Granted: ${consent1.granted}\n`);

    const consent2 = await rgpdService.grantConsent({
      userId,
      tenantId,
      purpose: 'marketing',
    });

    console.log(`✅ 2e consent accordé: ${consent2.id} (marketing)\n`);

    // ===========================================
    // TEST 2: List Consents
    // ===========================================
    console.log('📋 TEST 2: List Consents...');

    const consents = await rgpdService.listUserConsents({ userId, tenantId });

    console.log(`✅ Consentements: ${consents.length}`);
    consents.forEach((c, idx) => {
      console.log(`   ${idx + 1}. ${c.purpose} - granted: ${c.granted}`);
    });
    console.log('');

    // ===========================================
    // TEST 3: Revoke Consent
    // ===========================================
    console.log('🚫 TEST 3: Revoke Consent...');

    const revokedConsent = await rgpdService.revokeConsent({
      consentId: consent2.id,
      userId,
      tenantId,
    });

    console.log(`✅ Consent révoqué: ${revokedConsent.id}`);
    console.log(`   Purpose: ${revokedConsent.purpose}`);
    console.log(`   Granted: ${revokedConsent.granted}`);
    console.log(`   RevokedAt: ${revokedConsent.revokedAt?.toISOString()}\n`);

    // ===========================================
    // TEST 4: Export User Data
    // ===========================================
    console.log('📦 TEST 4: Export User Data (RGPD Art. 15+20)...');

    const exportResult = await rgpdService.exportUserData({
      userId,
      tenantId,
      requestedBy: userId,
    });

    exportRequestId = exportResult.requestId;

    console.log(`✅ Export créé: ${exportRequestId}`);
    console.log(`   Data size: ${exportResult.exportData.exportMetadata.dataSize} bytes`);
    console.log(`   Items: ${exportResult.exportData.exportMetadata.itemsCount}`);
    console.log(`   Dossiers: ${exportResult.exportData.dossiers.length}`);
    console.log(`   Documents: ${exportResult.exportData.documents.length}`);
    console.log(`   Comments: ${exportResult.exportData.comments.length}`);
    console.log(`   ChatSessions: ${exportResult.exportData.chatSessions.length}`);
    console.log(`   Consents: ${exportResult.exportData.consents.length}\n`);

    // ===========================================
    // TEST 5: Vérifier contenu export
    // ===========================================
    console.log('🔍 TEST 5: Vérifier contenu export...');

    const exportData = exportResult.exportData;

    console.log(`✅ User exporté:`);
    console.log(`   Email: ${exportData.user.email}`);
    console.log(`   Name: ${exportData.user.name}`);
    console.log(`   Phone: ${exportData.user.phone}\n`);

    // ===========================================
    // TEST 6: Get Export Request
    // ===========================================
    console.log('📄 TEST 6: Get Export Request...');

    const exportRequest = await rgpdService.getExportRequest(exportRequestId);

    console.log(`✅ Export request status: ${exportRequest.status}`);
    console.log(`   ExportUrl: ${exportRequest.exportUrl}`);
    console.log(`   ExpiresAt: ${exportRequest.expiresAt?.toISOString()}\n`);

    // ===========================================
    // TEST 7: EventLog CONSENT_GRANTED
    // ===========================================
    console.log('🔐 TEST 7: Vérifier EventLog CONSENT_GRANTED...');

    const consentEvents = await prisma.eventLog.findMany({
      where: {
        tenantId,
        eventType: 'CONSENT_GRANTED',
      },
      orderBy: { timestamp: 'desc' },
    });

    console.log(`✅ Events CONSENT_GRANTED: ${consentEvents.length}`);
    if (consentEvents.length > 0) {
      const evt = consentEvents[0];
      const meta = evt.metadata as any;
      console.log(`   Purpose: ${meta.purpose}`);
      console.log(`   IP: ${meta.ipAddress}\n`);
    }

    // ===========================================
    // TEST 8: EventLog CONSENT_REVOKED
    // ===========================================
    console.log('🔐 TEST 8: Vérifier EventLog CONSENT_REVOKED...');

    const revokedEvents = await prisma.eventLog.findMany({
      where: {
        tenantId,
        eventType: 'CONSENT_REVOKED',
      },
    });

    console.log(`✅ Events CONSENT_REVOKED: ${revokedEvents.length}\n`);

    // ===========================================
    // TEST 9: EventLog DATA_EXPORTED
    // ===========================================
    console.log('🔐 TEST 9: Vérifier EventLog DATA_EXPORTED...');

    const exportEvents = await prisma.eventLog.findMany({
      where: {
        tenantId,
        eventType: 'DATA_EXPORTED',
      },
    });

    console.log(`✅ Events DATA_EXPORTED: ${exportEvents.length}`);
    if (exportEvents.length > 0) {
      const evt = exportEvents[0];
      const meta = evt.metadata as any;
      console.log(`   Data size: ${meta.dataSize} bytes`);
      console.log(`   Items count: ${meta.itemsCount}\n`);
    }

    // ===========================================
    // TEST 10: Anonymize User
    // ===========================================
    console.log('🎭 TEST 10: Anonymize User (RGPD Art. 17)...');

    // Créer 2e user pour anonymisation
    const userToAnonymize = await prisma.user.create({
      data: {
        email: `anonymize-test-${Date.now()}@test.com`,
        name: 'User To Anonymize',
        password: 'test123',
        role: 'user',
        phone: '+33600000000',
        tenantId,
      },
    });

    const anonymizeResult = await rgpdService.anonymizeUser({
      userId: userToAnonymize.id,
      tenantId,
      requestedBy: userId,
    });

    console.log(`✅ User anonymisé: ${anonymizeResult.userId}`);
    console.log(`   Fields anonymisés: ${anonymizeResult.anonymizedFields.join(', ')}`);
    console.log(`   Tables affectées: ${anonymizeResult.tablesAffected.join(', ')}\n`);

    // Vérifier anonymisation
    const anonymizedUser = await prisma.user.findUnique({
      where: { id: userToAnonymize.id },
    });

    console.log(`✅ Vérification anonymisation:`);
    console.log(`   Email: ${anonymizedUser?.email}`);
    console.log(`   Name: ${anonymizedUser?.name}`);
    console.log(`   Phone: ${anonymizedUser?.phone}\n`);

    // ===========================================
    // TEST 11: EventLog DATA_ANONYMIZED
    // ===========================================
    console.log('🔐 TEST 11: Vérifier EventLog DATA_ANONYMIZED...');

    const anonymizeEvents = await prisma.eventLog.findMany({
      where: {
        tenantId,
        eventType: 'DATA_ANONYMIZED',
      },
    });

    console.log(`✅ Events DATA_ANONYMIZED: ${anonymizeEvents.length}\n`);

    // ===========================================
    // TEST 12: Delete User Data
    // ===========================================
    console.log('🗑️  TEST 12: Delete User Data CASCADE (RGPD Art. 17)...');

    // Créer 3e user pour suppression
    const userToDelete = await prisma.user.create({
      data: {
        email: `delete-test-${Date.now()}@test.com`,
        name: 'User To Delete',
        password: 'test123',
        role: 'user',
        tenantId,
      },
    });

    // Créer données associées
    await prisma.comment.create({
      data: {
        tenantId,
        content: 'Comment to be deleted',
        entityType: 'dossier',
        entityId: dossierId,
        authorId: userToDelete.id,
      },
    });

    const deleteResult = await rgpdService.deleteUserData({
      userId: userToDelete.id,
      tenantId,
      requestedBy: userId,
    });

    console.log(`✅ User supprimé: ${deleteResult.userId}`);
    console.log(`   Total records: ${deleteResult.totalDeleted}`);
    console.log(`   Tables:`);
    Object.entries(deleteResult.deletedRecords).forEach(([table, count]) => {
      console.log(`     - ${table}: ${count}`);
    });
    console.log('');

    // Vérifier suppression
    const deletedUser = await prisma.user.findUnique({
      where: { id: userToDelete.id },
    });

    console.log(`✅ User vraiment supprimé: ${deletedUser === null}\n`);

    // ===========================================
    // TEST 13: EventLog DATA_DELETED
    // ===========================================
    console.log('🔐 TEST 13: Vérifier EventLog DATA_DELETED...');

    const deleteEvents = await prisma.eventLog.findMany({
      where: {
        tenantId,
        eventType: 'DATA_DELETED',
      },
    });

    console.log(`✅ Events DATA_DELETED: ${deleteEvents.length}\n`);

    // ===========================================
    // VALIDATIONS
    // ===========================================
    console.log('🧪 VALIDATIONS...\n');

    const validations = [
      { test: 'Consent accordé', pass: !!consent1.id && consent1.granted },
      {
        test: 'Consent révoqué',
        pass: revokedConsent.granted === false && !!revokedConsent.revokedAt,
      },
      { test: 'Liste consentements (≥2)', pass: consents.length >= 2 },
      { test: 'Export données créé', pass: !!exportRequestId },
      { test: 'Export contient user', pass: !!exportData.user.email },
      { test: 'Export contient dossiers (≥1)', pass: exportData.dossiers.length >= 1 },
      { test: 'Export contient documents (≥1)', pass: exportData.documents.length >= 1 },
      { test: 'Export contient comments (≥1)', pass: exportData.comments.length >= 1 },
      { test: 'Export request status completed', pass: exportRequest.status === 'completed' },
      {
        test: 'User anonymisé (email changed)',
        pass: anonymizedUser?.email.includes('anonymized') || false,
      },
      {
        test: 'User anonymisé (name changed)',
        pass: anonymizedUser?.name === 'Utilisateur Anonymisé',
      },
      { test: 'User supprimé (null)', pass: deletedUser === null },
      { test: 'EventLog CONSENT_GRANTED (≥2)', pass: consentEvents.length >= 2 },
      { test: 'EventLog CONSENT_REVOKED (≥1)', pass: revokedEvents.length >= 1 },
      { test: 'EventLog DATA_EXPORTED (≥1)', pass: exportEvents.length >= 1 },
      { test: 'EventLog DATA_ANONYMIZED (≥1)', pass: anonymizeEvents.length >= 1 },
      { test: 'EventLog DATA_DELETED (≥1)', pass: deleteEvents.length >= 1 },
    ];

    validations.forEach(v => {
      console.log(`${v.pass ? '✅' : '❌'} ${v.test}`);
    });

    const passedCount = validations.filter(v => v.pass).length;
    console.log(`\n📊 Résultat: ${passedCount}/${validations.length} validations passées\n`);

    if (passedCount === validations.length) {
      console.log('🎉 RGPD COMPLIANCE VALIDÉ - Tous les tests passent !');
      console.log(
        '✅ Conformité RGPD complète: Art. 7 (consentements), Art. 15 (accès), Art. 17 (effacement), Art. 20 (portabilité)'
      );
    } else {
      console.log('❌ ÉCHEC - Certains tests ont échoué');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur test:', error);
    throw error;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleanup...');

    if (chatSessionId) {
      await prisma.chatMessage.deleteMany({ where: { sessionId: chatSessionId } });
      await prisma.chatSession.delete({ where: { id: chatSessionId } }).catch(() => {});
    }

    if (documentId) {
      await prisma.document.delete({ where: { id: documentId } }).catch(() => {});
    }

    if (dossierId) {
      await prisma.dossier.delete({ where: { id: dossierId } }).catch(() => {});
    }

    if (userId) {
      await prisma.dataExportRequest.deleteMany({ where: { userId } });
      await prisma.consentRecord.deleteMany({ where: { userId } });
      await prisma.comment.deleteMany({ where: { authorId: userId } });
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }

    // EventLog + Tenant : garder pour audit
    console.log('✅ Cleanup terminé (EventLog + Tenant conservés)\n');

    await prisma.$disconnect();
  }
}

testRGPDCompliance().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
