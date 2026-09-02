const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const u = await p.user.findUnique({
    where: { email: 'morosidibepro@gmail.com' },
    include: { accounts: true },
  });
  console.log('USER:', u?.id, u?.role, u?.tenantId);
  console.log('ACCOUNTS:', u?.accounts?.length || 0);
  if (u?.accounts) {
    u.accounts.forEach(a => console.log('  -', a.provider, a.providerAccountId));
  }
  await p.$disconnect();
}

check().catch(e => { console.log('ERR:', e.message); process.exit(1); });
