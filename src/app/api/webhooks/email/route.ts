import { NextRequest, NextResponse } from 'next/server';
import { emailMonitor } from '@/lib/email/email-monitor-service';

// Webhook pour recevoir les emails (ex: depuis Resend, SendGrid, etc.)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Vérifier le secret webhook
    const webhookSecret = req.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.EMAIL_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extraire les données selon le provider
    const { tenantId, rawEmail, from, subject, text } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    // Traiter l'email
    const result = await emailMonitor.processEmail(tenantId, rawEmail || text);

    return NextResponse.json({
      success: true,
      ...result,
      message: result.action === 'created' 
        ? `Nouveau dossier ${result.dossierId} créé`
        : result.action === 'linked'
        ? `Email lié au dossier ${result.dossierId}`
        : 'Email enregistré, action manuelle requise'
    });

  } catch (error) {
    console.error('Erreur webhook email:', error);
    return NextResponse.json({ 
      error: 'Internal error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
