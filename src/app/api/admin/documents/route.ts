import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all documents for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const documents = await prisma.document.findMany({
      where: {
        dossier: {
          client: {
            tenantId: session.user.tenantId,
          },
        },
      },
      include: {
        dossier: {
          select: {
            id: true,
            numero: true,
            objet: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching admin documents:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
