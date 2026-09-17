import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/documents/convention-honoraires
 * Genere une convention d'honoraires pre-remplie.
 */
export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { dossierId, tauxHoraire, provision, forfait } = await req.json();

  let client: any = null;
  let dossier: any = null;

  if (dossierId) {
    dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, tenantId: user.tenantId },
      include: { Client: true },
    });
    client = dossier?.Client;
  }

  const convention = `CONVENTION D'HONORAIRES

Entre:
Me. ${user.name || '[NOM AVOCAT]'}
Avocat au Barreau de [BARREAU]
[ADRESSE CABINET]

Et:
${client ? `${client.firstName} ${client.lastName}` : '[NOM CLIENT]'}
${client?.email || '[EMAIL CLIENT]'}

---

ARTICLE 1 — OBJET DE LA MISSION

Le present contrat a pour objet de definir les conditions dans lesquelles l'avocat intervient pour le compte du client dans le cadre de:
${dossier?.objet || dossier?.typeDossier || '[DESCRIPTION MISSION]'}

Dossier: ${dossier?.numero || '[NUMERO]'}

---

ARTICLE 2 — HONORAIRES

${forfait ? `Honoraires forfaitaires: ${forfait} EUR HT
Ce forfait couvre l'ensemble de la mission decrite a l'article 1.` : `Honoraires au temps passe: ${tauxHoraire || 150} EUR HT / heure
Le temps passe est decompte par tranches de 15 minutes.`}

TVA applicable: 20%

---

ARTICLE 3 — PROVISION

Une provision de ${provision || 500} EUR TTC est demandee a la signature de la presente convention.
Cette provision sera imputee sur les honoraires definitifs.

---

ARTICLE 4 — MODALITES DE PAIEMENT

Les honoraires sont payables par virement bancaire ou carte bancaire dans un delai de 30 jours suivant l'envoi de la facture.

---

ARTICLE 5 — AIDE JURIDICTIONNELLE

En cas d'eligibilite a l'aide juridictionnelle, les honoraires seront ajustes selon le bareme en vigueur. Le client s'engage a informer l'avocat de toute demande d'AJ.

---

ARTICLE 6 — RESILIATION

Chaque partie peut mettre fin a la mission a tout moment par lettre recommandee. Les honoraires dus pour le travail effectue restent exigibles.

---

ARTICLE 7 — CONTESTATION

En cas de contestation des honoraires, le client peut saisir le Batonnier de l'Ordre des Avocats competent.

---

Fait en deux exemplaires a [VILLE], le ${new Date().toLocaleDateString('fr-FR')}

L'avocat:                          Le client:
Me. ${user.name || '[NOM]'}        ${client ? `${client.firstName} ${client.lastName}` : '[NOM]'}
`;

  return NextResponse.json({
    success: true,
    content: convention,
    metadata: {
      dossierId,
      client: client ? `${client.firstName} ${client.lastName}` : null,
      tauxHoraire: tauxHoraire || 150,
      provision: provision || 500,
      forfait: forfait || null,
    },
  });
}




