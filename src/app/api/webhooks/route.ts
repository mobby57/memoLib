import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('x-hub-signature-256');
    
    // Verifier la signature webhook GitHub
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret || !signature || !verifyGitHubSignature(body, signature, secret)) {
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const { event, data } = payload;

    // Traiter l'evenement webhook
    await processWebhookEvent(event, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur webhook:', error);
    return NextResponse.json({ error: 'echec du traitement webhook' }, { status: 500 });
  }
}

function verifyGitHubSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

async function processWebhookEvent(event: string, data: any) {
  switch (event) {
    case 'dossier.created':
      console.log('Nouveau dossier cree:', data.dossierId);
      break;
    case 'dossier.updated':
      console.log('Dossier mis a jour:', data.dossierId);
      break;
    case 'payment.completed':
      console.log('Paiement complete:', data.paymentId);
      break;
    case 'document.uploaded':
      console.log('Document telecharge:', data.documentId);
      break;
    default:
      console.log(`evenement webhook non gere: ${event}`);
  }
}
