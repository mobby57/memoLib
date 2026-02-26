/**
 * GET /api/deadlines/upcoming - Deadlines urgentes
 * POST /api/deadlines/check - Trigger monitoring
 * PATCH /api/deadlines/:id/complete - Marquer complété
 * Phase 6: Deadline Tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { DeadlineMonitorService } from '@/lib/services/deadline-monitor.service';

const prisma = new PrismaClient();
const deadlineMonitor = new DeadlineMonitorService(prisma);

// GET /api/deadlines/upcoming?tenantId=xxx&limit=50
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const dossierId = searchParams.get('dossierId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const daysAhead = parseInt(searchParams.get('daysAhead') || '30');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    const result = await deadlineMonitor.getUpcomingDeadlines(tenantId, {
      dossierId,
      limit,
      daysAhead,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] GET /api/deadlines/upcoming error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
