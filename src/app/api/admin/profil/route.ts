// CLERK-MIGRATION: Remplacement session.user -> user (vérifier)
// CLERK-MIGRATION: Remplacement getServerSession() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET admin profile
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    return NextResponse.json({ profil: user });
  } catch (error) {
    logger.error('Error fetching admin profile:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT update admin profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, address, city, postalCode, country } = body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: `${firstName} ${lastName}`,
        phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ profil: updatedUser });
  } catch (error) {
    logger.error('Error updating admin profile:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}




