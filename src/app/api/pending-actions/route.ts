import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const querySchema = z.object({
  tenantId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = querySchema.safeParse({
      tenantId: searchParams.get('tenantId'),
      limit: searchParams.get('limit') ?? 50,
      offset: searchParams.get('offset') ?? 0,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Paramètres invalides', details: parsed.error.flatten() }, { status: 400 });
    }

    const { tenantId, limit, offset } = parsed.data;

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where: {
          tenantId,
          isProcessed: false,
        },
        orderBy: {
          receivedAt: 'desc',
        },
        skip: offset,
        take: limit,
        select: {
          id: true,
          from: true,
          subject: true,
          preview: true,
          category: true,
          urgency: true,
          receivedAt: true,
          clientId: true,
          dossierId: true,
        },
      }),
      prisma.email.count({
        where: {
          tenantId,
          isProcessed: false,
        },
      }),
    ]);

    const actions = emails.map(email => ({
      id: email.id,
      eventType: 'EMAIL',
      status: 'PENDING',
      from: email.from,
      subject: email.subject,
      preview: email.preview,
      createdAt: email.receivedAt,
      suggestCreateCase: !email.dossierId,
      suggestedCaseTitle: email.subject,
      suggestCreateClient: !email.clientId,
      suggestLinkToExistingClient: email.clientId,
      urgency: email.urgency,
      category: email.category,
    }));

    return NextResponse.json({
      count: total,
      hasMore: offset + actions.length < total,
      actions,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
