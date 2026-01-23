import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer le tenantId depuis la session
    const tenantId = (session.user as any).tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 400 });
    }

    // Paramètres de filtrage
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const read = searchParams.get('read');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construire le where
    const where: any = { tenantId };

    if (type) {
      where.classification = {
        type
      };
    }

    if (priority) {
      where.classification = {
        ...where.classification,
        priority
      };
    }

    if (read !== null) {
      where.isRead = read === 'true';
    }

    // Récupérer les emails
    const emails = await prisma.email.findMany({
      where,
      include: {
        classification: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        dossier: {
          select: {
            id: true,
            numero: true,
            objet: true,
            statut: true
          }
        }
      },
      orderBy: {
        receivedDate: 'desc'
      },
      take: limit
    });

    // Statistiques
    const stats = await prisma.email.groupBy({
      by: ['isRead'],
      where: { tenantId },
      _count: true
    });

    const statsByType = await prisma.emailClassification.groupBy({
      by: ['type'],
      _count: true,
      where: {
        email: {
          tenantId
        }
      }
    });

    const statsByPriority = await prisma.emailClassification.groupBy({
      by: ['priority'],
      _count: true,
      where: {
        email: {
          tenantId
        }
      }
    });

    return NextResponse.json({
      emails: emails.map(email => ({
        id: email.id,
        messageId: email.messageId,
        from: email.from,
        subject: email.subject,
        receivedDate: email.receivedDate,
        isRead: email.isRead,
        isStarred: email.isStarred,
        hasAttachments: !!email.attachments,
        classification: email.classification,
        client: email.client,
        dossier: email.dossier,
        preview: email.bodyText?.substring(0, 200)
      })),
      stats: {
        total: stats.reduce((acc, s) => acc + s._count, 0),
        unread: stats.find(s => !s.isRead)?._count || 0,
        read: stats.find(s => s.isRead)?._count || 0,
        byType: statsByType.reduce((acc, s) => ({
          ...acc,
          [s.type]: s._count
        }), {}),
        byPriority: statsByPriority.reduce((acc, s) => ({
          ...acc,
          [s.priority]: s._count
        }), {})
      }
    });

  } catch (error: any) {
    console.error('Erreur API emails:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { emailId, action, data } = body;

    if (!emailId || !action) {
      return NextResponse.json(
        { error: 'emailId et action requis' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    switch (action) {
      case 'mark-read':
        await prisma.email.update({
          where: { id: emailId },
          data: { isRead: true }
        });
        break;

      case 'mark-unread':
        await prisma.email.update({
          where: { id: emailId },
          data: { isRead: false }
        });
        break;

      case 'star':
        await prisma.email.update({
          where: { id: emailId },
          data: { isStarred: true }
        });
        break;

      case 'unstar':
        await prisma.email.update({
          where: { id: emailId },
          data: { isStarred: false }
        });
        break;

      case 'archive':
        await prisma.email.update({
          where: { id: emailId },
          data: { isArchived: true }
        });
        break;

      case 'validate-classification':
        const email = await prisma.email.findUnique({
          where: { id: emailId },
          include: { classification: true }
        });

        if (email?.classification) {
          await prisma.emailClassification.update({
            where: { id: email.classification.id },
            data: {
              validated: true,
              validatedBy: userId,
              validatedAt: new Date(),
              correctedType: data?.correctedType
            }
          });
        }
        break;

      case 'link-client':
        await prisma.email.update({
          where: { id: emailId },
          data: { clientId: data.clientId }
        });
        break;

      case 'link-dossier':
        await prisma.email.update({
          where: { id: emailId },
          data: { dossierId: data.dossierId }
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Action non supportée' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erreur PATCH emails:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}
