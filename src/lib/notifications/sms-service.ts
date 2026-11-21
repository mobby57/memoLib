import { logger } from '@/lib/logger';

export interface SmsSendResult {
  success: boolean;
  sid?: string;
  error?: string;
}

export async function sendSms(to: string, message: string): Promise<SmsSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    logger.error('Configuration SMS Twilio incomplete');
    return { success: false, error: 'SMS_NOT_CONFIGURED' };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: from, Body: message }),
      }
    );

    const data = await response.json() as { sid?: string; message?: string };
    if (!response.ok) {
      logger.error('Echec envoi SMS Twilio');
      return { success: false, error: data.message || 'SMS_SEND_FAILED' };
    }

    return { success: true, sid: data.sid };
  } catch (error) {
    logger.error('Erreur reseau envoi SMS', error instanceof Error ? error : undefined);
    return { success: false, error: 'SMS_NETWORK_ERROR' };
  }
}
