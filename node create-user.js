const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Hash bcrypt pour le mot de passe "Test@123456" (généré avec coût 12)
const hashedPassword = '$2a$12$1C26unvsJp5LdZp6XhA5L.lCuI2UJYLwvYuzYvBrBEJEHbBgqV/E.';

async function main() {
  await prisma.user.upsert({
    where: { email: 'avocat@test.com' },
    update: {
      password: hashedPassword,
      updatedAt: new Date(),
    },
    create: {
      email: 'avocat@test.com',
      password: hashedPassword,
      emailVerified: new Date(),
      // ⚠️ Ajoute ici les autres champs obligatoires de ton modèle (ex: planId, firstName, etc.)
      // Exemple : planId: 'starter',
    },
  });
  console.log('✅ Utilisateur avocat@test.com créé/mis à jour avec succès.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur :', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
