import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const querySchema = z.object({
  tenantId: z.string().min(1),
});

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    const parsed = querySchema.safeParse({
      tenantId: searchParams.get('tenantId'),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    const email = await prisma.email.findFirst({
      where: {
        id,
        tenantId: parsed.data.tenantId,
        isProcessed: false,
      },
      select: {
        id: true,
        from: true,
        to: true,
        subject: true,
        body: true,
        preview: true,
        category: true,
        urgency: true,
        sentiment: true,
        receivedAt: true,
        clientId: true,
        dossierId: true,
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Action non trouvée' }, { status: 404 });
    }

    return NextResponse.json({
      id: email.id,
      eventType: 'EMAIL',
      status: 'PENDING',
      from: email.from,
      subject: email.subject,
      preview: email.preview,
      payload: email.body,
      category: email.category,
      urgency: email.urgency,
      sentiment: email.sentiment,
      suggestCreateCase: !email.dossierId,
      suggestCreateClient: !email.clientId,
      suggestedCaseTitle: email.subject,
      createdAt: email.receivedAt,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
