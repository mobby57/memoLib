import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getTemplateForEvent } from '@/lib/questionnaire/templates';

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

const querySchema = z.object({
  tenantId: z.string().min(1),
});

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const { searchParams } = new URL(request.url);

    const parsedQuery = querySchema.safeParse({
      tenantId: searchParams.get('tenantId'),
    });

    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    const email = await prisma.email.findFirst({
      where: {
        id: eventId,
        tenantId: parsedQuery.data.tenantId,
      },
      select: {
        id: true,
        category: true,
        subject: true,
      },
    });

    const eventType = email?.category || 'email-client';
    const template = getTemplateForEvent(eventType);

    return NextResponse.json({
      eventId,
      eventType,
      questionnaire: template,
      context: {
        subject: email?.subject,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
