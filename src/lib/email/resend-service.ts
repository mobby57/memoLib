/**
 * Service d'envoi d'emails transactionnels via Resend
 * 
 * Gratuit: 100 emails/jour, 3000/mois
 * Config: RESEND_API_KEY dans les variables d'environnement
 * 
 * Usage:
 *   import { sendTransactionalEmail } from '@/lib/email/resend-service';
 *   await sendTransactionalEmail({ to: 'avocat@cabinet.fr', subject: '...', html: '...' });
 */

import { logger } from '@/lib/logger';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Envoyer un email via Resend API
 */
export async function sendTransactionalEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    logger.warn('[EMAIL] RESEND_API_KEY non configuré — email non envoyé', { to: options.to, subject: options.subject });
    return false;
  }

  const from = options.from || process.env.EMAIL_FROM || 'MemoLib <noreply@memolib.space>';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`[EMAIL] Resend error (${response.status}): ${error}`);
      return false;
    }

    const data = await response.json();
    logger.info(`[EMAIL] Envoyé: ${options.subject} → ${options.to}`, { id: data.id });
    return true;
  } catch (error) {
    logger.error('[EMAIL] Erreur envoi', error);
    return false;
  }
}

/**
 * Templates d'emails prédéfinis
 */
export const emailTemplates = {
  deadlineReminder: (params: { lawyerName: string; deadline: string; dossier: string; client: string; daysLeft: number; dueDate: string }) => ({
    subject: params.daysLeft === 0
      ? `[URGENT] Deadline AUJOURD'HUI — ${params.deadline}`
      : params.daysLeft === 1
      ? `[URGENT] Deadline DEMAIN — ${params.deadline}`
      : `Rappel échéance (J-${params.daysLeft}) — ${params.deadline}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563eb, #1e40af); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 18px;">⏰ Rappel — MemoLib</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p style="color: #374151;">Bonjour ${params.lawyerName},</p>
          <div style="background: ${params.daysLeft <= 1 ? '#fef2f2' : '#eff6ff'}; border-left: 4px solid ${params.daysLeft <= 1 ? '#ef4444' : '#3b82f6'}; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0;">
            <p style="margin: 0; font-weight: 600; color: ${params.daysLeft <= 1 ? '#991b1b' : '#1e40af'};">
              ${params.daysLeft === 0 ? '🔴 AUJOURD\'HUI' : params.daysLeft === 1 ? '🟠 DEMAIN' : `📅 Dans ${params.daysLeft} jours`}
            </p>
            <p style="margin: 8px 0 0; color: #374151;"><strong>${params.deadline}</strong></p>
            <p style="margin: 4px 0 0; color: #6b7280;">Dossier: ${params.dossier} • Client: ${params.client}</p>
            <p style="margin: 4px 0 0; color: #6b7280;">Échéance: ${params.dueDate}</p>
          </div>
          <a href="https://memolib.space/fr/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            Voir le dossier
          </a>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
          MemoLib — Ne ratez plus jamais une échéance
        </p>
      </div>
    `,
  }),

  welcomeEmail: (params: { name: string; email: string }) => ({
    subject: 'Bienvenue sur MemoLib !',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">⚖️ Bienvenue sur MemoLib</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p style="color: #374151;">Bonjour ${params.name},</p>
          <p style="color: #374151;">Votre compte est créé. Voici comment démarrer en 3 minutes :</p>
          <ol style="color: #374151; padding-left: 20px;">
            <li style="margin-bottom: 8px;"><strong>Connectez votre boîte mail</strong> — Gmail ou Outlook en 1 clic</li>
            <li style="margin-bottom: 8px;"><strong>Créez votre premier dossier</strong> — 3 champs suffisent</li>
            <li style="margin-bottom: 8px;"><strong>Laissez l'IA travailler</strong> — résumés, deadlines, brouillons</li>
          </ol>
          <a href="https://memolib.space/fr/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            Accéder à mon cabinet
          </a>
        </div>
      </div>
    `,
  }),
};
