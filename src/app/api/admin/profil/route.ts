import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET admin profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ profil: user });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT update admin profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, address, city, postalCode, country } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
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
        postalCode: true,
        country: true,
      },
    });

    return NextResponse.json({ profil: updatedUser });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
