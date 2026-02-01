/**
 * Test Document OCR - Phase 7
 * Upload et extraction texte automatique
 */

import { PrismaClient } from '@prisma/client';
import { DocumentOCRService } from '../frontend/lib/services/document-ocr.service';
import { EventLogService } from '../lib/services/event-log.service';

const prisma = new PrismaClient();
const eventLogService = new EventLogService(prisma);
const documentOCRService = new DocumentOCRService(prisma, eventLogService);

async function testDocumentOCR() {
  console.log('🧪 TEST DOCUMENT OCR - Phase 7\n');

  try {
    // Setup
    console.log('📦 Setup: Création tenant + user + dossier...');

    let freePlan = await prisma.plan.findUnique({ where: { name: 'free' } });
    if (!freePlan) {
      freePlan = await prisma.plan.create({
        data: {
          name: 'free',
          displayName: 'Gratuit',
          priceMonthly: 0,
          priceYearly: 0,
        },
      });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: 'Cabinet Test OCR',
        subdomain: `ocr-test-${Date.now()}`,
        planId: freePlan.id,
      },
    });
    console.log(`✅ Tenant: ${tenant.id}`);

    const user = await prisma.user.create({
      data: {
        email: `avocat.ocr.${Date.now()}@cabinet.com`,
        name: 'Maître OCR',
        password: 'hash',
        role: 'lawyer',
        tenantId: tenant.id,
      },
    });

    const client = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Marie',
        lastName: 'Martin',
        email: `client.ocr.${Date.now()}@example.com`,
      },
    });

    const dossier = await prisma.dossier.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        numero: `${Date.now()}`,
        typeDossier: 'titre_de_sejour',
        objet: 'Recours TA Paris',
      },
    });
    console.log(`✅ Dossier: ${dossier.numero}\n`);

    // ==========================================
    // TEST 1: Upload document + OCR automatique
    // ==========================================
    console.log('📄 TEST 1: Upload document PDF...');

    const document1 = await prisma.document.create({
      data: {
        tenantId: tenant.id,
        dossierId: dossier.id,
        clientId: client.id,
        filename: 'jugement-ta-paris.pdf',
        originalName: 'jugement-ta-paris.pdf',
        mimeType: 'application/pdf',
        size: 125000,
        storageKey: `documents/${Date.now()}-jugement.pdf`,
        category: 'jugement',
        uploadedBy: user.id,
      },
    });

    console.log(`✅ Document créé: ${document1.id}`);
    console.log(`   Filename: ${document1.filename}`);
    console.log(`   OCR processed: ${document1.ocrProcessed}\n`);

    // ==========================================
    // TEST 2: Trigger OCR processing
    // ==========================================
    console.log('🔍 TEST 2: Traitement OCR...');

    const ocrResult = await documentOCRService.processDocument({
      documentId: document1.id,
      tenantId: tenant.id,
      mimeType: document1.mimeType,
    });

    console.log(`✅ OCR terminé:`);
    console.log(`   Texte extrait: ${ocrResult.text.length} caractères`);
    console.log(`   Mots: ${ocrResult.wordCount}`);
    console.log(`   Confidence: ${(ocrResult.confidence * 100).toFixed(1)}%`);
    console.log(`   Langue: ${ocrResult.language}\n`);

    // ==========================================
    // TEST 3: Vérifier entités extraites
    // ==========================================
    console.log('🏷️ TEST 3: Entités extraites...');

    console.log(`✅ Dates trouvées: ${ocrResult.entities.dates?.length || 0}`);
    ocrResult.entities.dates?.slice(0, 3).forEach((date: string) => {
      console.log(`   - ${date}`);
    });

    console.log(`\n✅ Noms trouvés: ${ocrResult.entities.names?.length || 0}`);
    ocrResult.entities.names?.slice(0, 5).forEach((name: string) => {
      console.log(`   - ${name}`);
    });

    console.log(`\n✅ Numéros trouvés: ${ocrResult.entities.numbers?.length || 0}`);
    ocrResult.entities.numbers?.forEach((num: string) => {
      console.log(`   - ${num}`);
    });

    console.log(`\n✅ Emails trouvés: ${ocrResult.entities.emails?.length || 0}`);
    ocrResult.entities.emails?.forEach((email: string) => {
      console.log(`   - ${email}`);
    });
    console.log('');

    // ==========================================
    // TEST 4: Vérifier DB update
    // ==========================================
    console.log('🗄️ TEST 4: Vérifier DB...');

    const updatedDoc = await prisma.document.findUnique({
      where: { id: document1.id },
    });

    console.log(`✅ Document mis à jour:`);
    console.log(`   ocrProcessed: ${updatedDoc?.ocrProcessed}`);
    console.log(`   ocrText length: ${updatedDoc?.ocrText?.length || 0}`);
    console.log(`   ocrConfidence: ${updatedDoc?.ocrConfidence}`);
    console.log(`   extractedData: ${updatedDoc?.extractedData ? 'Yes' : 'No'}\n`);

    // ==========================================
    // TEST 5: Vérifier EventLog
    // ==========================================
    console.log('🔐 TEST 5: Vérifier EventLog...');

    const ocrEvents = await prisma.eventLog.findMany({
      where: {
        tenantId: tenant.id,
        eventType: 'DOCUMENT_OCR_PROCESSED',
      },
    });

    console.log(`✅ Events DOCUMENT_OCR_PROCESSED: ${ocrEvents.length}`);
    ocrEvents.forEach((e: any, idx: number) => {
      const meta = e.metadata as any;
      console.log(`   ${idx + 1}. ${meta.filename}: ${meta.textLength} chars, confidence ${(meta.confidence * 100).toFixed(1)}%`);
      console.log(`      Entities: ${meta.entitiesFound.dates} dates, ${meta.entitiesFound.names} names, ${meta.entitiesFound.emails} emails`);
    });
    console.log('');

    // ==========================================
    // TEST 6: Créer 2e document pour test search
    // ==========================================
    console.log('📄 TEST 6: Upload 2e document...');

    const document2 = await prisma.document.create({
      data: {
        tenantId: tenant.id,
        dossierId: dossier.id,
        filename: 'recours-oqtf.pdf',
        originalName: 'recours-oqtf.pdf',
        mimeType: 'application/pdf',
        size: 85000,
        storageKey: `documents/${Date.now()}-recours.pdf`,
        category: 'recours',
        uploadedBy: user.id,
      },
    });

    await documentOCRService.processDocument({
      documentId: document2.id,
      tenantId: tenant.id,
      mimeType: document2.mimeType,
    });

    console.log(`✅ 2e document traité: ${document2.filename}\n`);

    // ==========================================
    // TEST 7: Recherche full-text
    // ==========================================
    console.log('🔎 TEST 7: Recherche full-text...');

    const searchResult1 = await documentOCRService.searchDocuments(tenant.id, {
      query: 'DUPONT',
    });

    console.log(`✅ Recherche "DUPONT": ${searchResult1.total} résultats`);
    searchResult1.documents.forEach((doc: any) => {
      console.log(`   - ${doc.filename}`);
      console.log(`     Highlight: ${doc.highlight.substring(0, 100)}...`);
    });
    console.log('');

    const searchResult2 = await documentOCRService.searchDocuments(tenant.id, {
      query: 'territoire',
    });

    console.log(`✅ Recherche "territoire": ${searchResult2.total} résultats`);
    console.log('');

    const searchResult3 = await documentOCRService.searchDocuments(tenant.id, {
      query: 'xyz_non_existant',
    });

    console.log(`✅ Recherche "xyz_non_existant": ${searchResult3.total} résultats\n`);

    // ==========================================
    // TEST 8: Stats OCR
    // ==========================================
    console.log('📊 TEST 8: Stats OCR...');

    const stats = await documentOCRService.getOCRStats(tenant.id);

    console.log(`✅ Stats OCR:`);
    console.log(`   Total documents: ${stats.totalDocuments}`);
    console.log(`   Documents traités: ${stats.processedDocuments}`);
    console.log(`   En attente: ${stats.pendingDocuments}`);
    console.log(`   Confidence moyenne: ${(stats.averageConfidence * 100).toFixed(1)}%`);
    console.log(`   Taux traitement: ${stats.processingRate.toFixed(1)}%\n`);

    // ==========================================
    // VALIDATIONS
    // ==========================================
    console.log('🧪 VALIDATIONS...\n');

    const checks = [
      {
        name: 'Document créé',
        condition: !!document1,
      },
      {
        name: 'OCR exécuté avec succès',
        condition: ocrResult.text.length > 0,
      },
      {
        name: 'Texte extrait (>100 chars)',
        condition: ocrResult.text.length > 100,
      },
      {
        name: 'Confidence score valide (>0.8)',
        condition: ocrResult.confidence > 0.8,
      },
      {
        name: 'Dates extraites (≥3)',
        condition: (ocrResult.entities.dates?.length || 0) >= 3,
      },
      {
        name: 'Noms extraits (≥1)',
        condition: (ocrResult.entities.names?.length || 0) >= 1,
      },
      {
        name: 'Emails extraits (≥1)',
        condition: (ocrResult.entities.emails?.length || 0) >= 1,
      },
      {
        name: 'DB mise à jour (ocrProcessed = true)',
        condition: updatedDoc?.ocrProcessed === true,
      },
      {
        name: 'EventLog DOCUMENT_OCR_PROCESSED créé',
        condition: ocrEvents.length >= 1,
      },
      {
        name: 'Recherche "DUPONT" trouve résultats',
        condition: searchResult1.total > 0,
      },
      {
        name: 'Recherche "territoire" trouve résultats',
        condition: searchResult2.total > 0,
      },
      {
        name: 'Recherche inexistante retourne 0',
        condition: searchResult3.total === 0,
      },
      {
        name: 'Stats correctes (2 docs processés)',
        condition: stats.processedDocuments === 2 && stats.processingRate === 100,
      },
    ];

    let passed = 0;
    checks.forEach((check) => {
      if (check.condition) {
        console.log(`✅ ${check.name}`);
        passed++;
      } else {
        console.log(`❌ ${check.name}`);
      }
    });

    console.log(`\n📊 Résultat: ${passed}/${checks.length} validations passées\n`);

    // Cleanup
    console.log('🧹 Cleanup (partiel - EventLog conservés)...');
    await prisma.document.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.dossier.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.client.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
    console.log('✅ Cleanup terminé\n');

    if (passed === checks.length) {
      console.log('🎉 DOCUMENT OCR VALIDÉ - Tous les tests passent !');
    } else {
      console.log('⚠️ Certains tests ont échoué');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testDocumentOCR();
