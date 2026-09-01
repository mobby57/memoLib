import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const tenantId = (user as any).tenantId as string | undefined;
    if (!tenantId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const email = await prisma.email.findFirst({
      where: {
        id,
        tenantId,
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
