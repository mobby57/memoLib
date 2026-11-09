const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const user = await p.user.findUnique({
    where: { email: 'demo@memolib.fr' },
    include: {
      Tenant: { select: { id: true, name: true, status: true, Plan: { select: { name: true } } } },
    }
  });
  
  if (user) {
    console.log('✅ Utilisateur trouvé:');
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Status:', user.status);
    console.log('  TenantId:', user.tenantId);
    console.log('  Tenant:', user.Tenant);
    
    const bcrypt = require('bcryptjs');
    const match = await bcrypt.compare('Demo2026!', user.password);
    console.log('  Password match:', match);
  } else {
    console.log('❌ Utilisateur NOT FOUND');
  }
  
  await p.$disconnect();
}

check();
