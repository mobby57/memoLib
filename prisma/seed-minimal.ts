import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding minimal...');

  // Créer utilisateurs
  const admin = await prisma.user.upsert({
    where: { email: 'admin@memolib.com' },
    update: {},
    create: {
      email: 'admin@memolib.com',
      name: 'Admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  });

  const lawyer = await prisma.user.upsert({
    where: { email: 'avocat@memolib.fr' },
    update: {},
    create: {
      email: 'avocat@memolib.fr',
      name: 'Maître Dupont',
      password: await bcrypt.hash('avocat123', 10),
      role: 'LAWYER',
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'client@memolib.fr' },
    update: {},
    create: {
      email: 'client@memolib.fr',
      name: 'Jean Martin',
      password: await bcrypt.hash('client123', 10),
      role: 'CLIENT',
    },
  });

  // Créer client
  const clientRecord = await prisma.client.create({
    data: {
      firstName: 'Jean',
      lastName: 'Martin',
      email: 'jean.martin@example.com',
      phone: '+33612345678',
    },
  });

  // Créer dossier
  const caseRecord = await prisma.case.create({
    data: {
      title: 'Dossier Immigration - Martin',
      description: 'Demande de titre de séjour',
      status: 'OPEN',
      clientId: clientRecord.id,
      lawyerId: lawyer.id,
    },
  });

  console.log('✅ Seed terminé!');
  console.log('\n📋 IDENTIFIANTS:');
  console.log('   Admin: admin@memolib.com / admin123');
  console.log('   Avocat: avocat@memolib.fr / avocat123');
  console.log('   Client: client@memolib.fr / client123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
