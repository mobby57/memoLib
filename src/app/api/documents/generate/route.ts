import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
type TemplateType = 'accuse_reception' | 'mise_en_demeure' | 'recours_gracieux' | 'recours_contentieux' | 'convocation' | 'attestation';

const TEMPLATES: Record<TemplateType, { title: string; generate: (vars: Record<string, string>) => string }> = {
  accuse_reception: {
    title: 'Accusé de réception',
    generate: (v) => `${v.lieu}, le ${v.date}

${v.destinataire}

Objet : Accusé de réception — ${v.objet}

Madame, Monsieur,

J'accuse bonne réception de votre courrier${v.dateReception ? ` en date du ${v.dateReception}` : ''} relatif à ${v.objet}.

Votre demande a été enregistrée sous la référence ${v.numeroDossier} et sera traitée dans les meilleurs délais.

${v.complement || 'Je ne manquerai pas de revenir vers vous dès que les éléments nécessaires auront été réunis.'}

Je reste à votre entière disposition.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${v.avocat}
${v.cabinet || ''}`,
  },

  mise_en_demeure: {
    title: 'Mise en demeure',
    generate: (v) => `${v.lieu}, le ${v.date}

LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION

${v.destinataire}

Objet : MISE EN DEMEURE — ${v.objet}
Réf. dossier : ${v.numeroDossier}

Madame, Monsieur,

J'interviens en qualité de conseil de ${v.client} dans le cadre de ${v.objet}.

Par la présente, je vous mets en demeure de ${v.demande} dans un délai de ${v.delai || 'quinze (15) jours'} à compter de la réception de la présente.

À défaut de réponse satisfaisante dans le délai imparti, je me verrai contraint(e) d'engager toute procédure utile à la défense des intérêts de mon client, sans autre avis.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${v.avocat}
${v.cabinet || ''}`,
  },

  recours_gracieux: {
    title: 'Recours gracieux',
    generate: (v) => `${v.lieu}, le ${v.date}

${v.destinataire}

Objet : RECOURS GRACIEUX contre ${v.decision || 'la décision'} du ${v.dateDecision || '...'}
Réf. : ${v.numeroDossier}

Madame, Monsieur le Préfet,

J'ai l'honneur de former, au nom et pour le compte de ${v.client}, un recours gracieux à l'encontre de ${v.decision || 'la décision susvisée'}.

${v.motifs || 'Les motifs de ce recours sont les suivants : [à compléter]'}

En conséquence, je vous prie de bien vouloir réexaminer la situation de ${v.client} et rapporter la décision contestée.

Dans l'attente de votre réponse, je vous prie d'agréer, Madame, Monsieur le Préfet, l'assurance de ma haute considération.

${v.avocat}
${v.cabinet || ''}`,
  },

  recours_contentieux: {
    title: 'Recours contentieux',
    generate: (v) => `TRIBUNAL ADMINISTRATIF DE ${(v.tribunal || 'PARIS').toUpperCase()}

REQUÊTE EN ANNULATION

POUR : ${v.client}, demeurant ${v.adresseClient || '[adresse]'}
Représenté(e) par : ${v.avocat}

CONTRE : ${v.destinataire || 'Le Préfet de [département]'}

OBJET : Annulation de ${v.decision || 'la décision'} du ${v.dateDecision || '[date]'}
Réf. dossier : ${v.numeroDossier}

FAITS :
${v.faits || '[Exposé des faits]'}

DISCUSSION :
${v.motifs || '[Moyens de droit]'}

PAR CES MOTIFS, il est demandé au Tribunal de bien vouloir :
- Annuler la décision attaquée ;
- Enjoindre à l'administration de ${v.injonction || '[mesure demandée]'} ;
- Condamner l'État aux dépens.

${v.lieu}, le ${v.date}
${v.avocat}`,
  },

  convocation: {
    title: 'Convocation rendez-vous',
    generate: (v) => `${v.lieu}, le ${v.date}

${v.destinataire}

Objet : Convocation — Rendez-vous du ${v.dateRdv || '[date]'}
Réf. : ${v.numeroDossier}

Madame, Monsieur,

Je vous prie de bien vouloir vous présenter à mon cabinet le ${v.dateRdv || '[date]'} à ${v.heureRdv || '[heure]'} afin de faire le point sur votre dossier.

${v.documentsApporter ? `Merci de vous munir des documents suivants :\n${v.documentsApporter}` : 'Merci de vous munir de votre pièce d\'identité et de tout document utile.'}

En cas d'empêchement, merci de me prévenir au moins 48 heures à l'avance.

Cordialement,

${v.avocat}
${v.cabinet || ''}`,
  },

  attestation: {
    title: 'Attestation',
    generate: (v) => `ATTESTATION

Je soussigné(e), ${v.avocat}, avocat au Barreau de ${v.barreau || '[ville]'}, atteste par la présente que ${v.client} ${v.contenu || 'est suivi(e) par mon cabinet dans le cadre du dossier référencé ci-dessous'}.

Référence dossier : ${v.numeroDossier}
${v.complement || ''}

Cette attestation est délivrée pour servir et valoir ce que de droit.

Fait à ${v.lieu}, le ${v.date}

${v.avocat}`,
  },
};

export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = user.tenantId;
  const { templateType, dossierId, variables } = await req.json();

  if (!templateType || !TEMPLATES[templateType as TemplateType]) {
    return NextResponse.json({ error: 'Template invalide', available: Object.keys(TEMPLATES) }, { status: 400 });
  }

  // Auto-remplir les variables depuis le dossier
  const vars: Record<string, string> = {
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    lieu: 'Paris',
    avocat: user.name || 'Maître',
    ...variables,
  };

  if (dossierId && tenantId) {
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, tenantId },
      include: { Client: { select: { firstName: true, lastName: true } } },
    });
    if (dossier) {
      vars.numeroDossier = vars.numeroDossier || dossier.numero;
      const clientData = (dossier as any).Client;
      vars.client = vars.client || (clientData ? `${clientData.firstName} ${clientData.lastName}` : '');
      vars.objet = vars.objet || dossier.objet || '';
    }
  }

  const template = TEMPLATES[templateType as TemplateType];
  const document = template.generate(vars);

  return NextResponse.json({
    templateType,
    title: template.title,
    content: document,
    variables: vars,
  });
}

export async function GET() {
  const templates = Object.entries(TEMPLATES).map(([key, val]) => ({
    id: key,
    title: val.title,
  }));
  return NextResponse.json({ templates });
}




