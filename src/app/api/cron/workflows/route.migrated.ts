import { NextRequest, NextResponse } from 'next/server';
import { runMonitors } from '@/lib/workflows/monitors';
import { logger, LogCategory } from '@/lib/logger';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const CronAuthSchema = z.object({
  authorization: z.string().startsWith('Bearer '),
});

// ============================================
// GET /api/cron/workflows
// Execution periodique des moniteurs de workflows (Cron Job)
// a appeler toutes les 15 minutes via cron externe
// ============================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validation du token de securite
    const authHeader = request.headers.get('authorization');
    
    CronAuthSchema.parse({ authorization: authHeader });

    const expectedToken = process.env.CRON_SECRET || 'dev-secret-token';
    const providedToken = authHeader?.replace('Bearer ', '');
    
    if (providedToken !== expectedToken) {
      logger.warn(LogCategory.SECURITY, 'Unauthorized cron attempt', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      });
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    logger.log(LogCategory.WORKFLOW, ' Cron execution started: workflow monitors');

    // Executer les moniteurs
    const result = await runMonitors();

    const executionTime = Date.now() - startTime;

    logger.log(LogCategory.WORKFLOW, ` Cron execution completed in ${executionTime}ms`, {
      executionTime,
      monitorsRun: result?.monitorsRun || 'unknown',
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Moniteurs executes avec succes',
      executionTime,
      result,
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;

    if (error instanceof z.ZodError) {
      logger.warn(LogCategory.SECURITY, 'Invalid cron authorization', { error: error.errors });
      return NextResponse.json(
        { error: 'Authorization invalide', details: error.errors },
        { status: 401 }
      );
    }

    logger.error(LogCategory.WORKFLOW, 'Error executing cron monitors', { error, executionTime });
    return NextResponse.json(
      { error: 'Erreur lors de l\'execution des moniteurs', executionTime },
      { status: 500 }
    );
  }
}
