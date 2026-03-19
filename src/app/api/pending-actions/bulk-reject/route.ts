import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rejectPendingAction } from '@/lib/pending-actions/service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const bodySchema = z.object({
  tenantId: z.string().min(1).optional(),
  actionIds: z.array(z.string().min(1)).min(1),
  reason: z.string().default('bulk-reject'),
  markAsSpam: z.boolean().default(false),
  archive: z.boolean().default(true),
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
        rejectPendingAction(
          actionId,
          sessionTenantId,
          parsed.data.reason,
          parsed.data.markAsSpam,
          parsed.data.archive
        )
      )
    );

    const rejected = results.filter(Boolean);

    return NextResponse.json({
      message: `${rejected.length} actions rejetées`,
      count: rejected.length,
      skipped: parsed.data.actionIds.length - rejected.length,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
