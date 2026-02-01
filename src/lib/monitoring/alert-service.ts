/**
 * Système d'alertes et monitoring proactif
 * Détection automatique des problèmes et notifications
 */

import { publishEvent } from '@/app/api/realtime/events/route';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/services/emailService';

// ==================== TYPES ====================

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type AlertCategory =
  | 'deadline'
  | 'quota'
  | 'security'
  | 'billing'
  | 'performance'
  | 'system'
  | 'compliance';

export interface Alert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  tenantId?: string;
  userId?: string;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  category: AlertCategory;
  enabled: boolean;
  condition: () => Promise<AlertCheck[]>;
  cooldownMinutes: number; // Éviter les alertes répétées
}

interface AlertCheck {
  shouldAlert: boolean;
  severity: AlertSeverity;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  tenantId?: string;
  userId?: string;
}

interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'slack' | 'webhook';
  config: Record<string, string>;
  severities: AlertSeverity[];
}

// ==================== STORE ====================

const alertHistory = new Map<string, Date>(); // Pour le cooldown
const activeAlerts: Alert[] = [];

// ==================== RÈGLES D'ALERTES ====================

const alertRules: AlertRule[] = [
  {
    id: 'deadline_proche',
    name: 'Échéances proches',
    category: 'deadline',
    enabled: true,
    cooldownMinutes: 60 * 24, // 1 alerte par jour par dossier
    condition: async () => {
      const alerts: AlertCheck[] = [];

      // Dossiers avec échéance dans les 3 jours
      const dossiers = await prisma.dossier.findMany({
        where: {
          deadline: {
            gte: new Date(),
            lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
          status: { not: 'CLOS' },
        },
        include: {
          assignedTo: true,
          tenant: true,
        },
      });

      for (const dossier of dossiers) {
        const daysLeft = Math.ceil(
          (dossier.deadline!.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        );

        alerts.push({
          shouldAlert: true,
          severity: daysLeft <= 1 ? 'critical' : 'warning',
          title: `Échéance proche: ${dossier.reference}`,
          message: `Le dossier "${dossier.titre}" arrive à échéance dans ${daysLeft} jour(s).`,
          data: {
            dossierId: dossier.id,
            reference: dossier.reference,
            deadline: dossier.deadline,
            daysLeft,
          },
          tenantId: dossier.tenantId,
          userId: dossier.assignedToId ?? undefined,
        });
      }

      return alerts;
    },
  },
  {
    id: 'quota_warning',
    name: 'Quotas élevés',
    category: 'quota',
    enabled: true,
    cooldownMinutes: 60 * 12, // 2 alertes par jour max
    condition: async () => {
      const alerts: AlertCheck[] = [];

      const tenants = await prisma.tenant.findMany({
        where: { status: 'active' },
        include: {
          plan: true,
          users: {
            where: { role: 'ADMIN' },
            take: 1,
          },
        },
      });

      for (const tenant of tenants) {
        if (!tenant.plan) continue;

        // Vérifier les différents quotas
        const quotaChecks = [
          {
            name: 'Dossiers',
            current: tenant.currentDossiers,
            max: tenant.plan.maxDossiers,
          },
          {
            name: 'Utilisateurs',
            current: tenant.currentUsers,
            max: tenant.plan.maxUsers,
          },
          {
            name: 'Stockage',
            current: tenant.currentStorageGb,
            max: tenant.plan.maxStorageGb,
          },
        ];

        for (const check of quotaChecks) {
          if (check.max === -1) continue; // Illimité

          const percentage = (check.current / check.max) * 100;

          if (percentage >= 90) {
            alerts.push({
              shouldAlert: true,
              severity: percentage >= 100 ? 'critical' : 'warning',
              title: `Quota ${check.name} atteint`,
              message: `${tenant.name}: ${check.current}/${check.max} ${check.name} utilisés (${percentage.toFixed(0)}%)`,
              data: {
                quotaType: check.name.toLowerCase(),
                current: check.current,
                max: check.max,
                percentage,
              },
              tenantId: tenant.id,
              userId: tenant.users[0]?.id,
            });
          }
        }
      }

      return alerts;
    },
  },
  {
    id: 'facture_impayee',
    name: 'Factures impayées',
    category: 'billing',
    enabled: true,
    cooldownMinutes: 60 * 24 * 3, // 1 alerte tous les 3 jours
    condition: async () => {
      const alerts: AlertCheck[] = [];

      // Factures échues non payées
      const factures = await prisma.facture.findMany({
        where: {
          statut: 'ENVOYEE',
          dateEcheance: { lt: new Date() },
        },
        include: {
          client: true,
          tenant: true,
        },
      });

      for (const facture of factures) {
        const joursRetard = Math.ceil(
          (Date.now() - facture.dateEcheance.getTime()) / (24 * 60 * 60 * 1000)
        );

        alerts.push({
          shouldAlert: true,
          severity: joursRetard > 30 ? 'critical' : 'warning',
          title: `Facture impayée: ${facture.numero}`,
          message: `Facture ${facture.numero} de ${facture.client.nom} impayée depuis ${joursRetard} jours (${facture.totalTTC}€)`,
          data: {
            factureId: facture.id,
            numero: facture.numero,
            client: facture.client.nom,
            montant: facture.totalTTC,
            joursRetard,
          },
          tenantId: facture.tenantId,
        });
      }

      return alerts;
    },
  },
  {
    id: 'connexion_suspecte',
    name: 'Connexions suspectes',
    category: 'security',
    enabled: true,
    cooldownMinutes: 30,
    condition: async () => {
      const alerts: AlertCheck[] = [];

      // Vérifier les logs de connexion (exemple simplifié)
      const recentLogins = await prisma.securityEvent.findMany({
        where: {
          type: 'LOGIN_FAILED',
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }, // 15 min
        },
        orderBy: { createdAt: 'desc' },
      });

      // Grouper par IP
      const loginsByIP = new Map<string, number>();
      for (const login of recentLogins) {
        const ip = (login.metadata as Record<string, string>)?.ip || 'unknown';
        loginsByIP.set(ip, (loginsByIP.get(ip) || 0) + 1);
      }

      for (const [ip, count] of loginsByIP) {
        if (count >= 5) {
          alerts.push({
            shouldAlert: true,
            severity: count >= 10 ? 'critical' : 'warning',
            title: 'Tentatives de connexion suspectes',
            message: `${count} tentatives de connexion échouées depuis l'IP ${ip} en 15 minutes`,
            data: { ip, count },
          });
        }
      }

      return alerts;
    },
  },
];

// ==================== SERVICE ====================

export class AlertService {
  private channels: NotificationChannel[] = [];

  constructor() {
    // Canal email par défaut
    this.addChannel({
      type: 'email',
      config: {},
      severities: ['warning', 'critical', 'emergency'],
    });
  }

  /**
   * Ajouter un canal de notification
   */
  addChannel(channel: NotificationChannel): void {
    this.channels.push(channel);
  }

  /**
   * Exécuter toutes les règles d'alertes
   */
  async checkAllRules(): Promise<Alert[]> {
    const newAlerts: Alert[] = [];

    for (const rule of alertRules) {
      if (!rule.enabled) continue;

      try {
        const checks = await rule.condition();

        for (const check of checks) {
          if (!check.shouldAlert) continue;

          // Vérifier le cooldown
          const cooldownKey = `${rule.id}:${check.tenantId || ''}:${check.userId || ''}`;
          const lastAlert = alertHistory.get(cooldownKey);

          if (lastAlert) {
            const cooldownMs = rule.cooldownMinutes * 60 * 1000;
            if (Date.now() - lastAlert.getTime() < cooldownMs) {
              continue; // Skip, encore en cooldown
            }
          }

          // Créer l'alerte
          const alert: Alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            category: rule.category,
            severity: check.severity,
            title: check.title,
            message: check.message,
            data: check.data,
            tenantId: check.tenantId,
            userId: check.userId,
            createdAt: new Date(),
          };

          newAlerts.push(alert);
          activeAlerts.push(alert);
          alertHistory.set(cooldownKey, new Date());

          // Notifier
          await this.notifyAlert(alert);
        }
      } catch (error) {
        console.error(`[Alerts] Erreur règle ${rule.id}:`, error);
      }
    }

    return newAlerts;
  }

  /**
   * Notifier une alerte via les canaux configurés
   */
  private async notifyAlert(alert: Alert): Promise<void> {
    // Publier via SSE pour le temps réel
    publishEvent(
      'system:alert',
      {
        alert,
      },
      alert.userId ? [alert.userId] : undefined
    );

    // Notifier via les canaux configurés
    for (const channel of this.channels) {
      if (!channel.severities.includes(alert.severity)) continue;

      try {
        switch (channel.type) {
          case 'email':
            await this.sendEmailAlert(alert);
            break;
          case 'slack':
            await this.sendSlackAlert(alert, channel.config);
            break;
          case 'webhook':
            await this.sendWebhookAlert(alert, channel.config);
            break;
          // Ajouter d'autres canaux selon besoin
        }
      } catch (error) {
        console.error(`[Alerts] Erreur notification ${channel.type}:`, error);
      }
    }
  }

  /**
   * Envoyer une alerte par email
   */
  private async sendEmailAlert(alert: Alert): Promise<void> {
    // Trouver les destinataires
    let recipients: string[] = [];

    if (alert.userId) {
      const user = await prisma.user.findUnique({
        where: { id: alert.userId },
        select: { email: true },
      });
      if (user?.email) recipients.push(user.email);
    } else if (alert.tenantId) {
      const admins = await prisma.user.findMany({
        where: { tenantId: alert.tenantId, role: 'ADMIN' },
        select: { email: true },
      });
      recipients = admins.map(a => a.email).filter(Boolean) as string[];
    }

    if (recipients.length === 0) return;

    const severityEmoji = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🔴',
      emergency: '🚨',
    };

    for (const email of recipients) {
      await sendEmail({
        to: email,
        subject: `${severityEmoji[alert.severity]} [${alert.severity.toUpperCase()}] ${alert.title}`,
        text: `
${alert.title}

${alert.message}

Catégorie: ${alert.category}
Sévérité: ${alert.severity}
Date: ${alert.createdAt.toLocaleString('fr-FR')}

${alert.data ? `Détails: ${JSON.stringify(alert.data, null, 2)}` : ''}

---
memoLib - Système d'alertes
        `,
      });
    }
  }

  /**
   * Envoyer une alerte Slack
   */
  private async sendSlackAlert(alert: Alert, config: Record<string, string>): Promise<void> {
    const webhookUrl = config.webhookUrl;
    if (!webhookUrl) return;

    const colors = {
      info: '#3b82f6',
      warning: '#f59e0b',
      critical: '#ef4444',
      emergency: '#7c3aed',
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [
          {
            color: colors[alert.severity],
            title: alert.title,
            text: alert.message,
            fields: [
              { title: 'Catégorie', value: alert.category, short: true },
              { title: 'Sévérité', value: alert.severity, short: true },
            ],
            footer: 'memoLib',
            ts: Math.floor(alert.createdAt.getTime() / 1000),
          },
        ],
      }),
    });
  }

  /**
   * Envoyer une alerte via webhook personnalisé
   */
  private async sendWebhookAlert(alert: Alert, config: Record<string, string>): Promise<void> {
    const url = config.url;
    if (!url) return;

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.authHeader ? { Authorization: config.authHeader } : {}),
      },
      body: JSON.stringify({ alert }),
    });
  }

  /**
   * Marquer une alerte comme reconnue
   */
  acknowledgeAlert(alertId: string): void {
    const alert = activeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledgedAt = new Date();
    }
  }

  /**
   * Marquer une alerte comme résolue
   */
  resolveAlert(alertId: string): void {
    const alert = activeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolvedAt = new Date();
    }
  }

  /**
   * Obtenir les alertes actives
   */
  getActiveAlerts(tenantId?: string): Alert[] {
    return activeAlerts.filter(a => {
      if (a.resolvedAt) return false;
      if (tenantId && a.tenantId !== tenantId) return false;
      return true;
    });
  }

  /**
   * Obtenir les statistiques d'alertes
   */
  getStats(): {
    total: number;
    bySeverity: Record<AlertSeverity, number>;
    byCategory: Record<AlertCategory, number>;
    activeCount: number;
  } {
    const active = this.getActiveAlerts();

    const bySeverity: Record<AlertSeverity, number> = {
      info: 0,
      warning: 0,
      critical: 0,
      emergency: 0,
    };
    const byCategory: Partial<Record<AlertCategory, number>> = {};

    for (const alert of active) {
      bySeverity[alert.severity]++;
      byCategory[alert.category] = (byCategory[alert.category] || 0) + 1;
    }

    return {
      total: activeAlerts.length,
      bySeverity,
      byCategory: byCategory as Record<AlertCategory, number>,
      activeCount: active.length,
    };
  }
}

// Export singleton
export const alertService = new AlertService();

// Fonction pour démarrer le monitoring périodique
export function startAlertMonitoring(intervalMinutes = 15): NodeJS.Timeout {
  console.log(`[Alerts] Monitoring démarré (intervalle: ${intervalMinutes}min)`);

  return setInterval(
    async () => {
      try {
        const alerts = await alertService.checkAllRules();
        if (alerts.length > 0) {
          console.log(`[Alerts] ${alerts.length} nouvelles alertes générées`);
        }
      } catch (error) {
        console.error('[Alerts] Erreur monitoring:', error);
      }
    },
    intervalMinutes * 60 * 1000
  );
}

export default alertService;
