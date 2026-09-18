import { auth } from '@/lib/clerk-auth';
import { logger } from '@/lib/logger';
import { searchService } from '@/lib/services/searchService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;

    if (!user) {
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




