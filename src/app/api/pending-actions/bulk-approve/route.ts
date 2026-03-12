import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { approvePendingAction } from '@/lib/pending-actions/service';

const bodySchema = z.object({
  tenantId: z.string().min(1),
  actionIds: z.array(z.string().min(1)).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload invalide', details: parsed.error.flatten() }, { status: 400 });
    }

    const results = await Promise.all(
      parsed.data.actionIds.map(actionId =>
        approvePendingAction(actionId, parsed.data.tenantId, {
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
