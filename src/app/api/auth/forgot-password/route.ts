import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API pour demander une reinitialisation de mot de passe
 * Genere un token unique et l'envoie par email
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    // Chercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Pour des raisons de securite, toujours repondre OK
    // meme si l'utilisateur n'existe pas
    if (!user) {
      logger.info('Demande de reset password pour email inexistant', { email });
      return NextResponse.json({
        success: true,
        message: 'Si un compte existe avec cette adresse, un email a ete envoye.',
      });
    }

    // Generer un token de reinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Token valide pendant 1 heure
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Sauvegarder le token dans la base de donnees
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry,
      },
    });

    // Construire l'URL de reinitialisation
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Envoyer l'email via Resend
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'noreply@iapostemanager.com',
          to: email,
          subject: 'Réinitialisation de votre mot de passe - IA Poste Manager',
          html: `
            <h2>Réinitialisation de mot de passe</h2>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p>Cliquez sur le lien ci-dessous (valide 1 heure) :</p>
            <a href="${resetUrl}" style="background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Réinitialiser mon mot de passe</a>
            <p style="margin-top:20px;color:#666;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
          `,
        });
        logger.info('Email de reinitialisation envoye', { to: email });
      } else {
        logger.warn('RESEND_API_KEY non configure, email non envoye');
      }
    } catch (emailError) {
      logger.error('Erreur envoi email reset password', { error: emailError, email });
    }

    // Pour le developpement, log le lien
    if (process.env.NODE_ENV === 'development') {
      logger.info('\n========================================');
      logger.info('🔐 LIEN DE REINITIALISATION (DEV ONLY):');
      logger.info('Reset URL:', { resetUrl });
      logger.info('========================================\n');
    }

    logger.info('Demande de reinitialisation de mot de passe', {
      userId: user.id,
      email,
    });

    return NextResponse.json({
      success: true,
      message: 'Si un compte existe avec cette adresse, un email a ete envoye.',
    });
  } catch (error) {
    logger.error('Erreur forgot-password API', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
