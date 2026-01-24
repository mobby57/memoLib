import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'CLIENT') {
      return NextResponse.json({ error: 'Acces reserve aux clients' }, { status: 403 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Mot de passe actuel et nouveau mot de passe requis' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit contenir au moins 8 caracteres' },
        { status: 400 }
      );
    }

    // Recuperer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    // Verifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 401 });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Mettre a jour le mot de passe
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info(`Client ${userId} a modifie son mot de passe`);

    return NextResponse.json({ success: true, message: 'Mot de passe modifie avec succes' });
  } catch (error) {
    logger.error('Erreur modification mot de passe client', { error });
    return NextResponse.json(
      { error: 'Erreur serveur lors de la modification' },
      { status: 500 }
    );
  }
}
