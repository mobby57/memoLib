import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'cabinet-e2e' },
    update: {},
    create: {
      id: 'tenant-e2e',
      name: 'Cabinet E2E',
      subdomain: 'cabinet-e2e',
      planId: 'starter',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // 2. Admin
  await prisma.user.upsert({
    where: { email: 'admin@memolib.local' },
    update: {},
    create: {
      id: 'user-admin',
      email: 'admin@memolib.local',
      password: await bcrypt.hash('Admin123!', 10),
      name: 'Admin E2E',
      role: 'ADMIN',
      tenantId: tenant.id,
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // 3. Avocat (test)
  const avocat = await prisma.user.upsert({
    where: { email: 'avocat@test.com' },
    update: {},
    create: {
      id: 'user-avocat',
      email: 'avocat@test.com',
      password: await bcrypt.hash('Test123!@#456', 10),
      name: 'Avocat Test',
      role: 'LAWYER',
      tenantId: tenant.id,
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // 4. Clients
  const client1 = await prisma.client.upsert({
    where: { id: 'client1' },
    update: {},
    create: {
      id: 'client1',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@example.com',
      phone: '0612345678',
      tenantId: tenant.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: 'client2' },
    update: {},
    create: {
      id: 'client2',
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie@example.com',
      phone: '0687654321',
      tenantId: tenant.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // 5. Dossiers (avec les bons champs)
  await prisma.dossier.upsert({
    where: { id: 'dossier1' },
    update: {},
    create: {
      id: 'dossier1',
      tenantId: tenant.id,
      numero: 'DOS-001',
      clientId: client1.id,
      typeDossier: 'OQTF',
      statut: 'en_cours',
      priorite: 'urgent',
      phase: 'instruction',
      confidentialMode: false,
      dateCreation: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      description: 'Dossier urgent pour OQTF',
      responsableId: avocat.id,
    },
  });

  await prisma.dossier.upsert({
    where: { id: 'dossier2' },
    update: {},
    create: {
      id: 'dossier2',
      tenantId: tenant.id,
      numero: 'DOS-002',
      clientId: client2.id,
      typeDossier: 'TITRE_SEJOUR',
      statut: 'en_cours',
      priorite: 'normale',
      phase: 'instruction',
      confidentialMode: false,
      dateCreation: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      description: 'Demande de titre de séjour',
      responsableId: avocat.id,
    },
  });

  console.log('✅ Seed E2E terminé.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
