import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
interface RouteContext {
  params: Promise<{ caseId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const tenantId = (user as any).tenantId as string | undefined;
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
