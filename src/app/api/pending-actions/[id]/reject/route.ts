import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rejectPendingAction } from '@/lib/pending-actions/service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const bodySchema = z.object({
  tenantId: z.string().min(1),
  reason: z.string().default('rejected'),
  markAsSpam: z.boolean().default(false),
  archive: z.boolean().default(true),
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsed = bodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload invalide', details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await rejectPendingAction(
      id,
      parsed.data.tenantId,
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
