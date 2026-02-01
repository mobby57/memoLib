import { prisma } from '../src/lib/prisma';

async function createTestWorkspace() {
  const client = await prisma.client.findFirst();
  const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  
  if (!client || !user) {
    console.log('❌ Données manquantes');
    return;
  }

  const workspace = await prisma.workspace.create({
    data: {
      tenantId: client.tenantId,
      clientId: client.id,
      createdById: user.id,
      procedureType: 'OQTF',
      title: `Espace Test Upload - ${client.firstName} ${client.lastName}`,
      reference: 'TEST-UPLOAD-001',
      status: 'active',
      urgencyLevel: 'moyen',
      description: 'Workspace de test pour uploads de documents',
    },
  });

  console.log(`✅ Workspace créé : ${workspace.id}`);
  console.log(`   Titre : ${workspace.title}`);
  console.log(`   Client : ${client.firstName} ${client.lastName}`);
}

createTestWorkspace()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
