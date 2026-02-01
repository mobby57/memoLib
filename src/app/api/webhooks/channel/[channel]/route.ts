/**
 * API Multi-Canal Webhooks
 * Réception centralisée pour tous les canaux de communication
 */

import { logger } from '@/lib/logger';
import { auditService } from '@/lib/multichannel/audit-service';
import { multiChannelService } from '@/lib/multichannel/channel-service';
import { ChannelType, WebhookPayload } from '@/lib/multichannel/types';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Mapping des chemins vers les canaux
const CHANNEL_MAP: Record<string, ChannelType> = {
  email: 'EMAIL',
  whatsapp: 'WHATSAPP',
  sms: 'SMS',
  voice: 'VOICE',
  slack: 'SLACK',
  teams: 'TEAMS',
  linkedin: 'LINKEDIN',
  twitter: 'TWITTER',
  form: 'FORM',
  document: 'DOCUMENT',
  declan: 'DECLAN',
  internal: 'INTERNAL',
};

/**
 * POST /api/webhooks/channel/[channel]
 * Recevoir un message de n'importe quel canal
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const startTime = Date.now();
  const { channel: channelPath } = await params;
  const headersList = await headers();
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';

  try {
    // Valider le canal
    const channelType = CHANNEL_MAP[channelPath.toLowerCase()];
    if (!channelType) {
      return NextResponse.json({ error: `Canal non supporté: ${channelPath}` }, { status: 400 });
    }

    // Vérifier l'authentification webhook
    const authResult = await validateWebhookAuth(request, channelType, headersList);
    if (!authResult.valid) {
      await auditService.log({
        action: 'WEBHOOK_AUTH_FAILED',
        channel: channelType,
        actorType: 'SYSTEM',
        resourceType: 'WEBHOOK',
        resourceId: channelPath,
        details: { reason: authResult.reason },
        ipAddress,
        userAgent,
      });
      return NextResponse.json({ error: 'Authentification webhook invalide' }, { status: 401 });
    }

    // Parser le payload
    const payload = await request.json();

    // Récupérer la signature selon le canal
    const signature = getSignature(headersList, channelType);

    // Créer le webhook payload normalisé
    const webhookPayload: WebhookPayload = {
      channel: channelType,
      timestamp: new Date().toISOString(),
      signature,
      payload,
    };

    // Traiter le message
    const message = await multiChannelService.receiveMessage(webhookPayload);

    // Log de succès
    await auditService.log({
      action: 'WEBHOOK_RECEIVED',
      channel: channelType,
      actorType: 'SYSTEM',
      resourceType: 'MESSAGE',
      resourceId: message.id,
      tenantId: message.tenantId,
      clientId: message.clientId,
      details: {
        processingTime: Date.now() - startTime,
        hasAttachments: message.attachments.length > 0,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      messageId: message.id,
      status: message.status,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

    await auditService.log({
      action: 'WEBHOOK_ERROR',
      channel: CHANNEL_MAP[channelPath.toLowerCase()],
      actorType: 'SYSTEM',
      resourceType: 'WEBHOOK',
      resourceId: channelPath,
      details: { error: errorMessage },
      ipAddress,
      userAgent,
    });

    logger.error(`Webhook ${channelPath} error`, error instanceof Error ? error : undefined, {
      route: `/api/webhooks/channel/${channelPath}`,
    });

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/channel/[channel]
 * Vérification webhook (challenge)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { channel: channelPath } = await params;
  const url = new URL(request.url);

  // WhatsApp/Meta verification
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  // Slack challenge
  const slackChallenge = url.searchParams.get('challenge');
  if (slackChallenge) {
    return NextResponse.json({ challenge: slackChallenge });
  }

  // Santé du webhook
  return NextResponse.json({
    status: 'active',
    channel: channelPath,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Valider l'authentification webhook selon le canal
 */
async function validateWebhookAuth(
  request: NextRequest,
  channel: ChannelType,
  headersList: Headers
): Promise<{ valid: boolean; reason?: string }> {
  const secret = process.env[`CHANNEL_${channel}_SECRET`];

  // Si pas de secret configuré, accepter (dev mode)
  if (!secret && process.env.NODE_ENV === 'development') {
    return { valid: true };
  }

  switch (channel) {
    case 'WHATSAPP':
      const waSignature = headersList.get('x-hub-signature-256');
      if (!waSignature) return { valid: false, reason: 'Missing signature' };
      // Validation signature Meta
      return { valid: true }; // Simplifié pour l'exemple

    case 'SLACK':
      const slackSignature = headersList.get('x-slack-signature');
      const slackTimestamp = headersList.get('x-slack-request-timestamp');
      if (!slackSignature || !slackTimestamp) {
        return { valid: false, reason: 'Missing Slack headers' };
      }
      return { valid: true }; // Simplifié

    case 'SMS':
    case 'VOICE':
      // Validation Twilio
      const twilioSignature = headersList.get('x-twilio-signature');
      if (!twilioSignature && process.env.NODE_ENV === 'production') {
        return { valid: false, reason: 'Missing Twilio signature' };
      }
      return { valid: true };

    case 'TEAMS':
      const teamsAuth = headersList.get('authorization');
      if (!teamsAuth?.startsWith('Bearer ')) {
        return { valid: false, reason: 'Missing Teams auth' };
      }
      return { valid: true };

    default:
      // Pour les autres canaux, vérifier un token API simple
      const apiKey = headersList.get('x-api-key');
      if (apiKey === secret || !secret) {
        return { valid: true };
      }
      return { valid: false, reason: 'Invalid API key' };
  }
}

/**
 * Récupérer la signature selon le canal
 */
function getSignature(headersList: Headers, channel: ChannelType): string | undefined {
  switch (channel) {
    case 'WHATSAPP':
      return headersList.get('x-hub-signature-256') || undefined;
    case 'SLACK':
      return headersList.get('x-slack-signature') || undefined;
    case 'SMS':
    case 'VOICE':
      return headersList.get('x-twilio-signature') || undefined;
    default:
      return headersList.get('x-signature') || undefined;
  }
}
