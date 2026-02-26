/**
 * POST /api/analysis/execute
 *
 * Executes the complete analysis pipeline
 * - Retrieves units from Prisma
 * - Calls Python backend
 * - Persists EventLog
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { tenantId, unitStatus = 'RECEIVED', limit = 100 } = await req.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    // Call Python backend to execute pipeline
    const pythonResponse = await fetch('http://localhost:5000/analysis/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenantId,
        unit_status: unitStatus,
        limit,
        persist: true,
      }),
    });

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error('Python backend error:', errorText);
      throw new Error(`Python backend error: ${pythonResponse.statusText}`);
    }

    const result = await pythonResponse.json();

    return NextResponse.json({
      success: true,
      events_generated: result.events_generated,
      duplicates_detected: result.duplicates_detected,
      processing_time_seconds: result.processing_time_seconds,
      rules_applied: result.rules_applied || [],
      errors: result.errors || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ANALYSIS/EXECUTE]', error);
    return NextResponse.json(
      { error: 'Pipeline execution failed', details: String(error) },
      { status: 500 }
    );
  }
}
