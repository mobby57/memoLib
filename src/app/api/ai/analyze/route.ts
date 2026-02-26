/**
import { logger } from '@/lib/logger';
 * API Route: AI Analysis
 *
 * Proxies requests to the Python AI service
 */

import { NextRequest, NextResponse } from 'next/server';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${AI_SERVICE_URL}/api/analysis/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'AI service error' }));
      return NextResponse.json(
        { error: error.detail || 'Analysis failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error('AI Analysis error:', { error });
    return NextResponse.json({ error: 'Failed to connect to AI service' }, { status: 503 });
  }
}
