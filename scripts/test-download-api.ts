/**
 * Test de l'API de téléchargement de documents
 * Teste l'endpoint /api/lawyer/workspaces/[id]/documents/[docId]/download
 */

import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

async function testDownloadAPI() {
  console.log('\n📥 Test API de Téléchargement de Documents\n');
  console.log('════════════════════════════════════════════════════════════');

  try {
    // Récupérer le workspace de test
    const workspace = await prisma.workspace.findFirst({
      include: { client: true },
    });

    if (!workspace) {
      console.log('❌ Aucun workspace trouvé. Exécuter d\'abord create-test-workspace.ts');
      process.exit(1);
    }

    console.log(`✅ Workspace de test : ${workspace.title}`);
    console.log(`   ID : ${workspace.id}\n`);

    // Créer un fichier de test
    console.log('📝 Étape 1 : Créer un document de test');
    const testContent = 'Ceci est un document PDF de test pour memoLib.\nContenu du fichier téléchargeable.';
    const testFilename = `test-download-${Date.now()}.txt`;
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'workspaces', workspace.id);
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const testPath = join(uploadsDir, testFilename);
    await writeFile(testPath, testContent);
    console.log(`  ✅ Fichier créé : ${testFilename}`);

    // Créer l'entrée DB
    const document = await prisma.workspaceDocument.create({
      data: {
        tenantId: workspace.tenantId,
        workspaceId: workspace.id,
        filename: testFilename,
        originalName: 'document-test-download.txt',
        mimeType: 'text/plain',
        sizeBytes: Buffer.from(testContent).length,
        storagePath: `/uploads/workspaces/${workspace.id}/${testFilename}`,
        documentType: 'document_general',
        description: 'Document de test pour API download',
        aiProcessed: false,
        verified: false,
      },
    });
    console.log(`  ✅ Document créé en DB : ${document.id}\n`);

    // Afficher les informations de test
    console.log('🌐 Étape 2 : Informations pour test manuel');
    console.log('════════════════════════════════════════════════════════════');
    console.log('\n📍 URL de téléchargement :');
    console.log(`   http://localhost:3000/api/lawyer/workspaces/${workspace.id}/documents/${document.id}/download\n`);
    
    console.log('🔐 Authentification requise :');
    console.log('   - Session NextAuth active (cookie de session)');
    console.log('   - User avec tenantId = ' + workspace.tenantId);
    console.log('   - Connexion : admin@demo.com / Demo123!\n');

    console.log('📊 Détails du document :');
    console.log(`   - ID : ${document.id}`);
    console.log(`   - Nom original : ${document.originalName}`);
    console.log(`   - MIME type : ${document.mimeType}`);
    console.log(`   - Taille : ${document.sizeBytes} bytes`);
    console.log(`   - Chemin stockage : ${document.storagePath}\n`);

    console.log('✅ En-têtes attendus dans la réponse :');
    console.log(`   - Content-Type: ${document.mimeType}`);
    console.log(`   - Content-Disposition: attachment; filename="${document.originalName}"`);
    console.log(`   - Content-Length: ${document.sizeBytes}`);
    console.log(`   - Cache-Control: private, max-age=3600\n`);

    console.log('🧪 Tests de sécurité à valider :');
    console.log('   ✓ Sans session → 401 Unauthorized');
    console.log('   ✓ Autre tenant → 403 Forbidden');
    console.log('   ✓ Workspace incorrect → 403 Forbidden');
    console.log('   ✓ Document ID invalide → 404 Not Found');
    console.log('   ✓ Avec session correcte → 200 OK + fichier\n');

    console.log('🚀 Pour tester manuellement :');
    console.log('   1. Démarrer le serveur : npm run dev');
    console.log('   2. Se connecter : http://localhost:3000/login');
    console.log('   3. Email : admin@demo.com');
    console.log('   4. Mot de passe : Demo123!');
    console.log('   5. Ouvrir l\'URL de téléchargement dans le navigateur\n');

    console.log('💡 Avec curl (après extraction du cookie) :');
    console.log(`   curl -v "http://localhost:3000/api/lawyer/workspaces/${workspace.id}/documents/${document.id}/download" \\`);
    console.log('        -H "Cookie: next-auth.session-token=VOTRE_TOKEN" \\');
    console.log('        -o downloaded-file.txt\n');

    console.log('════════════════════════════════════════════════════════════');
    console.log('✅ Document de test créé avec succès !');
    console.log('🎯 Prêt pour le test de téléchargement via navigateur ou curl\n');

  } catch (error) {
    console.error('❌ Erreur pendant le test:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDownloadAPI();
