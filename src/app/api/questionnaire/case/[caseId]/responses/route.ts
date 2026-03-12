import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ caseId: string }>;
}

const querySchema = z.object({
  tenantId: z.string().min(1),
});

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const { searchParams } = new URL(request.url);

    const parsedQuery = querySchema.safeParse({
      tenantId: searchParams.get('tenantId'),
    });

    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    const responses = await prisma.workflowExecution.findMany({
      where: {
        tenantId: parsedQuery.data.tenantId,
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
