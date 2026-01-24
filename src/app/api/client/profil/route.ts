import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Recuperer le profil
export async function GET(request: NextRequest) {
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

    const client = await prisma.client.findFirst({
      where: {
        user: {
          id: userId,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Profil client non trouve' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    logger.error('Erreur recuperation profil client', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT: Mettre a jour le profil
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
    
    // Champs modifiables par le client
    const allowedFields = {
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      phoneSecondaire: body.phoneSecondaire,
      address: body.address,
      codePostal: body.codePostal,
      ville: body.ville,
      pays: body.pays,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      nationality: body.nationality,
      passportNumber: body.passportNumber,
      passportExpiry: body.passportExpiry ? new Date(body.passportExpiry) : undefined,
      situationFamiliale: body.situationFamiliale,
      nombreEnfants: body.nombreEnfants ? parseInt(body.nombreEnfants) : undefined,
      profession: body.profession,
      languePrincipale: body.languePrincipale,
      accepteNotifications: body.accepteNotifications,
    };

    // Supprimer les champs undefined
    Object.keys(allowedFields).forEach(key => {
      if (allowedFields[key as keyof typeof allowedFields] === undefined) {
        delete allowedFields[key as keyof typeof allowedFields];
      }
    });

    const updatedClient = await prisma.client.updateMany({
      where: {
        user: {
          id: userId,
        },
      },
      data: allowedFields,
    });

    if (updatedClient.count === 0) {
      return NextResponse.json({ error: 'Profil client non trouve' }, { status: 404 });
    }

    logger.info(`Client ${userId} a mis a jour son profil`);

    return NextResponse.json({ success: true, message: 'Profil mis a jour avec succes' });
  } catch (error) {
    logger.error('Erreur mise a jour profil client', { error });
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise a jour' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
