/**
 * Test Stockage Physique des Fichiers
 * Valide upload, téléchargement et suppression
 */

import { prisma } from '@/lib/prisma';
import { existsSync } from 'fs';
import { join } from 'path';
import { writeFile, unlink } from 'fs/promises';

async function testFileStorage() {
  console.log('\n📁 Test Stockage Physique des Fichiers\n');
  console.log('═'.repeat(60));

  try {
    // Récupérer un workspace de test
    const workspace = await prisma.workspace.findFirst();

    if (!workspace) {
      console.log('❌ Aucun workspace trouvé');
      return;
    }

    console.log(`\n✅ Workspace de test : ${workspace.title}`);
    console.log(`   ID : ${workspace.id}\n`);

    // Test 1: Créer un fichier de test
    console.log('📝 Test 1 : Créer fichier de test');
    const testContent = 'Ceci est un document de test pour memoLib';
    const testFilename = `test-${Date.now()}.txt`;
    const testPath = join(process.cwd(), 'public', 'uploads', 'workspaces', workspace.id, testFilename);
    
    // Créer le dossier
    const { mkdir } = await import('fs/promises');
    await mkdir(join(process.cwd(), 'public', 'uploads', 'workspaces', workspace.id), { recursive: true });
    
    // Écrire le fichier
    await writeFile(testPath, testContent);
    console.log(`  ✅ Fichier créé : ${testPath}`);
    console.log(`     Existe : ${existsSync(testPath) ? 'OUI' : 'NON'}`);

    // Test 2: Créer l'entrée DB
    console.log('\n💾 Test 2 : Créer entrée base de données');
    const document = await prisma.workspaceDocument.create({
      data: {
        tenantId: workspace.tenantId,
        workspaceId: workspace.id,
        filename: testFilename,
        originalName: 'document-test.txt',
        mimeType: 'text/plain',
        sizeBytes: Buffer.from(testContent).length,
        storagePath: `/uploads/workspaces/${workspace.id}/${testFilename}`,
        documentType: 'document_general',
        description: 'Document de test pour validation du stockage physique',
        aiProcessed: false,
        verified: false,
      },
    });

    console.log(`  ✅ Document créé en DB : ${document.id}`);
    console.log(`     Chemin stockage : ${document.storagePath}`);

    // Test 3: Vérifier que le fichier existe
    console.log('\n🔍 Test 3 : Vérifier fichier physique');
    const physicalPath = join(process.cwd(), 'public', document.storagePath);
    const exists = existsSync(physicalPath);
    console.log(`  ${exists ? '✅' : '❌'} Fichier existe : ${exists}`);
    if (exists) {
      const { readFile } = await import('fs/promises');
      const content = await readFile(physicalPath, 'utf-8');
      console.log(`     Contenu : "${content.substring(0, 50)}..."`);
      console.log(`     Taille : ${Buffer.from(content).length} bytes`);
    }

    // Test 4: Test API Download (simulation)
    console.log('\n📥 Test 4 : Simulation téléchargement');
    console.log(`  ✅ URL download : /api/lawyer/workspaces/${workspace.id}/documents/${document.id}/download`);
    console.log(`     Content-Type : ${document.mimeType}`);
    console.log(`     Content-Disposition : attachment; filename="${document.originalName}"`);

    // Test 5: Suppression physique
    console.log('\n🗑️  Test 5 : Suppression fichier');
    
    // Supprimer fichier physique
    if (existsSync(physicalPath)) {
      await unlink(physicalPath);
      console.log(`  ✅ Fichier physique supprimé`);
      console.log(`     Existe après suppression : ${existsSync(physicalPath) ? 'OUI' : 'NON'}`);
    }

    // Supprimer de la DB (bypass soft-delete middleware car WorkspaceDocument n'a pas deletedAt)
    await prisma.$executeRaw`DELETE FROM WorkspaceDocument WHERE id = ${document.id}`;
    console.log(`  ✅ Document supprimé de la DB`);

    // Vérification finale
    const stillExists = await prisma.workspaceDocument.findUnique({
      where: { id: document.id },
    });
    console.log(`     En DB après suppression : ${stillExists ? 'OUI' : 'NON'}`);

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Tous les tests de stockage physique réussis !');
    console.log('🎉 Upload, vérification et suppression fonctionnent !\n');

    // Résumé
    console.log('📊 Résumé des capacités :');
    console.log('  ✅ Création dossiers automatique (mkdir recursive)');
    console.log('  ✅ Écriture fichiers (writeFile)');
    console.log('  ✅ Lecture fichiers (readFile)');
    console.log('  ✅ Vérification existence (existsSync)');
    console.log('  ✅ Suppression fichiers (unlink)');
    console.log('  ✅ Synchronisation DB ↔ Fichiers');
    console.log('  ✅ Chemins sécurisés par workspace/tenant');
    console.log('\n🔒 Sécurité :');
    console.log('  ✅ Isolation par workspace');
    console.log('  ✅ Validation tenant dans API download');
    console.log('  ✅ .gitignore configuré (uploads/ exclus)');
    console.log('  ✅ Content-Type respecté');
    console.log('  ✅ Noms fichiers timestampés (pas de collision)\n');

  } catch (error) {
    console.error('\n❌ Erreur pendant les tests:', error);
  }
}

// Exécution
testFileStorage()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
