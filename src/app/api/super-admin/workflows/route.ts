/**
 * API Route - Super Admin Workflow Monitoring
 * GET /api/super-admin/workflows - Liste toutes les exécutions de workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status');
    const tenantId = searchParams.get('tenantId');

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const [workflows, total] = await Promise.all([
      prisma.workflowExecution.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true
            }
          },
          email: {
            select: {
              id: true,
              from: true,
              subject: true,
              category: true,
              urgency: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.workflowExecution.count({ where })
    ]);

    // Statistiques par statut
    const statusStats = await prisma.workflowExecution.groupBy({
      by: ['status'],
      _count: true
    });

    const stats: Record<string, number> = {};
    statusStats.forEach(stat => {
      stats[stat.status] = stat._count;
    });

    // Temps moyen d'exécution
    const completedWorkflows = await prisma.workflowExecution.findMany({
      where: { 
        status: 'completed',
        completedAt: { not: null },
        startedAt: { not: null }
      },
      select: {
        startedAt: true,
        completedAt: true
      },
      take: 100
    });

    let avgExecutionTime = 0;
    if (completedWorkflows.length > 0) {
      const totalTime = completedWorkflows.reduce((sum, wf) => {
        const duration = new Date(wf.completedAt!).getTime() - new Date(wf.startedAt!).getTime();
        return sum + duration;
      }, 0);
      avgExecutionTime = totalTime / completedWorkflows.length;
    }

    return NextResponse.json({
      workflows: workflows.map(wf => ({
        id: wf.id,
        workflowId: wf.workflowId,
        workflowName: wf.workflowName,
        status: wf.status,
        currentStep: wf.currentStep,
        progress: wf.progress,
        triggerType: wf.triggerType,
        startedAt: wf.startedAt,
        completedAt: wf.completedAt,
        error: wf.error,
        tenant: wf.tenant,
        email: wf.email,
        steps: wf.steps ? JSON.parse(wf.steps) : [],
        result: wf.result ? JSON.parse(wf.result) : null
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        total,
        byStatus: stats,
        avgExecutionTimeMs: Math.round(avgExecutionTime)
      }
    });

  } catch (error) {
    console.error('Erreur API super admin workflows:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
