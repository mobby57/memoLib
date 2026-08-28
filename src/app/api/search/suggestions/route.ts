// CLERK-MIGRATION: Remplacement session.user -> user (vérifier)
// CLERK-MIGRATION: Remplacement getServerSession() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';
import { searchService } from '@/lib/services/searchService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const partial = searchParams.get('q') || '';

    if (!partial || partial.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await searchService.getSuggestions(
      partial,
      user.tenantId || undefined,
      5
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    logger.error('Suggestions error', error instanceof Error ? error : undefined, {
      route: '/api/search/suggestions',
    });
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des suggestions' },
      { status: 500 }
    );
  }
}




