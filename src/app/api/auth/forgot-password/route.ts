import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

/**
 * API pour demander une reinitialisation de mot de passe
 * Genere un token unique et l'envoie par email
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
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
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
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

    // Envoyer l'email (simulation si pas de service email configure)
    try {
      // TODO: Integrer un vrai service d'email (SendGrid, Resend, etc.)
      logger.info('Email de reinitialisation a envoyer', {
        to: email,
        resetUrl,
        expiresAt: resetTokenExpiry,
      });

      // Pour le developpement, log le lien
      if (process.env.NODE_ENV === 'development') {
        console.log('\n========================================');
        console.log('🔐 LIEN DE REINITIALISATION (DEV ONLY):');
        console.log(resetUrl);
        console.log('========================================\n');
      }
    } catch (emailError) {
      logger.error('Erreur envoi email reset password', { error: emailError, email });
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
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
