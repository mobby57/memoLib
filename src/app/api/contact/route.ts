import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Stocker la demande en base (optionnel - on peut aussi envoyer un email)
    // Pour l'instant, on log la demande
    console.log('=== NOUVELLE DEMANDE DE CONTACT ===');
    console.log('Type:', type);
    console.log('Nom:', nom);
    console.log('Email:', email);
    console.log('Telephone:', telephone || 'Non renseigne');
    console.log('Cabinet:', cabinet || 'Non renseigne');
    console.log('Sujet:', sujet);
    console.log('Message:', message);
    console.log('Date:', new Date().toISOString());
    console.log('===================================');

    // Optionnel: Créer une entrée dans une table ContactRequest
    // await prisma.contactRequest.create({ data: { ... } });

    // Optionnel: Envoyer un email de notification
    // await sendNotificationEmail({ to: 'admin@iapostemanager.com', ... });

    return NextResponse.json({ 
      success: true,
      message: 'Votre demande a ete envoyee avec succes' 
    });
  } catch (error) {
    console.error('Erreur API contact:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
