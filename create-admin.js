const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const p = new PrismaClient();

  try {
    const hash = await bcrypt.hash('admin123', 10);

    // Chercher ou créer un tenant
    let tenant = await p.tenant.findFirst();
    if (!tenant) {
      tenant = await p.tenant.create({
        data: {
          name: 'Cabinet Demo',
          subdomain: 'demo',
          plan: 'PROFESSIONAL',
        },
      });
      console.log('✅ Tenant créé:', tenant.id);
    } else {
      console.log('✅ Tenant existant:', tenant.id);
    }

    // Créer l'admin
    const admin = await p.user.upsert({
      where: { email: 'admin@memolib.fr' },
      update: { password: hash },
      create: {
        email: 'admin@memolib.fr',
        name: 'Admin Demo',
        password: hash,
        role: 'ADMIN',
        tenantId: tenant.id,
      },
    });
    console.log('✅ Admin créé/mis à jour:', admin.email);

    // Créer un avocat
    const avocat = await p.user.upsert({
      where: { email: 'avocat@memolib.fr' },
      update: { password: hash },
      create: {
        email: 'avocat@memolib.fr',
        name: 'Avocat Demo',
        password: hash,
        role: 'LAWYER',
        tenantId: tenant.id,
      },
    });
    console.log('✅ Avocat créé/mis à jour:', avocat.email);

    console.log('\n========================================');
    console.log('   IDENTIFIANTS DE CONNEXION');
    console.log('========================================');
    console.log('   Admin:  admin@memolib.fr / admin123');
    console.log('   Avocat: avocat@memolib.fr / admin123');
    console.log('========================================\n');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await p.$disconnect();
  }
}

createAdmin();
