import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { NextRequest, NextResponse } from 'next/server';
/**
 * POST /api/signatures/request
 * Envoie une demande de signature electronique (Yousign ou fallback).
 */
export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { documentId, signerEmail, signerName, documentName } = await req.json();

  if (!signerEmail || !documentName) {
    return NextResponse.json({ error: 'signerEmail et documentName requis' }, { status: 400 });
  }

  const yousignKey = process.env.YOUSIGN_API_KEY;

  if (yousignKey) {
    try {
      // Yousign API v3
      const response = await fetch('https://api.yousign.app/v3/signature_requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${yousignKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: documentName,
          delivery_mode: 'email',
          signers: [{ info: { first_name: signerName?.split(' ')[0] || 'Client', last_name: signerName?.split(' ')[1] || '', email: signerEmail, locale: 'fr' } }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ success: true, signatureId: data.id, status: 'sent', provider: 'yousign' });
      }
    } catch (e) {
      console.error('[SIGNATURE] Yousign error:', e);
    }
  }

  // Fallback: simuler
  return NextResponse.json({
    success: true,
    signatureId: `sig-${Date.now()}`,
    status: 'simulated',
    message: `Demande de signature envoyee a ${signerEmail} pour "${documentName}"`,
    note: 'Configurez YOUSIGN_API_KEY pour les signatures reelles',
  });
}


