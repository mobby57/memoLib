import { NextResponse } from 'next/server';
import { z } from 'zod';

const demoRequestSchema = z.object({
  nom: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  telephone: z.string().max(50).optional(),
  cabinet: z.string().max(200).optional(),
  tailleEquipe: z.union([z.string().max(50), z.number().int().positive()]),
  dateSouhaitee: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heureSouhaitee: z.string().regex(/^\d{2}:\d{2}$/),
  besoinPrincipal: z.string().trim().min(1).max(2000),
  commentaire: z.string().max(5000).optional(),
});

export async function POST(request: Request) {
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide. JSON attendu.' },
      { status: 400 }
    );
  }

  const parsedBody = demoRequestSchema.safeParse(requestBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Données invalides pour la demande de démonstration.' },
      { status: 400 }
    );
  }

  const { dateSouhaitee, heureSouhaitee } = parsedBody.data;
  const requestedDate = new Date(`${dateSouhaitee}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(requestedDate.getTime()) || requestedDate < today) {
    return NextResponse.json(
      { error: 'La date souhaitée doit être valide et dans le futur.' },
      { status: 400 }
    );
  }

  const [hours, minutes] = heureSouhaitee.split(':').map(Number);
  if (hours > 23 || minutes > 59) {
    return NextResponse.json({ error: 'L’heure souhaitée est invalide.' }, { status: 400 });
  }

  return NextResponse.json(
    { error: 'Les demandes de démonstration ne sont pas encore enregistrées.' },
    { status: 503 }
  );
}
