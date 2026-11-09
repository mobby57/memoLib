import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
type TemplateType = 'accuse_reception' | 'mise_en_demeure' | 'recours_gracieux' | 'recours_contentieux' | 'convocation' | 'attestation';

const TEMPLATES: Record<TemplateType, { title: string; generate: (vars: Record<string, string>) => string }> = {
  accuse_reception: {
    title: 'AccusÃ© de rÃ©ception',
    generate: (v) => `${v.lieu}, le ${v.date}

${v.destinataire}

Objet : AccusÃ© de rÃ©ception â€” ${v.objet}

Madame, Monsieur,

J'accuse bonne rÃ©ception de votre courrier${v.dateReception ? ` en date du ${v.dateReception}` : ''} relatif Ã  ${v.objet}.

Votre demande a Ã©tÃ© enregistrÃ©e sous la rÃ©fÃ©rence ${v.numeroDossier} et sera traitÃ©e dans les meilleurs dÃ©lais.

${v.complement || 'Je ne manquerai pas de revenir vers vous dÃ¨s que les Ã©lÃ©ments nÃ©cessaires auront Ã©tÃ© rÃ©unis.'}

Je reste Ã  votre entiÃ¨re disposition.

Veuillez agrÃ©er, Madame, Monsieur, l'expression de mes salutations distinguÃ©es.

${v.avocat}
${v.cabinet || ''}`,
  },

  mise_en_demeure: {
    title: 'Mise en demeure',
    generate: (v) => `${v.lieu}, le ${v.date}

LETTRE RECOMMANDÃ‰E AVEC ACCUSÃ‰ DE RÃ‰CEPTION

${v.destinataire}

Objet : MISE EN DEMEURE â€” ${v.objet}
RÃ©f. dossier : ${v.numeroDossier}

Madame, Monsieur,

J'interviens en qualitÃ© de conseil de ${v.client} dans le cadre de ${v.objet}.

Par la prÃ©sente, je vous mets en demeure de ${v.demande} dans un dÃ©lai de ${v.delai || 'quinze (15) jours'} Ã  compter de la rÃ©ception de la prÃ©sente.

Ã€ dÃ©faut de rÃ©ponse satisfaisante dans le dÃ©lai imparti, je me verrai contraint(e) d'engager toute procÃ©dure utile Ã  la dÃ©fense des intÃ©rÃªts de mon client, sans autre avis.

Veuillez agrÃ©er, Madame, Monsieur, l'expression de mes salutations distinguÃ©es.

${v.avocat}
${v.cabinet || ''}`,
  },

  recours_gracieux: {
    title: 'Recours gracieux',
    generate: (v) => `${v.lieu}, le ${v.date}

${v.destinataire}

Objet : RECOURS GRACIEUX contre ${v.decision || 'la dÃ©cision'} du ${v.dateDecision || '...'}
RÃ©f. : ${v.numeroDossier}

Madame, Monsieur le PrÃ©fet,

J'ai l'honneur de former, au nom et pour le compte de ${v.client}, un recours gracieux Ã  l'encontre de ${v.decision || 'la dÃ©cision susvisÃ©e'}.

${v.motifs || 'Les motifs de ce recours sont les suivants : [Ã  complÃ©ter]'}

En consÃ©quence, je vous prie de bien vouloir rÃ©examiner la situation de ${v.client} et rapporter la dÃ©cision contestÃ©e.

Dans l'attente de votre rÃ©ponse, je vous prie d'agrÃ©er, Madame, Monsieur le PrÃ©fet, l'assurance de ma haute considÃ©ration.

${v.avocat}
${v.cabinet || ''}`,
  },

  recours_contentieux: {
    title: 'Recours contentieux',
    generate: (v) => `TRIBUNAL ADMINISTRATIF DE ${(v.tribunal || 'PARIS').toUpperCase()}

REQUÃŠTE EN ANNULATION

POUR : ${v.client}, demeurant ${v.adresseClient || '[adresse]'}
ReprÃ©sentÃ©(e) par : ${v.avocat}

CONTRE : ${v.destinataire || 'Le PrÃ©fet de [dÃ©partement]'}

OBJET : Annulation de ${v.decision || 'la dÃ©cision'} du ${v.dateDecision || '[date]'}
RÃ©f. dossier : ${v.numeroDossier}

FAITS :
${v.faits || '[ExposÃ© des faits]'}

DISCUSSION :
${v.motifs || '[Moyens de droit]'}

PAR CES MOTIFS, il est demandÃ© au Tribunal de bien vouloir :
- Annuler la dÃ©cision attaquÃ©e ;
- Enjoindre Ã  l'administration de ${v.injonction || '[mesure demandÃ©e]'} ;
- Condamner l'Ã‰tat aux dÃ©pens.

${v.lieu}, le ${v.date}
${v.avocat}`,
  },

  convocation: {
    title: 'Convocation rendez-vous',
    generate: (v) => `${v.lieu}, le ${v.date}

${v.destinataire}

Objet : Convocation â€” Rendez-vous du ${v.dateRdv || '[date]'}
RÃ©f. : ${v.numeroDossier}

Madame, Monsieur,

Je vous prie de bien vouloir vous prÃ©senter Ã  mon cabinet le ${v.dateRdv || '[date]'} Ã  ${v.heureRdv || '[heure]'} afin de faire le point sur votre dossier.

${v.documentsApporter ? `Merci de vous munir des documents suivants :\n${v.documentsApporter}` : 'Merci de vous munir de votre piÃ¨ce d\'identitÃ© et de tout document utile.'}

En cas d'empÃªchement, merci de me prÃ©venir au moins 48 heures Ã  l'avance.

Cordialement,

${v.avocat}
${v.cabinet || ''}`,
  },

  attestation: {
    title: 'Attestation',
    generate: (v) => `ATTESTATION

Je soussignÃ©(e), ${v.avocat}, avocat au Barreau de ${v.barreau || '[ville]'}, atteste par la prÃ©sente que ${v.client} ${v.contenu || 'est suivi(e) par mon cabinet dans le cadre du dossier rÃ©fÃ©rencÃ© ci-dessous'}.

RÃ©fÃ©rence dossier : ${v.numeroDossier}
${v.complement || ''}

Cette attestation est dÃ©livrÃ©e pour servir et valoir ce que de droit.

Fait Ã  ${v.lieu}, le ${v.date}

${v.avocat}`,
  },
};

export async function POST(req: NextRequest) {
  const prisma = await getSecurePrisma();
  const session = await getServerSessionCompat();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const tenantId = user.tenantId;
  const { templateType, dossierId, variables } = await req.json();

  if (!templateType || !TEMPLATES[templateType as TemplateType]) {
    return NextResponse.json({ error: 'Template invalide', available: Object.keys(TEMPLATES) }, { status: 400 });
  }

  // Auto-remplir les variables depuis le dossier
  const vars: Record<string, string> = {
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    lieu: 'Paris',
    avocat: user.name || 'MaÃ®tre',
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
  const prisma = await getSecurePrisma();
  const templates = Object.entries(TEMPLATES).map(([key, val]) => ({
    id: key,
    title: val.title,
  }));
  return NextResponse.json({ templates });
}

