/**
 * Base de connaissances CESEDA — Droit des étrangers
 *
 * Source de vérité pour les délais légaux, articles de loi,
 * documents requis et procédures. Utilisée par les prompts IA
 * pour contextualiser les réponses.
 */

// ─── DÉLAIS LÉGAUX ───────────────────────────────────────────

export interface LegalDeadline {
  procedure: string;
  delai: string;
  jours: number;
  article: string;
  consequence: string;
  recours?: string;
}

export const DELAIS_CESEDA: LegalDeadline[] = [
  // OQTF
  {
    procedure: 'OQTF avec délai de départ volontaire',
    delai: '30 jours',
    jours: 30,
    article: 'Art. L611-1 CESEDA',
    consequence: 'Exécution forcée + interdiction de retour',
    recours: 'Recours contentieux devant le TA dans les 30 jours (Art. L614-5)',
  },
  {
    procedure: 'OQTF sans délai (48h)',
    delai: '48 heures',
    jours: 2,
    article: 'Art. L612-2 CESEDA',
    consequence: 'Placement en rétention / assignation à résidence',
    recours: 'Recours en 48h devant le juge administratif (Art. L614-6)',
  },
  {
    procedure: 'OQTF prise en rétention',
    delai: '48 heures',
    jours: 2,
    article: 'Art. L614-6 CESEDA',
    consequence: 'Éloignement forcé immédiat',
    recours: 'Référé-liberté possible (Art. L521-2 CJA)',
  },
  // ASILE
  {
    procedure: 'Demande d\'asile (procédure normale)',
    delai: '21 jours après passage guichet',
    jours: 21,
    article: 'Art. L531-27 CESEDA',
    consequence: 'Perte conditions matérielles d\'accueil',
  },
  {
    procedure: 'Recours CNDA (procédure normale)',
    delai: '1 mois après notification OFPRA',
    jours: 30,
    article: 'Art. L532-1 CESEDA',
    consequence: 'Rejet définitif demande d\'asile',
  },
  {
    procedure: 'Recours CNDA (procédure accélérée)',
    delai: '15 jours',
    jours: 15,
    article: 'Art. L532-4 CESEDA',
    consequence: 'Rejet définitif + perte droit au maintien',
  },
  // TITRE DE SÉJOUR
  {
    procedure: 'Renouvellement titre de séjour',
    delai: '2 mois avant expiration',
    jours: 60,
    article: 'Art. R431-5 CESEDA',
    consequence: 'Situation irrégulière si expiration sans demande',
  },
  {
    procedure: 'Recours refus titre de séjour',
    delai: '2 mois après notification',
    jours: 60,
    article: 'Art. R421-1 CJA',
    consequence: 'Forclusion du recours contentieux',
  },
  {
    procedure: 'Recours gracieux/hiérarchique',
    delai: '2 mois (interrompt le délai contentieux)',
    jours: 60,
    article: 'Art. L410-1 CRPA',
    consequence: 'Nouveau délai de 2 mois après réponse/silence',
  },
  // NATURALISATION
  {
    procedure: 'Recours refus naturalisation',
    delai: '2 mois après notification',
    jours: 60,
    article: 'Art. 45 Décret 93-1362',
    consequence: 'Forclusion définitive',
  },
  {
    procedure: 'Ajournement naturalisation (nouveau délai)',
    delai: '2 ans (sauf exception)',
    jours: 730,
    article: 'Art. 21-4-1 Code civil',
    consequence: 'Impossibilité de redéposer avant le terme',
  },
  // REGROUPEMENT FAMILIAL
  {
    procedure: 'Réponse préfecture regroupement familial',
    delai: '6 mois (silence vaut rejet)',
    jours: 180,
    article: 'Art. R434-20 CESEDA',
    consequence: 'Rejet implicite contestable',
  },
  // RÉTENTION
  {
    procedure: 'Rétention administrative (1ère prolongation)',
    delai: '48 heures',
    jours: 2,
    article: 'Art. L742-1 CESEDA',
    consequence: 'Libération si pas de saisine JLD',
  },
  {
    procedure: 'Rétention (durée maximale)',
    delai: '90 jours',
    jours: 90,
    article: 'Art. L742-4 CESEDA',
    consequence: 'Libération obligatoire',
  },
];

// ─── DOCUMENTS REQUIS PAR PROCÉDURE ─────────────────────────

export interface RequiredDocuments {
  procedure: string;
  obligatoires: string[];
  recommandes: string[];
  conseil: string;
}

export const DOCUMENTS_PAR_PROCEDURE: Record<string, RequiredDocuments> = {
  OQTF: {
    procedure: 'Recours OQTF',
    obligatoires: [
      'Copie décision OQTF notifiée',
      'Preuve de notification (AR ou PV)',
      'Pièce d\'identité (passeport)',
      'Justificatif de domicile',
      'Requête motivée au TA',
    ],
    recommandes: [
      'Attestations d\'hébergement',
      'Justificatifs d\'attaches en France (famille, travail)',
      'Bulletins scolaires enfants',
      'Certificats médicaux si problème de santé',
      'Preuves d\'intégration (cours de français, emploi)',
      'Avis d\'imposition',
    ],
    conseil: 'Vérifier systématiquement les vices de procédure : notification irrégulière, motivation insuffisante, erreur manifeste d\'appréciation.',
  },
  ASILE: {
    procedure: 'Demande d\'asile / Recours CNDA',
    obligatoires: [
      'Récit de persécution détaillé et chronologique',
      'Formulaire OFPRA complété',
      'Pièce d\'identité (si disponible)',
      'Attestation de demande d\'asile (ADA)',
    ],
    recommandes: [
      'Preuves des persécutions (photos, articles, témoignages)',
      'Certificats médicaux (traces de torture, trauma)',
      'Rapports pays d\'origine (OFPRA, HCR, Amnesty)',
      'Attestations de membres de la communauté',
      'Documents d\'état civil traduits',
    ],
    conseil: 'Le récit doit être précis, daté, cohérent. Les incohérences mineures ne suffisent pas à rejeter. Invoquer les rapports géopolitiques récents.',
  },
  TITRE_SEJOUR: {
    procedure: 'Demande / Renouvellement titre de séjour',
    obligatoires: [
      'Passeport en cours de validité',
      'Justificatif de domicile < 3 mois',
      '3 photos d\'identité conformes',
      'Justificatif d\'état civil (acte de naissance)',
      'Timbre fiscal (montant selon titre)',
    ],
    recommandes: [
      'Contrat de travail / promesse d\'embauche',
      'Bulletins de salaire (3 à 6 derniers)',
      'Avis d\'imposition',
      'Attestation employeur',
      'Preuves d\'intégration républicaine',
      'Certificat de langue française (B1 minimum)',
    ],
    conseil: 'Anticiper le renouvellement 2 mois avant expiration. Demander un récépissé dès le dépôt. En cas de refus, recours gracieux puis contentieux.',
  },
  NATURALISATION: {
    procedure: 'Demande de naturalisation',
    obligatoires: [
      'Formulaire CERFA 12753*02',
      'Acte de naissance + traduction assermentée',
      'Justificatif de domicile',
      'Passeport',
      'Justificatifs de résidence continue (5 ans)',
      'Attestation de niveau B1 en français',
      'Casier judiciaire du pays d\'origine',
      'Timbres fiscaux (55€)',
    ],
    recommandes: [
      'Avis d\'imposition (3 dernières années)',
      'Contrats de travail / bulletins',
      'Diplômes français',
      'Attestation d\'employeur',
      'Preuve d\'investissement associatif ou civique',
    ],
    conseil: 'La résidence habituelle et continue est le critère clé. Attention aux absences prolongées. L\'entretien d\'assimilation porte sur les valeurs républicaines et la connaissance de la France.',
  },
  REGROUPEMENT_FAMILIAL: {
    procedure: 'Regroupement familial',
    obligatoires: [
      'Titre de séjour en cours de validité (> 1 an)',
      'Justificatifs de revenus (SMIC minimum)',
      'Justificatif de logement adapté',
      'Actes de mariage / naissance traduits',
      'Formulaire CERFA 11436*05',
    ],
    recommandes: [
      'Attestation employeur avec ancienneté',
      'Bail ou titre de propriété',
      'Avis d\'imposition (2 dernières années)',
      'Certificat de conformité du logement (OFII)',
    ],
    conseil: 'Le logement doit répondre aux normes de surface (selon zone géographique et nombre de personnes). L\'OFII effectue une visite.',
  },
};

// ─── ARTICLES CLÉS PAR DOMAINE ──────────────────────────────

export const ARTICLES_CLES: Record<string, { article: string; objet: string }[]> = {
  OQTF: [
    { article: 'Art. L611-1 CESEDA', objet: 'Cas de délivrance OQTF' },
    { article: 'Art. L612-1 CESEDA', objet: 'Délai de départ volontaire (30 jours)' },
    { article: 'Art. L612-2 CESEDA', objet: 'OQTF sans délai' },
    { article: 'Art. L612-3 CESEDA', objet: 'IRTF (interdiction de retour)' },
    { article: 'Art. L614-5 CESEDA', objet: 'Recours TA (30 jours)' },
    { article: 'Art. L614-6 CESEDA', objet: 'Recours 48h (sans délai)' },
    { article: 'Art. 8 CEDH', objet: 'Droit au respect de la vie privée et familiale' },
    { article: 'Art. 3 CEDH', objet: 'Interdiction traitements inhumains (non-refoulement)' },
  ],
  ASILE: [
    { article: 'Art. L511-1 CESEDA', objet: 'Droit d\'asile constitutionnel' },
    { article: 'Art. L512-1 CESEDA', objet: 'Statut de réfugié' },
    { article: 'Art. L512-2 CESEDA', objet: 'Protection subsidiaire' },
    { article: 'Art. L531-27 CESEDA', objet: 'Délai dépôt demande (21 jours)' },
    { article: 'Art. L532-1 CESEDA', objet: 'Recours CNDA' },
    { article: 'Convention de Genève 1951', objet: 'Définition du réfugié' },
  ],
  TITRE_SEJOUR: [
    { article: 'Art. L421-1 CESEDA', objet: 'Carte séjour salarié' },
    { article: 'Art. L423-1 CESEDA', objet: 'Carte séjour vie privée et familiale' },
    { article: 'Art. L423-7 CESEDA', objet: 'Titre parent enfant français' },
    { article: 'Art. L423-23 CESEDA', objet: 'Admission exceptionnelle au séjour' },
    { article: 'Art. L425-9 CESEDA', objet: 'Titre pour raisons de santé (étranger malade)' },
    { article: 'Art. L432-1 CESEDA', objet: 'Carte de résident (10 ans)' },
  ],
  NATURALISATION: [
    { article: 'Art. 21-2 Code civil', objet: 'Naturalisation par décret' },
    { article: 'Art. 21-7 Code civil', objet: 'Acquisition par naissance en France' },
    { article: 'Art. 21-12 Code civil', objet: 'Déclaration par mariage' },
    { article: 'Art. 21-15 Code civil', objet: 'Conditions de résidence (5 ans)' },
    { article: 'Art. 21-24 Code civil', objet: 'Assimilation et langue' },
  ],
  RETENTION: [
    { article: 'Art. L741-1 CESEDA', objet: 'Placement en rétention' },
    { article: 'Art. L742-1 CESEDA', objet: 'Prolongation par JLD (48h)' },
    { article: 'Art. L742-4 CESEDA', objet: 'Durée maximale (90 jours)' },
    { article: 'Art. L743-1 CESEDA', objet: 'Droits du retenu' },
    { article: 'Art. 5 CEDH', objet: 'Droit à la liberté et à la sûreté' },
  ],
};

// ─── VOIES DE RECOURS ────────────────────────────────────────

export interface VoieDeRecours {
  type: string;
  juridiction: string;
  delai: string;
  effet: string;
  conseil: string;
}

export const VOIES_DE_RECOURS: Record<string, VoieDeRecours[]> = {
  OQTF: [
    {
      type: 'Recours contentieux',
      juridiction: 'Tribunal Administratif',
      delai: '30 jours (avec DDV) / 48h (sans DDV)',
      effet: 'Suspensif (maintien sur le territoire)',
      conseil: 'Toujours demander le sursis à exécution en parallèle si OQTF sans délai.',
    },
    {
      type: 'Référé-suspension',
      juridiction: 'Tribunal Administratif (juge des référés)',
      delai: 'Tant que le recours au fond est pendant',
      effet: 'Suspensif si urgence + doute sérieux',
      conseil: 'Utile si l\'OQTF est exécutable immédiatement.',
    },
    {
      type: 'Référé-liberté',
      juridiction: 'Tribunal Administratif',
      delai: '48h de délai de jugement',
      effet: 'Suspensif si atteinte grave à une liberté fondamentale',
      conseil: 'Réservé aux cas d\'extrême urgence (rétention, vol programmé).',
    },
  ],
  ASILE: [
    {
      type: 'Recours CNDA',
      juridiction: 'Cour Nationale du Droit d\'Asile',
      delai: '1 mois (normal) / 15 jours (accéléré)',
      effet: 'Suspensif (maintien conditions d\'accueil)',
      conseil: 'Préparer un mémoire complémentaire avec preuves nouvelles. L\'audience est orale.',
    },
    {
      type: 'Pourvoi en cassation',
      juridiction: 'Conseil d\'État',
      delai: '2 mois après décision CNDA',
      effet: 'Non suspensif',
      conseil: 'Limité aux erreurs de droit. Très rare succès.',
    },
  ],
  TITRE_SEJOUR: [
    {
      type: 'Recours gracieux',
      juridiction: 'Préfet (même autorité)',
      delai: '2 mois après notification',
      effet: 'Interrompt le délai contentieux',
      conseil: 'Apporter des éléments nouveaux. Le silence de 2 mois vaut rejet.',
    },
    {
      type: 'Recours hiérarchique',
      juridiction: 'Ministre de l\'Intérieur',
      delai: '2 mois après notification',
      effet: 'Interrompt le délai contentieux',
      conseil: 'Rarement efficace seul, mais préserve les droits.',
    },
    {
      type: 'Recours contentieux',
      juridiction: 'Tribunal Administratif',
      delai: '2 mois après notification (ou rejet recours gracieux)',
      effet: 'Non suspensif (sauf référé)',
      conseil: 'Invoquer Art. 8 CEDH (vie privée) et erreur manifeste d\'appréciation.',
    },
  ],
  NATURALISATION: [
    {
      type: 'Recours gracieux',
      juridiction: 'Ministre chargé des naturalisations',
      delai: '2 mois après notification',
      effet: 'Interrompt le délai contentieux',
      conseil: 'Apporter la preuve que les motifs d\'ajournement sont levés.',
    },
    {
      type: 'Recours contentieux',
      juridiction: 'Tribunal Administratif de Nantes',
      delai: '2 mois',
      effet: 'Non suspensif',
      conseil: 'Le juge contrôle l\'erreur manifeste. Motivation insuffisante = annulation.',
    },
  ],
};

// ─── JURISPRUDENCE DE RÉFÉRENCE ──────────────────────────────

export const JURISPRUDENCE_CLE = [
  {
    reference: 'CE, 19 avril 1991, Belgacem',
    domaine: 'OQTF',
    principe: 'Contrôle de proportionnalité entre mesure d\'éloignement et droit à la vie privée et familiale (Art. 8 CEDH)',
  },
  {
    reference: 'CE, 8 décembre 1978, GISTI',
    domaine: 'GENERAL',
    principe: 'Droit des étrangers à mener une vie familiale normale',
  },
  {
    reference: 'CEDH, 13 février 2001, Ezzoudhi c/ France',
    domaine: 'OQTF',
    principe: 'Éloignement disproportionné si attaches familiales fortes en France',
  },
  {
    reference: 'CE, 7 avril 2010, n°316625',
    domaine: 'TITRE_SEJOUR',
    principe: 'L\'administration doit examiner le droit au séjour avant de prononcer l\'éloignement',
  },
  {
    reference: 'CE Ass., 13 décembre 2016, n°391898',
    domaine: 'ASILE',
    principe: 'Évaluation du risque de persécution : prise en compte de la situation générale du pays',
  },
  {
    reference: 'CC, 13 août 1993, Décision 93-325 DC',
    domaine: 'GENERAL',
    principe: 'Valeur constitutionnelle du droit d\'asile',
  },
  {
    reference: 'CE, 4 février 2013, n°356529',
    domaine: 'TITRE_SEJOUR',
    principe: 'Étranger malade : appréciation de l\'accès effectif aux soins dans le pays d\'origine',
  },
  {
    reference: 'CE, 25 novembre 2009, n°316961',
    domaine: 'NATURALISATION',
    principe: 'Le défaut d\'assimilation doit être motivé concrètement',
  },
];

// ─── HELPER : CONTEXTE POUR PROMPTS IA ──────────────────────

/**
 * Génère un contexte juridique structuré pour enrichir les prompts IA
 * selon le type de dossier détecté.
 */
export function getKnowledgeContext(caseType: string): string {
  const type = caseType.toUpperCase().replace(/[- ]/g, '_');
  const delais = DELAIS_CESEDA.filter(d =>
    d.procedure.toUpperCase().includes(type) ||
    (type === 'OQTF' && d.procedure.includes('OQTF')) ||
    (type === 'ASILE' && (d.procedure.includes('asile') || d.procedure.includes('CNDA')))
  );
  const docs = DOCUMENTS_PAR_PROCEDURE[type];
  const articles = ARTICLES_CLES[type] || [];
  const recours = VOIES_DE_RECOURS[type] || [];

  let context = `\n--- CONNAISSANCES JURIDIQUES (${type}) ---\n`;

  if (delais.length > 0) {
    context += `\nDÉLAIS LÉGAUX:\n`;
    delais.forEach(d => {
      context += `• ${d.procedure}: ${d.delai} (${d.article}) → ${d.consequence}\n`;
    });
  }

  if (articles.length > 0) {
    context += `\nARTICLES APPLICABLES:\n`;
    articles.forEach(a => {
      context += `• ${a.article}: ${a.objet}\n`;
    });
  }

  if (recours.length > 0) {
    context += `\nVOIES DE RECOURS:\n`;
    recours.forEach(r => {
      context += `• ${r.type} → ${r.juridiction} (${r.delai}) [${r.effet}]\n`;
    });
  }

  if (docs) {
    context += `\nDOCUMENTS OBLIGATOIRES:\n`;
    docs.obligatoires.forEach(d => { context += `• ${d}\n`; });
    context += `CONSEIL: ${docs.conseil}\n`;
  }

  context += `--- FIN CONNAISSANCES ---\n`;
  return context;
}

/**
 * Retourne le délai critique le plus urgent pour un type de dossier
 */
export function getCriticalDeadline(caseType: string): LegalDeadline | null {
  const type = caseType.toUpperCase();
  const matching = DELAIS_CESEDA.filter(d =>
    d.procedure.toUpperCase().includes(type)
  );
  if (matching.length === 0) return null;
  return matching.reduce((min, d) => d.jours < min.jours ? d : min);
}
