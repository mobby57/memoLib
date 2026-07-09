const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  try {
    const now = new Date();
    const j7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const deadlines = await p.legalDeadline.findMany({
      where: { status: 'PENDING', alertJ7Sent: false, dueDate: { lte: j7, gte: now } },
      include: { Dossier: { include: { Client: true } } },
    });
    console.log('OK:', deadlines.length, 'deadlines for J-7 alert');
    if (deadlines.length > 0) {
      console.log('First:', JSON.stringify(deadlines[0], null, 2).substring(0, 200));
    }
  } catch (e) {
    console.error('ERR:', e.message);
  } finally {
    await p.$disconnect();
  }
}
test();
