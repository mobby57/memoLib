import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { approvePendingAction } from '@/lib/pending-actions/service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const bodySchema = z.object({
  tenantId: z.string().min(1),
  createCase: z.boolean().optional(),
  caseTitle: z.string().optional(),
  createClient: z.boolean().optional(),
  clientName: z.string().optional(),
  linkToClientId: z.string().optional(),
  assignToUserId: z.string().optional(),
  priority: z.number().int().min(1).max(5).optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload invalide', details: parsed.error.flatten() }, { status: 400 });
    }

    const body = parsed.data;
    const tags = Array.isArray(body.tags)
      ? body.tags
      : body.tags
        ? body.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

    const result = await approvePendingAction(id, body.tenantId, {
      createCase: body.createCase,
      caseTitle: body.caseTitle,
      createClient: body.createClient,
      clientName: body.clientName,
      linkToClientId: body.linkToClientId,
      assignToUserId: body.assignToUserId,
      priority: body.priority,
      tags,
      notes: body.notes,
    });

    if (!result) {
      return NextResponse.json({ error: 'Action non trouvée ou déjà traitée' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Action approuvée et exécutée',
      action: result,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
