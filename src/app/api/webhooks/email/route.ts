import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculerDateLimiteUniverselle } from '@/lib/ceseda-delais';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // On enregistre l'email pour la traçabilité
    const log = await prisma.emailLog.create({
      data: { sender: body.sender, subject: body.subject, rawText: body.body, processed: false }
    });

    // LOGIQUE IA SIMULÉE (À remplacer par un appel OpenAI)
    const isOQTF = body.subject.includes("OQTF") || body.body.includes("Obligation de quitter");
    
    if (isOQTF) {
      const dateNotif = new Date();
      const dateLimite = calculerDateLimiteUniverselle('OQTF_48H', dateNotif);

      const newCase = await prisma.case.create({
        data: {
          title: `OQTF - ${body.sender}`,
          clientId: "client-temporaire", // À lier dynamiquement
          typeDossier: "OQTF",
          dateNotification: dateNotif,
          dateLimiteRecours: dateLimite,
          statut: 'OUVERT',
          emails: { connect: { id: log.id } }
        }
      });
      return NextResponse.json({ success: true, message: "Dossier OQTF créé", caseId: newCase.id });
    }
    return NextResponse.json({ success: true, message: "Email loggué, pas d'action" });
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}