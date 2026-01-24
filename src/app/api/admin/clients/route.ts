import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/clients
 * Recupere tous les clients du tenant (pour avocats)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const tenantId = (session.user as any).tenantId;

    if (userRole !== 'AVOCAT' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Acces reserve aux avocats' }, { status: 403 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouve' }, { status: 403 });
    }

    // Recuperer tous les clients du tenant
    const clients = await prisma.client.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        lastName: 'asc',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        _count: {
          select: {
            dossiers: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      clients: clients.map(c => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        telephone: c.phone,
        adresse: c.address,
        dateCreation: c.createdAt,
        nombreDossiers: c._count.dossiers,
      }))
    });
  } catch (error) {
    logger.error('Erreur recuperation clients admin', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/clients
 * Creer un nouveau client (avocat uniquement)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const tenantId = (session.user as any).tenantId;

    if (userRole !== 'AVOCAT' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Acces reserve aux avocats' }, { status: 403 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouve' }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, address, ...rest } = body;

    // Verifier si l'email existe deja
    const existingClient = await prisma.client.findFirst({
      where: {
        email,
        tenantId,
      },
    });

    if (existingClient) {
      return NextResponse.json({ error: 'Un client avec cet email existe deja' }, { status: 400 });
    }

    // Creer le client
    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        address,
        tenantId,
        createdAt: new Date(),
        ...rest,
      },
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    logger.error('Erreur creation client admin', { error });
    return NextResponse.json(
      { error: 'Erreur serveur', details: (error as Error).message },
      { status: 500 }
    );
  }
}
