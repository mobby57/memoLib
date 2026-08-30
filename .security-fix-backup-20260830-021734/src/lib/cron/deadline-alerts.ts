/**
 * Cron deadline-alerts — PLAN_COMPLET.md §5.4
 *
 * Règles de relance :
 * - J-7 : email avocat responsable
 * - J-3 : email + notification in-app (si non acquitté)
 * - J-1 : SMS + email + notification urgente (si non acquitté)
 * - J+0 : statut OVERDUE (escalade gérée par escalation.service.ts)
 *
 * Pas de relance si : SUSPENDED, COMPLETED, CANCELLED
 */

import { prisma } from '@/lib/prisma';

const ACTIVE_STATUSES = ['PENDING', 'APPROACHING', 'URGENT', 'CRITICAL'] as const;

export async function checkDeadlineAlerts() {
  const now = new Date();
  const j7 = addDays(now, 7);
  const j3 = addDays(now, 3);
  const j1 = addDays(now, 1);

  // Filtre commun : exclure deadlines acquittées, suspendues, terminées
  const baseWhere = {
    status: { in: ACTIVE_STATUSES },
    acknowledgedAt: null, // pas de relance si déjà acquittée
  };

  const [deadlinesJ7, deadlinesJ3, deadlinesJ1, deadlinesOverdue, suspendedDeadlines] = await Promise.all([
    prisma.legalDeadline.findMany({
      where: { ...baseWhere, alertJ7Sent: false, dueDate: { lte: j7, gt: j3 } },
      include: { Dossier: { select: { numero: true, responsableId: true } } },
    }),
    prisma.legalDeadline.findMany({
      where: { ...baseWhere, alertJ3Sent: false, dueDate: { lte: j3, gt: j1 } },
      include: { Dossier: { select: { numero: true, responsableId: true } } },
    }),
    prisma.legalDeadline.findMany({
      where: { ...baseWhere, alertJ1Sent: false, dueDate: { lte: j1, gte: now } },
      include: { Dossier: { select: { numero: true, responsableId: true } } },
    }),
    prisma.legalDeadline.findMany({
      where: { status: { in: ACTIVE_STATUSES }, dueDate: { lt: now } },
    }),
    prisma.legalDeadline.findMany({
      where: { status: 'SUSPENDED', suspendedAt: { lte: addDays(now, -14) } },
      include: { Dossier: { select: { responsableId: true } } },
    }),
  ]);

  // J-7 : email
  for (const dl of deadlinesJ7) {
    await sendAlert(dl, 'J-7', 'email');
    await prisma.legalDeadline.update({
      where: { id: dl.id },
      data: { alertJ7Sent: true, status: 'APPROACHING' },
    });
  }

  // J-3 : email + in-app
  for (const dl of deadlinesJ3) {
    await sendAlert(dl, 'J-3', 'email');
    await notifyInApp(dl, 'J-3');
    await prisma.legalDeadline.update({
      where: { id: dl.id },
      data: { alertJ3Sent: true, status: 'URGENT' },
    });
  }

  // J-1 : email + SMS + in-app urgente
  for (const dl of deadlinesJ1) {
    await sendAlert(dl, 'J-1', 'email');
    await sendAlert(dl, 'J-1', 'sms');
    await notifyInApp(dl, 'J-1');
    await prisma.legalDeadline.update({
      where: { id: dl.id },
      data: { alertJ1Sent: true, alertSmsSent: true, status: 'CRITICAL' },
    });
  }

  // Overdue : marquer OVERDUE (escalade gérée séparément)
  for (const dl of deadlinesOverdue) {
    await prisma.legalDeadline.update({
      where: { id: dl.id },
      data: { status: 'OVERDUE' },
    });
  }

  for (const dl of suspendedDeadlines) {
    await notifySuspensionReminder(dl);
  }

  return {
    j7: deadlinesJ7.length,
    j3: deadlinesJ3.length,
    j1: deadlinesJ1.length,
    overdue: deadlinesOverdue.length,
    suspensionReminders: suspendedDeadlines.length,
  };
}

// --- Helpers ---

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}

async function sendAlert(
  deadline: { id: string; tenantId: string; label: string; dueDate: Date; createdBy: string; Dossier?: { numero: string; responsableId: string | null } | null },
  alertType: string,
  channel: string
) {
  // Anti-spam : vérifier si alerte identique envoyée dans les 2 dernières heures
  const recent = await prisma.deadlineAlert.findFirst({
    where: {
      deadlineId: deadline.id,
      alertType,
      channel,
      sentAt: { gte: new Date(Date.now() - 2 * 3600_000) },
    },
  });
  if (recent) return;

  const recipient = deadline.Dossier?.responsableId || deadline.createdBy;

  await prisma.deadlineAlert.create({
    data: {
      id: crypto.randomUUID(),
      deadlineId: deadline.id,
      alertType,
      sentTo: recipient,
      channel,
      acknowledged: false,
    },
  });
}

async function notifyInApp(
  deadline: { id: string; tenantId: string; label: string; dueDate: Date; createdBy: string; Dossier?: { numero: string; responsableId: string | null } | null },
  alertType: string
) {
  const userId = deadline.Dossier?.responsableId || deadline.createdBy;
  if (!userId) return;

  // La clé de déduplication inclut la deadline afin de ne pas masquer une
  // alerte distincte assignée au même responsable.
  const recent = await prisma.notification.findFirst({
    where: {
      userId,
      type: `deadline_${alertType.toLowerCase()}`,
      data: { contains: `"deadlineId":"${deadline.id}"` },
      createdAt: { gte: new Date(Date.now() - 4 * 3600_000) },
    },
  });
  if (recent) return;

  const isUrgent = alertType === 'J-1';
  await prisma.notification.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      type: `deadline_${alertType.toLowerCase()}`,
      title: `${isUrgent ? '🚨' : '⚠️'} Deadline ${alertType} — ${deadline.label}`,
      message: `Échéance le ${deadline.dueDate.toLocaleDateString('fr-FR')}${deadline.Dossier ? ` — Dossier ${deadline.Dossier.numero}` : ''}`,
      priority: isUrgent ? 'high' : 'normal',
      data: JSON.stringify({ deadlineId: deadline.id }),
    },
  });
}

async function notifySuspensionReminder(
  deadline: { id: string; label: string; suspendedReason: string | null; suspendedBy: string | null; Dossier?: { responsableId: string | null } | null }
) {
  const userId = deadline.Dossier?.responsableId ?? deadline.suspendedBy;
  if (!userId) return;

  const recent = await prisma.notification.findFirst({
    where: {
      userId,
      type: 'deadline_suspension_reminder',
      data: { contains: `"deadlineId":"${deadline.id}"` },
    },
  });
  if (recent) return;

  await prisma.notification.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      type: 'deadline_suspension_reminder',
      title: `Rappel suspension — ${deadline.label}`,
      message: `Cette deadline est suspendue depuis 14 jours. Toujours bloquée ?${deadline.suspendedReason ? ` Raison : ${deadline.suspendedReason}` : ''}`,
      priority: 'normal',
      data: JSON.stringify({ deadlineId: deadline.id }),
    },
  });
}
