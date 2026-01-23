/**
 * API Route - Webhook Email Entrant (simplifié)
 * POST /api/webhooks/email - Reçoit un email via webhook
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, subject, body: emailBody, messageId } = body;

    if (!from || !to || !subject) {
      return NextResponse.json(
        { error: 'from, to et subject sont requis' },
        { status: 400 }
      );
    }

    // Log pour debug
    console.log('[WEBHOOK EMAIL]', { from, to, subject, messageId });

    return NextResponse.json({
      success: true,
      message: 'Email reçu',
      data: {
        from,
        to,
        subject,
        receivedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[WEBHOOK EMAIL ERROR]', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de l\'email' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/webhooks/email',
    method: 'POST',
    description: 'Webhook pour recevoir les emails entrants',
    requiredFields: ['from', 'to', 'subject'],
    optionalFields: ['body', 'messageId', 'attachments']
  });
}
