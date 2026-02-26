/**
 * Exemple d'utilisation du Pattern Adapter Multi-Canal
 * Démonstration intégration complète
 */

import { AdapterFactory, multiChannelService } from '@/lib/multichannel';

// ========== EXEMPLE 1 : Recevoir email via webhook ==========

export async function handleEmailWebhook(req: Request) {
  const payload = await req.json();

  try {
    const message = await multiChannelService.receiveMessage({
      channel: 'EMAIL',
      payload,
      signature: req.headers.get('x-signature') || undefined,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      messageId: message.id,
      externalId: message.externalId,
      checksum: message.checksum.substring(0, 12) + '...',
    };
  } catch (error) {
    if (error.message.includes('doublon détecté')) {
      return {
        success: false,
        error: 'DUPLICATE',
        message: 'Ce message a déjà été traité',
      };
    }
    throw error;
  }
}

// ========== EXEMPLE 2 : Recevoir WhatsApp via webhook ==========

export async function handleWhatsAppWebhook(req: Request) {
  const payload = await req.json();
  const signature = req.headers.get('x-hub-signature-256') || '';

  // Validation signature WhatsApp
  const adapter = AdapterFactory.getAdapter('WHATSAPP');
  const secret = process.env.WHATSAPP_APP_SECRET!;

  if (
    adapter.validateSignature &&
    !adapter.validateSignature(signature, JSON.stringify(payload), secret)
  ) {
    return {
      success: false,
      error: 'INVALID_SIGNATURE',
    };
  }

  const message = await multiChannelService.receiveMessage({
    channel: 'WHATSAPP',
    payload,
    signature,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    messageId: message.id,
    sender: message.sender.phone,
  };
}

// ========== EXEMPLE 3 : Recevoir SMS Twilio ==========

export async function handleTwilioSMS(req: Request) {
  const formData = await req.formData();

  const payload = {
    MessageSid: formData.get('MessageSid'),
    AccountSid: formData.get('AccountSid'),
    From: formData.get('From'),
    To: formData.get('To'),
    Body: formData.get('Body'),
  };

  const message = await multiChannelService.receiveMessage({
    channel: 'SMS',
    payload,
    signature: req.headers.get('x-twilio-signature') || undefined,
    timestamp: new Date().toISOString(),
  });

  // Réponse TwiML
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
     <Response>
       <Message>Message reçu, merci !</Message>
     </Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  );
}

// ========== EXEMPLE 4 : Recevoir formulaire web ==========

export async function handleFormSubmission(formData: {
  email: string;
  name: string;
  phone?: string;
  subject: string;
  message: string;
  formId: string;
  consentGiven: boolean;
}) {
  const message = await multiChannelService.receiveMessage({
    channel: 'FORM',
    payload: {
      submissionId: `form_${Date.now()}`,
      formId: formData.formId,
      formType: 'contact',
      email: formData.email,
      name: formData.name,
      phone: formData.phone,
      subject: formData.subject,
      message: formData.message,
      consentGiven: formData.consentGiven,
      consentPurpose: 'Contact et suivi client',
      formData: formData,
    },
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    messageId: message.id,
    urgency: message.aiAnalysis?.urgency,
    summary: message.aiAnalysis?.summary,
  };
}

// ========== EXEMPLE 5 : Ajouter canal personnalisé ==========

import { ChannelAdapter } from '@/lib/multichannel';

export class CustomCRMAdapter implements ChannelAdapter {
  extractExternalId(payload: Record<string, unknown>): string | undefined {
    return payload.crmMessageId as string;
  }

  async parseWebhook(payload: Record<string, unknown>): Promise<Partial<any>> {
    return {
      sender: {
        externalId: payload.crmContactId as string,
        email: payload.contactEmail as string,
        name: payload.contactName as string,
      },
      body: payload.message as string,
      channelMetadata: {
        crmSource: payload.source,
        crmDealId: payload.dealId,
        crmPipeline: payload.pipeline,
      },
    };
  }
}

// Enregistrer adapter personnalisé
// AdapterFactory.registerCustomAdapter('CRM' as any, new CustomCRMAdapter());

// ========== EXEMPLE 6 : Query DB directement ==========
// Pour récupérer messages : utiliser prisma.channelMessage.findMany
// Tous les messages garantis uniques grâce à checksum UNIQUE
