import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getSearchStats,
  getPopularSearches,
  getUserRecentSearches,
  getEmptySearches,
  getSearchTrends,
} from '@/lib/services/searchAnalytics';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'stats';
    const tenantId = session.user.tenantId || undefined;

    switch (type) {
      case 'stats': {
        const stats = await getSearchStats(tenantId);
        return NextResponse.json(stats);
      }

      case 'popular': {
        const limit = parseInt(searchParams.get('limit') || '10');
        const popular = await getPopularSearches(tenantId, limit);
        return NextResponse.json({ searches: popular });
      }

      case 'recent': {
        const limit = parseInt(searchParams.get('limit') || '10');
        const recent = await getUserRecentSearches(session.user.id, limit);
        return NextResponse.json({ searches: recent });
      }

      case 'empty': {
        const limit = parseInt(searchParams.get('limit') || '20');
        const empty = await getEmptySearches(tenantId, limit);
        return NextResponse.json({ searches: empty });
      }

      case 'trends': {
        const days = parseInt(searchParams.get('days') || '7');
        const trends = await getSearchTrends(tenantId, days);
        return NextResponse.json({ trends });
      }

      default:
        return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    }
  } catch (error) {
    console.error('Search analytics error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des analytics' },
      { status: 500 }
    );
  }
}
