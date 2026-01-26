/**
 * API Route: AI Health Check
 *
 * Returns health status of the AI service
 */

import { NextResponse } from 'next/server';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Short timeout for health checks
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          service: 'ai-service',
          error: `AI service returned ${response.status}`,
        },
        { status: 503 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unreachable',
        service: 'ai-service',
        error: error instanceof Error ? error.message : 'Connection failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
