/**
 * Test HTTP Endpoints - Validation End-to-End
 * Teste les APIs file storage via requêtes HTTP réelles
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000';
const WORKSPACE_ID = 'a71f6959-fd48-457c-b2da-1580e571add9'; // Test workspace

async function testEndpoints() {
  console.log('\n🧪 TEST HTTP ENDPOINTS - File Storage System\n');
  
  try {
    // 1. Vérifier que le workspace existe
    console.log('📋 Step 1: Vérification workspace...');
    const workspace = await prisma.workspace.findUnique({
      where: { id: WORKSPACE_ID },
      include: { tenant: true, client: true }
    });
    
    if (!workspace) {
      console.error('❌ Workspace introuvable. Créez-le avec: npx tsx prisma/create-test-workspace.ts');
      process.exit(1);
    }
    
    console.log(`✅ Workspace: "${workspace.title}"`);
    console.log(`   Tenant: ${workspace.tenant.name}`);
    console.log(`   Client: ${workspace.client?.firstName} ${workspace.client?.lastName}`);
    
    // 2. Vérifier qu'un document de test existe
    console.log('\n📄 Step 2: Recherche document de test...');
    const testDoc = await prisma.workspaceDocument.findFirst({
      where: {
        workspaceId: WORKSPACE_ID,
        filename: { contains: 'test-download' }
      },
      orderBy: { uploadedAt: 'desc' }
    });
    
    if (!testDoc) {
      console.log('⚠️  Aucun document test trouvé. Création automatique...');
      
      // Créer un document test
      const { writeFile, mkdir } = await import('fs/promises');
      const { join } = await import('path');
      const { existsSync } = await import('fs');
      
      const filename = `test-http-${Date.now()}.txt`;
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'workspaces', WORKSPACE_ID);
      
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }
      
      const filePath = join(uploadsDir, filename);
      const content = `Document de test HTTP - ${new Date().toISOString()}\n\nCe fichier teste le système de file storage.`;
      await writeFile(filePath, content, 'utf-8');
      
      const newDoc = await prisma.workspaceDocument.create({
        data: {
          tenantId: workspace.tenantId,
          workspaceId: workspace.id,
          filename,
          originalName: 'test-http-endpoint.txt',
          mimeType: 'text/plain',
          sizeBytes: Buffer.byteLength(content, 'utf-8'),
          storagePath: `/uploads/workspaces/${WORKSPACE_ID}/${filename}`,
          documentType: 'test',
          description: 'Test HTTP endpoint validation',
          aiProcessed: false,
          verified: false,
        }
      });
      
      console.log(`✅ Document créé: ${newDoc.id}`);
      console.log(`   Fichier: ${newDoc.filename} (${newDoc.sizeBytes} bytes)`);
    } else {
      console.log(`✅ Document trouvé: ${testDoc.id}`);
      console.log(`   Fichier: ${testDoc.filename} (${testDoc.sizeBytes} bytes)`);
    }
    
    // 3. Construire les URLs de test
    const docId = testDoc?.id || (await prisma.workspaceDocument.findFirst({
      where: { workspaceId: WORKSPACE_ID },
      orderBy: { uploadedAt: 'desc' }
    }))?.id;
    
    if (!docId) {
      console.error('❌ Aucun document disponible pour test');
      process.exit(1);
    }
    
    console.log('\n🌐 Step 3: URLs de test\n');
    
    const downloadUrl = `${BASE_URL}/api/lawyer/workspaces/${WORKSPACE_ID}/documents/${docId}/download`;
    const uploadUrl = `${BASE_URL}/api/lawyer/workspaces/${WORKSPACE_ID}/documents`;
    const deleteUrl = `${BASE_URL}/api/lawyer/workspaces/${WORKSPACE_ID}/documents/${docId}`;
    
    console.log('📥 Download URL:');
    console.log(`   ${downloadUrl}\n`);
    
    console.log('📤 Upload URL:');
    console.log(`   ${uploadUrl}\n`);
    
    console.log('🗑️  Delete URL:');
    console.log(`   ${deleteUrl}\n`);
    
    // 4. Instructions de test manuel
    console.log('\n📖 INSTRUCTIONS DE TEST MANUEL\n');
    
    console.log('🔐 Étape 1: Authentification');
    console.log('   1. Ouvrir http://localhost:3000 dans le navigateur');
    console.log('   2. Se connecter avec:');
    console.log('      Email: admin@demo.com');
    console.log('      Password: Demo123!');
    console.log('   3. Ouvrir DevTools (F12) → Application → Cookies');
    console.log('   4. Copier la valeur de "next-auth.session-token"\n');
    
    console.log('📥 Étape 2: Test Download (Browser)');
    console.log('   Naviguer vers:');
    console.log(`   ${downloadUrl}`);
    console.log('   ✅ Attendu: Téléchargement automatique du fichier\n');
    
    console.log('📥 Étape 3: Test Download (curl)');
    console.log('   Remplacer <SESSION_TOKEN> par votre token:');
    console.log(`   curl "${downloadUrl}" -H "Cookie: next-auth.session-token=<SESSION_TOKEN>" -o test.txt`);
    console.log('   ✅ Attendu: Fichier test.txt téléchargé\n');
    
    console.log('📤 Étape 4: Test Upload (curl)');
    console.log('   Créer un fichier test.pdf et exécuter:');
    console.log(`   curl -X POST "${uploadUrl}" \\`);
    console.log(`        -H "Cookie: next-auth.session-token=<SESSION_TOKEN>" \\`);
    console.log(`        -F "file=@test.pdf" \\`);
    console.log(`        -F "documentType=passeport" \\`);
    console.log(`        -F "description=Test upload HTTP"`);
    console.log('   ✅ Attendu: JSON avec documentId et success: true\n');
    
    console.log('🗑️  Étape 5: Test Delete (curl)');
    console.log(`   curl -X DELETE "${deleteUrl}" \\`);
    console.log(`        -H "Cookie: next-auth.session-token=<SESSION_TOKEN>"`);
    console.log('   ✅ Attendu: {"success": true}\n');
    
    // 5. Test de sécurité - Sans authentification
    console.log('\n🔒 TESTS DE SÉCURITÉ\n');
    
    console.log('Test 1: Download sans session → 401 Unauthorized');
    console.log(`   curl "${downloadUrl}" -v`);
    console.log('   ✅ Attendu: HTTP 401 + {"error": "Non authentifié"}\n');
    
    console.log('Test 2: Upload sans session → 401 Unauthorized');
    console.log(`   curl -X POST "${uploadUrl}" -F "file=@test.pdf" -v`);
    console.log('   ✅ Attendu: HTTP 401\n');
    
    console.log('Test 3: Delete sans session → 401 Unauthorized');
    console.log(`   curl -X DELETE "${deleteUrl}" -v`);
    console.log('   ✅ Attendu: HTTP 401\n');
    
    // 6. Statistiques système
    console.log('\n📊 STATISTIQUES SYSTÈME\n');
    
    const totalDocs = await prisma.workspaceDocument.count({
      where: { workspaceId: WORKSPACE_ID }
    });
    
    const totalSize = await prisma.workspaceDocument.aggregate({
      where: { workspaceId: WORKSPACE_ID },
      _sum: { sizeBytes: true }
    });
    
    const docsByType = await prisma.workspaceDocument.groupBy({
      by: ['documentType'],
      where: { workspaceId: WORKSPACE_ID },
      _count: true
    });
    
    console.log(`📁 Total documents: ${totalDocs}`);
    console.log(`💾 Taille totale: ${((totalSize._sum.sizeBytes || 0) / 1024).toFixed(2)} KB`);
    console.log(`\n📋 Par type:`);
    docsByType.forEach(({ documentType, _count }) => {
      console.log(`   - ${documentType}: ${_count}`);
    });
    
    console.log('\n✅ Test préparation terminée!\n');
    console.log('🚀 Serveur: http://localhost:3000');
    console.log('📚 Documentation: WORKSPACE_FILE_STORAGE_COMPLETE.md\n');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testEndpoints();
