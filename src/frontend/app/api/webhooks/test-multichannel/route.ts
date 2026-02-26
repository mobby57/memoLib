import { checkDuplicate, computeChecksum, storeChannelMessage } from '@/lib/deduplication-service';
import { addRateLimitHeaders, checkRateLimit, getClientIP } from '@/lib/rate-limit';
import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

// Force recompile: timestamp 2026-02-06 20:33 CRITICAL FIX

export async function GET() {
  return NextResponse.json({
    TEST_MARKER: 'FILE_UPDATED_2026_02_06_20_38',
    endpoint: '/api/webhooks/test-multichannel',
    method: 'POST',
    description: 'Test webhook pour Pattern Adapter Multi-Canal',
    examples: {
      email: {
        channel: 'EMAIL',
        messageId: 'msg_' + Date.now(),
        from: 'client@example.com',
        to: 'cabinet@example.com',
        subject: 'Question urgente',
        text: "Bonjour, j'ai une question juridique...",
      },
      whatsapp: {
        channel: 'WHATSAPP',
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      id: 'wamid_' + Date.now(),
                      from: '+33612345678',
                      type: 'text',
                      text: { body: 'Message via WhatsApp' },
                    },
                  ],
                  contacts: [{ profile: { name: 'Marie Client' } }],
                },
              },
            ],
          },
        ],
      },
      sms: {
        channel: 'SMS',
        MessageSid: 'SM' + Date.now(),
        From: '+33612345678',
        To: '+33698765432',
        Body: 'Message urgent via SMS',
      },
      form: {
        channel: 'FORM',
        submissionId: 'form_' + Date.now(),
        email: 'client@example.com',
        name: 'John Doe',
        subject: 'Contact formulaire',
        message: 'Demande via formulaire web',
        consentGiven: true,
      },
    },
  });
}

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  try {
    // 🔒 Rate Limiting - Protection DDoS
    const clientIP = getClientIP(req);
    const rateInfo = await checkRateLimit(clientIP, 'webhook');

    if (!rateInfo.success) {
      Sentry.captureMessage('Rate limit exceeded', {
        level: 'warning',
        tags: { ip: clientIP, endpoint: 'webhook' },
        extra: { remaining: rateInfo.remaining, reset: rateInfo.reset },
      });

      const response = NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Trop de requêtes. Veuillez réessayer plus tard.',
          retryAfter: rateInfo.reset.toISOString(),
        },
        { status: 429 }
      );

      return addRateLimitHeaders(response, rateInfo);
    }

    const payload = await req.json();

    // Compute checksum for deduplication
    const checksum = await computeChecksum(payload);

    // Check for duplicate using database
    const isDuplicate = await checkDuplicate(checksum);
    if (isDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error: 'DUPLICATE_MESSAGE',
          message: 'Ce message a déjà été traité (doublon détecté)',
          checksum,
        },
        { status: 409 }
      );
    }

    // Extract basic fields
    const channel = payload.channel || 'EMAIL';
    const sender = {
      email: payload.from || payload.email,
      phone: payload.From || payload.phone,
      name: payload.name || undefined,
    };

    const body = payload.text || payload.Body || payload.message || JSON.stringify(payload);
    const subject = payload.subject || undefined;

    // Store message in database
    const message = await storeChannelMessage({
      externalId: payload.messageId || payload.MessageSid || payload.id,
      checksum,
      channel,
      sender,
      body,
      subject,
      channelMetadata: payload,
    });

    const duration = performance.now() - startTime;
    Sentry.captureMessage(`Webhook processed: ${message.channel}`, {
      level: 'info',
      tags: {
        channel: message.channel,
        success: 'true',
      },
      extra: {
        messageId: message.id,
        duration: `${duration.toFixed(2)}ms`,
      },
    });

    console.log('[DEBUG TEST-HOTFIX] duration value:', duration, 'messageId:', message.id);

    // CRITICAL: Ensure duration is included in response
    const response = {
      MARKER: 'CODE_UPDATED_2026_02_06_20_35',
      success: true,
      messageId: message.id,
      externalId: message.externalId,
      checksum: message.checksum,
      channel: message.channel,
      status: message.status,
      duration: Math.round(duration * 100) / 100, // Round to 2 decimals
      timestamp: message.receivedAt || new Date().toISOString(),
    };

    console.log('[DEBUG] Response object:', JSON.stringify(response));

    return NextResponse.json(response);
  } catch (e: any) {
    const duration = performance.now() - startTime;

    // Check if it's a duplicate error
    if (e.message?.includes('DUPLICATE')) {
      Sentry.captureMessage('Webhook duplicate detected', {
        level: 'warning',
        tags: {
          error: 'DUPLICATE',
        },
        extra: {
          duration: `${duration.toFixed(2)}ms`,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'DUPLICATE_MESSAGE',
          message: e.message,
        },
        { status: 409 }
      );
    }

    // Log error to Sentry
    Sentry.captureException(e, {
      tags: {
        error: 'WEBHOOK_ERROR',
      },
      extra: {
        duration: `${duration.toFixed(2)}ms`,
      },
    });

    console.error('[Webhook Error]', e.message);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 400 });
  }
}
