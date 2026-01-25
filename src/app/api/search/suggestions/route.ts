import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { searchService } from '@/lib/services/searchService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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
      session.user.tenantId || undefined,
      5
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Suggestions error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des suggestions' },
      { status: 500 }
    );
  }
}
