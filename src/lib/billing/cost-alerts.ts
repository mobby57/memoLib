/**
 * Système d'alertes pour les dépassements de budget IA
 */

import { prisma } from '@/lib/prisma';

interface AlertConfig {
  warningThreshold: number;  // 70%
  criticalThreshold: number; // 90%
  blockedThreshold: number;  // 100%
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  warningThreshold: 0.70,
  criticalThreshold: 0.90,
  blockedThreshold: 1.00,
};

interface CostAlert {
  tenantId: string;
  tenantName: string;
  adminEmail: string;
  currentCost: number;
  budgetLimit: number;
  percentage: number;
  alertLevel: 'warning' | 'critical' | 'blocked';
  period: { month: number; year: number };
}

/**
 * Vérifie tous les tenants et génère des alertes si nécessaire
 */
export async function checkAllTenantsForAlerts(): Promise<CostAlert[]> {
  const alerts: CostAlert[] = [];
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  try {
    // Récupérer tous les tenants actifs avec leur plan
    const tenants = await prisma.tenant.findMany({
      where: { status: 'active' },
      include: {
        plan: true,
        users: {
          where: { role: 'ADMIN' },
          select: { email: true, name: true },
          take: 1,
        },
      },
    });

    for (const tenant of tenants) {
      // Calculer le budget selon le plan
      const budgetLimit = getBudgetLimitForPlan(tenant.plan?.name || 'starter');
      
      // Récupérer le coût actuel du mois
      const currentCost = await getCurrentMonthCost(tenant.id, month, year);
      
      const percentage = budgetLimit > 0 ? (currentCost / budgetLimit) : 0;
      const adminEmail = tenant.users[0]?.email || '';

      // Déterminer le niveau d'alerte
      let alertLevel: 'warning' | 'critical' | 'blocked' | null = null;
      
      if (percentage >= DEFAULT_ALERT_CONFIG.blockedThreshold) {
        alertLevel = 'blocked';
      } else if (percentage >= DEFAULT_ALERT_CONFIG.criticalThreshold) {
        alertLevel = 'critical';
      } else if (percentage >= DEFAULT_ALERT_CONFIG.warningThreshold) {
        alertLevel = 'warning';
      }

      if (alertLevel) {
        alerts.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          adminEmail,
          currentCost,
          budgetLimit,
          percentage: percentage * 100,
          alertLevel,
          period: { month, year },
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error('[Cost Alerts] Erreur lors de la vérification:', error);
    return [];
  }
}

/**
 * Récupère le coût du mois en cours pour un tenant
 */
async function getCurrentMonthCost(
  tenantId: string,
  month: number,
  year: number
): Promise<number> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  try {
    const result = await prisma.aIUsageLog.aggregate({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        costEur: true,
      },
    });

    return result._sum.costEur || 0;
  } catch {
    // Table n'existe peut-être pas encore
    return 0;
  }
}

/**
 * Budget IA par plan
 */
function getBudgetLimitForPlan(planName: string): number {
  const limits: Record<string, number> = {
    FREE: 0.50,
    SOLO: 5,
    CABINET: 30,
    ENTERPRISE: 100,
    starter: 0.50,
    pro: 10,
    enterprise: 50,
    BASIC: 5,
    PREMIUM: 30,
  };

  return limits[planName] || 5;
}

/**
 * Envoie une alerte par email à l'admin du tenant
 */
export async function sendAlertEmail(alert: CostAlert): Promise<boolean> {
  const subject = getAlertSubject(alert);
  const body = getAlertBody(alert);

  try {
    // Utiliser l'API email existante ou Resend
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: alert.adminEmail,
        subject,
        html: body,
        type: 'cost-alert',
      }),
    });

    if (response.ok) {
      console.log(`[Cost Alerts] Email envoyé à ${alert.adminEmail} pour ${alert.tenantName}`);
      return true;
    }
    
    console.error('[Cost Alerts] Échec envoi email:', await response.text());
    return false;
  } catch (error) {
    console.error('[Cost Alerts] Erreur envoi email:', error);
    return false;
  }
}

/**
 * Envoie une alerte au super admin
 */
export async function sendSuperAdminAlert(alerts: CostAlert[]): Promise<void> {
  if (alerts.length === 0) return;

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@iapostemanager.com';
  
  const criticalCount = alerts.filter(a => a.alertLevel === 'critical' || a.alertLevel === 'blocked').length;
  const warningCount = alerts.filter(a => a.alertLevel === 'warning').length;

  const subject = `⚠️ Alertes Coûts IA: ${criticalCount} critiques, ${warningCount} warnings`;
  
  const body = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .alert-blocked { background: #FEE2E2; border-left: 4px solid #DC2626; padding: 10px; margin: 10px 0; }
    .alert-critical { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 10px; margin: 10px 0; }
    .alert-warning { background: #DBEAFE; border-left: 4px solid #3B82F6; padding: 10px; margin: 10px 0; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>🚨 Rapport Alertes Coûts IA</h1>
  <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
  
  <h2>Résumé</h2>
  <ul>
    <li>🔴 Bloqués/Critiques: ${criticalCount}</li>
    <li>🟡 Warnings: ${warningCount}</li>
  </ul>

  <h2>Détails par Tenant</h2>
  <table>
    <tr>
      <th>Tenant</th>
      <th>Admin</th>
      <th>Coût Actuel</th>
      <th>Limite</th>
      <th>%</th>
      <th>Statut</th>
    </tr>
    ${alerts.map(a => `
    <tr class="alert-${a.alertLevel}">
      <td>${a.tenantName}</td>
      <td>${a.adminEmail}</td>
      <td>${a.currentCost.toFixed(2)}€</td>
      <td>${a.budgetLimit}€</td>
      <td>${a.percentage.toFixed(1)}%</td>
      <td>${a.alertLevel.toUpperCase()}</td>
    </tr>
    `).join('')}
  </table>

  <h2>Actions Recommandées</h2>
  <ul>
    <li>Contacter les tenants en dépassement</li>
    <li>Proposer upgrade de plan si usage justifié</li>
    <li>Vérifier si abus ou usage anormal</li>
  </ul>

  <p><a href="${process.env.NEXTAUTH_URL}/admin/costs">👉 Voir le dashboard des coûts</a></p>
</body>
</html>
  `;

  try {
    await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: superAdminEmail,
        subject,
        html: body,
        type: 'super-admin-alert',
      }),
    });
    
    console.log(`[Cost Alerts] Rapport super admin envoyé à ${superAdminEmail}`);
  } catch (error) {
    console.error('[Cost Alerts] Erreur envoi rapport super admin:', error);
  }
}

function getAlertSubject(alert: CostAlert): string {
  const emoji = alert.alertLevel === 'blocked' ? '🚨' : 
                alert.alertLevel === 'critical' ? '⚠️' : '📊';
  
  return `${emoji} Alerte Budget IA - ${alert.percentage.toFixed(0)}% utilisé`;
}

function getAlertBody(alert: CostAlert): string {
  const statusColor = alert.alertLevel === 'blocked' ? '#DC2626' :
                      alert.alertLevel === 'critical' ? '#F59E0B' : '#3B82F6';
  
  const statusText = alert.alertLevel === 'blocked' ? 'BLOQUÉ - Limite atteinte' :
                     alert.alertLevel === 'critical' ? 'CRITIQUE - 90% atteint' : 'ATTENTION - 70% atteint';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
    .status-box { background: ${statusColor}20; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0; }
    .progress-bar { background: #E5E7EB; border-radius: 10px; height: 20px; overflow: hidden; }
    .progress-fill { background: ${statusColor}; height: 100%; }
    .stats { display: flex; justify-content: space-between; margin: 20px 0; }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1F2937; }
    .stat-label { font-size: 12px; color: #6B7280; }
    .btn { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>📊 Alerte Budget IA</h1>
  <p>Bonjour,</p>
  
  <div class="status-box">
    <strong style="color: ${statusColor};">${statusText}</strong>
    <p>Votre consommation IA pour ${alert.period.month}/${alert.period.year} approche de la limite.</p>
  </div>

  <div class="progress-bar">
    <div class="progress-fill" style="width: ${Math.min(alert.percentage, 100)}%;"></div>
  </div>
  <p style="text-align: center; color: #6B7280;">${alert.percentage.toFixed(1)}% du budget utilisé</p>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${alert.currentCost.toFixed(2)}€</div>
      <div class="stat-label">Coût actuel</div>
    </div>
    <div class="stat">
      <div class="stat-value">${alert.budgetLimit}€</div>
      <div class="stat-label">Limite mensuelle</div>
    </div>
    <div class="stat">
      <div class="stat-value">${(alert.budgetLimit - alert.currentCost).toFixed(2)}€</div>
      <div class="stat-label">Restant</div>
    </div>
  </div>

  <h3>💡 Recommandations</h3>
  <ul>
    <li><strong>Installez Ollama</strong> pour réduire les coûts IA à 0€</li>
    <li>Les requêtes similaires sont mises en cache automatiquement</li>
    <li>Contactez le support pour augmenter votre limite</li>
  </ul>

  <p style="text-align: center; margin-top: 30px;">
    <a href="${process.env.NEXTAUTH_URL}/admin/parametres" class="btn">Voir mes paramètres</a>
  </p>

  <hr style="margin-top: 40px; border: none; border-top: 1px solid #E5E7EB;">
  <p style="font-size: 12px; color: #6B7280;">
    IA Poste Manager - Cabinet ${alert.tenantName}<br>
    Cet email a été envoyé automatiquement suite à un dépassement de seuil.
  </p>
</body>
</html>
  `;
}

/**
 * Exécute le check complet et envoie les alertes
 */
export async function runCostAlertCheck(): Promise<{
  alertsSent: number;
  tenantsChecked: number;
}> {
  console.log('[Cost Alerts] Démarrage du check...');
  
  const alerts = await checkAllTenantsForAlerts();
  let alertsSent = 0;

  // Envoyer les alertes individuelles aux admins de chaque tenant
  for (const alert of alerts) {
    if (alert.adminEmail) {
      const sent = await sendAlertEmail(alert);
      if (sent) alertsSent++;
    }
  }

  // Envoyer un rapport au super admin si des alertes critiques
  const criticalAlerts = alerts.filter(a => a.alertLevel === 'critical' || a.alertLevel === 'blocked');
  if (criticalAlerts.length > 0) {
    await sendSuperAdminAlert(alerts);
  }

  console.log(`[Cost Alerts] Check terminé: ${alerts.length} alertes, ${alertsSent} emails envoyés`);

  return {
    alertsSent,
    tenantsChecked: alerts.length,
  };
}
