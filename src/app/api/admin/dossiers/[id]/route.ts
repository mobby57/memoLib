import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * DELETE /api/admin/dossiers/[id]
 * Supprimer un dossier (avocat uniquement)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verifier que le dossier appartient au tenant
    const dossier = await prisma.dossier.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });
    }

    // Supprimer le dossier et ses relations
    await prisma.dossier.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Dossier supprime' }, { status: 200 });
  } catch (error) {
    console.error('Erreur suppression dossier:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/admin/dossiers/[id]
 * Recuperer un dossier specifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const dossier = await prisma.dossier.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        client: true,
        documents: true,
        echeances: true,
        factures: true,
      },
    });

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });
    }

    return NextResponse.json({ dossier });
  } catch (error) {
    console.error('Erreur recuperation dossier:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/admin/dossiers/[id]
 * Mettre a jour un dossier
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();

    // Verifier que le dossier appartient au tenant
    const existingDossier = await prisma.dossier.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingDossier) {
      return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });
    }

    // Mettre à jour
    const dossier = await prisma.dossier.update({
      where: { id: params.id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      dossier: {
        ...dossier,
        client: {
          nom: dossier.client.lastName,
          prenom: dossier.client.firstName,
          email: dossier.client.email,
        },
      }
    });
  } catch (error) {
    console.error('Erreur mise a jour dossier:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
