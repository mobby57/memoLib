import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

/**
 * API pour reinitialiser le mot de passe avec un token valide
 */
export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: 'Token, email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Validation du mot de passe
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caracteres' },
        { status: 400 }
      );
    }

    // Hasher le token pour comparaison
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Chercher l'utilisateur avec ce token
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        resetToken: tokenHash,
        resetTokenExpiry: {
          gt: new Date(), // Token non expire
        },
      },
    });

    if (!user) {
      logger.warn('Tentative de reset avec token invalide', { email });
      return NextResponse.json(
        { error: 'Token invalide ou expire' },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Mettre a jour le mot de passe et supprimer le token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date(),
      },
    });

    logger.info('Mot de passe reinitialise avec succes', {
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Mot de passe modifie avec succes',
    });
  } catch (error) {
    logger.error('Erreur reset-password API', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
