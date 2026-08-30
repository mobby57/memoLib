import { NextRequest, NextResponse } from 'next/server';
import {
  ActionProposalDecisionSchema,
  ActionProposalStatus,
  decideActionProposal,
  getActionProposalAccess,
  parseActionProposalId,
} from '@/lib/services/action-proposal.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await getActionProposalAccess();
    if (access.kind === 'unauthenticated') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    if (access.kind === 'forbidden') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const id = parseActionProposalId((await params).id);
    if (!id.success) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const body = await request.json().catch(() => undefined);
    const decision = ActionProposalDecisionSchema.safeParse(body);
    if (!decision.success) {
      return NextResponse.json({ error: 'Payload invalide', details: decision.error.flatten() }, { status: 400 });
    }

    const result = await decideActionProposal(
      access.actor,
      id.data,
      ActionProposalStatus.REJECTED,
      decision.data.reason
    );
    if (result.kind === 'not_found') {
      return NextResponse.json({ error: 'Proposition introuvable' }, { status: 404 });
    }
    if (result.kind === 'forbidden') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }
    if (result.kind === 'conflict') {
      return NextResponse.json({ error: 'Proposition déjà décidée', proposal: result.proposal }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      idempotent: result.kind === 'idempotent',
      proposal: result.proposal,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
