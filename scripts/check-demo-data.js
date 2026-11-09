const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const dossiers = await p.dossier.findMany({
    where: { numero: { in: ['DOS-2026-001', 'DOS-2026-002', 'DOS-2026-003'] } },
    select: { id: true, numero: true, clientId: true, tenantId: true }
  });
  console.log('DOSSIERS:', JSON.stringify(dossiers, null, 2));

  if (dossiers.length > 0) {
    const deadlines = await p.legalDeadline.findMany({
      where: { tenantId: dossiers[0].tenantId },
      select: { id: true, label: true, dueDate: true, status: true }
    });
    console.log('DEADLINES:', JSON.stringify(deadlines, null, 2));
  }

  await p.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
