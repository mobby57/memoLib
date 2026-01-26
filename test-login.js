const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const user = await prisma.user.findUnique({ 
      where: { email: 'superadmin@iapostemanager.com' } 
    });
    
    if (!user) {
      console.log('❌ Utilisateur non trouve');
      return;
    }
    
    console.log('✅ Utilisateur trouve:', user.email);
    console.log('   Role:', user.role);
    console.log('   Status:', user.status);
    console.log('   Password hash:', user.password.substring(0, 20) + '...');
    
    const valid = await bcrypt.compare('SuperAdmin2026!', user.password);
    console.log('🔐 Mot de passe valide:', valid);
    
    if (!valid) {
      // Regenerer le mot de passe
      const newHash = await bcrypt.hash('SuperAdmin2026!', 10);
      await prisma.user.update({
        where: { email: 'superadmin@iapostemanager.com' },
        data: { password: newHash }
      });
      console.log('🔄 Mot de passe regenere!');
    }
    
  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
