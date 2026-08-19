/**
 * Générateur de documents juridiques DOCX
 * 
 * Templates avancés pour mémoires, conclusions, recours
 * Utilise la lib 'docx' pour générer des fichiers Word professionnels.
 */

import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageBreak,
  TabStopPosition,
  TabStopType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from 'docx';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface DocxTemplateType {
  id: string;
  title: string;
  description: string;
  category: 'recours' | 'contentieux' | 'courrier' | 'attestation';
  requiredVars: string[];
  optionalVars: string[];
}

export interface MemoireRecoursVars {
  // Parties
  requerantNom: string;
  requerantAdresse: string;
  requerantMatricule?: string;
  defendeurNom: string;
  defendeurAdresse?: string;

  // Juridiction
  juridiction: string; // ex: "Conseil arbitral de la sécurité sociale"
  
  // Objet
  objet: string;
  dateDecision: string;
  dateNotification: string;

  // Recevabilité
  delaiLegal: string; // ex: "quarante (40) jours"
  baseLegale: string; // ex: "articles 433, 454, 455bis du Code de la sécurité sociale"
  dateDepot: string;

  // Faits (liste structurée)
  faits: { titre: string; contenu: string }[];

  // Analyse décision (points contestés)
  pointsContestes: { titre: string; citationDecision: string; observations: string[] }[];

  // Moyens juridiques
  moyens: { titre: string; contenu: string }[];

  // Pièces
  pieces: { numero: number; designation: string }[];

  // Demandes
  demandesPrincipales: string[];
  demandesSubsidiaires?: string[];

  // Metadata
  lieu: string;
  date: string;
  avocat?: string;
  cabinet?: string;
  numeroDossier?: string;
}

export interface ConclusionsVars {
  juridiction: string;
  chambre?: string;
  numeroRG?: string;
  demandeurNom: string;
  demandeurQualite: string;
  defendeurNom: string;
  defendeurQualite: string;
  objet: string;
  faits: string[];
  discussion: { titre: string; contenu: string }[];
  dispositif: string[];
  lieu: string;
  date: string;
  avocat: string;
  cabinet?: string;
  barreau?: string;
}

// ─── Templates disponibles ──────────────────────────────────────────────────────

export const DOCX_TEMPLATES: DocxTemplateType[] = [
  {
    id: 'memoire_recours',
    title: 'Mémoire en recours',
    description: 'Mémoire complet devant juridiction (Conseil arbitral, TA, etc.)',
    category: 'recours',
    requiredVars: ['requerantNom', 'defendeurNom', 'juridiction', 'objet', 'dateDecision'],
    optionalVars: ['requerantMatricule', 'avocat', 'cabinet', 'numeroDossier'],
  },
  {
    id: 'conclusions',
    title: 'Conclusions récapitulatives',
    description: 'Conclusions devant tribunal avec discussion et dispositif',
    category: 'contentieux',
    requiredVars: ['juridiction', 'demandeurNom', 'defendeurNom', 'objet'],
    optionalVars: ['chambre', 'numeroRG', 'barreau'],
  },
  {
    id: 'memoire_complementaire',
    title: 'Mémoire complémentaire',
    description: 'Mémoire en réplique ou complément d\'argumentation',
    category: 'recours',
    requiredVars: ['juridiction', 'requerantNom', 'defendeurNom'],
    optionalVars: ['numeroRG'],
  },
  {
    id: 'requete_introductive',
    title: 'Requête introductive d\'instance',
    description: 'Requête initiale devant tribunal administratif',
    category: 'contentieux',
    requiredVars: ['juridiction', 'demandeurNom', 'defendeurNom', 'objet'],
    optionalVars: ['sursis_execution'],
  },
  {
    id: 'note_delibere',
    title: 'Note en délibéré',
    description: 'Note post-audience pour le tribunal',
    category: 'contentieux',
    requiredVars: ['juridiction', 'demandeurNom', 'objet'],
    optionalVars: [],
  },
];

// ─── Helpers de mise en forme ────────────────────────────────────────────────────

function titre(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1): Paragraph {
  return new Paragraph({
    heading: level,
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: level === HeadingLevel.HEADING_1 ? 28 : 24 })],
  });
}

function sousTitre(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 24 })],
  });
}

function sousSousTitre(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, italics: true, size: 22 })],
  });
}

function paragraphe(text: string, options?: { bold?: boolean; italic?: boolean; indent?: number }): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    indent: options?.indent ? { left: options.indent } : undefined,
    children: [
      new TextRun({
        text,
        bold: options?.bold,
        italics: options?.italic,
        size: 22,
        font: 'Times New Roman',
      }),
    ],
  });
}

function citation(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    indent: { left: 720 }, // 0.5 inch
    children: [
      new TextRun({
        text: `« ${text} »`,
        italics: true,
        size: 22,
        font: 'Times New Roman',
      }),
    ],
  });
}

function tiret(text: string, indent = 720): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: indent },
    children: [
      new TextRun({ text: '–  ', size: 22, font: 'Times New Roman' }),
      new TextRun({ text, size: 22, font: 'Times New Roman' }),
    ],
  });
}

function separateur(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    children: [new TextRun({ text: '— — —', size: 22 })],
  });
}

function ligneVide(): Paragraph {
  return new Paragraph({ spacing: { after: 120 }, children: [] });
}

// ─── Générateur : Mémoire en recours ────────────────────────────────────────────

export function generateMemoireRecours(vars: MemoireRecoursVars): Document {
  const paragraphs: Paragraph[] = [];

  // En-tête : Juridiction
  paragraphs.push(titre(vars.juridiction.toUpperCase()));
  paragraphs.push(titre('MÉMOIRE EN RECOURS', HeadingLevel.HEADING_1));
  paragraphs.push(separateur());

  // Requérant
  paragraphs.push(paragraphe('REQUÉRANT :', { bold: true }));
  paragraphs.push(paragraphe(`Monsieur ${vars.requerantNom}`));
  if (vars.requerantMatricule) {
    paragraphs.push(paragraphe(`Matricule : ${vars.requerantMatricule}`));
  }
  paragraphs.push(paragraphe(vars.requerantAdresse));
  paragraphs.push(ligneVide());

  // Contre
  paragraphs.push(paragraphe('CONTRE :', { bold: true }));
  paragraphs.push(paragraphe(vars.defendeurNom));
  if (vars.defendeurAdresse) {
    paragraphs.push(paragraphe(vars.defendeurAdresse));
  }
  paragraphs.push(separateur());

  // Objet
  paragraphs.push(paragraphe('OBJET :', { bold: true }));
  paragraphs.push(paragraphe(vars.objet));
  paragraphs.push(separateur());

  // PARTIE 1 – RECEVABILITÉ
  paragraphs.push(sousTitre('PARTIE 1 – RECEVABILITÉ DU RECOURS'));

  paragraphs.push(sousSousTitre('1.1. Sur le délai'));
  paragraphs.push(paragraphe(
    `La décision attaquée a été notifiée au requérant le ${vars.dateNotification}.`
  ));
  paragraphs.push(paragraphe(
    `Conformément aux dispositions ${vars.baseLegale}, le recours doit être formé dans un délai de ${vars.delaiLegal} à compter de la notification de la décision attaquée.`
  ));
  paragraphs.push(paragraphe(
    `Le présent mémoire est déposé le ${vars.dateDepot}, soit dans le délai légal.`
  ));
  paragraphs.push(paragraphe('Le recours est donc recevable quant au délai.'));

  paragraphs.push(sousSousTitre('1.2. Sur la compétence'));
  paragraphs.push(paragraphe(
    `Le ${vars.juridiction} est compétent pour connaître du présent litige. Le présent recours relève pleinement de cette compétence.`
  ));

  paragraphs.push(sousSousTitre('1.3. Sur la forme'));
  paragraphs.push(paragraphe(
    'Le recours est formé par simple requête sur papier libre, conformément aux prescriptions légales.'
  ));

  // PARTIE 2 – FAITS
  paragraphs.push(sousTitre('PARTIE 2 – EXPOSÉ DES FAITS'));
  vars.faits.forEach((fait, idx) => {
    paragraphs.push(sousSousTitre(`2.${idx + 1}. ${fait.titre}`));
    paragraphs.push(paragraphe(fait.contenu));
  });

  // PARTIE 3 – ANALYSE DÉCISION
  paragraphs.push(sousTitre('PARTIE 3 – ANALYSE DE LA DÉCISION'));
  vars.pointsContestes.forEach((point, idx) => {
    paragraphs.push(sousSousTitre(`3.${idx + 1}. ${point.titre}`));
    if (point.citationDecision) {
      paragraphs.push(paragraphe('La décision affirme :', { bold: true }));
      paragraphs.push(citation(point.citationDecision));
      paragraphs.push(paragraphe('Cette affirmation appelle les observations suivantes :'));
    }
    point.observations.forEach((obs, obsIdx) => {
      paragraphs.push(tiret(`${String.fromCharCode(97 + obsIdx)}) ${obs}`));
    });
  });

  // PARTIE 4 – MOYENS JURIDIQUES
  paragraphs.push(sousTitre('PARTIE 4 – MOYENS JURIDIQUES'));
  vars.moyens.forEach((moyen, idx) => {
    paragraphs.push(sousSousTitre(`4.${idx + 1}. ${moyen.titre}`));
    paragraphs.push(paragraphe(moyen.contenu));
  });

  // PARTIE 5 – PIÈCES
  paragraphs.push(sousTitre('PARTIE 5 – PIÈCES PRODUITES'));
  paragraphs.push(paragraphe('Le requérant verse aux débats les pièces suivantes :'));
  paragraphs.push(ligneVide());

  const tableRows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [paragraphe('N°', { bold: true })],
        }),
        new TableCell({
          width: { size: 85, type: WidthType.PERCENTAGE },
          children: [paragraphe('Désignation', { bold: true })],
        }),
      ],
    }),
    ...vars.pieces.map(
      (p) =>
        new TableRow({
          children: [
            new TableCell({
              children: [paragraphe(`Pièce ${p.numero}`)],
            }),
            new TableCell({
              children: [paragraphe(p.designation)],
            }),
          ],
        })
    ),
  ];

  paragraphs.push(
    new Paragraph({ children: [] }) // placeholder before table
  );

  // PARTIE 6 – DEMANDES
  paragraphs.push(sousTitre('PARTIE 6 – DEMANDES'));

  paragraphs.push(paragraphe('À titre principal', { bold: true }));
  paragraphs.push(paragraphe(`Plaise au ${vars.juridiction} :`));
  vars.demandesPrincipales.forEach((d, idx) => {
    paragraphs.push(paragraphe(`${idx + 1}.  ${d}`, { indent: 360 }));
  });

  if (vars.demandesSubsidiaires?.length) {
    paragraphs.push(ligneVide());
    paragraphs.push(paragraphe('À titre subsidiaire', { bold: true }));
    vars.demandesSubsidiaires.forEach((d, idx) => {
      paragraphs.push(paragraphe(`${idx + 1}.  ${d}`, { indent: 360 }));
    });
  }

  // Signature
  paragraphs.push(ligneVide());
  paragraphs.push(ligneVide());
  paragraphs.push(paragraphe(`Fait à ${vars.lieu}, le ${vars.date}`));
  paragraphs.push(ligneVide());
  paragraphs.push(paragraphe('Signature :'));
  paragraphs.push(paragraphe('_________________________________________'));
  paragraphs.push(paragraphe(vars.requerantNom));

  // Construction du document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 22, // 11pt
          },
          paragraph: {
            spacing: { line: 276 }, // 1.15 interligne
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 1 inch
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: vars.numeroDossier ? `Réf. ${vars.numeroDossier}` : '',
                    size: 18,
                    color: '666666',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Page ', size: 18 }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                  new TextRun({ text: ' sur ', size: 18 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...paragraphs.slice(0, paragraphs.indexOf(paragraphs.find(p => p === paragraphs[paragraphs.length - 1])!) + 1),
        ],
      },
    ],
  });

  // On insère la table des pièces manuellement
  // Note: la table sera dans le flow principal
  return new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 22 },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: vars.numeroDossier ? `Réf. ${vars.numeroDossier}` : '', size: 18, color: '666666' })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Page ', size: 18 }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
              new TextRun({ text: ' sur ', size: 18 }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 }),
            ],
          })],
        }),
      },
      children: [
        ...paragraphs,
        new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
      ],
    }],
  });
}

// ─── Générateur : Requête introductive ───────────────────────────────────────────

export interface RequeteIntroductiveVars {
  juridiction: string;
  demandeurNom: string;
  demandeurAdresse: string;
  demandeurAvocat?: string;
  defendeurNom: string;
  defendeurAdresse?: string;
  objet: string;
  dateDecision: string;
  dateNotification?: string;
  faits: string[];
  moyens: { titre: string; contenu: string }[];
  demandes: string[];
  sursisExecution?: boolean;
  motifsSursis?: string;
  lieu: string;
  date: string;
  avocat: string;
  cabinet?: string;
  numeroDossier?: string;
}

export function generateRequeteIntroductive(vars: RequeteIntroductiveVars): Document {
  const children: Paragraph[] = [];

  children.push(titre(`TRIBUNAL ADMINISTRATIF DE ${vars.juridiction.toUpperCase()}`));
  children.push(ligneVide());
  children.push(titre('REQUÊTE EN ANNULATION', HeadingLevel.HEADING_1));
  children.push(separateur());

  // Parties
  children.push(paragraphe('POUR :', { bold: true }));
  children.push(paragraphe(vars.demandeurNom));
  children.push(paragraphe(vars.demandeurAdresse));
  if (vars.demandeurAvocat) {
    children.push(paragraphe(`Représenté(e) par : ${vars.demandeurAvocat}`));
  }
  children.push(ligneVide());

  children.push(paragraphe('CONTRE :', { bold: true }));
  children.push(paragraphe(vars.defendeurNom));
  if (vars.defendeurAdresse) children.push(paragraphe(vars.defendeurAdresse));
  children.push(separateur());

  children.push(paragraphe(`OBJET : Annulation de la décision du ${vars.dateDecision}`, { bold: true }));
  if (vars.numeroDossier) children.push(paragraphe(`Réf. dossier : ${vars.numeroDossier}`));
  children.push(separateur());

  // Faits
  children.push(sousTitre('I. FAITS'));
  vars.faits.forEach((fait) => children.push(paragraphe(fait)));

  // Moyens
  children.push(sousTitre('II. DISCUSSION'));
  vars.moyens.forEach((m, idx) => {
    children.push(sousSousTitre(`${idx + 1}. ${m.titre}`));
    children.push(paragraphe(m.contenu));
  });

  // Sursis à exécution
  if (vars.sursisExecution) {
    children.push(sousTitre('III. SUR LE SURSIS À EXÉCUTION'));
    children.push(paragraphe(vars.motifsSursis || 'L\'exécution de la décision attaquée entraînerait des conséquences difficilement réparables. Les moyens invoqués sont sérieux. Il est demandé au Tribunal d\'ordonner le sursis à exécution.'));
  }

  // Dispositif
  children.push(sousTitre(vars.sursisExecution ? 'IV. PAR CES MOTIFS' : 'III. PAR CES MOTIFS'));
  children.push(paragraphe('Plaise au Tribunal de :'));
  vars.demandes.forEach((d, idx) => {
    children.push(paragraphe(`${idx + 1}.  ${d}`, { indent: 360 }));
  });

  // Signature
  children.push(ligneVide());
  children.push(ligneVide());
  children.push(paragraphe(`Fait à ${vars.lieu}, le ${vars.date}`));
  children.push(paragraphe(vars.avocat));
  if (vars.cabinet) children.push(paragraphe(vars.cabinet));

  return new Document({
    styles: { default: { document: { run: { font: 'Times New Roman', size: 22 }, paragraph: { spacing: { line: 276 } } } } },
    sections: [{
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children,
    }],
  });
}

// ─── Générateur : Note en délibéré ──────────────────────────────────────────────

export interface NoteDelibereVars {
  juridiction: string;
  chambre?: string;
  numeroRG?: string;
  demandeurNom: string;
  defendeurNom: string;
  dateAudience: string;
  points: { titre: string; contenu: string }[];
  lieu: string;
  date: string;
  avocat: string;
  cabinet?: string;
}

export function generateNoteDelibere(vars: NoteDelibereVars): Document {
  const children: Paragraph[] = [];

  children.push(titre(vars.juridiction.toUpperCase()));
  if (vars.chambre) children.push(paragraphe(vars.chambre, { bold: true }));
  children.push(ligneVide());
  children.push(titre('NOTE EN DÉLIBÉRÉ', HeadingLevel.HEADING_1));
  if (vars.numeroRG) children.push(paragraphe(`R.G. n° ${vars.numeroRG}`, { bold: true }));
  children.push(separateur());

  children.push(paragraphe(`${vars.demandeurNom} c/ ${vars.defendeurNom}`, { bold: true }));
  children.push(paragraphe(`Audience du ${vars.dateAudience}`));
  children.push(separateur());

  children.push(paragraphe('Monsieur/Madame le Président, Mesdames et Messieurs les Juges,'));
  children.push(ligneVide());
  children.push(paragraphe('À la suite de l\'audience tenue ce jour, le requérant souhaite porter à la connaissance du Tribunal les observations complémentaires suivantes :'));
  children.push(ligneVide());

  vars.points.forEach((point, idx) => {
    children.push(sousSousTitre(`${idx + 1}. ${point.titre}`));
    children.push(paragraphe(point.contenu));
  });

  children.push(ligneVide());
  children.push(paragraphe('Le requérant maintient l\'intégralité de ses conclusions.'));
  children.push(ligneVide());
  children.push(ligneVide());
  children.push(paragraphe(`Fait à ${vars.lieu}, le ${vars.date}`));
  children.push(paragraphe(vars.avocat));
  if (vars.cabinet) children.push(paragraphe(vars.cabinet));

  return new Document({
    styles: { default: { document: { run: { font: 'Times New Roman', size: 22 }, paragraph: { spacing: { line: 276 } } } } },
    sections: [{
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children,
    }],
  });
}

// ─── Générateur : Mémoire complémentaire ─────────────────────────────────────────

export interface MemoireComplementaireVars {
  juridiction: string;
  numeroRG?: string;
  requerantNom: string;
  defendeurNom: string;
  objet?: string;
  introduction: string;
  points: { titre: string; contenu: string }[];
  conclusion: string;
  lieu: string;
  date: string;
  avocat: string;
  cabinet?: string;
}

export function generateMemoireComplementaire(vars: MemoireComplementaireVars): Document {
  const children: Paragraph[] = [];

  children.push(titre(vars.juridiction.toUpperCase()));
  children.push(ligneVide());
  children.push(titre('MÉMOIRE COMPLÉMENTAIRE', HeadingLevel.HEADING_1));
  if (vars.numeroRG) children.push(paragraphe(`R.G. n° ${vars.numeroRG}`, { bold: true }));
  children.push(separateur());

  children.push(paragraphe('POUR :', { bold: true }));
  children.push(paragraphe(vars.requerantNom));
  children.push(ligneVide());
  children.push(paragraphe('CONTRE :', { bold: true }));
  children.push(paragraphe(vars.defendeurNom));
  children.push(separateur());

  if (vars.objet) {
    children.push(paragraphe(`OBJET : ${vars.objet}`, { bold: true }));
    children.push(separateur());
  }

  children.push(paragraphe(vars.introduction));
  children.push(ligneVide());

  vars.points.forEach((point, idx) => {
    children.push(sousTitre(`${idx + 1}. ${point.titre}`));
    children.push(paragraphe(point.contenu));
  });

  children.push(ligneVide());
  children.push(paragraphe(vars.conclusion));
  children.push(ligneVide());
  children.push(paragraphe('Le requérant maintient l\'intégralité de ses demandes antérieures.'));
  children.push(ligneVide());
  children.push(ligneVide());
  children.push(paragraphe(`Fait à ${vars.lieu}, le ${vars.date}`));
  children.push(paragraphe(vars.avocat));
  if (vars.cabinet) children.push(paragraphe(vars.cabinet));

  return new Document({
    styles: { default: { document: { run: { font: 'Times New Roman', size: 22 }, paragraph: { spacing: { line: 276 } } } } },
    sections: [{
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children,
    }],
  });
}

// ─── Générateur : Conclusions ────────────────────────────────────────────────────

export function generateConclusions(vars: ConclusionsVars): Document {
  const children: Paragraph[] = [];

  children.push(titre(vars.juridiction.toUpperCase()));
  if (vars.chambre) {
    children.push(paragraphe(vars.chambre, { bold: true }));
  }
  children.push(ligneVide());
  children.push(titre('CONCLUSIONS RÉCAPITULATIVES', HeadingLevel.HEADING_1));
  if (vars.numeroRG) {
    children.push(paragraphe(`R.G. n° ${vars.numeroRG}`, { bold: true }));
  }
  children.push(separateur());

  // Parties
  children.push(paragraphe('POUR :', { bold: true }));
  children.push(paragraphe(`${vars.demandeurNom}, ${vars.demandeurQualite}`));
  children.push(ligneVide());
  children.push(paragraphe('CONTRE :', { bold: true }));
  children.push(paragraphe(`${vars.defendeurNom}, ${vars.defendeurQualite}`));
  children.push(separateur());

  // Objet
  children.push(paragraphe(`OBJET : ${vars.objet}`, { bold: true }));
  children.push(separateur());

  // Faits
  children.push(sousTitre('I. EXPOSÉ DES FAITS'));
  vars.faits.forEach((fait) => {
    children.push(paragraphe(fait));
  });

  // Discussion
  children.push(sousTitre('II. DISCUSSION'));
  vars.discussion.forEach((point, idx) => {
    children.push(sousSousTitre(`${idx + 1}. ${point.titre}`));
    children.push(paragraphe(point.contenu));
  });

  // Dispositif
  children.push(sousTitre('III. PAR CES MOTIFS'));
  children.push(paragraphe('Plaise au Tribunal de :'));
  vars.dispositif.forEach((d, idx) => {
    children.push(paragraphe(`${idx + 1}.  ${d}`, { indent: 360 }));
  });

  // Signature
  children.push(ligneVide());
  children.push(ligneVide());
  children.push(paragraphe(`Fait à ${vars.lieu}, le ${vars.date}`));
  if (vars.cabinet) children.push(paragraphe(vars.cabinet));
  children.push(paragraphe(vars.avocat));
  if (vars.barreau) children.push(paragraphe(`Avocat au Barreau de ${vars.barreau}`));

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 22 },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      children,
    }],
  });
}
