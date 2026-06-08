import prisma from '@/lib/prisma';

export async function checkDeadlineAlerts() {
  const now = new Date();
  const j7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const j3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const j1 = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

  const deadlinesJ7 = await prisma.legalDeadline.findMany({
    where: { status: 'PENDING', alertJ7Sent: false, dueDate: { lte: j7, gte: now } },
    include: { dossier: { include: { client: true } } },
  });

  for (const deadline of deadlinesJ7) {
    await prisma.deadlineAlert.create({
      data: { deadlineId: deadline.id, alertType: 'J-7', sentTo: deadline.createdBy, channel: 'email' },
    });
    await prisma.legalDeadline.update({
      where: { id: deadline.id },
      data: { alertJ7Sent: true, status: 'APPROACHING' },
    });
  }

  const deadlinesJ3 = await prisma.legalDeadline.findMany({
    where: { status: { in: ['PENDING', 'APPROACHING'] }, alertJ3Sent: false, dueDate: { lte: j3, gte: now } },
  });

  for (const deadline of deadlinesJ3) {
    await prisma.deadlineAlert.create({
      data: { deadlineId: deadline.id, alertType: 'J-3', sentTo: deadline.createdBy, channel: 'email' },
    });
    await prisma.legalDeadline.update({
      where: { id: deadline.id },
      data: { alertJ3Sent: true, status: 'URGENT' },
    });
  }

  const deadlinesJ1 = await prisma.legalDeadline.findMany({
    where: { status: { in: ['PENDING', 'APPROACHING', 'URGENT'] }, alertJ1Sent: false, dueDate: { lte: j1, gte: now } },
    include: { dossier: { select: { responsableId: true, numero: true, typeDossier: true } } },
  });

  for (const deadline of deadlinesJ1) {
    await prisma.deadlineAlert.create({
      data: { deadlineId: deadline.id, alertType: 'J-1', sentTo: deadline.createdBy, channel: 'email' },
    });
    await prisma.legalDeadline.update({
      where: { id: deadline.id },
      data: { alertJ1Sent: true, status: 'CRITICAL' },
    });

    // SMS d'urgence pour OQTF/rétention (délais < 48h)
    const isUrgent = deadline.dossier?.typeDossier &&
      ['OQTF', 'RECOURS_OQTF', 'OQTF_SANS_DELAI', 'RETENTION'].includes(deadline.dossier.typeDossier);

    if (isUrgent && deadline.dossier?.responsableId) {
      const avocat = await prisma.user.findUnique({
        where: { id: deadline.dossier.responsableId },
        select: { phone: true, firstName: true },
      });
      if (avocat?.phone) {
        const smsBody = `⚠️ URGENT MemoLib: Dossier ${deadline.dossier.numero} — ${deadline.label} expire DEMAIN. Action immédiate requise.`;
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: avocat.phone, message: smsBody, dossierId: deadline.dossierId, urgence: 'critique' }),
        }).catch(() => {});
      }
    }
  }

  const deadlinesOverdue = await prisma.legalDeadline.findMany({
    where: { status: { in: ['PENDING', 'APPROACHING', 'URGENT', 'CRITICAL'] }, dueDate: { lt: now } },
  });

  for (const deadline of deadlinesOverdue) {
    await prisma.legalDeadline.update({
      where: { id: deadline.id },
      data: { status: 'OVERDUE' },
    });
  }

  return { j7: deadlinesJ7.length, j3: deadlinesJ3.length, j1: deadlinesJ1.length, overdue: deadlinesOverdue.length };
}
