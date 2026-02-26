import { checkWebhookRateLimit } from '@/lib/webhook-rate-limit';
import { checkPayloadSize } from '@/lib/webhook-size-limits';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Test 1: Check payload size
    const testPayload = JSON.stringify({ channel: 'EMAIL', test: true });
    const sizeCheck = checkPayloadSize(testPayload, 'EMAIL');

    // Test 2: Check rate limit
    const rateLimitCheck = await checkWebhookRateLimit(req, 'EMAIL');

    return NextResponse.json({
      success: true,
      tests: {
        sizeCheck: {
          valid: sizeCheck.valid,
          size: sizeCheck.size,
          limit: sizeCheck.limit,
        },
        rateLimit: {
          success: rateLimitCheck.success,
          remaining: rateLimitCheck.remaining,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
