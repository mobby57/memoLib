const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const hashedPassword = '$2a$12$1C26unvsJp5LdZp6XhA5L.lCuI2UJYLwvYuzYvBrBEJEHbBgqV/E.';

async function main() {
  await prisma.user.upsert({
    where: { email: 'avocat@test.com' },
    update: { password: hashedPassword, updatedAt: new Date() },
    create: { email: 'avocat@test.com', password: hashedPassword, emailVerified: new Date() }
  });
  console.log('✅ Utilisateur avocat@test.com créé/mis à jour.');
}

main().catch(e => console.error('❌ Erreur :', e.message)).finally(() => prisma.$disconnect());
