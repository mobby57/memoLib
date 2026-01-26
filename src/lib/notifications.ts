import prisma from './prisma';

export type NotificationType = 'email' | 'workflow' | 'facture' | 'dossier' | 'calendar' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  priority?: NotificationPriority;
}

// Creer une notification
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, data, priority = 'normal' } = params;

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : null,
      priority,
    },
  });

  // emettre via Server-Sent Events (SSE) ou WebSocket si configure
  await emitNotification(userId, notification);

  return notification;
}

// Obtenir les notifications d'un utilisateur
export async function getUserNotifications(userId: string, options?: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const { unreadOnly = false, limit = 50, offset = 0 } = options || {};

  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

// Marquer une notification comme lue
export async function markNotificationAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });
}

// Marquer toutes les notifications comme lues
export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

// Compter les notifications non lues
export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

// Supprimer les anciennes notifications (plus de 30 jours)
export async function cleanupOldNotifications(days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return prisma.notification.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      isRead: true,
    },
  });
}

// Map pour stocker les connexions SSE actives
const sseClients = new Map<string, Set<ReadableStreamDefaultController>>();

// Enregistrer un client SSE
export function registerSSEClient(userId: string, controller: ReadableStreamDefaultController) {
  if (!sseClients.has(userId)) {
    sseClients.set(userId, new Set());
  }
  sseClients.get(userId)!.add(controller);
}

// Desenregistrer un client SSE
export function unregisterSSEClient(userId: string, controller: ReadableStreamDefaultController) {
  const clients = sseClients.get(userId);
  if (clients) {
    clients.delete(controller);
    if (clients.size === 0) {
      sseClients.delete(userId);
    }
  }
}

// emettre une notification via SSE
async function emitNotification(userId: string, notification: Record<string, unknown>) {
  const clients = sseClients.get(userId);
  if (clients) {
    const data = `data: ${JSON.stringify(notification)}\n\n`;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);
    
    clients.forEach((controller) => {
      try {
        controller.enqueue(encoded);
      } catch (error) {
        console.error('Erreur envoi SSE:', error);
      }
    });
  }
}

// Creer des notifications pour differents evenements
export const NotificationService = {
  // Nouvel email recu
  async emailReceived(userId: string, emailData: { from: string; subject: string; emailId: string }) {
    return createNotification({
      userId,
      type: 'email',
      title: 'Nouvel email recu',
      message: `De: ${emailData.from} - ${emailData.subject}`,
      data: { emailId: emailData.emailId },
      priority: 'normal',
    });
  },

  // Workflow termine
  async workflowCompleted(userId: string, workflowData: { name: string; status: string; workflowId: string }) {
    return createNotification({
      userId,
      type: 'workflow',
      title: 'Workflow termine',
      message: `${workflowData.name} - Statut: ${workflowData.status}`,
      data: { workflowId: workflowData.workflowId },
      priority: workflowData.status === 'failed' ? 'high' : 'normal',
    });
  },

  // Facture emise
  async factureCreated(userId: string, factureData: { numero: string; montant: number; factureId: string }) {
    return createNotification({
      userId,
      type: 'facture',
      title: 'Nouvelle facture creee',
      message: `Facture ${factureData.numero} - ${factureData.montant.toFixed(2)}€`,
      data: { factureId: factureData.factureId },
      priority: 'normal',
    });
  },

  // Paiement recu
  async paymentReceived(userId: string, paymentData: { numero: string; montant: number; factureId: string }) {
    return createNotification({
      userId,
      type: 'facture',
      title: 'Paiement recu',
      message: `Facture ${paymentData.numero} - ${paymentData.montant.toFixed(2)}€ paye`,
      data: { factureId: paymentData.factureId },
      priority: 'normal',
    });
  },

  // echeance proche
  async deadlineApproaching(userId: string, data: { title: string; date: Date; type: string; id: string }) {
    return createNotification({
      userId,
      type: 'calendar',
      title: 'echeance proche',
      message: `${data.title} - ${data.date.toLocaleDateString('fr-FR')}`,
      data: { eventId: data.id, eventType: data.type },
      priority: 'high',
    });
  },

  // Dossier mis a jour
  async dossierUpdated(userId: string, dossierData: { numero: string; action: string; dossierId: string }) {
    return createNotification({
      userId,
      type: 'dossier',
      title: 'Dossier mis a jour',
      message: `Dossier ${dossierData.numero} - ${dossierData.action}`,
      data: { dossierId: dossierData.dossierId },
      priority: 'normal',
    });
  },
};
