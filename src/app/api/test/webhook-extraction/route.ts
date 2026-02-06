import { extractWebhookFields } from '@/lib/webhook-field-extraction';
import { validateWebhookPayloadSafe } from '@/lib/webhook-schemas';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Step 1: Validate
    const validation = validateWebhookPayloadSafe(payload);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          step: 'validation',
          errors: validation.errors.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Step 2: Extract fields
    try {
      const normalized = extractWebhookFields(validation.data);
      return NextResponse.json({
        success: true,
        step: 'extraction',
        channel: normalized.channel,
        externalId: normalized.externalId,
        sender: normalized.sender,
        subject: normalized.subject,
        bodyLength: normalized.body.length,
        metadata: normalized.metadata,
      });
    } catch (extractError: any) {
      return NextResponse.json(
        {
          success: false,
          step: 'extraction',
          error: extractError.message,
          stack: extractError.stack,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        step: 'json_parsing',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
