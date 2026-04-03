/**
 * Mapping type de dossier → articles CESEDA pertinents
 *
 * Permet d'afficher automatiquement les textes applicables
 * selon le type de dossier et le fondement juridique selectionne.
 */

export interface ArticleReference {
  code: string;
  numero: string;
  titre: string;
  pertinence: 'principal' | 'complementaire' | 'jurisprudence';
  description: string;
}

export interface DossierLegalContext {
  typeDossier: string;
  fondement?: string;
  articles: ArticleReference[];
  jurisprudenceKeywords: string[];
  delaisLegaux: string[];
}

/**
 * Articles principaux par type de dossier
 */
const MAPPING: Record<string, DossierLegalContext> = {
  RECOURS_OQTF: {
    typeDossier: 'RECOURS_OQTF',
    articles: [
      { code: 'CESEDA', numero: 'L611-1', titre: "Conditions de l'OQTF", pertinence: 'principal', description: "Cas dans lesquels l'autorite administrative peut obliger un etranger a quitter le territoire" },
      { code: 'CESEDA', numero: 'L611-3', titre: 'Protections contre OQTF', pertinence: 'principal', description: "Categories d'etrangers proteges contre l'eloignement" },
      { code: 'CESEDA', numero: 'L612-1', titre: 'Delai de depart volontaire', pertinence: 'principal', description: 'Delai de 30 jours accorde pour quitter le territoire' },
      { code: 'CESEDA', numero: 'L612-2', titre: 'OQTF sans delai', pertinence: 'principal', description: "Cas ou l'OQTF est prononcee sans delai de depart volontaire" },
      { code: 'CESEDA', numero: 'L614-1', titre: 'Interdiction de retour', pertinence: 'complementaire', description: "Interdiction de retour sur le territoire francais (IRTF)" },
      { code: 'CJA', numero: 'L521-2', titre: 'Refere-liberte', pertinence: 'complementaire', description: 'Procedure d\'urgence devant le juge administratif' },
      { code: 'CESEDA', numero: 'L613-1', titre: 'Assignation a residence', pertinence: 'complementaire', description: "Alternative a la retention administrative" },
    ],
    jurisprudenceKeywords: ['OQTF', 'obligation quitter territoire', 'eloignement', 'refere-liberte OQTF'],
    delaisLegaux: [
      '48h — Refere-liberte (OQTF sans delai)',
      '15 jours — Recours TA (OQTF sans delai)',
      '30 jours — Depart volontaire',
      '30 jours — Recours TA (OQTF avec delai)',
    ],
  },

  TITRE_SEJOUR: {
    typeDossier: 'TITRE_SEJOUR',
    articles: [
      { code: 'CESEDA', numero: 'L421-1', titre: 'Carte sejour salarie', pertinence: 'principal', description: 'Titre de sejour pour activite salariee' },
      { code: 'CESEDA', numero: 'L422-1', titre: 'Carte sejour etudiant', pertinence: 'principal', description: 'Titre de sejour pour etudes' },
      { code: 'CESEDA', numero: 'L423-1', titre: 'Parent enfant francais', pertinence: 'principal', description: 'Titre de sejour vie privee et familiale' },
      { code: 'CESEDA', numero: 'L423-23', titre: 'Conjoint de Francais', pertinence: 'principal', description: 'Titre de sejour pour conjoint de ressortissant francais' },
      { code: 'CESEDA', numero: 'L425-9', titre: 'Jeune majeur', pertinence: 'complementaire', description: 'Titre de sejour pour mineur devenu majeur' },
      { code: 'CESEDA', numero: 'L425-10', titre: 'Etranger malade', pertinence: 'complementaire', description: 'Titre de sejour pour raisons de sante' },
      { code: 'CESEDA', numero: 'L435-1', titre: 'Admission exceptionnelle', pertinence: 'complementaire', description: 'Regularisation a titre exceptionnel (10 ans de presence)' },
    ],
    jurisprudenceKeywords: ['titre sejour', 'carte sejour', 'renouvellement titre', 'refus titre sejour'],
    delaisLegaux: [
      '2 mois avant expiration — Depot demande renouvellement',
      '4 mois — Delai instruction prefecture',
      '2 mois — Recours gracieux apres refus',
      '2 mois — Recours contentieux TA',
    ],
  },

  ASILE: {
    typeDossier: 'ASILE',
    articles: [
      { code: 'CESEDA', numero: 'L511-1', titre: 'Droit asile', pertinence: 'principal', description: "Principe du droit d'asile en France" },
      { code: 'CESEDA', numero: 'L512-1', titre: 'Statut refugie', pertinence: 'principal', description: 'Conditions d\'octroi du statut de refugie' },
      { code: 'CESEDA', numero: 'L512-2', titre: 'Protection subsidiaire', pertinence: 'principal', description: 'Conditions de la protection subsidiaire' },
      { code: 'CESEDA', numero: 'L531-1', titre: 'Procedure OFPRA', pertinence: 'principal', description: "Examen de la demande par l'OFPRA" },
      { code: 'CESEDA', numero: 'L531-24', titre: 'Procedure acceleree', pertinence: 'complementaire', description: "Cas de placement en procedure acceleree" },
      { code: 'CESEDA', numero: 'L532-1', titre: 'Recours CNDA', pertinence: 'complementaire', description: 'Recours devant la Cour nationale du droit d\'asile' },
      { code: 'Convention Geneve', numero: 'Art. 1A(2)', titre: 'Definition refugie', pertinence: 'complementaire', description: 'Definition internationale du refugie' },
    ],
    jurisprudenceKeywords: ['asile', 'refugie', 'OFPRA', 'CNDA', 'protection subsidiaire', 'persecution'],
    delaisLegaux: [
      '21 jours — Depot dossier OFPRA apres enregistrement',
      '6 mois — Instruction procedure normale',
      '15 jours — Instruction procedure acceleree',
      '1 mois — Recours CNDA apres rejet OFPRA',
      '5 mois — Delai jugement CNDA',
    ],
  },

  NATURALISATION: {
    typeDossier: 'NATURALISATION',
    articles: [
      { code: 'Code civil', numero: '21-15', titre: 'Naturalisation par decret', pertinence: 'principal', description: 'Conditions generales de naturalisation' },
      { code: 'Code civil', numero: '21-16', titre: 'Condition de residence', pertinence: 'principal', description: 'Residence habituelle en France depuis 5 ans' },
      { code: 'Code civil', numero: '21-2', titre: 'Acquisition par mariage', pertinence: 'principal', description: 'Declaration de nationalite par mariage avec un Francais' },
      { code: 'Code civil', numero: '21-24', titre: 'Condition assimilation', pertinence: 'complementaire', description: 'Assimilation a la communaute francaise' },
      { code: 'Code civil', numero: '21-4-1', titre: 'Entretien assimilation', pertinence: 'complementaire', description: "Entretien individuel d'assimilation" },
      { code: 'CESEDA', numero: 'D431-1', titre: 'Pieces justificatives', pertinence: 'complementaire', description: 'Liste des pieces a fournir' },
    ],
    jurisprudenceKeywords: ['naturalisation', 'nationalite francaise', 'assimilation', 'decret naturalisation'],
    delaisLegaux: [
      '5 ans — Residence minimum (sauf exceptions)',
      '4 ans — Mariage + communaute de vie',
      '12-18 mois — Delai instruction',
      '2 ans — Recours apres refus',
    ],
  },

  REGROUPEMENT_FAMILIAL: {
    typeDossier: 'REGROUPEMENT_FAMILIAL',
    articles: [
      { code: 'CESEDA', numero: 'L434-1', titre: 'Droit au regroupement', pertinence: 'principal', description: 'Conditions du regroupement familial' },
      { code: 'CESEDA', numero: 'L434-2', titre: 'Conditions ressources', pertinence: 'principal', description: 'Conditions de ressources et logement' },
      { code: 'CESEDA', numero: 'L434-4', titre: 'Membres de famille', pertinence: 'principal', description: 'Membres de famille eligibles' },
      { code: 'CESEDA', numero: 'L434-7', titre: 'Instruction demande', pertinence: 'complementaire', description: "Procedure d'instruction par l'OFII" },
      { code: 'CESEDA', numero: 'L434-9', titre: 'Refus regroupement', pertinence: 'complementaire', description: 'Motifs de refus du regroupement familial' },
    ],
    jurisprudenceKeywords: ['regroupement familial', 'OFII logement', 'conditions ressources regroupement'],
    delaisLegaux: [
      '18 mois — Residence reguliere minimum',
      '6 mois — Delai instruction OFII',
      '2 mois — Recours apres refus',
    ],
  },

  VISA: {
    typeDossier: 'VISA',
    articles: [
      { code: 'CESEDA', numero: 'L312-1', titre: 'Visa long sejour', pertinence: 'principal', description: 'Conditions du visa de long sejour' },
      { code: 'CESEDA', numero: 'L312-2', titre: 'Visa court sejour', pertinence: 'complementaire', description: 'Visa Schengen de court sejour' },
      { code: 'CESEDA', numero: 'L312-5', titre: 'Refus de visa', pertinence: 'complementaire', description: 'Motifs de refus et recours' },
    ],
    jurisprudenceKeywords: ['visa long sejour', 'refus visa', 'commission recours visa'],
    delaisLegaux: [
      '3 mois — Depot avant depart prevu',
      '2 mois — Recours commission recours visa',
      '2 mois — Recours TA Nantes',
    ],
  },
};

/**
 * Retourne le contexte juridique pour un type de dossier
 */
export function getLegalContext(typeDossier: string, fondement?: string): DossierLegalContext | null {
  const context = MAPPING[typeDossier];
  if (!context) return null;

  // Si un fondement specifique est selectionne, le mettre en tete
  if (fondement) {
    const sorted = [...context.articles].sort((a, b) => {
      if (a.numero === fondement) return -1;
      if (b.numero === fondement) return 1;
      return 0;
    });
    return { ...context, articles: sorted };
  }

  return context;
}

/**
 * Retourne les mots-cles de jurisprudence pour un type de dossier
 */
export function getJurisprudenceKeywords(typeDossier: string): string[] {
  return MAPPING[typeDossier]?.jurisprudenceKeywords || [];
}

/**
 * Retourne tous les types de dossiers disponibles
 */
export function getAvailableTypes(): string[] {
  return Object.keys(MAPPING);
}
