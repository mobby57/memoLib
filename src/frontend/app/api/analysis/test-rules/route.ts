/**
 * POST /api/analysis/test-rules
 *
 * Tests rules on a single unit
 * Returns: priority, applied_rules, score, deadlines
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.content) {
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    }

    // Call Python backend to test rules
    const pythonResponse = await fetch('http://localhost:5000/analysis/test-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: data.source || 'API',
        content: data.content,
        content_hash: data.content_hash || '',
        metadata: data.metadata || {},
        tenant_id: data.tenantId || 'default',
        historical_count: data.historical_count || 0,
      }),
    });

    if (!pythonResponse.ok) {
      throw new Error(`Python backend error: ${pythonResponse.statusText}`);
    }

    const result = await pythonResponse.json();

    return NextResponse.json({
      priority: result.priority,
      applied_rules: result.applied_rules,
      score: result.score,
      deadlines: result.deadlines,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error('[ANALYSIS/TEST-RULES]', error);
    return NextResponse.json(
      { error: 'Rule testing failed', details: String(error) },
      { status: 500 }
    );
  }
}
