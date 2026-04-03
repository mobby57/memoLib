import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/server-session';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface RouteContext {
  params: Promise<{ caseId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId as string | undefined;
    if (!tenantId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const responses = await prisma.workflowExecution.findMany({
      where: {
        tenantId,
        triggerType: 'questionnaire-response',
        triggerData: {
          contains: `\"caseId\":\"${caseId}\"`,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        workflowId: true,
        workflowName: true,
        triggerData: true,
        result: true,
        createdAt: true,
        completedAt: true,
      },
      take: 100,
    });

    return NextResponse.json({
      caseId,
      count: responses.length,
      responses,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
