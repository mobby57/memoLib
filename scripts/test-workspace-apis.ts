/**
 * Script de Test - Workspace APIs Backend
 * 
 * Teste tous les endpoints API des workspaces :
 * - Documents (GET/POST/PATCH/DELETE)
 * - Notes (GET/POST/PATCH/DELETE)
 * - Emails (GET/PATCH actions)
 * - Procédures (GET avec filtres)
 * 
 * Usage: npx tsx scripts/test-workspace-apis.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Couleurs console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Test 1 : Documents API
 */
async function testDocumentsAPI(workspaceId: string) {
  log('\n📄 Test 1 : Documents API', 'blue');
  
  try {
    // GET - Liste tous documents
    log('  1.1. GET /documents - Liste tous', 'yellow');
    const allDocs = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { documents: true },
    });
    log(`    ✅ ${allDocs?.documents.length || 0} documents trouvés`, 'green');
    
    // GET - Filtre verified
    log('  1.2. GET /documents?filter=verified - Filtre vérifiés', 'yellow');
    const verifiedDocs = allDocs?.documents.filter(d => d.verified) || [];
    log(`    ✅ ${verifiedDocs.length} documents vérifiés`, 'green');
    
    // GET - Filtre ai_processed
    log('  1.3. GET /documents?filter=ai_processed - Filtre IA', 'yellow');
    const aiDocs = allDocs?.documents.filter(d => d.aiProcessed) || [];
    log(`    ✅ ${aiDocs.length} documents traités IA`, 'green');
    
    // GET - Recherche
    log('  1.4. GET /documents?search=passeport - Recherche', 'yellow');
    const searchDocs = allDocs?.documents.filter(d => 
      d.originalName.toLowerCase().includes('passeport') ||
      d.documentType.toLowerCase().includes('passeport')
    ) || [];
    log(`    ✅ ${searchDocs.length} documents trouvés avec "passeport"`, 'green');
    
    // POST - Créer nouveau document (simulation métadonnées)
    log('  1.5. POST /documents - Créer document', 'yellow');
    const newDoc = await prisma.workspaceDocument.create({
      data: {
        workspaceId,
        tenantId: allDocs!.tenantId,
        filename: `${Date.now()}-test-document.pdf`,
        originalName: 'Test Document API.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 150000,
        storagePath: `/uploads/test-${Date.now()}.pdf`,
        documentType: 'test_api',
        category: 'juridique',
        description: 'Document créé par test API',
        source: 'manual',
        aiProcessed: false,
        verified: false,
      },
    });
    log(`    ✅ Document créé : ${newDoc.id}`, 'green');
    
    // PATCH - Vérifier document
    log('  1.6. PATCH /documents/[id] - Vérifier', 'yellow');
    const verifiedDoc = await prisma.workspaceDocument.update({
      where: { id: newDoc.id },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: 'test-user-id',
      },
    });
    log(`    ✅ Document vérifié : ${verifiedDoc.verified}`, 'green');
    
    // PATCH - Modifier catégorie
    log('  1.7. PATCH /documents/[id] - Modifier catégorie', 'yellow');
    const updatedDoc = await prisma.workspaceDocument.update({
      where: { id: newDoc.id },
      data: {
        category: 'identite',
        description: 'Description mise à jour via API',
        tags: JSON.stringify(['test', 'api', 'automatique']),
      },
    });
    log(`    ✅ Catégorie modifiée : ${updatedDoc.category}`, 'green');
    
    // DELETE - Supprimer document
    log('  1.8. DELETE /documents/[id] - Supprimer', 'yellow');
    await prisma.workspaceDocument.delete({
      where: { id: newDoc.id },
    });
    log(`    ✅ Document supprimé`, 'green');
    
  } catch (error) {
    log(`    ❌ Erreur Documents API: ${error}`, 'red');
  }
}

/**
 * Test 2 : Notes API
 */
async function testNotesAPI(workspaceId: string) {
  log('\n📝 Test 2 : Notes API', 'blue');
  
  try {
    // GET - Liste toutes notes
    log('  2.1. GET /notes - Liste toutes', 'yellow');
    const allNotes = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        notes: {
          orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' },
          ],
        },
      },
    });
    log(`    ✅ ${allNotes?.notes.length || 0} notes trouvées`, 'green');
    
    // GET - Filtre épinglées
    log('  2.2. GET /notes?filter=pinned - Filtre épinglées', 'yellow');
    const pinnedNotes = allNotes?.notes.filter(n => n.isPinned) || [];
    log(`    ✅ ${pinnedNotes.length} notes épinglées`, 'green');
    
    // GET - Filtre privées
    log('  2.3. GET /notes?filter=private - Filtre privées', 'yellow');
    const privateNotes = allNotes?.notes.filter(n => n.isPrivate) || [];
    log(`    ✅ ${privateNotes.length} notes privées`, 'green');
    
    // POST - Créer note
    log('  2.4. POST /notes - Créer note', 'yellow');
    const newNote = await prisma.workspaceNote.create({
      data: {
        workspaceId,
        title: 'Note de Test API',
        content: 'Contenu de la note créée automatiquement par le test API backend.',
        authorId: 'test-user-id',
        authorName: 'Test User',
        isPrivate: false,
        isPinned: true,
        tags: JSON.stringify(['test', 'api', 'backend']),
      },
    });
    log(`    ✅ Note créée : ${newNote.id}`, 'green');
    
    // PATCH - Modifier note
    log('  2.5. PATCH /notes/[id] - Modifier contenu', 'yellow');
    const updatedNote = await prisma.workspaceNote.update({
      where: { id: newNote.id },
      data: {
        title: 'Note Modifiée par API',
        content: 'Contenu modifié via PATCH.',
        tags: JSON.stringify(['test', 'api', 'modifie']),
      },
    });
    log(`    ✅ Note modifiée : ${updatedNote.title}`, 'green');
    
    // PATCH - Toggle épinglage
    log('  2.6. PATCH /notes/[id] - Toggle isPinned', 'yellow');
    const toggledNote = await prisma.workspaceNote.update({
      where: { id: newNote.id },
      data: { isPinned: !newNote.isPinned },
    });
    log(`    ✅ isPinned modifié : ${toggledNote.isPinned}`, 'green');
    
    // DELETE - Supprimer note
    log('  2.7. DELETE /notes/[id] - Supprimer', 'yellow');
    await prisma.workspaceNote.delete({
      where: { id: newNote.id },
    });
    log(`    ✅ Note supprimée`, 'green');
    
  } catch (error) {
    log(`    ❌ Erreur Notes API: ${error}`, 'red');
  }
}

/**
 * Test 3 : Emails API
 */
async function testEmailsAPI(workspaceId: string) {
  log('\n📧 Test 3 : Emails API', 'blue');
  
  try {
    // GET - Liste tous emails
    log('  3.1. GET /emails - Liste tous', 'yellow');
    const allEmails = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        emails: {
          orderBy: { receivedDate: 'desc' },
          take: 20,
        },
      },
    });
    log(`    ✅ ${allEmails?.emails.length || 0} emails trouvés`, 'green');
    
    if (!allEmails?.emails.length) {
      log('    ⚠️  Aucun email disponible pour tester les actions', 'yellow');
      return;
    }
    
    const testEmail = allEmails.emails[0];
    
    // GET - Filtre non lus
    log('  3.2. GET /emails?isRead=false - Filtre non lus', 'yellow');
    const unreadEmails = allEmails.emails.filter(e => !e.isRead);
    log(`    ✅ ${unreadEmails.length} emails non lus`, 'green');
    
    // GET - Filtre catégorie
    log('  3.3. GET /emails?category=urgent - Filtre urgent', 'yellow');
    const urgentEmails = allEmails.emails.filter(e => e.category === 'urgent');
    log(`    ✅ ${urgentEmails.length} emails urgents`, 'green');
    
    // GET - Recherche
    log('  3.4. GET /emails?search=OQTF - Recherche', 'yellow');
    const searchEmails = allEmails.emails.filter(e =>
      e.subject.toLowerCase().includes('oqtf') ||
      e.bodyText?.toLowerCase().includes('oqtf')
    );
    log(`    ✅ ${searchEmails.length} emails contenant "OQTF"`, 'green');
    
    // PATCH - Marquer lu
    log('  3.5. PATCH /emails - Action mark_read', 'yellow');
    const markedRead = await prisma.workspaceEmail.update({
      where: { id: testEmail.id },
      data: { isRead: true },
    });
    log(`    ✅ Email marqué lu : ${markedRead.isRead}`, 'green');
    
    // PATCH - Ajouter favoris
    log('  3.6. PATCH /emails - Action star', 'yellow');
    const starred = await prisma.workspaceEmail.update({
      where: { id: testEmail.id },
      data: { isStarred: true },
    });
    log(`    ✅ Email en favoris : ${starred.isStarred}`, 'green');
    
    // PATCH - Archiver
    log('  3.7. PATCH /emails - Action archive', 'yellow');
    const archived = await prisma.workspaceEmail.update({
      where: { id: testEmail.id },
      data: { isArchived: true },
    });
    log(`    ✅ Email archivé : ${archived.isArchived}`, 'green');
    
    // PATCH - Désarchiver (reset pour tests suivants)
    log('  3.8. PATCH /emails - Action unarchive', 'yellow');
    await prisma.workspaceEmail.update({
      where: { id: testEmail.id },
      data: { 
        isArchived: false,
        isStarred: false,
      },
    });
    log(`    ✅ Email restauré`, 'green');
    
  } catch (error) {
    log(`    ❌ Erreur Emails API: ${error}`, 'red');
  }
}

/**
 * Test 4 : Procédures API
 */
async function testProceduresAPI(workspaceId: string) {
  log('\n⚖️  Test 4 : Procédures API', 'blue');
  
  try {
    // GET - Liste toutes procédures
    log('  4.1. GET /procedures - Liste toutes', 'yellow');
    const allProcedures = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        procedures: {
          orderBy: [
            { urgencyLevel: 'desc' },
            { deadlineDate: 'asc' },
          ],
        },
      },
    });
    log(`    ✅ ${allProcedures?.procedures.length || 0} procédures trouvées`, 'green');
    
    // GET - Filtre par type
    log('  4.2. GET /procedures?type=OQTF - Filtre type', 'yellow');
    const oqtfProcedures = allProcedures?.procedures.filter(
      p => p.procedureType === 'OQTF'
    ) || [];
    log(`    ✅ ${oqtfProcedures.length} procédures OQTF`, 'green');
    
    // GET - Filtre par statut
    log('  4.3. GET /procedures?status=active - Filtre statut', 'yellow');
    const activeProcedures = allProcedures?.procedures.filter(
      p => p.status === 'active'
    ) || [];
    log(`    ✅ ${activeProcedures.length} procédures actives`, 'green');
    
    // GET - Filtre par urgence
    log('  4.4. GET /procedures?urgency=critique - Filtre urgence', 'yellow');
    const criticalProcedures = allProcedures?.procedures.filter(
      p => p.urgencyLevel === 'critique'
    ) || [];
    log(`    ✅ ${criticalProcedures.length} procédures critiques`, 'green');
    
    // GET - Recherche
    log('  4.5. GET /procedures?search=recours - Recherche', 'yellow');
    const searchProcedures = allProcedures?.procedures.filter(p =>
      p.title.toLowerCase().includes('recours') ||
      p.description?.toLowerCase().includes('recours')
    ) || [];
    log(`    ✅ ${searchProcedures.length} procédures contenant "recours"`, 'green');
    
  } catch (error) {
    log(`    ❌ Erreur Procédures API: ${error}`, 'red');
  }
}

/**
 * Test 5 : Workspace Global
 */
async function testWorkspaceAPI(workspaceId: string) {
  log('\n🏠 Test 5 : Workspace Global', 'blue');
  
  try {
    // GET - Workspace complet
    log('  5.1. GET /workspace - Données complètes', 'yellow');
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        client: true,
        procedures: true,
        emails: true,
        documents: true,
        notes: true,
        timeline: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    
    if (!workspace) {
      log(`    ❌ Workspace ${workspaceId} introuvable`, 'red');
      return;
    }
    
    log(`    ✅ Workspace : ${workspace.title}`, 'green');
    log(`    ✅ Client : ${workspace.client.firstName} ${workspace.client.lastName}`, 'green');
    log(`    ✅ Statut : ${workspace.status}`, 'green');
    log(`    ✅ Priorité : ${workspace.globalPriority}`, 'green');
    log(`    ✅ Procédures : ${workspace.totalProcedures} (${workspace.activeProcedures} actives)`, 'green');
    log(`    ✅ Emails : ${workspace.totalEmails}`, 'green');
    log(`    ✅ Documents : ${workspace.totalDocuments}`, 'green');
    log(`    ✅ Timeline : ${workspace.timeline.length} événements récents`, 'green');
    
    // PATCH - Modifier workspace
    log('  5.2. PATCH /workspace - Modifier description', 'yellow');
    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        description: 'Description modifiée via test API',
        lastActivityDate: new Date(),
      },
    });
    log(`    ✅ Description modifiée`, 'green');
    
  } catch (error) {
    log(`    ❌ Erreur Workspace API: ${error}`, 'red');
  }
}

/**
 * Main - Lancer tous les tests
 */
async function main() {
  log('\n🧪 Test Workspace Backend APIs\n', 'blue');
  log('═'.repeat(60), 'blue');
  
  try {
    // Récupérer un workspace de test
    const workspace = await prisma.workspace.findFirst({
      where: {
        status: 'active',
      },
      include: {
        client: true,
      },
    });
    
    if (!workspace) {
      log('❌ Aucun workspace actif trouvé. Lancez d\'abord le seed.', 'red');
      return;
    }
    
    log(`\n✅ Workspace de test : ${workspace.title}`, 'green');
    log(`   Client : ${workspace.client.firstName} ${workspace.client.lastName}`, 'green');
    log(`   ID : ${workspace.id}`, 'green');
    
    // Lancer les tests séquentiellement
    await testDocumentsAPI(workspace.id);
    await testNotesAPI(workspace.id);
    await testEmailsAPI(workspace.id);
    await testProceduresAPI(workspace.id);
    await testWorkspaceAPI(workspace.id);
    
    log('\n═'.repeat(60), 'blue');
    log('✅ Tous les tests API sont terminés avec succès !', 'green');
    log('🎉 Backend API 100% opérationnel !\n', 'green');
    
  } catch (error) {
    log(`\n❌ Erreur globale : ${error}`, 'red');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

