import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

/**
 * API Demo - Recevoir les demandes de demonstration
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nom,
      email,
      telephone,
      cabinet,
      tailleEquipe,
      dateSouhaitee,
      heureSouhaitee,
      besoinPrincipal,
      commentaire,
    } = body;

    // Validation
    if (!nom || !email || !tailleEquipe || !dateSouhaitee || !heureSouhaitee || !besoinPrincipal) {
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

    // Validation date (doit etre dans le futur)
    const dateDemo = new Date(dateSouhaitee);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateDemo < today) {
      return NextResponse.json({ error: 'La date doit etre dans le futur' }, { status: 400 });
    }

    // Log la demande de demo
    logger.info('=== NOUVELLE DEMANDE DE DEMO ===');
    logger.info('Nom:', { nom });
    logger.info('Email:', { email });
    logger.info('Telephone:', { telephone: telephone || 'Non renseigne' });
    logger.info('Cabinet:', { cabinet: cabinet || 'Non renseigne' });
    logger.info('Taille equipe:', { tailleEquipe });
    logger.info('Date souhaitee:', { dateSouhaitee });
    logger.info('Heure souhaitee:', { heureSouhaitee });
    logger.info('Besoin principal:', { besoinPrincipal });
    logger.info('Commentaire:', { commentaire: commentaire || 'Aucun' });
    logger.info('Date demande:', { date: new Date().toISOString() });
    logger.info('================================');

    // Optionnel: Créer une entrée dans une table DemoRequest
    // await prisma.demoRequest.create({ data: { ... } });

    // Optionnel: Envoyer un email de confirmation + notification admin
    // await sendDemoConfirmationEmail({ to: email, date: dateSouhaitee, heure: heureSouhaitee });
    // await sendDemoNotificationEmail({ to: 'sales@memoLib.com', ... });

    // Optionnel: Créer un evenement dans Google Calendar / Calendly
    // await createCalendarEvent({ ... });

    return NextResponse.json({
      success: true,
      message: 'Votre demande de demonstration a ete enregistree',
      data: {
        date: dateSouhaitee,
        heure: heureSouhaitee,
      },
    });
  } catch (error) {
    logger.error('Erreur API demo:', { error });
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
