/**
 * Service de notifications par email
 *
 * Gère la génération et l'envoi des emails :
 * - rappels d'échéances
 * - factures en retard
 * - factures payées
 * - résumés hebdomadaires
 * - nouveaux clients
 * - mises à jour de dossiers
 *
 * L'envoi réel utilise l'API Resend si RESEND_API_KEY est configurée.
 * Sinon, en développement, l'email est simplement journalisé.
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

export type NotificationType =
  | 'echeance_reminder'
  | 'facture_overdue'
  | 'facture_paid'
  | 'weekly_summary'
  | 'new_client'
  | 'dossier_update';

export interface ReminderConfig {
  enabled: boolean;
  triggers: {
    echeances: {
      enabled: boolean;
      daysBefore: number[];
    };
    facturesOverdue: {
      enabled: boolean;
      daysAfter: number[];
    };
    weeklySummary: {
      enabled: boolean;
      dayOfWeek: number;
      hour: number;
    };
  };
}

/**
 * URL de base de l'application.
 */
function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

/**
 * Échappe les caractères HTML pour éviter l'injection
 * dans les templates email.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Génère un email de rappel d'échéance.
 */
export function generateEcheanceReminderEmail(
  echeance: {
    titre: string;
    date: Date;
    dossier: string;
    description?: string;
  },
  daysUntil: number,
): EmailTemplate {
  const urgencyLevel =
    daysUntil <= 1 ? 'URGENT' : daysUntil <= 3 ? 'Important' : 'À venir';

  const urgencyColor =
    daysUntil <= 1
      ? '#dc2626'
      : daysUntil <= 3
        ? '#f59e0b'
        : '#3b82f6';

  const dayLabel = daysUntil > 1 ? 'jours' : 'jour';

  const titre = escapeHtml(echeance.titre);
  const dossier = escapeHtml(echeance.dossier);
  const description = echeance.description
    ? escapeHtml(echeance.description)
    : '';

  const formattedDate = echeance.date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `${urgencyLevel}: échéance dans ${daysUntil} ${dayLabel} - ${echeance.titre}`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel d'échéance</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f3f4f6;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;">

    <div style="background:linear-gradient(135deg,#3b82f6 0%,#1e40af 100%);padding:30px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;">
        Rappel d'échéance
      </h1>
    </div>

    <div style="background-color:${urgencyColor};color:#ffffff;padding:15px;text-align:center;font-weight:bold;">
      ${urgencyLevel}: ${daysUntil} ${dayLabel} restant${daysUntil > 1 ? 's' : ''}
    </div>

    <div style="padding:30px;">

      <h2 style="color:#1f2937;margin-top:0;">
        ${titre}
      </h2>

      <div style="background-color:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;width:30%;">
              Date :
            </td>
            <td style="padding:8px 0;color:#1f2937;font-weight:bold;">
              ${formattedDate}
            </td>
          </tr>

          <tr>
            <td style="padding:8px 0;color:#6b7280;">
              Dossier :
            </td>
            <td style="padding:8px 0;color:#1f2937;font-weight:bold;">
              ${dossier}
            </td>
          </tr>

          ${
            description
              ? `
          <tr>
            <td colspan="2" style="padding:8px 0;color:#6b7280;">
              <strong>Description :</strong><br>
              <span style="color:#1f2937;">
                ${description}
              </span>
            </td>
          </tr>
          `
              : ''
          }
        </table>
      </div>

      <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;">
        <strong style="color:#92400e;">
          Action requise :
        </strong>

        <p style="color:#78350f;margin:8px 0 0 0;">
          N'oubliez pas de traiter cette échéance avant la date limite.
        </p>
      </div>

      <div style="text-align:center;margin-top:30px;">
        <a
          href="${getAppUrl()}/calendrier"
          style="background-color:#3b82f6;color:#ffffff;padding:12px 30px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;"
        >
          Voir le calendrier
        </a>
      </div>

    </div>

    <div style="background-color:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#6b7280;font-size:12px;margin:0;">
        Cet email a été généré automatiquement par memoLib.<br>
        Pour modifier vos préférences de notification,
        rendez-vous dans les paramètres.
      </p>
    </div>

  </div>
</body>
</html>
`;

  const textBody = `
${urgencyLevel}: échéance dans ${daysUntil} ${dayLabel}

${echeance.titre}

Date : ${echeance.date.toLocaleDateString('fr-FR')}
Dossier : ${echeance.dossier}
${echeance.description ? `\nDescription : ${echeance.description}` : ''}

N'oubliez pas de traiter cette échéance avant la date limite.

Voir le calendrier :
${getAppUrl()}/calendrier
`.trim();

  return {
    subject,
    htmlBody,
    textBody,
  };
}

/**
 * Génère un email pour une facture en retard.
 */
export function generateFactureOverdueEmail(
  facture: {
    numero: string;
    client: string;
    montant: number;
    dateEcheance: Date;
  },
  daysOverdue: number,
): EmailTemplate {
  const numero = escapeHtml(facture.numero);
  const client = escapeHtml(facture.client);

  const dayLabel = daysOverdue > 1 ? 'jours' : 'jour';

  const subject = `Rappel : Facture ${facture.numero} en retard (${daysOverdue} ${dayLabel})`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture impayée</title>
</head>

<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f3f4f6;">

  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;">

    <div style="background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);padding:30px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;">
        Facture impayée
      </h1>
    </div>

    <div style="padding:30px;">

      <h2 style="color:#1f2937;">
        Relance de paiement
      </h2>

      <p style="color:#4b5563;line-height:1.6;">
        La facture suivante est en retard de paiement depuis
        <strong>${daysOverdue} ${dayLabel}</strong>.
      </p>

      <div style="background-color:#fee2e2;padding:20px;border-radius:8px;border-left:4px solid #dc2626;margin:20px 0;">

        <table style="width:100%;border-collapse:collapse;">

          <tr>
            <td style="color:#6b7280;padding:5px 0;">
              Numéro :
            </td>

            <td style="color:#1f2937;font-weight:bold;padding:5px 0;">
              ${numero}
            </td>
          </tr>

          <tr>
            <td style="color:#6b7280;padding:5px 0;">
              Client :
            </td>

            <td style="color:#1f2937;font-weight:bold;padding:5px 0;">
              ${client}
            </td>
          </tr>

          <tr>
            <td style="color:#6b7280;padding:5px 0;">
              Montant :
            </td>

            <td style="color:#dc2626;font-weight:bold;font-size:18px;padding:5px 0;">
              ${facture.montant.toFixed(2)} €
            </td>
          </tr>

          <tr>
            <td style="color:#6b7280;padding:5px 0;">
              Échéance :
            </td>

            <td style="color:#1f2937;padding:5px 0;">
              ${facture.dateEcheance.toLocaleDateString('fr-FR')}
            </td>
          </tr>

        </table>

      </div>

      <p style="color:#4b5563;line-height:1.6;">
        <strong>Actions recommandées :</strong>
      </p>

      <ul style="color:#4b5563;line-height:1.8;">
        <li>Contacter le client pour relance</li>
        <li>Vérifier le statut de paiement</li>
        <li>Envoyer un rappel de paiement</li>
      </ul>

      <div style="text-align:center;margin-top:30px;">
        <a
          href="${getAppUrl()}/factures"
          style="background-color:#dc2626;color:#ffffff;padding:12px 30px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;"
        >
          Voir les factures
        </a>
      </div>

    </div>

    <div style="background-color:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#6b7280;font-size:12px;margin:0;">
        memoLib - Gestion intelligente de cabinet juridique
      </p>
    </div>

  </div>

</body>
</html>
`;

  const textBody = `
Rappel : Facture ${facture.numero} en retard (${daysOverdue} ${dayLabel})

La facture suivante est en retard de paiement :

Numéro : ${facture.numero}
Client : ${facture.client}
Montant : ${facture.montant.toFixed(2)} €
Échéance : ${facture.dateEcheance.toLocaleDateString('fr-FR')}

Actions recommandées :

- Contacter le client pour relance
- Vérifier le statut de paiement
- Envoyer un rappel de paiement

Voir les factures :
${getAppUrl()}/factures
`.trim();

  return {
    subject,
    htmlBody,
    textBody,
  };
}

/**
 * Génère un résumé hebdomadaire.
 */
export function generateWeeklySummaryEmail(
  summary: {
    newDossiers: number;
    newFactures: number;
    totalRevenue: number;
    upcomingEcheances: number;
    overdueFactures: number;
  },
): EmailTemplate {
  const currentDate = new Date().toLocaleDateString('fr-FR');

  const subject = `Résumé hebdomadaire - Semaine du ${currentDate}`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Résumé hebdomadaire</title>
</head>

<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f3f4f6;">

  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;">

    <div style="background:linear-gradient(135deg,#3b82f6 0%,#1e40af 100%);padding:30px;text-align:center;">

      <h1 style="color:#ffffff;margin:0;font-size:24px;">
        Résumé hebdomadaire
      </h1>

      <p style="color:#dbeafe;margin:10px 0 0 0;">
        Semaine du ${currentDate}
      </p>

    </div>

    <div style="padding:30px;">

      <h2 style="color:#1f2937;margin-top:0;">
        Votre activité cette semaine
      </h2>

      <div style="margin:20px 0;">

        <div style="background-color:#eff6ff;padding:20px;border-radius:8px;text-align:center;margin-bottom:15px;">
          <div style="color:#3b82f6;font-size:32px;font-weight:bold;">
            ${summary.newDossiers}
          </div>

          <div style="color:#1e40af;font-size:14px;margin-top:5px;">
            Nouveaux dossiers
          </div>
        </div>

        <div style="background-color:#f0fdf4;padding:20px;border-radius:8px;text-align:center;margin-bottom:15px;">
          <div style="color:#22c55e;font-size:32px;font-weight:bold;">
            ${summary.totalRevenue.toFixed(2)} €
          </div>

          <div style="color:#16a34a;font-size:14px;margin-top:5px;">
            Chiffre d'affaires
          </div>
        </div>

        <div style="background-color:#fef3c7;padding:20px;border-radius:8px;text-align:center;margin-bottom:15px;">
          <div style="color:#f59e0b;font-size:32px;font-weight:bold;">
            ${summary.upcomingEcheances}
          </div>

          <div style="color:#d97706;font-size:14px;margin-top:5px;">
            Échéances à venir
          </div>
        </div>

        <div style="background-color:#fee2e2;padding:20px;border-radius:8px;text-align:center;margin-bottom:15px;">
          <div style="color:#ef4444;font-size:32px;font-weight:bold;">
            ${summary.overdueFactures}
          </div>

          <div style="color:#dc2626;font-size:14px;margin-top:5px;">
            Factures en retard
          </div>
        </div>

      </div>

      ${
        summary.overdueFactures > 0
          ? `
      <div style="background-color:#fee2e2;border-left:4px solid #dc2626;padding:15px;margin:20px 0;">

        <strong style="color:#991b1b;">
          Action requise :
        </strong>

        <p style="color:#7f1d1d;margin:8px 0 0 0;">
          Vous avez ${summary.overdueFactures}
          facture${summary.overdueFactures > 1 ? 's' : ''}
          en retard de paiement.
        </p>

      </div>
      `
          : ''
      }

      <div style="text-align:center;margin-top:30px;">

        <a
          href="${getAppUrl()}/dashboard"
          style="background-color:#3b82f6;color:#ffffff;padding:12px 30px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;"
        >
          Voir le dashboard
        </a>

      </div>

    </div>

    <div style="background-color:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">

      <p style="color:#6b7280;font-size:12px;margin:0;">
        memoLib - Résumé automatique hebdomadaire<br>
        Pour désactiver ces emails, rendez-vous dans les paramètres.
      </p>

    </div>

  </div>

</body>
</html>
`;

  const textBody = `
Résumé hebdomadaire - ${currentDate}

Votre activité cette semaine :

- ${summary.newDossiers} nouveaux dossiers
- ${summary.newFactures} nouvelles factures
- ${summary.totalRevenue.toFixed(2)} € de chiffre d'affaires
- ${summary.upcomingEcheances} échéances à venir
- ${summary.overdueFactures} facture${summary.overdueFactures > 1 ? 's' : ''} en retard

Voir le dashboard :
${getAppUrl()}/dashboard
`.trim();

  return {
    subject,
    htmlBody,
    textBody,
  };
}

/**
 * Configuration par défaut des notifications.
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
      dayOfWeek: 1,
      hour: 9,
    },
  },
};

/**
 * Envoie réellement un email via Resend.
 *
 * Si RESEND_API_KEY n'est pas configurée :
 * - en développement : l'envoi est simulé
 * - en production : l'envoi échoue proprement
 */
export async function sendEmail(
  notification: EmailNotification,
): Promise<boolean> {
  const recipients = notification.to
    .map((recipient) => recipient.email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    logger.warn('Aucun destinataire email fourni');
    return false;
  }

  const apiKey = process.env.RESEND_API_KEY;

  const from =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    'MemoLib <noreply@memolib.io>';

  /**
   * Mode simulation si aucune clé Resend n'est configurée.
   */
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      logger.error(
        'RESEND_API_KEY manquante en production : email non envoyé',
        {
          to: recipients,
          subject: notification.template.subject,
        },
      );

      return false;
    }

    logger.info('Email simulé en développement', {
      to: recipients,
      subject: notification.template.subject,
      from,
    });

    return true;
  }

  try {
    const attachments = notification.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content:
        typeof attachment.content === 'string'
          ? attachment.content
          : attachment.content.toString('base64'),
    }));

    const payload: Record<string, unknown> = {
      from,
      to: recipients,
      subject: notification.template.subject,
      html: notification.template.htmlBody,
      text: notification.template.textBody,
    };

    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as
      | { id?: string; message?: string }
      | null;

    if (!response.ok) {
      logger.error('Erreur Resend lors de l\'envoi email', {
        status: response.status,
        message: data?.message || 'Erreur inconnue',
        to: recipients,
        subject: notification.template.subject,
      });

      return false;
    }

    logger.info('Email envoyé avec succès', {
      id: data?.id,
      to: recipients,
      subject: notification.template.subject,
    });

    return true;
  } catch (error) {
    logger.error('Erreur lors de l\'envoi email', {
      error: error instanceof Error ? error.message : String(error),
      to: recipients,
      subject: notification.template.subject,
    });

    return false;
  }
}