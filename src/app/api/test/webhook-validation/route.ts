import { validateWebhookPayloadSafe } from '@/lib/webhook-schemas';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const result = validateWebhookPayloadSafe(payload);

    if (!result.success) {
      return NextResponse.json(
        {
          valid: false,
          errors: result.errors.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        },
        { status: 400 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Payload validé mais données absentes',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      channel: result.data.channel,
      message: 'Validation réussie',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}
