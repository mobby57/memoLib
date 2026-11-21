import { prisma, withTenantContextTransaction } from '@/lib/prisma';
import { randomUUID } from 'crypto';

const ACTIVE_STATUSES = ['PENDING', 'APPROACHING', 'URGENT', 'CRITICAL'] as const;
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);

export async function checkDeadlineAlerts() {
  const tenants = await prisma.tenant.findMany({ where: { status: 'active' }, select: { id: true } });

  for (const { id: tenantId } of tenants) {
    await withTenantContextTransaction(tenantId, async (tx) => {
      const now = new Date();
      const j7 = addDays(now, 7);
      const j3 = addDays(now, 3);
      const j1 = addDays(now, 1);
      const baseWhere = { tenantId };

      const [deadlinesJ7, deadlinesJ3, deadlinesJ1, deadlinesOverdue, suspendedDeadlines] = await Promise.all([
        tx.legalDeadline.findMany({
          where: { ...baseWhere, alertJ7Sent: false, dueDate: { lte: j7, gt: j3 } },
          include: { Dossier: { select: { numero: true, responsableId: true } } },
        }),
        tx.legalDeadline.findMany({
          where: { ...baseWhere, alertJ3Sent: false, dueDate: { lte: j3, gt: j1 } },
          include: { Dossier: { select: { numero: true, responsableId: true } } },
        }),
        tx.legalDeadline.findMany({
          where: { ...baseWhere, alertJ1Sent: false, dueDate: { lte: j1, gte: now } },
          include: { Dossier: { select: { numero: true, responsableId: true } } },
        }),
        tx.legalDeadline.findMany({
          where: { tenantId, status: { in: ACTIVE_STATUSES }, dueDate: { lt: now } },
        }),
        tx.legalDeadline.findMany({
          where: { tenantId, status: 'SUSPENDED', suspendedAt: { lte: addDays(now, -14) } },
          include: { Dossier: { select: { responsableId: true } } },
        }),
      ]);

      for (const dl of deadlinesJ7) {
        await sendAlert(tx, dl, 'J-7', 'email');
        await tx.legalDeadline.update({ where: { id: dl.id }, data: { alertJ7Sent: true, status: 'APPROACHING' } });
      }

      for (const dl of deadlinesJ3) {
        await sendAlert(tx, dl, 'J-3', 'email');
        await notifyInApp(tx, dl, 'J-3');
        await tx.legalDeadline.update({ where: { id: dl.id }, data: { alertJ3Sent: true, status: 'URGENT' } });
      }

      for (const dl of deadlinesJ1) {
        await sendAlert(tx, dl, 'J-1', 'email');
        await sendAlert(tx, dl, 'J-1', 'sms');
        await notifyInApp(tx, dl, 'J-1');
        await tx.legalDeadline.update({ where: { id: dl.id }, data: { alertJ1Sent: true, alertSmsSent: true, status: 'CRITICAL' } });
      }

      for (const dl of deadlinesOverdue) {
        await tx.legalDeadline.update({ where: { id: dl.id }, data: { status: 'OVERDUE' } });
      }
    });
  }
}

async function sendAlert(tx: any, deadline: any, alertType: string, channel: string) {
  const recent = await tx.deadlineAlert.findFirst({
    where: {
      deadlineId: deadline.id,
      alertType,
      channel,
      sentAt: { gte: new Date(Date.now() - 2 * 3600_000) },
    },
  });
  if (recent) return;

  const recipient = deadline.Dossier?.responsableId || deadline.createdBy;
  await tx.deadlineAlert.create({
    data: {
      id: randomUUID(),
      deadlineId: deadline.id,
      alertType,
      sentTo: recipient,
      channel,
    },
  });
}

async function notifyInApp(tx: any, deadline: any, alertType: string) {
  const userId = deadline.Dossier?.responsableId || deadline.createdBy;
  if (!userId) return;

  const recent = await tx.notification.findFirst({
    where: {
      userId,
      type: `deadline_${alertType.toLowerCase()}`,
      data: { contains: `"deadlineId":"${deadline.id}"` },
      createdAt: { gte: new Date(Date.now() - 4 * 3600_000) },
    },
  });
  if (recent) return;

  const isUrgent = alertType === 'J-1';
  await tx.notification.create({
    data: {
      id: randomUUID(),
      userId,
      type: `deadline_${alertType.toLowerCase()}`,
      title: `${isUrgent ? '🚨' : '⚠️'} Deadline ${alertType} — ${deadline.label}`,
      message: `L'échéance ${deadline.label} arrive à expiration le ${deadline.dueDate.toLocaleDateString('fr-FR')}.`,
      priority: isUrgent ? 'urgent' : 'high',
    },
  });
}