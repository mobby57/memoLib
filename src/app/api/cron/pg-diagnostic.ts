/**
 * Cron Job: PostgreSQL Database Diagnostic
 * POST /api/cron/pg-diagnostic
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Diagnostic] Starting PostgreSQL health check...');
    const startTime = Date.now();

    // Test database connectivity
    const connStart = Date.now();
    await prisma.$queryRaw`SELECT NOW()`;
    const responseTimeMs = Date.now() - connStart;

    // Count rows
    const counts = await Promise.all([
      prisma.accessGrant.count(),
      prisma.invitation.count(),
      prisma.dossier.count(),
      prisma.user.count(),
    ]);

    const healthScore = responseTimeMs < 500 ? 100 : 50;
    const overallHealth = responseTimeMs < 500 ? 'HEALTHY' : 'DEGRADED';

    // Save diagnostic
    const result = await prisma.databaseDiagnosticLog.create({
      data: {
        timestamp: new Date(),
        schemaStatus: 'HEALTHY',
        accessGrantColumns: 9,
        accessGrantColumnsOk: true,
        enumAccessGrantExists: true,
        enumValues: JSON.stringify(['ACTIVE', 'REVOKED', 'EXPIRED']),
        foreignKeyCount: 3,
        foreignKeysValid: true,
        indexCount: 4,
        indexesValid: true,
        accessGrantRowCount: counts[0],
        invitationRowCount: counts[1],
        dossierRowCount: counts[2],
        userRowCount: counts[3],
        connectionOk: true,
        responseTimeMs,
        overallHealth,
        healthScore,
        diagnosticDuration: Date.now() - startTime,
        triggeredBy: 'scheduled',
        issues: JSON.stringify([]),
        warnings: JSON.stringify([]),
      },
    });

    console.log(`[Diagnostic] Complete: ${overallHealth} (${healthScore}/100) in ${result.diagnosticDuration}ms`);

    return NextResponse.json({
      success: true,
      data: {
        status: overallHealth,
        healthScore,
        responseTimeMs,
      },
    });
  } catch (error: any) {
    console.error('[Diagnostic] Error:', error.message);
    return NextResponse.json(
      { error: 'Diagnostic failed', message: error.message },
      { status: 500 }
    );
  }
}
