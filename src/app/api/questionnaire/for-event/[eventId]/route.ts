import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTemplateForEvent } from '@/lib/questionnaire/templates';
interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { eventId } = await context.params;
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
        id: eventId,
        tenantId,
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
