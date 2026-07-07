/**
 * Service de verification d'email
 * Genere un token, l'enregistre en base, et envoie un email de confirmation
 */

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/email-service';
import { randomBytes } from 'crypto';

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

/**
 * Generer un token cryptographiquement securise
 */
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Creer et envoyer un email de verification
 */
export async function sendVerificationEmail(email: string, name: string): Promise<boolean> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Supprimer les anciens tokens pour cet email
  await prisma.verificationToken.deleteMany({
    where: {
      email: email.toLowerCase(),
      type: 'email_verification',
    },
  });

  // Creer le nouveau token
  await prisma.verificationToken.create({
    data: {
      email: email.toLowerCase(),
      token,
      type: 'email_verification',
      expiresAt,
    },
  });

  // Construire l'URL de verification
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const verifyUrl = `${baseUrl}/fr/auth/verify-email?token=${token}`;

  // Envoyer l'email
  const result = await sendEmail({
    to: email,
    subject: 'MemoLib - Confirmez votre adresse email',
    html: buildVerificationEmailHtml(name, verifyUrl),
  });

  return result.success;
}

/**
 * Verifier un token et activer le compte
 */
export async function verifyEmailToken(token: string): Promise<{
  success: boolean;
  error?: string;
  email?: string;
}> {
  // Rechercher le token
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return { success: false, error: 'Token invalide ou deja utilise.' };
  }

  // Verifier l'expiration
  if (verificationToken.expiresAt < new Date()) {
    // Supprimer le token expire
    await prisma.verificationToken.delete({ where: { token } });
    return { success: false, error: 'Ce lien a expire. Veuillez demander un nouveau lien de verification.' };
  }

  // Mettre a jour l'utilisateur
  const user = await prisma.user.findUnique({
    where: { email: verificationToken.email },
  });

  if (!user) {
    return { success: false, error: 'Utilisateur introuvable.' };
  }

  // Activer le compte
  await prisma.user.update({
    where: { email: verificationToken.email },
    data: {
      emailVerified: new Date(),
      status: 'active',
    },
  });

  // Supprimer le token utilise
  await prisma.verificationToken.delete({ where: { token } });

  return { success: true, email: verificationToken.email };
}

/**
 * Renvoyer un email de verification
 */
export async function resendVerificationEmail(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Ne pas reveler si l'email existe
    return true;
  }

  if (user.emailVerified) {
    // Deja verifie
    return true;
  }

  return sendVerificationEmail(email, user.name);
}

/**
 * Template HTML pour l'email de verification
 */
function buildVerificationEmailHtml(name: string, verifyUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">⚖️ MemoLib</h1>
      <p style="color: #bfdbfe; margin: 8px 0 0;">Plateforme Juridique Intelligente</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <h2 style="color: #1e293b; margin: 0 0 16px;">Bonjour ${name},</h2>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">
        Bienvenue sur MemoLib ! Pour finaliser votre inscription et acceder a votre espace,
        veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verifyUrl}" 
           style="display: inline-block; background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
          Confirmer mon adresse email
        </a>
      </div>

      <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
        Ce lien est valable <strong>24 heures</strong>. Si vous n'avez pas cree de compte sur MemoLib,
        vous pouvez ignorer cet email en toute securite.
      </p>

      <!-- Fallback link -->
      <div style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px;">
        <p style="color: #64748b; font-size: 12px; margin: 0 0 8px;">Si le bouton ne fonctionne pas, copiez ce lien :</p>
        <p style="color: #2563eb; font-size: 12px; word-break: break-all; margin: 0;">${verifyUrl}</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        MemoLib - Plateforme securisee pour avocats | Conforme RGPD
      </p>
    </div>
  </div>
</body>
</html>`;
}
