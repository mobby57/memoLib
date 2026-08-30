import { NextRequest, NextResponse } from 'next/server';
import {
  ActionProposalListQuerySchema,
  getActionProposalAccess,
  listActionProposals,
} from '@/lib/services/action-proposal.service';

export async function GET(request: NextRequest) {
  try {
    const access = await getActionProposalAccess();
    if (access.kind === 'unauthenticated') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    if (access.kind === 'forbidden') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const query = ActionProposalListQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries())
    );
    if (!query.success) {
      return NextResponse.json({ error: 'Paramètres invalides', details: query.error.flatten() }, { status: 400 });
    }

    return NextResponse.json(await listActionProposals(access.actor, query.data));
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
