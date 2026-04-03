import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

/**
 * API Contact - Recevoir les demandes de contact
 */

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const { nom, email, telephone, cabinet, sujet, message, type } = body;

    // Validation
    if (!nom || !email || !sujet || !message) {
      return NextResponse.json(
        { error: 'Veuillez remplir tous les champs obligatoires' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string') {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    // Stocker la demande en base (optionnel - on peut aussi envoyer un email)
    // Ne pas logger de donnees personnelles (RGPD)
    logger.info('=== NOUVELLE DEMANDE DE CONTACT ===');
    logger.info('Meta:', {
      type: type || 'non-renseigne',
      hasTelephone: Boolean(telephone),
      hasCabinet: Boolean(cabinet),
      hasSubject: Boolean(sujet),
      messageLength: typeof message === 'string' ? message.length : 0,
      receivedAt: new Date().toISOString(),
    });
    logger.info('===================================');

    // Optionnel: Créer une entrée dans une table ContactRequest
    // await prisma.contactRequest.create({ data: { ... } });

    // Optionnel: Envoyer un email de notification
    // await sendNotificationEmail({ to: 'admin@memoLib.space', ... });

    return NextResponse.json({
      success: true,
      message: 'Votre demande a ete envoyee avec succes',
    });
  } catch (error) {
    logger.error('Erreur API contact', error instanceof Error ? error : undefined, {
      route: '/api/contact',
    });
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
