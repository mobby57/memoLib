/**
 * Service d'envoi d'emails
 * Compatible avec: Resend, SendGrid, Nodemailer SMTP
 */

import nodemailer from 'nodemailer';

// Configuration du transporteur
const getTransporter = () => {
  // Option 1: Resend (recommandé, gratuit 100 emails/jour)
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    });
  }

  // Option 2: SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Option 3: SMTP personnalisé
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: Mode test (logs seulement)
  console.warn('[EMAIL] Aucun transporteur configuré - mode test');
  return null;
};

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envoyer un email
 */
export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  const transporter = getTransporter();
  const fromAddress = options.from || process.env.EMAIL_FROM || 'noreply@iapostemanager.com';

  // Mode test si pas de transporteur
  if (!transporter) {
    console.log('[EMAIL TEST]', {
      to: options.to,
      subject: options.subject,
      from: fromAddress,
    });
    return { success: true, messageId: 'test-' + Date.now() };
  }

  try {
    const result = await transporter.sendMail({
      from: fromAddress,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      replyTo: options.replyTo,
      attachments: options.attachments,
    });

    console.log('[EMAIL] Envoyé:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('[EMAIL] Erreur:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Templates d'emails prédéfinis
 */
export const emailTemplates = {
  /**
   * Alerte échéance dossier
   */
  deadlineAlert: (data: {
    clientName: string;
    dossierNumero: string;
    dossierType: string;
    echeance: Date;
    joursRestants: number;
    lienDossier: string;
  }) => ({
    subject: `⚠️ Échéance proche: ${data.dossierNumero} - ${data.joursRestants} jours restants`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-table { width: 100%; margin: 20px 0; }
    .info-table td { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .info-table td:first-child { font-weight: 600; color: #6b7280; width: 40%; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">⚠️ Alerte Échéance</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.joursRestants} jours restants</p>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      
      <div class="alert-box">
        <strong>Une échéance importante approche !</strong><br>
        Le dossier <strong>${data.dossierNumero}</strong> arrive à échéance dans <strong>${data.joursRestants} jours</strong>.
      </div>
      
      <table class="info-table">
        <tr><td>Client</td><td>${data.clientName}</td></tr>
        <tr><td>Numéro dossier</td><td>${data.dossierNumero}</td></tr>
        <tr><td>Type</td><td>${data.dossierType}</td></tr>
        <tr><td>Date échéance</td><td>${new Date(data.echeance).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
      </table>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${data.lienDossier}" class="btn">Voir le dossier →</a>
      </p>
      
      <div class="footer">
        <p>Cet email a été envoyé automatiquement par IA Poste Manager.</p>
        <p>© ${new Date().getFullYear()} IA Poste Manager</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
  }),

  /**
   * Changement de statut dossier
   */
  statusChange: (data: {
    clientName: string;
    dossierNumero: string;
    ancienStatut: string;
    nouveauStatut: string;
    lienDossier: string;
  }) => ({
    subject: `📋 Mise à jour dossier ${data.dossierNumero}: ${data.nouveauStatut}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .status-change { display: flex; align-items: center; justify-content: center; gap: 15px; margin: 25px 0; }
    .status { background: white; padding: 15px 25px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .status.old { border: 2px solid #d1d5db; color: #6b7280; }
    .status.new { border: 2px solid #22c55e; color: #16a34a; font-weight: 600; }
    .arrow { font-size: 24px; color: #9ca3af; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">📋 Mise à jour de votre dossier</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.dossierNumero}</p>
    </div>
    <div class="content">
      <p>Bonjour ${data.clientName},</p>
      
      <p>Le statut de votre dossier a été mis à jour :</p>
      
      <div class="status-change">
        <div class="status old">${data.ancienStatut}</div>
        <span class="arrow">→</span>
        <div class="status new">${data.nouveauStatut}</div>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${data.lienDossier}" class="btn">Consulter le dossier →</a>
      </p>
      
      <div class="footer">
        <p>Cet email a été envoyé automatiquement par IA Poste Manager.</p>
        <p>© ${new Date().getFullYear()} IA Poste Manager</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
  }),

  /**
   * Bienvenue nouveau client
   */
  welcome: (data: {
    clientName: string;
    cabinetName: string;
    loginUrl: string;
    email: string;
  }) => ({
    subject: `🎉 Bienvenue chez ${data.cabinetName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .features { margin: 20px 0; }
    .feature { display: flex; align-items: flex-start; gap: 15px; margin: 15px 0; }
    .feature-icon { font-size: 24px; }
    .btn { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🎉 Bienvenue !</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Votre espace client est prêt</p>
    </div>
    <div class="content">
      <p>Bonjour ${data.clientName},</p>
      
      <p>Nous sommes ravis de vous accueillir chez <strong>${data.cabinetName}</strong>.</p>
      
      <p>Votre espace client en ligne vous permet de :</p>
      
      <div class="features">
        <div class="feature">
          <span class="feature-icon">📁</span>
          <div><strong>Suivre vos dossiers</strong><br>Consultez l'avancement de vos dossiers en temps réel</div>
        </div>
        <div class="feature">
          <span class="feature-icon">📎</span>
          <div><strong>Partager des documents</strong><br>Envoyez et recevez des documents en toute sécurité</div>
        </div>
        <div class="feature">
          <span class="feature-icon">💬</span>
          <div><strong>Communiquer</strong><br>Échangez directement avec votre avocat</div>
        </div>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${data.loginUrl}" class="btn">Accéder à mon espace →</a>
      </p>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        <strong>Identifiant :</strong> ${data.email}
      </p>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${data.cabinetName} - Propulsé par IA Poste Manager</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
  }),
};

export default { sendEmail, emailTemplates };
