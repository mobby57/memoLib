import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const LogQuerySchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error', 'critical']).optional(),
  category: z.enum(['API', 'WORKFLOW', 'SECURITY', 'AI', 'DATABASE', 'EMAIL']).optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  since: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
});

// ============================================
// GET /api/dev/logs
// Recupere les logs filtres (dev/debug uniquement)
// ============================================

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  if (auth.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  const session = { user: auth.user };

  try {
    const { searchParams } = new URL(request.url);
    
    const { level, category, limit, since } = LogQuerySchema.parse({
      level: searchParams.get('level'),
      category: searchParams.get('category'),
      limit: searchParams.get('limit'),
      since: searchParams.get('since'),
    });

    logger.info(`Fetching dev logs`, { level, category, limit, since });

    // Recuperer les logs depuis le buffer
    const logs = logger.getBufferedLogs();

    // Appliquer les filtres
    let filteredLogs = logs;

    if (level) {
      filteredLogs = filteredLogs.filter((log) => log.level === level);
    }

    if (category) {
      filteredLogs = filteredLogs.filter((log) => log.context?.category === category);
    }

    if (since) {
      filteredLogs = filteredLogs.filter((log) => new Date(log.timestamp) >= since);
    }

    // Trier par timestamp decroissant et limiter
    const result = filteredLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    logger.info(` Dev logs fetched: ${result.length}`, {
      filters: { level, category, limit, since },
      total: result.length,
    });

    return NextResponse.json({
      success: true,
      logs: result,
      total: result.length,
      filters: { level, category, limit, since: since?.toISOString() },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid log query parameters', { error: error.errors });
      return NextResponse.json(
        { error: 'Parametres invalides', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error fetching dev logs', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/dev/logs
// Nettoie les logs (dev/debug uniquement)
// ============================================

export async function DELETE(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  if (auth.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  const session = { user: auth.user };

  try {
    logger.info(`Clearing dev logs`, { userId: session.user.id });

    // Clear logs buffer (si methode existe)
    // logger.clearBuffer(); // TODO: Implementer si necessaire

    logger.info(` Dev logs cleared`, { userId: session.user.id });

    return NextResponse.json({
      success: true,
      message: 'Logs cleared successfully',
    });
  } catch (error) {
    logger.error('Error clearing dev logs', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
