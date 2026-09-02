import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/clerk-auth';

/**
 * POST /api/analytics/abandon
 * Reçoit les événements d'abandon de workflow depuis le client.
 */
export async function POST(req: NextRequest) {
  try {
    const { isAuthenticated, clerkUserId, user } = await auth();
    if (!isAuthenticated || !clerkUserId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workflow, step, metadata, timestamp } = body;

    if (!workflow || !step) {
      return NextResponse.json({ error: 'workflow and step are required' }, { status: 400 });
    }

    // Clerk is authoritative for identity; client-supplied IDs must not be trusted.
    const userId = user?.id ?? clerkUserId;
    const tenantId = user?.tenantId;

    // Logger l'événement (Sentry / console en dev)
    const event = {
      type: 'abandon_step',
      workflow,
      step,
      userId,
      tenantId,
      metadata,
      timestamp: timestamp ?? Date.now(),
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: req.headers.get('user-agent') ?? 'unknown',
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics/Abandon] event received', { type: event.type });
    }

    // TODO: persister dans une table analytics ou envoyer à Sentry/Posthog
    // await prisma.analyticsEvent.create({ data: event });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Analytics/Abandon] Error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
