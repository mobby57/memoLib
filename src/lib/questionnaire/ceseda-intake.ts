/**
 * Base de questions CESEDA — entretien d'ouverture de dossier (droit des étrangers).
 *
 * Objectif : structurer l'entretien avocat ↔ client pour (1) recueillir les faits,
 * (2) détecter immédiatement une décision administrative notifiée et sa date
 * (un délai de recours peut être en cours), et (3) orienter la procédure.
 *
 * GARDE-FOU MÉTIER (important) :
 *   Ce questionnaire RECUEILLE des faits et SIGNALE des urgences possibles.
 *   Il ne conclut jamais qu'un client est régularisable ni qu'un recours est
 *   recevable. L'avocat vérifie le droit applicable (Légifrance / CESEDA) et
 *   valide toute stratégie. Les champs marqués `deadlineTrigger` déclenchent une
 *   ALERTE à faire valider par l'avocat — jamais un calcul d'échéance opposable.
 *
 * Sources consultées (à vérifier avant usage, non contractuelles) :
 *   - Légifrance (textes CESEDA)
 *   - Service-Public.fr (fiche OQTF et recours)
 *   - OFPRA (déroulé de l'entretien, récit, craintes au retour)
 *   - DGEF / immigration.interieur.gouv.fr (naturalisation, regroupement)
 */

import { ProcedureType } from '@/types/cesda';

export type IntakeQuestionType = 'text' | 'textarea' | 'boolean' | 'date' | 'select';

export interface CesedaIntakeQuestion {
  /** Identifiant stable (utilisé pour stocker la réponse). */
  id: string;
  /** Question posée au client. */
  label: string;
  type: IntakeQuestionType;
  required: boolean;
  options?: string[];
  /** Aide / précision affichée à l'avocat. */
  hint?: string;
  /**
   * Si vrai, une réponse (typiquement une date de notification) doit déclencher
   * une ALERTE "délai de recours potentiellement en cours" à faire valider par
   * l'avocat. N'implique aucun calcul d'échéance automatique opposable.
   */
  deadlineTrigger?: boolean;

  /* --- Métadonnées « corpus versionné » (toutes optionnelles) ------------- */
  /** Articles CESEDA / textes à VÉRIFIER (jamais présentés comme conclusion). */
  legalReferences?: string[];
  /** Pièces justificatives attendues en regard de la question. */
  requiredDocuments?: string[];
  /**
   * Règle de signalement d'urgence (texte lisible par l'avocat). Décrit QUAND
   * alerter — jamais un calcul d'échéance opposable.
   */
  urgencyRule?: string;
  /** Date de version du texte de référence (traçabilité temporelle). */
  legalVersionDate?: string;
  /** Statut de vérification de la référence juridique. */
  verificationStatus?: 'a_verifier' | 'verifie' | 'obsolete';
}

export interface CesedaIntakeSection {
  /** Procédure concernée, ou `COMMON` pour le tronc commun. */
  procedure: ProcedureType | 'COMMON';
  title: string;
  description: string;
  /** Priorité d'affichage : les sections d'urgence passent en premier. */
  priority: 'urgent' | 'standard';
  questions: CesedaIntakeQuestion[];
}

/* -------------------------------------------------------------------------- */
/* A. Tronc commun — posé pour tous les dossiers                              */
/* -------------------------------------------------------------------------- */

const COMMON_SECTION: CesedaIntakeSection = {
  procedure: 'COMMON',
  title: 'Questions communes (tous dossiers)',
  description: "Qualification du client et historique administratif. À poser en ouverture de tout dossier CESEDA.",
  priority: 'standard',
  questions: [
    { id: 'nationalite', label: 'Quelle est votre nationalité ?', type: 'text', required: true },
    { id: 'dateNaissance', label: 'Quelle est votre date de naissance ?', type: 'date', required: true },
    { id: 'dateArriveeFrance', label: 'Depuis quelle date êtes-vous en France ?', type: 'date', required: true },
    { id: 'documentEntree', label: "Avec quel document êtes-vous entré en France ?", type: 'text', required: false, hint: 'Visa, passeport, entrée irrégulière…' },
    { id: 'titreActuel', label: "Quel titre de séjour possédez-vous actuellement ou avez-vous possédé ?", type: 'text', required: false },
    { id: 'demandePrefecture', label: 'Avez-vous déjà déposé une demande à la préfecture ou sur l’ANEF ?', type: 'boolean', required: true },
    {
      id: 'decisionRecue',
      label: 'Avez-vous reçu un refus, une OQTF, une assignation à résidence ou une autre décision ?',
      type: 'boolean',
      required: true,
      hint: 'Si oui, renseigner impérativement la date de notification ci-dessous.',
      deadlineTrigger: true,
    },
    {
      id: 'dateNotificationDecision',
      label: 'À quelle date avez-vous reçu cette décision et comment vous a-t-elle été remise ?',
      type: 'date',
      required: false,
      hint: 'Déclenche une ALERTE délai à faire valider par l’avocat. Mode de remise : main propre, LRAR, préfecture…',
      deadlineTrigger: true,
    },
    { id: 'recoursAnterieur', label: 'Avez-vous déjà contesté une décision devant un tribunal ?', type: 'boolean', required: false },
    { id: 'situationFamiliale', label: 'Quelle est votre situation familiale en France ?', type: 'text', required: false, hint: 'Conjoint, enfants, concubinage, PACS…' },
    { id: 'travail', label: 'Travaillez-vous ? Depuis quand ? Quels justificatifs possédez-vous ?', type: 'textarea', required: false },
    { id: 'justificatifsPresence', label: 'Disposez-vous de justificatifs de domicile et de présence en France ?', type: 'boolean', required: false },
    { id: 'aideJuridictionnelle', label: 'Avez-vous déjà bénéficié de l’aide juridictionnelle ou d’un autre avocat ?', type: 'boolean', required: false },
  ],
};

/* -------------------------------------------------------------------------- */
/* B. OQTF — urgence prioritaire                                              */
/* -------------------------------------------------------------------------- */

const OQTF_SECTION: CesedaIntakeSection = {
  procedure: ProcedureType.OQTF,
  title: 'OQTF — obligation de quitter le territoire',
  description: "Urgence à vérifier en premier : identifier la décision exacte, sa notification et la procédure applicable AVANT toute estimation de délai. Les délais ne sont pas identiques pour toutes les OQTF.",
  priority: 'urgent',
  questions: [
    { id: 'oqtf_arreteEcrit', label: 'Avez-vous reçu un arrêté préfectoral écrit ?', type: 'boolean', required: true, legalReferences: ['CESEDA L. 611-1 et s.'], requiredDocuments: ['Arrêté préfectoral intégral'], verificationStatus: 'a_verifier', legalVersionDate: '2026-10-01' },
    { id: 'oqtf_dateNotification', label: 'Quelle est la date exacte de notification ?', type: 'date', required: true, deadlineTrigger: true, hint: 'ALERTE délai à faire valider par l’avocat.', legalReferences: ['CESEDA L. 614-1 à L. 614-19'], requiredDocuments: ['Preuve de notification', 'Enveloppe / avis de remise'], urgencyRule: "Décision d'éloignement notifiée : signaler une urgence IMMÉDIATE. Ne pas calculer d'échéance définitive tant que la nature de la décision et le mode de notification ne sont pas vérifiés.", verificationStatus: 'a_verifier', legalVersionDate: '2026-10-01' },
    {
      id: 'oqtf_contenuArrete',
      label: "L’arrêté comporte-t-il un refus de séjour, une OQTF, un délai de départ volontaire ou une interdiction de retour ?",
      type: 'select',
      required: true,
      options: ['Refus de séjour', 'OQTF avec délai de départ volontaire', 'OQTF sans délai', 'Interdiction de retour (IRTF)', 'Plusieurs des éléments ci-dessus', 'Ne sait pas'],
      hint: 'Le type conditionne la procédure et le délai — à qualifier par l’avocat.',
      deadlineTrigger: true,
      legalReferences: ['CESEDA L. 611-1 et s.', 'CESEDA L. 612-1 et s. (départ volontaire / IRTF)'],
      urgencyRule: "Qualification multi-décisions : un même arrêté peut contenir plusieurs décisions contestables, chacune avec sa propre procédure et son délai. L'avocat qualifie chaque décision séparément.",
      verificationStatus: 'a_verifier',
      legalVersionDate: '2026-10-01',
    },
    { id: 'oqtf_retention', label: 'Êtes-vous actuellement en rétention ou assigné à résidence ?', type: 'select', required: true, options: ['Non', 'Rétention administrative', 'Assignation à résidence'], hint: 'La rétention raccourcit fortement les délais — urgence maximale.', deadlineTrigger: true, legalReferences: ['CESEDA Livre VI (rétention / assignation)'], urgencyRule: 'Mesure privative/restrictive de liberté : traiter le dossier EN PRIORITÉ ABSOLUE (P0). Ne jamais appliquer un délai générique à toutes les rétentions.', verificationStatus: 'a_verifier', legalVersionDate: '2026-10-01' },
    { id: 'oqtf_recoursDepose', label: 'Avez-vous déjà déposé un recours ? Si oui, quand et auprès de quelle juridiction ?', type: 'textarea', required: false },
    { id: 'oqtf_attachesFamiliales', label: 'Avez-vous des enfants scolarisés, un conjoint ou des proches en France ?', type: 'textarea', required: false },
    { id: 'oqtf_elementsPresence', label: 'Quels éléments justifient votre présence : travail, vie familiale, santé, durée de séjour ?', type: 'textarea', required: false },
    { id: 'oqtf_risquesRetour', label: 'Existe-t-il des risques personnels en cas de retour dans votre pays ?', type: 'textarea', required: false },
  ],
};

/* -------------------------------------------------------------------------- */
/* C. Titre de séjour — première demande / renouvellement                     */
/* -------------------------------------------------------------------------- */

const TITRE_SECTION: CesedaIntakeSection = {
  procedure: ProcedureType.REFUS_TITRE,
  title: 'Titre de séjour — demande / renouvellement',
  description: "Première demande, renouvellement ou changement de statut. Vérifier l'expiration du titre et les récépissés en cours.",
  priority: 'standard',
  questions: [
    { id: 'titre_type', label: 'Quel titre demandez-vous : salarié, vie privée et familiale, étudiant, visiteur ou autre ?', type: 'text', required: true },
    { id: 'titre_nature', label: 'S’agit-il d’une première demande, d’un renouvellement ou d’un changement de statut ?', type: 'select', required: true, options: ['Première demande', 'Renouvellement', 'Changement de statut'] },
    { id: 'titre_dateExpiration', label: 'À quelle date votre titre expire-t-il ?', type: 'date', required: false, deadlineTrigger: true, hint: 'Une expiration proche peut créer une urgence — à faire valider.' },
    { id: 'titre_recepisse', label: 'Avez-vous une attestation de dépôt, un récépissé ou une attestation de prolongation d’instruction ?', type: 'boolean', required: false },
    { id: 'titre_piecesComplementaires', label: 'Avez-vous reçu une demande de pièces complémentaires ?', type: 'boolean', required: false },
    { id: 'titre_situationPro', label: 'Quelle est votre situation professionnelle et depuis quand travaillez-vous ?', type: 'textarea', required: false },
    { id: 'titre_justificatifs', label: 'Quels justificatifs de résidence et de vie familiale pouvez-vous fournir ?', type: 'textarea', required: false },
    { id: 'titre_refusAnterieur', label: 'Avez-vous déjà reçu un refus ou une décision d’irrecevabilité ?', type: 'boolean', required: false, deadlineTrigger: true },
  ],
};

/* -------------------------------------------------------------------------- */
/* D. Asile — OFPRA / CNDA                                                     */
/* -------------------------------------------------------------------------- */

const ASILE_SECTION: CesedaIntakeSection = {
  procedure: ProcedureType.ASILE,
  title: 'Asile — OFPRA / CNDA',
  description: "Récit, craintes au retour et cohérence avec les déclarations antérieures. Vérifier toute décision OFPRA et un éventuel recours CNDA (délai).",
  priority: 'standard',
  questions: [
    { id: 'asile_motifDepart', label: 'Pourquoi avez-vous quitté votre pays ?', type: 'textarea', required: true },
    { id: 'asile_craintesRetour', label: 'Que craignez-vous en cas de retour ?', type: 'textarea', required: true },
    { id: 'asile_evenements', label: 'Quels événements précis vous sont arrivés, à quelles dates et dans quels lieux ?', type: 'textarea', required: false },
    { id: 'asile_auteurs', label: 'Qui est à l’origine des menaces ou des persécutions ?', type: 'textarea', required: false },
    { id: 'asile_protectionAutorites', label: 'Avez-vous demandé la protection des autorités de votre pays ? Si non, pourquoi ?', type: 'textarea', required: false },
    { id: 'asile_preuves', label: 'Disposez-vous de preuves, documents, messages ou témoignages ?', type: 'boolean', required: false },
    { id: 'asile_autrePays', label: 'Avez-vous déjà demandé l’asile dans un autre pays ?', type: 'boolean', required: false, hint: 'Peut relever de la procédure Dublin — à qualifier par l’avocat.' },
    { id: 'asile_coherenceRecit', label: 'Votre récit écrit correspond-il à ce que vous avez déclaré lors des précédentes étapes ?', type: 'boolean', required: false },
    { id: 'asile_decisionOfpra', label: 'Avez-vous reçu une décision de l’OFPRA ? À quelle date ?', type: 'date', required: false, deadlineTrigger: true, hint: 'ALERTE délai de recours CNDA à faire valider.' },
    { id: 'asile_recoursCnda', label: 'Un recours devant la CNDA a-t-il été déposé ?', type: 'boolean', required: false, deadlineTrigger: true },
  ],
};

/* -------------------------------------------------------------------------- */
/* E. Regroupement familial / vie privée et familiale                         */
/* -------------------------------------------------------------------------- */

const REGROUPEMENT_SECTION: CesedaIntakeSection = {
  procedure: ProcedureType.REGROUPEMENT_FAMILIAL,
  title: 'Regroupement familial / vie privée et familiale',
  description: "Lien familial, vie commune, logement et ressources. Vérifier toute décision administrative déjà rendue.",
  priority: 'standard',
  questions: [
    { id: 'rf_lien', label: 'Quel est votre lien avec la personne que vous souhaitez faire venir ou rejoindre ?', type: 'text', required: true },
    { id: 'rf_residence', label: 'Où résident votre conjoint et vos enfants ?', type: 'text', required: false },
    { id: 'rf_dateVieCommune', label: 'Depuis quand vivez-vous ensemble ?', type: 'text', required: false },
    { id: 'rf_actesEtatCivil', label: 'Quels actes d’état civil et preuves de vie commune possédez-vous ?', type: 'textarea', required: false },
    { id: 'rf_logementRessources', label: 'Quel est votre logement et quelles sont vos ressources ?', type: 'textarea', required: false },
    { id: 'rf_demandeDeposee', label: 'Une demande a-t-elle déjà été déposée ?', type: 'boolean', required: false },
    { id: 'rf_decisionRecue', label: 'Avez-vous reçu une décision administrative ?', type: 'date', required: false, deadlineTrigger: true, hint: 'ALERTE délai à faire valider si refus notifié.' },
  ],
};

/* -------------------------------------------------------------------------- */
/* F. Naturalisation française                                                */
/* -------------------------------------------------------------------------- */

const NATURALISATION_SECTION: CesedaIntakeSection = {
  procedure: ProcedureType.NATURALISATION,
  title: 'Naturalisation française',
  description: "Durée de résidence, stabilité et intégration. Vérifier toute décision d'ajournement, d'irrecevabilité ou de rejet (délai de recours).",
  priority: 'standard',
  questions: [
    { id: 'nat_dureeResidence', label: 'Depuis quand résidez-vous en France ?', type: 'date', required: true },
    { id: 'nat_statutSejour', label: 'Quel est votre statut de séjour actuel ?', type: 'text', required: true },
    { id: 'nat_situationPro', label: 'Quelle est votre situation professionnelle et financière ?', type: 'textarea', required: false },
    { id: 'nat_liensFamiliaux', label: 'Quels sont vos liens familiaux en France ?', type: 'textarea', required: false },
    { id: 'nat_niveauFrancais', label: 'Quels diplômes ou justificatifs de niveau de français possédez-vous ?', type: 'textarea', required: false },
    { id: 'nat_demandeAnterieure', label: 'Avez-vous déjà déposé une demande de naturalisation ?', type: 'boolean', required: false },
    { id: 'nat_decisionRecue', label: 'Avez-vous reçu une décision d’ajournement, d’irrecevabilité ou de rejet ?', type: 'date', required: false, deadlineTrigger: true, hint: 'ALERTE délai de recours à faire valider.' },
  ],
};

/* -------------------------------------------------------------------------- */
/* Export du corpus                                                           */
/* -------------------------------------------------------------------------- */

export const CESEDA_INTAKE_SECTIONS: CesedaIntakeSection[] = [
  COMMON_SECTION,
  OQTF_SECTION,
  TITRE_SECTION,
  ASILE_SECTION,
  REGROUPEMENT_SECTION,
  NATURALISATION_SECTION,
];

/** Map procédure → section spécifique (hors tronc commun). */
export const CESEDA_SECTION_BY_PROCEDURE: Partial<Record<ProcedureType, CesedaIntakeSection>> = {
  [ProcedureType.OQTF]: OQTF_SECTION,
  [ProcedureType.REFUS_TITRE]: TITRE_SECTION,
  [ProcedureType.ASILE]: ASILE_SECTION,
  [ProcedureType.REGROUPEMENT_FAMILIAL]: REGROUPEMENT_SECTION,
  [ProcedureType.NATURALISATION]: NATURALISATION_SECTION,
};

/**
 * Construit le questionnaire d'ouverture pour une procédure donnée :
 * tronc commun + section spécifique. La section urgente est placée en premier.
 */
export function buildCesedaIntake(procedure: ProcedureType): CesedaIntakeSection[] {
  const specific = CESEDA_SECTION_BY_PROCEDURE[procedure];
  if (!specific) return [COMMON_SECTION];
  // Les sections urgentes (OQTF) passent avant le tronc commun.
  return specific.priority === 'urgent' ? [specific, COMMON_SECTION] : [COMMON_SECTION, specific];
}

/**
 * Retourne toutes les questions qui déclenchent une alerte délai, pour la
 * pré-analyse IA : toute réponse non vide à ces questions doit produire une
 * ALERTE "délai potentiellement en cours" à faire valider par l'avocat.
 * (Ne calcule aucune échéance opposable.)
 */
export function getDeadlineTriggerQuestions(procedure?: ProcedureType): CesedaIntakeQuestion[] {
  const sections = procedure ? buildCesedaIntake(procedure) : CESEDA_INTAKE_SECTIONS;
  return sections.flatMap((s) => s.questions.filter((q) => q.deadlineTrigger));
}

/* -------------------------------------------------------------------------- */
/* Points bloquants documentés (2026) → fonctionnalités MemoLib               */
/* -------------------------------------------------------------------------- */

export type BlockingPriority = 'P0' | 'P1' | 'P2';

export interface CesedaBlockingPoint {
  id: string;
  /** Blocage observé en pratique (étranger ou avocat). */
  blockage: string;
  /** Réponse produit MemoLib. */
  feature: string;
  /** Test de validation de la fonctionnalité. */
  validation: string;
  priority: BlockingPriority;
  /** Sources officielles à conserver dans le dossier de recherche. */
  sources?: string[];
}

/**
 * Points bloquants prioritaires (droit des étrangers, référentiel 2026).
 * Sert de backlog produit traçable pour l'agent CESEDA. Ces priorités sont des
 * recommandations de conception, pas un classement officiel du secteur.
 */
export const CESEDA_BLOCKING_POINTS: CesedaBlockingPoint[] = [
  {
    id: 'anef-inaccessible',
    blockage: "Plateforme ANEF : dépôt impossible, compte inaccessible, changement de situation non déclarable, documents provisoires indisponibles.",
    feature: "Journal des tentatives ANEF + preuves d'incident (captures horodatées, suivi des démarches, dossier de signalement).",
    validation: 'Les captures et dates sont associées au bon dossier.',
    priority: 'P1',
    sources: ['Défenseur des droits — décision ANEF du 5 mai 2026', "Conseil d'État — défaillances ANEF 2026"],
  },
  {
    id: 'delais-instruction',
    blockage: "Allongement des délais d'instruction des titres de séjour, avec ruptures de droits (travail, logement, vie familiale).",
    feature: "Surveillance d'expiration des titres/attestations + alerte avant échéance + repérage des justificatifs de dépôt et de renouvellement.",
    validation: 'Une alerte est générée à partir de la date vérifiée.',
    priority: 'P1',
    sources: ["Défenseur des droits — rapport délais d'instruction du 17 juillet 2026"],
  },
  {
    id: 'delais-recours',
    blockage: 'Délais de recours difficiles à qualifier (varient selon la décision, la procédure et la version du texte).',
    feature: "Moteur de délais contextualisé + version du texte applicable + vérification de la notification + validation obligatoire par l'avocat.",
    validation: 'Aucune échéance définitive sans les données nécessaires vérifiées.',
    priority: 'P0',
    sources: ["Conseil d'État — décision n° 512314 du 9 juin 2026 (délai 7 jours, art. L. 921-1 CESEDA)"],
  },
  {
    id: 'dossiers-incomplets',
    blockage: 'Dossiers incomplets / pièces manquantes (documents et délais variables selon la procédure).',
    feature: "Checklist conditionnelle par procédure + détection des pièces absentes + preuve de transmission.",
    validation: 'Chaque pièce est marquée reçue, manquante ou non applicable.',
    priority: 'P1',
    sources: ['OFPRA — introduction et régularisation d\'une demande incomplète'],
  },
  {
    id: 'mauvaise-orientation',
    blockage: "Mauvaise orientation entre procédures (refus de séjour, OQTF, décision Dublin, refus de protection ne relèvent pas des mêmes règles).",
    feature: 'Qualification multi-décisions : chaque décision rattachée à sa procédure, son délai et sa juridiction potentielle.',
    validation: "L'agent distingue les mesures contenues dans un même arrêté.",
    priority: 'P0',
  },
  {
    id: 'asile-complexe',
    blockage: 'Procédures d\'asile complexes (demandes ultérieures, procédure accélérée, transferts Dublin).',
    feature: 'Questionnaire spécialisé + chronologie complète + distinction droit au maintien / recevabilité du recours.',
    validation: 'La chronologie reconstitue chaque étape et décision avec sa date.',
    priority: 'P1',
    sources: ['OFPRA — procédure normale et accélérée', 'OFPRA — demandes ultérieures'],
  },
  {
    id: 'jurisprudence-obsolete',
    blockage: 'Jurisprudence obsolète ou texte dans une version non applicable à la date des faits.',
    feature: 'Recherche juridique datée et sourcée (URL, date de consultation, version du texte).',
    validation: 'Chaque proposition est accompagnée d\'une référence vérifiable.',
    priority: 'P1',
  },
  {
    id: 'erreur-ia',
    blockage: "Risque d'erreur de l'IA transformée en acte juridique.",
    feature: 'Validation humaine systématique + journal d\'audit.',
    validation: 'Aucune action juridique externe sans validation de l\'avocat.',
    priority: 'P0',
  },
];

/** Retourne les points bloquants d'une priorité donnée (P0 = urgences juridiques). */
export function getBlockingPointsByPriority(priority: BlockingPriority): CesedaBlockingPoint[] {
  return CESEDA_BLOCKING_POINTS.filter((b) => b.priority === priority);
}

/**
 * Règles de sécurité juridique de l'agent CESEDA. Invariants NON négociables :
 * l'IA recueille des faits et prépare une synthèse ; l'avocat valide le droit.
 */
export const CESEDA_AGENT_SAFETY_RULES = [
  "Sources primaires en priorité (Légifrance pour les textes, sites institutionnels pour les procédures, juridictions pour la jurisprudence). Enregistrer URL, date de consultation et version du texte.",
  "Gestion des délais : vérifier date de notification, nature de la décision, procédure et situation AVANT tout calcul. Une échéance incertaine est signalée comme telle, jamais présentée comme opposable.",
  "Validation par l'avocat : l'IA prépare une synthèse et des pistes ; l'avocat valide la qualification, les textes, les moyens, les délais et tout acte destiné au tribunal ou à l'administration.",
  "Confidentialité / RGPD : collecte minimale, habilitations par dossier, journalisation des accès. Données médicales et récits sensibles = précautions renforcées, accès strictement limité.",
  "Un blocage administratif n'est PAS un refus légal ; un dossier incomplet n'est PAS nécessairement irrecevable. Ne jamais transformer une hypothèse en conclusion juridique automatique.",
] as const;

/* -------------------------------------------------------------------------- */
/* Besoins clients : demande exprimée → besoin réel → fonction MemoLib        */
/* -------------------------------------------------------------------------- */

export interface CesedaClientNeed {
  id: string;
  /** Demande telle qu'exprimée par le client (langage courant). */
  expressed: string;
  /** Besoin juridique réel sous-jacent. */
  realNeed: string;
  /** Fonctionnalité MemoLib qui y répond. */
  feature: string;
  /** Procédure(s) probablement concernée(s). */
  procedures: (ProcedureType | 'COMMON')[];
}

/**
 * Les 8 grandes demandes clients (synthèse fonctionnelle des besoins à couvrir,
 * PAS un classement statistique de fréquence). Sert à qualifier une demande
 * imprécise et à l'orienter vers le bon questionnaire.
 */
export const CESEDA_CLIENT_NEEDS: CesedaClientNeed[] = [
  {
    id: 'titre-sejour',
    expressed: '« Je veux régulariser ma situation » / « Mon titre expire bientôt. »',
    realNeed: 'Identifier le fondement juridique, vérifier les conditions, constituer un dossier complet.',
    feature: "Questionnaire adapté, checklist de pièces, suivi de dépôt, alertes d'expiration.",
    procedures: [ProcedureType.REFUS_TITRE],
  },
  {
    id: 'anef',
    expressed: "« Je n'arrive pas à déposer mon dossier / récupérer mon attestation. »",
    realNeed: "Prouver les démarches, conserver les erreurs, identifier les moyens de contact ou une solution alternative.",
    feature: "Journal des incidents ANEF, pièces horodatées, préparation d'un dossier de signalement.",
    procedures: ['COMMON', ProcedureType.REFUS_TITRE],
  },
  {
    id: 'oqtf',
    expressed: "« J'ai reçu une obligation de quitter la France. Que dois-je faire ? »",
    realNeed: 'Comprendre la décision, déterminer les recours possibles, vérifier immédiatement les délais.',
    feature: "Lecture de l'arrêté, extraction de la notification, alerte urgente, validation par l'avocat.",
    procedures: [ProcedureType.OQTF],
  },
  {
    id: 'famille',
    expressed: '« Je veux rejoindre mon conjoint » / « Je veux rester avec mes enfants. »',
    realNeed: 'Identifier le régime applicable, établir les liens familiaux, réunir les preuves pertinentes.',
    feature: "Questionnaire familial, collecte des actes d'état civil, vérification des justificatifs.",
    procedures: [ProcedureType.REGROUPEMENT_FAMILIAL],
  },
  {
    id: 'asile',
    expressed: '« Je crains de retourner dans mon pays. »',
    realNeed: 'Préparer un récit fidèle, ordonner les événements, rassembler les preuves SANS altérer les déclarations.',
    feature: 'Chronologie, classement des preuves, suivi OFPRA/CNDA, contrôle des échéances.',
    procedures: [ProcedureType.ASILE],
  },
  {
    id: 'travail',
    expressed: "« J'ai trouvé un employeur, mais je ne sais pas si je peux travailler. »",
    realNeed: "Vérifier le titre détenu, les autorisations nécessaires, la procédure applicable à l'activité.",
    feature: "Collecte du contrat, des justificatifs professionnels et des documents de l'employeur.",
    procedures: [ProcedureType.REFUS_TITRE],
  },
  {
    id: 'sans-reponse',
    expressed: "« J'ai déposé ma demande il y a longtemps et je n'ai aucune nouvelle. »",
    realNeed: "Reconstituer l'historique, vérifier les justificatifs de dépôt, déterminer si une démarche/recours est envisageable.",
    feature: "Chronologie des échanges, suivi des relances, préparation d'un courrier à valider.",
    procedures: ['COMMON', ProcedureType.REFUS_TITRE],
  },
  {
    id: 'naturalisation',
    expressed: '« Je vis en France depuis plusieurs années et je veux devenir français. »',
    realNeed: 'Vérifier les conditions de nationalité et la procédure, distincte du simple droit au séjour.',
    feature: 'Checklist dédiée, contrôle documentaire, suivi de la demande.',
    procedures: [ProcedureType.NATURALISATION],
  },
];

/** Besoins transversaux communs à tous les clients, indépendants de la procédure. */
export const CESEDA_CROSS_CUTTING_NEEDS = [
  'Comprendre : où en est le dossier, ce que signifie un courrier administratif.',
  'Être accompagné malgré les difficultés linguistiques ou numériques.',
  'Être rassuré sur les étapes SANS garantie infondée sur le résultat.',
  'Éviter les oublis : pièces manquantes et échéances signalées.',
  'Prouver ses démarches : conserver accusés de réception, courriels, décisions, justificatifs.',
  'Préserver ses droits : faire examiner rapidement une décision urgente ou une rupture de droits.',
] as const;

/** Ce que l'avocat attend de l'outil → réponse MemoLib. */
export const CESEDA_LAWYER_EXPECTATIONS: { need: string; response: string }[] = [
  { need: 'Comprendre rapidement le dossier', response: 'Synthèse factuelle avec chronologie' },
  { need: 'Éviter de relire plusieurs fois les mêmes documents', response: 'Extraction et classement des pièces' },
  { need: 'Identifier une urgence', response: 'Signalement des décisions et échéances' },
  { need: 'Repérer les informations absentes', response: 'Liste des questions à reposer au client' },
  { need: 'Trouver le droit applicable', response: 'Articles officiels versionnés et jurisprudence pertinente' },
  { need: 'Préparer un courrier ou un recours', response: 'Projet de document soumis à validation' },
  { need: 'Suivre les actions', response: 'Tâches, relances et historique des échanges' },
  { need: 'Sécuriser les dossiers', response: 'Contrôle des accès, confidentialité et journalisation' },
];

/** Parcours client cible (5 étapes), l'IA qualifie mais l'avocat valide. */
export const CESEDA_CLIENT_JOURNEY = [
  { step: 1, actor: 'client', action: "Le client explique son problème (formulaire simple ou conversation, pièce jointe possible)." },
  { step: 2, actor: 'ia', action: "L'IA qualifie la demande : procédure probable, décisions reçues, urgence éventuelle, informations manquantes." },
  { step: 3, actor: 'client', action: "Le client transmet les justificatifs (checklist personnalisée + relances)." },
  { step: 4, actor: 'avocat', action: "L'avocat examine : faits, textes, délais, voies de recours." },
  { step: 5, actor: 'cabinet', action: "Le client est informé des prochaines étapes (explication claire + tâches/documents validés)." },
] as const;

/**
 * Trois parcours à tester pour le premier pilote de l'agent CESEDA (sans
 * présumer qu'ils sont les plus fréquents de tous les cabinets).
 */
export interface CesedaPilotParcours {
  id: string;
  title: string;
  procedure: ProcedureType;
  focus: string;
}

export const CESEDA_PILOT_PARCOURS: CesedaPilotParcours[] = [
  {
    id: 'pilote-oqtf',
    title: 'Client ayant reçu une OQTF',
    procedure: ProcedureType.OQTF,
    focus: "Vérification immédiate de la décision, de la notification, d'une éventuelle rétention et des échéances à faire valider.",
  },
  {
    id: 'pilote-renouvellement',
    title: 'Client bloqué dans le renouvellement de son titre',
    procedure: ProcedureType.REFUS_TITRE,
    focus: 'Historique ANEF, preuve de dépôt, expiration du titre, document provisoire, conséquences sur les droits.',
  },
  {
    id: 'pilote-famille-travail',
    title: 'Client demandant un titre pour motif familial ou professionnel',
    procedure: ProcedureType.REFUS_TITRE,
    focus: 'Qualification du statut, collecte des justificatifs, identification des conditions légales à vérifier.',
  },
];
