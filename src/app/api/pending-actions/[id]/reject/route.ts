import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rejectPendingAction } from '@/lib/pending-actions/service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const bodySchema = z.object({
  tenantId: z.string().min(1).optional(),
  reason: z.string().default('rejected'),
  markAsSpam: z.boolean().default(false),
  archive: z.boolean().default(true),
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const sessionTenantId = (session.user as any).tenantId as string | undefined;
    if (!sessionTenantId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
    }

    if (parsed.data.tenantId && parsed.data.tenantId !== sessionTenantId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const result = await rejectPendingAction(
      id,
      sessionTenantId,
      parsed.data.reason,
      parsed.data.markAsSpam,
      parsed.data.archive
    );

    if (!result) {
      return NextResponse.json({ error: 'Action non trouvée ou déjà traitée' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Action rejetée',
      action: result,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
