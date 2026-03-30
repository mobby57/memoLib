import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const ExportFormatSchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
});

// ============================================
// GET /api/dev/logs/export
// Exporte les logs au format JSON ou CSV
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
    
    const { format } = ExportFormatSchema.parse({
      format: searchParams.get('format'),
    });

    logger.info(`Exporting dev logs`, { userId: session.user.id, format });

    // Recuperer tous les logs
    const logs = logger.getBufferedLogs();

    if (format === 'csv') {
      // Conversion en CSV
      const headers = 'timestamp,level,message,context\n';
      const rows = logs.map((log) => {
        const timestamp = new Date(log.timestamp).toISOString();
        const level = log.level;
        const message = log.message.replace(/"/g, '""'); // Escape quotes
        const context = JSON.stringify(log.context || {}).replace(/"/g, '""');
        return `"${timestamp}","${level}","${message}","${context}"`;
      }).join('\n');

      const data = headers + rows;

      logger.info(` Logs exported as CSV: ${logs.length} entries`, {
        userId: session.user.id,
        count: logs.length,
      });

      return new Response(data, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=logs-${new Date().toISOString()}.csv`,
        },
      });
    } else {
      // Format JSON (default)
      const data = JSON.stringify(logs, null, 2);

      logger.info(` Logs exported as JSON: ${logs.length} entries`, {
        userId: session.user.id,
        count: logs.length,
      });

      return new Response(data, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename=logs-${new Date().toISOString()}.json`,
        },
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid export format', { error: error.errors });
      return NextResponse.json(
        { error: 'Format invalide', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error exporting dev logs', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
