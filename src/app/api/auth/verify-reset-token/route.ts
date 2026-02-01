import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

/**
 * API pour verifier la validite d'un token de reinitialisation
 */
export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token et email requis' },
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
      logger.warn('Token de reinitialisation invalide ou expire', { email });
      return NextResponse.json(
        { error: 'Token invalide ou expire' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      message: 'Token valide',
    });
  } catch (error) {
    logger.error('Erreur verify-reset-token API', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
