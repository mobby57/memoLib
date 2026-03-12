import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rejectPendingAction } from '@/lib/pending-actions/service';

const bodySchema = z.object({
  tenantId: z.string().min(1),
  actionIds: z.array(z.string().min(1)).min(1),
  reason: z.string().default('bulk-reject'),
  markAsSpam: z.boolean().default(false),
  archive: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload invalide', details: parsed.error.flatten() }, { status: 400 });
    }

    const results = await Promise.all(
      parsed.data.actionIds.map(actionId =>
        rejectPendingAction(
          actionId,
          parsed.data.tenantId,
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
