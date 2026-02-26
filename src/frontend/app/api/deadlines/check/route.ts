/**
 * POST /api/deadlines/check - Trigger monitoring
 * Phase 6: Deadline Tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { DeadlineMonitorService } from '@/lib/services/deadline-monitor.service';

const prisma = new PrismaClient();
const deadlineMonitor = new DeadlineMonitorService(prisma);

// POST /api/deadlines/check - Vérifier toutes deadlines
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId } = body;

    const result = await deadlineMonitor.checkAllDeadlines(tenantId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[API] POST /api/deadlines/check error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
