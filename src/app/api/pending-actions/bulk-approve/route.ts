import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { approvePendingAction } from '@/lib/pending-actions/service';
import { getServerSession } from '@/lib/auth/server-session';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const bodySchema = z.object({
  tenantId: z.string().min(1).optional(),
  actionIds: z.array(z.string().min(1)).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }
    const sessionTenantId = (session.user as any).tenantId as string | undefined;
    if (!sessionTenantId) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
    }

    if (parsed.data.tenantId && parsed.data.tenantId !== sessionTenantId) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const results = await Promise.all(
      parsed.data.actionIds.map(actionId =>
        approvePendingAction(actionId, sessionTenantId, {
          createCase: true,
          createClient: true,
        })
      )
    );

    const approved = results.filter(Boolean);

    return NextResponse.json({
      message: `${approved.length} actions approuvées`,
      count: approved.length,
      skipped: parsed.data.actionIds.length - approved.length,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
