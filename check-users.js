const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n📋 Vérification des utilisateurs...\n');
  
  const users = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });

  if (users.length === 0) {
    console.log('❌ Aucun utilisateur trouvé dans la base de données!');
    console.log('\n💡 Exécutez: npx prisma db push && npx prisma db seed\n');
  } else {
    console.log(`✅ ${users.length} utilisateur(s) trouvé(s):\n`);
    users.forEach(user => {
      console.log(`📧 ${user.email}`);
      console.log(`   Nom: ${user.name}`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   Status: ${user.status}\n`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
