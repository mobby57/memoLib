import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ai/generate-recours
 * Genere un recours complet base sur les donnees du dossier.
 */
export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { dossierId, typeRecours, arguments: args } = await req.json();

  if (!dossierId || !typeRecours) {
    return NextResponse.json({ error: 'dossierId et typeRecours requis' }, { status: 400 });
  }

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, tenantId: user.tenantId },
    include: { Client: true },
  });

  if (!dossier) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

  const ollamaUrl = process.env.OLLAMA_URL;
  let content: string;

  if (ollamaUrl) {
    try {
      const prompt = `Tu es un avocat expert en droit des etrangers. Redige un ${typeRecours} complet pour ce dossier:
- Client: ${dossier.Client?.nom || 'N/A'}
- Type: ${dossier.typeDossier}
- Juridiction: ${dossier.juridiction || 'Tribunal administratif'}
- Objet: ${dossier.objet || ''}
- Description: ${dossier.description || ''}
${args ? `- Arguments supplementaires: ${args}` : ''}

Structure le recours avec: En-tete, Faits, Discussion (moyens de droit), Demande. Cite les articles CESEDA pertinents.`;

      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: process.env.OLLAMA_MODEL || 'llama3.2:latest', prompt, stream: false }),
      });

      if (res.ok) {
        const data = await res.json();
        content = data.response;
      } else {
        content = generateFallbackRecours(dossier, typeRecours);
      }
    } catch { content = generateFallbackRecours(dossier, typeRecours); }
  } else {
    content = generateFallbackRecours(dossier, typeRecours);
  }

  return NextResponse.json({
    success: true,
    typeRecours,
    dossierId,
    content,
    wordCount: content.split(/\s+/).length,
    note: 'Document genere par IA. A relire et valider par l\'avocat avant envoi.',
  });
}

function generateFallbackRecours(dossier: any, typeRecours: string): string {
  const client = dossier.client?.nom || '[NOM CLIENT]';
  const date = new Date().toLocaleDateString('fr-FR');

  return `TRIBUNAL ADMINISTRATIF DE [VILLE]

RECOURS ${typeRecours.toUpperCase()}

POUR: ${client}
CONTRE: Prefet de [DEPARTEMENT]

OBJET: ${dossier.objet || `Annulation de la decision du [DATE] portant ${dossier.typeDossier}`}

---

FAITS

${client} est de nationalite [NATIONALITE], present(e) sur le territoire francais depuis [DATE ARRIVEE].

Par decision en date du [DATE DECISION], le prefet de [DEPARTEMENT] a pris a son encontre une mesure de ${dossier.typeDossier}.

Cette decision est contestee pour les motifs suivants.

---

DISCUSSION

I. Sur la violation de l'article 8 de la CEDH (droit a la vie privee et familiale)

Le requerant justifie d'une vie privee et familiale etablie en France:
- [ELEMENTS DE VIE PRIVEE]
- [LIENS FAMILIAUX]

II. Sur la violation de l'article L.611-3 du CESEDA

[ARGUMENTS JURIDIQUES]

III. Sur l'erreur manifeste d'appreciation

[ARGUMENTS]

---

PAR CES MOTIFS

Il est demande au Tribunal:
- A titre principal: d'annuler la decision du [DATE]
- A titre subsidiaire: d'enjoindre au prefet de reexaminer la situation
- De mettre a la charge de l'Etat la somme de 1 500 EUR au titre de l'article L.761-1 du CJA

Fait a [VILLE], le ${date}

Me. [NOM AVOCAT]
Avocat au Barreau de [BARREAU]`;
}




