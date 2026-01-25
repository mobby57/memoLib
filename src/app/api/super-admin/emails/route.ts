/**
 * API Route - Super Admin Email & Workflow Monitoring
 * GET /api/super-admin/emails - Liste tous les emails de la plateforme
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const user = session.user as any;

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status'); // processed, unprocessed, all
    const urgency = searchParams.get('urgency');
    const tenantId = searchParams.get('tenantId');

    const where: any = {};
    
    if (status === 'processed') {
      where.isProcessed = true;
    } else if (status === 'unprocessed') {
      where.isProcessed = false;
    }
    
    if (urgency) {
      where.urgency = urgency;
    }
    
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true
            }
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          workflows: {
            select: {
              id: true,
              workflowName: true,
              status: true,
              progress: true,
              startedAt: true,
              completedAt: true
            }
          },
          _count: {
            select: {
              attachments: true
            }
          }
        },
        orderBy: { receivedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.email.count({ where })
    ]);

    // Statistiques globales
    const stats = await prisma.email.groupBy({
      by: ['category', 'urgency', 'isProcessed'],
      _count: true
    });

    const categoryStats: Record<string, number> = {};
    const urgencyStats: Record<string, number> = {};
    let processedCount = 0;
    let unprocessedCount = 0;

    stats.forEach(stat => {
      categoryStats[stat.category] = (categoryStats[stat.category] || 0) + stat._count;
      urgencyStats[stat.urgency] = (urgencyStats[stat.urgency] || 0) + stat._count;
      if (stat.isProcessed) {
        processedCount += stat._count;
      } else {
        unprocessedCount += stat._count;
      }
    });

    return NextResponse.json({
      emails: emails.map(email => ({
        id: email.id,
        from: email.from,
        to: email.to,
        subject: email.subject,
        preview: email.preview,
        category: email.category,
        urgency: email.urgency,
        sentiment: email.sentiment,
        isRead: email.isRead,
        isProcessed: email.isProcessed,
        receivedAt: email.receivedAt,
        processedAt: email.processedAt,
        tenant: email.tenant,
        client: email.client,
        attachmentCount: email._count.attachments,
        workflow: email.workflows[0] || null
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        total,
        processed: processedCount,
        unprocessed: unprocessedCount,
        byCategory: categoryStats,
        byUrgency: urgencyStats
      }
    });

  } catch (error) {
    console.error('Erreur API super admin emails:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
