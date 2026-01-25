/**
 * Service de notifications par email
 * Gere l'envoi automatique d'emails pour rappels, resumes et alertes
 */

import { logger } from '@/lib/logger';

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface EmailNotification {
  to: EmailRecipient[];
  template: EmailTemplate;
  attachments?: {
    filename: string;
    content: string | Buffer;
    contentType: string;
  }[];
}

/**
 * Types de notifications automatiques
 */
export type NotificationType = 
  | 'echeance_reminder'      // Rappel d'echeance
  | 'facture_overdue'        // Facture en retard
  | 'facture_paid'           // Facture payee
  | 'weekly_summary'         // Resume hebdomadaire
  | 'new_client'             // Nouveau client
  | 'dossier_update';        // Mise a jour dossier

/**
 * Configuration des rappels automatiques
 */
export interface ReminderConfig {
  enabled: boolean;
  triggers: {
    echeances: {
      enabled: boolean;
      daysBefore: number[];  // Ex: [7, 3, 1] pour rappels a 7j, 3j, 1j
    };
    facturesOverdue: {
      enabled: boolean;
      daysAfter: number[];   // Ex: [7, 14, 30] pour relances
    };
    weeklySummary: {
      enabled: boolean;
      dayOfWeek: number;     // 0 = Dimanche, 1 = Lundi, etc.
      hour: number;          // Heure d'envoi (0-23)
    };
  };
}

/**
 * Genere un email de rappel d'echeance
 */
export function generateEcheanceReminderEmail(
  echeance: {
    titre: string;
    date: Date;
    dossier: string;
    description?: string;
  },
  daysUntil: number
): EmailTemplate {
  const urgencyLevel = daysUntil <= 1 ? 'URGENT' : daysUntil <= 3 ? 'Important' : 'a venir';
  const urgencyColor = daysUntil <= 1 ? '#dc2626' : daysUntil <= 3 ? '#f59e0b' : '#3b82f6';

  const subject = `${urgencyLevel}: echeance dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''} - ${echeance.titre}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Rappel d'echeance</h1>
        </div>

        <!-- Alert Banner -->
        <div style="background-color: ${urgencyColor}; color: white; padding: 15px; text-align: center; font-weight: bold;">
          ️ ${urgencyLevel}: ${daysUntil} jour${daysUntil > 1 ? 's' : ''} restant${daysUntil > 1 ? 's' : ''}
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">${echeance.titre}</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 30%;"> Date:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">
                  ${echeance.date.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"> Dossier:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${echeance.dossier}</td>
              </tr>
              ${echeance.description ? `
              <tr>
                <td colspan="2" style="padding: 8px 0; color: #6b7280;">
                  <br>
                   Description:<br>
                  <span style="color: #1f2937;">${echeance.description}</span>
                </td>
              </tr>
              ` : ''}
            </table>
          </div>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <strong style="color: #92400e;">Action requise:</strong>
            <p style="color: #78350f; margin: 8px 0 0 0;">
              N'oubliez pas de traiter cette echeance avant la date limite.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/calendrier" 
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Voir le calendrier
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            Cet email a ete genere automatiquement par IA Poste Manager<br>
            Pour modifier vos preferences de notification, rendez-vous dans les parametres.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
${urgencyLevel}: echeance dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}

${echeance.titre}

Date: ${echeance.date.toLocaleDateString('fr-FR')}
Dossier: ${echeance.dossier}
${echeance.description ? `\nDescription: ${echeance.description}` : ''}

N'oubliez pas de traiter cette echeance avant la date limite.

Voir le calendrier: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/calendrier
  `.trim();

  return { subject, htmlBody, textBody };
}

/**
 * Genere un email pour facture en retard
 */
export function generateFactureOverdueEmail(
  facture: {
    numero: string;
    client: string;
    montant: number;
    dateEcheance: Date;
  },
  daysOverdue: number
): EmailTemplate {
  const subject = `Rappel: Facture ${facture.numero} en retard (${daysOverdue} jours)`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">️ Facture Impayee</h1>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #1f2937;">Relance de paiement</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">
            La facture suivante est en retard de paiement depuis <strong>${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}</strong>:
          </p>

          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Numero:</td>
                <td style="color: #1f2937; font-weight: bold; padding: 5px 0;">${facture.numero}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Client:</td>
                <td style="color: #1f2937; font-weight: bold; padding: 5px 0;">${facture.client}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Montant:</td>
                <td style="color: #dc2626; font-weight: bold; font-size: 18px; padding: 5px 0;">${facture.montant.toFixed(2)} €</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">echeance:</td>
                <td style="color: #1f2937; padding: 5px 0;">${facture.dateEcheance.toLocaleDateString('fr-FR')}</td>
              </tr>
            </table>
          </div>

          <p style="color: #4b5563; line-height: 1.6;">
            <strong>Actions recommandees:</strong>
          </p>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li>Contacter le client pour relance</li>
            <li>Verifier le statut de paiement</li>
            <li>Envoyer un rappel de paiement</li>
          </ul>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/factures" 
               style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Voir la facture
            </a>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            IA Poste Manager - Gestion intelligente de cabinet juridique
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Rappel: Facture ${facture.numero} en retard (${daysOverdue} jours)

La facture suivante est en retard de paiement:

Numero: ${facture.numero}
Client: ${facture.client}
Montant: ${facture.montant.toFixed(2)} €
echeance: ${facture.dateEcheance.toLocaleDateString('fr-FR')}

Actions recommandees:
- Contacter le client pour relance
- Verifier le statut de paiement
- Envoyer un rappel de paiement

Voir la facture: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/factures
  `.trim();

  return { subject, htmlBody, textBody };
}

/**
 * Genere un resume hebdomadaire
 */
export function generateWeeklySummaryEmail(
  summary: {
    newDossiers: number;
    newFactures: number;
    totalRevenue: number;
    upcomingEcheances: number;
    overdueFactures: number;
  }
): EmailTemplate {
  const subject = `Resume hebdomadaire - Semaine du ${new Date().toLocaleDateString('fr-FR')}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;"> Resume Hebdomadaire</h1>
          <p style="color: #dbeafe; margin: 10px 0 0 0;">Semaine du ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">Votre activite cette semaine</h2>

          <!-- Stats Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="color: #3b82f6; font-size: 32px; font-weight: bold;">${summary.newDossiers}</div>
              <div style="color: #1e40af; font-size: 14px; margin-top: 5px;">Nouveaux dossiers</div>
            </div>
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="color: #22c55e; font-size: 32px; font-weight: bold;">${summary.totalRevenue.toFixed(0)} €</div>
              <div style="color: #16a34a; font-size: 14px; margin-top: 5px;">Chiffre d'affaires</div>
            </div>
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="color: #f59e0b; font-size: 32px; font-weight: bold;">${summary.upcomingEcheances}</div>
              <div style="color: #d97706; font-size: 14px; margin-top: 5px;">echeances a venir</div>
            </div>
            <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="color: #ef4444; font-size: 32px; font-weight: bold;">${summary.overdueFactures}</div>
              <div style="color: #dc2626; font-size: 14px; margin-top: 5px;">Factures en retard</div>
            </div>
          </div>

          ${summary.overdueFactures > 0 ? `
          <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <strong style="color: #991b1b;">️ Action requise:</strong>
            <p style="color: #7f1d1d; margin: 8px 0 0 0;">
              Vous avez ${summary.overdueFactures} facture${summary.overdueFactures > 1 ? 's' : ''} en retard de paiement.
            </p>
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Voir le dashboard
            </a>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            IA Poste Manager - Resume automatique hebdomadaire<br>
            Pour desactiver ces emails, rendez-vous dans les parametres.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Resume hebdomadaire - ${new Date().toLocaleDateString('fr-FR')}

Votre activite cette semaine:

 ${summary.newDossiers} nouveaux dossiers
 ${summary.totalRevenue.toFixed(2)} € de chiffre d'affaires
 ${summary.upcomingEcheances} echeances a venir
️ ${summary.overdueFactures} factures en retard

Voir le dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard
  `.trim();

  return { subject, htmlBody, textBody };
}

/**
 * Configuration par defaut des notifications
 */
export const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  enabled: true,
  triggers: {
    echeances: {
      enabled: true,
      daysBefore: [7, 3, 1],
    },
    facturesOverdue: {
      enabled: true,
      daysAfter: [7, 14, 30],
    },
    weeklySummary: {
      enabled: true,
      dayOfWeek: 1, // Lundi
      hour: 9,      // 9h du matin
    },
  },
};

/**
 * Simule l'envoi d'un email (pour developpement)
 * En production, utiliser un service comme Resend, SendGrid ou AWS SES
 */
export async function sendEmail(notification: EmailNotification): Promise<boolean> {
  logger.info('Email simule envoye', {
    to: notification.to.map(r => r.email),
    subject: notification.template.subject,
    from: 'noreply@iapostemanage.com'
  });
  
  // En production, remplacer par:
  // const response = await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     from: 'IA Poste Manager <notifications@iapostemanager.com>',
  //     to: notification.to.map(r => r.email),
  //     subject: notification.template.subject,
  //     html: notification.template.htmlBody,
  //   }),
  // });
  
  return true;
}
