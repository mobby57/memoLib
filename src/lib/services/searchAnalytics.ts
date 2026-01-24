import { prisma } from '@/lib/prisma';

export interface SearchAnalytics {
  query: string;
  resultCount: number;
  executionTime: number;
  types?: string[];
  userId: string;
  tenantId?: string;
}

/**
 * Logger une recherche pour analytics
 */
export async function logSearch(analytics: SearchAnalytics): Promise<void> {
  try {
    await prisma.searchLog.create({
      data: {
        query: analytics.query,
        resultCount: analytics.resultCount,
        executionTime: analytics.executionTime,
        types: analytics.types ? JSON.stringify(analytics.types) : null,
        userId: analytics.userId,
        tenantId: analytics.tenantId || null,
      },
    });
  } catch (error) {
    console.error('Erreur logging recherche:', error);
    // Ne pas bloquer la recherche si le logging echoue
  }
}

/**
 * Obtenir les recherches les plus populaires
 */
export async function getPopularSearches(
  tenantId?: string,
  limit = 10
): Promise<Array<{ query: string; count: number }>> {
  const where = tenantId ? { tenantId } : {};

  const searches = await prisma.searchLog.groupBy({
    by: ['query'],
    where,
    _count: {
      query: true,
    },
    orderBy: {
      _count: {
        query: 'desc',
      },
    },
    take: limit,
  });

  return searches.map((s) => ({
    query: s.query,
    count: s._count.query,
  }));
}

/**
 * Obtenir les recherches recentes d'un utilisateur
 */
export async function getUserRecentSearches(
  userId: string,
  limit = 10
): Promise<string[]> {
  const searches = await prisma.searchLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    distinct: ['query'],
    select: { query: true },
  });

  return searches.map((s) => s.query);
}

/**
 * Obtenir les statistiques de recherche
 */
export async function getSearchStats(tenantId?: string) {
  const where = tenantId ? { tenantId } : {};

  const [totalSearches, avgExecutionTime, topSearches] = await Promise.all([
    prisma.searchLog.count({ where }),
    prisma.searchLog.aggregate({
      where,
      _avg: { executionTime: true },
    }),
    getPopularSearches(tenantId, 5),
  ]);

  return {
    totalSearches,
    avgExecutionTime: avgExecutionTime._avg.executionTime || 0,
    topSearches,
  };
}

/**
 * Obtenir les recherches sans resultats (pour ameliorer le systeme)
 */
export async function getEmptySearches(
  tenantId?: string,
  limit = 20
): Promise<Array<{ query: string; count: number }>> {
  const where = tenantId ? { tenantId, resultCount: 0 } : { resultCount: 0 };

  const searches = await prisma.searchLog.groupBy({
    by: ['query'],
    where,
    _count: {
      query: true,
    },
    orderBy: {
      _count: {
        query: 'desc',
      },
    },
    take: limit,
  });

  return searches.map((s) => ({
    query: s.query,
    count: s._count.query,
  }));
}

/**
 * Obtenir les tendances de recherche (par jour/semaine)
 */
export async function getSearchTrends(
  tenantId?: string,
  days = 7
): Promise<Array<{ date: string; count: number }>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const where = tenantId
    ? { tenantId, createdAt: { gte: startDate } }
    : { createdAt: { gte: startDate } };

  const searches = await prisma.searchLog.findMany({
    where,
    select: { createdAt: true },
  });

  // Grouper par jour
  const byDay = new Map<string, number>();

  searches.forEach((search) => {
    const day = search.createdAt.toISOString().split('T')[0];
    byDay.set(day, (byDay.get(day) || 0) + 1);
  });

  return Array.from(byDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
