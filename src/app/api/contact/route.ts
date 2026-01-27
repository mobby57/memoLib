import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

/**
 * API Contact - Recevoir les demandes de contact
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, email, telephone, cabinet, sujet, message, type } = body;

    // Validation
    if (!nom || !email || !sujet || !message) {
      return NextResponse.json(
        { error: 'Veuillez remplir tous les champs obligatoires' },
        { status: 400 }
      );
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    // Stocker la demande en base (optionnel - on peut aussi envoyer un email)
    // Pour l'instant, on log la demande
    logger.info('=== NOUVELLE DEMANDE DE CONTACT ===');
    logger.info('Type:', { type });
    logger.info('Nom:', { nom });
    logger.info('Email:', { email });
    logger.info('Telephone:', { telephone: telephone || 'Non renseigne' });
    logger.info('Cabinet:', { cabinet: cabinet || 'Non renseigne' });
    logger.info('Sujet:', { sujet });
    logger.info('Message:', { message });
    logger.info('Date:', { date: new Date().toISOString() });
    logger.info('===================================');

    // Optionnel: Créer une entrée dans une table ContactRequest
    // await prisma.contactRequest.create({ data: { ... } });

    // Optionnel: Envoyer un email de notification
    // await sendNotificationEmail({ to: 'admin@iapostemanager.com', ... });

    return NextResponse.json({
      success: true,
      message: 'Votre demande a ete envoyee avec succes',
    });
  } catch (error) {
    logger.error('Erreur API contact:', { error });
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
