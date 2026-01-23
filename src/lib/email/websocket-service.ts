import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface EmailNotification {
  id: string;
  type: 'nouveau_client' | 'reponse_client' | 'laposte_notification' | 'ceseda' | 'urgent' | 'spam' | 'general';
  priority: 'critical' | 'high' | 'medium' | 'low';
  from: string;
  subject: string;
  receivedDate: Date;
  confidence: number;
  tags: string[];
  suggestedAction?: string;
}

export class EmailWebSocketService {
  private io: SocketIOServer | null = null;

  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      },
      path: '/api/socket'
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Client connecté: ${socket.id}`);

      // Rejoindre une room tenant-specific
      socket.on('join-tenant', (tenantId: string) => {
        socket.join(`tenant:${tenantId}`);
        console.log(`👤 Client ${socket.id} rejoint tenant: ${tenantId}`);
      });

      // Rejoindre une room avocat-specific
      socket.on('join-lawyer', (lawyerId: string) => {
        socket.join(`lawyer:${lawyerId}`);
        console.log(`⚖️  Avocat ${lawyerId} connecté`);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client déconnecté: ${socket.id}`);
      });
    });

    console.log('✅ WebSocket service initialisé');
  }

  /**
   * Notifier tous les avocats d'un nouveau email
   */
  notifyNewEmail(tenantId: string, email: EmailNotification): void {
    if (!this.io) {
      console.warn('⚠️  WebSocket non initialisé');
      return;
    }

    const notification = {
      type: 'new-email',
      email,
      timestamp: new Date()
    };

    // Envoyer à tous les clients du tenant
    this.io.to(`tenant:${tenantId}`).emit('email:new', notification);

    console.log(`📨 Notification envoyée au tenant ${tenantId}`);
  }

  /**
   * Notifier email urgent (priorité critical/high)
   */
  notifyUrgentEmail(tenantId: string, lawyerId: string, email: EmailNotification): void {
    if (!this.io) return;

    const notification = {
      type: 'urgent-email',
      email,
      timestamp: new Date(),
      alert: {
        title: `Email ${email.priority === 'critical' ? 'CRITIQUE' : 'URGENT'}`,
        message: `De: ${email.from}\nSujet: ${email.subject}`,
        action: email.suggestedAction
      }
    };

    // Notification sonore et visuelle
    this.io.to(`lawyer:${lawyerId}`).emit('email:urgent', notification);
    
    // Notification système (pour notifications browser)
    this.io.to(`lawyer:${lawyerId}`).emit('system:notification', {
      title: notification.alert.title,
      body: notification.alert.message,
      icon: email.priority === 'critical' ? '🚨' : '⚠️',
      requireInteraction: true
    });

    console.log(`🚨 Notification urgente envoyée à l'avocat ${lawyerId}`);
  }

  /**
   * Notifier nouveau client créé depuis email
   */
  notifyNewClient(tenantId: string, client: { id: string; firstName: string; lastName: string; email: string }): void {
    if (!this.io) return;

    this.io.to(`tenant:${tenantId}`).emit('client:new', {
      type: 'new-client-from-email',
      client,
      timestamp: new Date()
    });

    console.log(`👤 Nouveau client notifié: ${client.firstName} ${client.lastName}`);
  }

  /**
   * Notifier extraction de numéro de suivi La Poste
   */
  notifyTrackingExtracted(tenantId: string, data: { emailId: string; trackingNumbers: string[] }): void {
    if (!this.io) return;

    this.io.to(`tenant:${tenantId}`).emit('tracking:extracted', {
      type: 'tracking-numbers-extracted',
      data,
      timestamp: new Date()
    });

    console.log(`📦 Numéros de suivi notifiés: ${data.trackingNumbers.join(', ')}`);
  }

  /**
   * Mettre à jour statistiques emails en temps réel
   */
  updateEmailStats(tenantId: string, stats: {
    total: number;
    unread: number;
    urgent: number;
    nouveauxClients: number;
  }): void {
    if (!this.io) return;

    this.io.to(`tenant:${tenantId}`).emit('email:stats', {
      stats,
      timestamp: new Date()
    });
  }

  /**
   * Notifier action effectuée sur email
   */
  notifyEmailAction(tenantId: string, action: {
    emailId: string;
    actionType: 'read' | 'archived' | 'starred' | 'validated' | 'responded';
    userId: string;
    userName: string;
  }): void {
    if (!this.io) return;

    this.io.to(`tenant:${tenantId}`).emit('email:action', {
      action,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast à tous les clients connectés
   */
  broadcast(event: string, data: any): void {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  /**
   * Obtenir nombre de clients connectés
   */
  getConnectedClientsCount(): number {
    if (!this.io) return 0;
    return this.io.sockets.sockets.size;
  }

  /**
   * Obtenir rooms actives
   */
  getActiveRooms(): string[] {
    if (!this.io) return [];
    return Array.from(this.io.sockets.adapter.rooms.keys());
  }
}

// Singleton instance
export const emailWebSocketService = new EmailWebSocketService();
