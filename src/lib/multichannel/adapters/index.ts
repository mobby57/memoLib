/**
 * Adaptateurs Multi-Canal
 * Pattern Adapter : normalise chaque source externe vers NormalizedMessage
 */

import { randomUUID } from 'crypto';
import { NormalizedMessage } from '../types';

// Fallback pour UUID (compatible CommonJS)
const uuidv4 = randomUUID;

/**
 * Interface ChannelAdapter
 */
export interface ChannelAdapter {
  parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>>;
  extractExternalId(payload: Record<string, unknown>): string | undefined;
  validateSignature?(signature: string, payload: string, secret: string): boolean;
  sendMessage?(message: NormalizedMessage): Promise<{ success: boolean; externalId?: string }>;
}

/**
 * EMAIL ADAPTER
 */
export class EmailAdapter implements ChannelAdapter {
  extractExternalId(payload: Record<string, unknown>): string | undefined {
    return (payload.messageId as string) || (payload.id as string);
  }

  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      sender: {
        email: payload.from as string,
        name: payload.fromName as string,
      },
      recipient: {
        email: payload.to as string,
      },
      subject: payload.subject as string,
      body: payload.text as string,
      bodyHtml: payload.html as string,
      attachments:
        (payload.attachments as any[])?.map(a => ({
          id: uuidv4(),
          filename: a.filename,
          mimeType: a.contentType,
          size: a.size,
          url: a.url,
        })) || [],
    };
  }
}

/**
 * WHATSAPP ADAPTER
 */
export class WhatsAppAdapter implements ChannelAdapter {
  extractExternalId(payload: Record<string, unknown>): string | undefined {
    const message = (payload.entry as any[])?.[0]?.changes?.[0]?.value?.messages?.[0];
    return message?.id;
  }

  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    const message = (payload.entry as any[])?.[0]?.changes?.[0]?.value?.messages?.[0];
    const contact = (payload.entry as any[])?.[0]?.changes?.[0]?.value?.contacts?.[0];

    return {
      sender: {
        phone: message?.from,
        name: contact?.profile?.name,
        externalId: message?.id,
      },
      body: message?.text?.body || message?.caption || '',
      attachments:
        message?.type !== 'text'
          ? [
              {
                id: uuidv4(),
                filename: `${message?.type}_${Date.now()}`,
                mimeType: this.getMimeType(message?.type),
                size: 0,
                url: message?.[message?.type]?.url,
              },
            ]
          : [],
      channelMetadata: { messageType: message?.type },
    };
  }

  validateSignature(signature: string, payload: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return signature === `sha256=${expectedSig}`;
  }

  private getMimeType(type: string): string {
    const mimeTypes: Record<string, string> = {
      image: 'image/jpeg',
      video: 'video/mp4',
      audio: 'audio/ogg',
      document: 'application/octet-stream',
    };
    return mimeTypes[type] || 'application/octet-stream';
  }
}

/**
 * SMS ADAPTER (Twilio)
 */
export class SMSAdapter implements ChannelAdapter {
  extractExternalId(payload: Record<string, unknown>): string | undefined {
    return (payload.MessageSid as string) || (payload.SmsSid as string);
  }

  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      sender: {
        phone: payload.From as string,
      },
      recipient: {
        phone: payload.To as string,
      },
      body: payload.Body as string,
      channelMetadata: {
        messageSid: payload.MessageSid,
        accountSid: payload.AccountSid,
      },
    };
  }

  validateSignature(signature: string, payload: string, secret: string): boolean {
    try {
      const crypto = require('crypto');
      const url = process.env.TWILIO_WEBHOOK_URL || '';
      const params = JSON.parse(payload);

      let data = url;
      Object.keys(params)
        .sort()
        .forEach(key => {
          data += key + params[key];
        });

      const computedSignature = crypto
        .createHmac('sha1', secret)
        .update(Buffer.from(data, 'utf-8'))
        .digest('base64');

      return signature === computedSignature;
    } catch (error) {
      console.error('[SMS] Signature validation error:', error);
      return false;
    }
  }
}

/**
 * VOICE ADAPTER
 */
export class VoiceAdapter implements ChannelAdapter {
  extractExternalId(payload: Record<string, unknown>): string | undefined {
    return payload.CallSid as string;
  }

  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      sender: {
        phone: payload.From as string,
        name: payload.CallerName as string,
      },
      body: (payload.TranscriptionText as string) || '[Transcription en cours...]',
      channelMetadata: {
        callSid: payload.CallSid,
        callDuration: payload.CallDuration,
        recordingUrl: payload.RecordingUrl,
        transcriptionSid: payload.TranscriptionSid,
      },
      attachments: payload.RecordingUrl
        ? [
            {
              id: uuidv4(),
              filename: `call_${payload.CallSid}.mp3`,
              mimeType: 'audio/mpeg',
              size: 0,
              url: payload.RecordingUrl as string,
            },
          ]
        : [],
    };
  }
}

/**
 * SLACK ADAPTER
 */
export class SlackAdapter implements ChannelAdapter {
  extractExternalId(payload: Record<string, unknown>): string | undefined {
    const event = payload.event as any;
    return event?.client_msg_id || event?.ts;
  }

  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    const event = payload.event as any;
    return {
      sender: {
        externalId: event?.user,
        name: event?.user_profile?.display_name,
      },
      body: event?.text || '',
      channelMetadata: {
        channel: event?.channel,
        ts: event?.ts,
        threadTs: event?.thread_ts,
      },
      attachments:
        (event?.files as any[])?.map(f => ({
          id: uuidv4(),
          filename: f.name,
          mimeType: f.mimetype,
          size: f.size,
          url: f.url_private,
        })) || [],
    };
  }

  validateSignature(signature: string, payload: string, secret: string): boolean {
    const crypto = require('crypto');
    const [version, hash] = signature.split('=');
    const baseString = `${version}:${Date.now() / 1000}:${payload}`;
    const computedHash = crypto.createHmac('sha256', secret).update(baseString).digest('hex');
    return hash === computedHash;
  }
}

/**
 * TEAMS ADAPTER
 */
export class TeamsAdapter implements ChannelAdapter {
  extractExternalId(payload: Record<string, unknown>): string | undefined {
    return payload.id as string;
  }

  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      sender: {
        externalId: (payload.from as any)?.id,
        name: (payload.from as any)?.name,
      },
      body: (payload.text as string) || '',
      channelMetadata: {
        conversationId: (payload.conversation as any)?.id,
        activityId: payload.id,
      },
      attachments:
        (payload.attachments as any[])?.map(a => ({
          id: uuidv4(),
          filename: a.name || 'attachment',
          mimeType: a.contentType,
          size: 0,
          url: a.contentUrl,
        })) || [],
    };
  }
}

/**
 * LINKEDIN ADAPTER
 */
export class LinkedInAdapter implements ChannelAdapter {
  extractExternalId(payload: Record<string, unknown>): string | undefined {
    return payload.messageId as string;
  }

  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      sender: {
        externalId: payload.senderId as string,
      },
      body: (payload.message as string) || '',
      channelMetadata: payload,
    };
  }
}

/**
 * TWITTER ADAPTER
 */
export class TwitterAdapter implements ChannelAdapter {
  extractExternalId(payload: Record<string, unknown>): string | undefined {
    const dm = (payload.direct_message_events as any[])?.[0];
    return dm?.id;
  }

  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    const dm = (payload.direct_message_events as any[])?.[0];
    return {
      sender: {
        externalId: dm?.message_create?.sender_id,
      },
      body: dm?.message_create?.message_data?.text || '',
      channelMetadata: payload,
    };
  }
}

/**
 * FORM ADAPTER
 */
export class FormAdapter implements ChannelAdapter {
  extractExternalId(payload: Record<string, unknown>): string | undefined {
    return (payload.submissionId as string) || (payload.formId as string);
  }

  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      sender: {
        email: payload.email as string,
        name: payload.name as string,
        phone: payload.phone as string,
      },
      subject: (payload.subject as string) || 'Formulaire soumis',
      body: (payload.message as string) || JSON.stringify(payload.formData),
      channelMetadata: {
        formId: payload.formId,
        formType: payload.formType,
        formData: payload.formData,
      },
      consent: {
        status: payload.consentGiven ? 'GRANTED' : 'PENDING',
        grantedAt: payload.consentGiven ? new Date() : undefined,
        purpose: payload.consentPurpose as string,
      },
    };
  }
}

/**
 * DOCUMENT ADAPTER
 */
export class DocumentAdapter implements ChannelAdapter {
  extractExternalId(payload: Record<string, unknown>): string | undefined {
    return (payload.documentId as string) || (payload.blobPath as string);
  }

  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      sender: {
        id: payload.uploadedBy as string,
      },
      body: (payload.description as string) || 'Document uploadé',
      attachments: [
        {
          id: uuidv4(),
          filename: payload.filename as string,
          mimeType: payload.mimeType as string,
          size: payload.size as number,
          blobPath: payload.blobPath as string,
          url: payload.url as string,
        },
      ],
      channelMetadata: {
        documentType: payload.documentType,
        category: payload.category,
      },
    };
  }
}

/**
 * DECLAN ADAPTER (événements déclaratifs)
 */
export class DeclanAdapter implements ChannelAdapter {
  extractExternalId(payload: Record<string, unknown>): string | undefined {
    return payload.eventId as string;
  }

  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      body: (payload.eventDescription as string) || JSON.stringify(payload),
      channelMetadata: {
        eventType: payload.eventType,
        eventSource: payload.eventSource,
        metadata: payload.metadata,
      },
    };
  }
}

/**
 * INTERNAL ADAPTER (messages système)
 */
export class InternalAdapter implements ChannelAdapter {
  extractExternalId(payload: Record<string, unknown>): string | undefined {
    return payload.internalMessageId as string;
  }

  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<NormalizedMessage>> {
    return {
      sender: {
        id: payload.systemUserId as string,
        name: 'SYSTEM',
      },
      body: payload.message as string,
      channelMetadata: {
        systemEvent: payload.systemEvent,
        triggeredBy: payload.triggeredBy,
      },
    };
  }
}
