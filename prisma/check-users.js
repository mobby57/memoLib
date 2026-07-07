const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({ select: { email: true, role: true, status: true } })
  .then(users => { console.table(users); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
