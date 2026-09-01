const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Avocat123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'avocat@test.fr' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'avocat@test.fr',
      name: 'Maître Dupont',
      password: hashedPassword,
      role: 'LAWYER',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ Avocat créé :', user);
}
main().catch(console.error).finally(() => prisma.$disconnect());
