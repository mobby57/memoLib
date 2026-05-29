import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/notifications/sms
 * Envoie un SMS d'urgence a l'avocat (OQTF 48h, refere, retention).
 * Utilise Twilio ou fallback log.
 */
export async function POST(req: NextRequest) {
  const { to, message, dossierId, urgence } = await req.json();

  if (!to || !message) {
    return NextResponse.json({ error: 'to et message requis' }, { status: 400 });
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: to, From: twilioFrom, Body: message }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ success: true, sid: data.sid, status: 'sent' });
      }
    } catch (e) {
      console.error('[SMS] Twilio error:', e);
    }
  }

  // Fallback: log
  console.log(`[SMS URGENCE] To: ${to} | ${message}`);
  return NextResponse.json({
    success: true,
    status: 'logged',
    message: `SMS simule vers ${to}: ${message}`,
    note: 'Configurez TWILIO_ACCOUNT_SID pour envoyer de vrais SMS',
  });
}
