/**
 * CESEDA Reference - Base de connaissances juridique
 * Code de l'entrée et du séjour des étrangers et du droit d'asile
 */

export interface DocumentType {
  nom: string;
  obligatoire: boolean;
  description: string;
  formats: string[];
}

export interface ProcedureCESEDA {
  type: string;
  categorie: string;
  description: string;
  delaiMoyen: string; // en jours
  urgence: 'urgent' | 'normal' | 'faible';
  documentsNecessaires: DocumentType[];
  risquesJuridiques: string[];
  recoursDisponibles: string[];
}

/**
 * Base de données des procédures CESEDA
 */
export const PROCEDURES_CESEDA: Record<string, ProcedureCESEDA> = {
  // === TITRES DE SÉJOUR ===
  'titre-sejour-salarie': {
    type: 'Titre de séjour',
    categorie: 'Salarié',
    description: 'Première demande ou renouvellement de titre de séjour pour travail salarié',
    delaiMoyen: '60',
    urgence: 'normal',
    documentsNecessaires: [
      { nom: 'Passeport', obligatoire: true, description: 'Passeport en cours de validité', formats: ['PDF', 'JPEG', 'PNG'] },
      { nom: 'Justificatif de domicile', obligatoire: true, description: 'Moins de 3 mois', formats: ['PDF', 'JPEG'] },
      { nom: 'Photos d\'identité', obligatoire: true, description: '3 photos récentes', formats: ['JPEG', 'PNG'] },
      { nom: 'Contrat de travail', obligatoire: true, description: 'CDI ou CDD de + 12 mois', formats: ['PDF'] },
      { nom: 'Bulletins de salaire', obligatoire: true, description: '3 derniers mois', formats: ['PDF'] },
      { nom: 'Attestation employeur', obligatoire: true, description: 'Déclaration d\'embauche', formats: ['PDF'] },
      { nom: 'Justificatif paiement taxes', obligatoire: true, description: 'Timbre fiscal OMI', formats: ['PDF'] },
    ],
    risquesJuridiques: [
      'Refus si contrat de travail non conforme',
      'Expiration du titre actuel pendant l\'instruction',
      'OQTF en cas de refus de renouvellement',
    ],
    recoursDisponibles: [
      'Recours gracieux auprès du préfet (2 mois)',
      'Recours contentieux au tribunal administratif (2 mois)',
      'Référé suspension en cas d\'urgence',
    ],
  },

  'titre-sejour-vie-privee': {
    type: 'Titre de séjour',
    categorie: 'Vie privée et familiale',
    description: 'Titre de séjour pour raisons familiales (conjoint, enfant, parent)',
    delaiMoyen: '90',
    urgence: 'normal',
    documentsNecessaires: [
      { nom: 'Passeport', obligatoire: true, description: 'Passeport en cours de validité', formats: ['PDF', 'JPEG', 'PNG'] },
      { nom: 'Acte de mariage', obligatoire: true, description: 'Avec traduction assermentée si nécessaire', formats: ['PDF'] },
      { nom: 'Acte de naissance', obligatoire: true, description: 'Moins de 3 mois', formats: ['PDF'] },
      { nom: 'Justificatif de domicile commun', obligatoire: true, description: 'Factures au nom des 2 conjoints', formats: ['PDF'] },
      { nom: 'Justificatif de ressources', obligatoire: true, description: 'Bulletins de salaire, avis d\'imposition', formats: ['PDF'] },
      { nom: 'Photos d\'identité', obligatoire: true, description: '3 photos récentes', formats: ['JPEG', 'PNG'] },
    ],
    risquesJuridiques: [
      'Suspicion de mariage blanc',
      'Ressources insuffisantes du conjoint français',
      'Absence de vie commune réelle',
    ],
    recoursDisponibles: [
      'Recours gracieux avec justificatifs complémentaires',
      'Recours contentieux au tribunal administratif',
      'Saisine du Défenseur des droits',
    ],
  },

  'titre-sejour-etudiant': {
    type: 'Titre de séjour',
    categorie: 'Étudiant',
    description: 'Titre de séjour pour études supérieures en France',
    delaiMoyen: '45',
    urgence: 'normal',
    documentsNecessaires: [
      { nom: 'Passeport', obligatoire: true, description: 'Passeport valide', formats: ['PDF', 'JPEG'] },
      { nom: 'Attestation d\'inscription', obligatoire: true, description: 'Université ou école reconnue', formats: ['PDF'] },
      { nom: 'Justificatif de ressources', obligatoire: true, description: 'Minimum 615€/mois (SMIC)', formats: ['PDF'] },
      { nom: 'Assurance santé', obligatoire: true, description: 'Sécurité sociale étudiante', formats: ['PDF'] },
      { nom: 'Justificatif de logement', obligatoire: true, description: 'Bail, attestation CROUS', formats: ['PDF'] },
    ],
    risquesJuridiques: [
      'Refus si ressources insuffisantes',
      'Obligation d\'assiduité aux cours',
      'Temps de travail limité (964h/an)',
    ],
    recoursDisponibles: [
      'Recours gracieux si justificatifs manquants',
      'Recours au tribunal administratif',
    ],
  },

  // === VISAS ===
  'visa-long-sejour': {
    type: 'Visa',
    categorie: 'Long séjour',
    description: 'Visa de long séjour valant titre de séjour (VLS-TS)',
    delaiMoyen: '30',
    urgence: 'urgent',
    documentsNecessaires: [
      { nom: 'Formulaire de demande', obligatoire: true, description: 'Cerfa n°14571', formats: ['PDF'] },
      { nom: 'Passeport', obligatoire: true, description: 'Validité > 3 mois après retour', formats: ['PDF', 'JPEG'] },
      { nom: 'Photos d\'identité', obligatoire: true, description: '2 photos norme ICAO', formats: ['JPEG'] },
      { nom: 'Justificatif objet du séjour', obligatoire: true, description: 'Contrat de travail, inscription université', formats: ['PDF'] },
      { nom: 'Justificatif de ressources', obligatoire: true, description: 'Bulletins de salaire, promesse d\'embauche', formats: ['PDF'] },
      { nom: 'Assurance voyage', obligatoire: true, description: 'Couverture médicale', formats: ['PDF'] },
    ],
    risquesJuridiques: [
      'Refus de visa sans motivation détaillée',
      'Délais de traitement variables selon consulats',
    ],
    recoursDisponibles: [
      'Recours auprès de la Commission de recours contre les refus de visa (CRRV)',
    ],
  },

  // === NATURALISATION ===
  'naturalisation': {
    type: 'Naturalisation',
    categorie: 'Acquisition nationalité française',
    description: 'Demande de naturalisation par décret',
    delaiMoyen: '540', // 18 mois
    urgence: 'faible',
    documentsNecessaires: [
      { nom: 'Formulaire cerfa', obligatoire: true, description: 'Cerfa n°12753', formats: ['PDF'] },
      { nom: 'Acte de naissance', obligatoire: true, description: 'Avec traduction assermentée', formats: ['PDF'] },
      { nom: 'Justificatif de résidence', obligatoire: true, description: '5 ans minimum en France', formats: ['PDF'] },
      { nom: 'Avis d\'imposition', obligatoire: true, description: '3 dernières années', formats: ['PDF'] },
      { nom: 'Diplômes et attestations', obligatoire: true, description: 'Niveau B1 français (TCF/DELF)', formats: ['PDF'] },
      { nom: 'Casier judiciaire', obligatoire: true, description: 'Bulletin n°3', formats: ['PDF'] },
      { nom: 'Justificatif d\'intégration', obligatoire: true, description: 'Adhésion valeurs de la République', formats: ['PDF'] },
    ],
    risquesJuridiques: [
      'Refus pour défaut d\'assimilation',
      'Refus pour condamnations pénales',
      'Refus pour séjours irréguliers antérieurs',
    ],
    recoursDisponibles: [
      'Nouvelle demande après 2 ans',
      'Recours gracieux avec justificatifs complémentaires',
    ],
  },

  // === OQTF ===
  'oqtf-recours': {
    type: 'OQTF',
    categorie: 'Recours contre obligation de quitter le territoire',
    description: 'Contestation d\'une OQTF avec ou sans délai',
    delaiMoyen: '7', // URGENT
    urgence: 'urgent',
    documentsNecessaires: [
      { nom: 'OQTF reçue', obligatoire: true, description: 'Décision préfectorale originale', formats: ['PDF'] },
      { nom: 'Justificatif de situation personnelle', obligatoire: true, description: 'Preuves d\'attaches familiales en France', formats: ['PDF'] },
      { nom: 'Certificats médicaux', obligatoire: false, description: 'Si soins impossibles dans pays d\'origine', formats: ['PDF'] },
      { nom: 'Attestations de témoins', obligatoire: false, description: 'Preuves d\'intégration', formats: ['PDF'] },
      { nom: 'Justificatif de domicile', obligatoire: true, description: 'Preuve de résidence en France', formats: ['PDF'] },
    ],
    risquesJuridiques: [
      'Délai très court (48h à 30 jours selon OQTF)',
      'Expulsion immédiate si OQTF sans délai',
      'Interdiction de retour sur le territoire (IRTF)',
    ],
    recoursDisponibles: [
      'Référé-liberté au tribunal administratif (48h)',
      'Recours en annulation de l\'OQTF (7 jours)',
      'Demande d\'aide juridictionnelle d\'urgence',
    ],
  },

  // === ASILE ===
  'demande-asile': {
    type: 'Demande d\'asile',
    categorie: 'Protection internationale',
    description: 'Demande de statut de réfugié ou protection subsidiaire',
    delaiMoyen: '180',
    urgence: 'urgent',
    documentsNecessaires: [
      { nom: 'Pièce d\'identité', obligatoire: true, description: 'Passeport, carte d\'identité ou à défaut photos', formats: ['PDF', 'JPEG'] },
      { nom: 'Récit détaillé', obligatoire: true, description: 'Récit des persécutions subies', formats: ['PDF', 'DOCX'] },
      { nom: 'Preuves de persécutions', obligatoire: false, description: 'Certificats médicaux, articles de presse', formats: ['PDF', 'JPEG'] },
      { nom: 'Justificatif de domicile', obligatoire: true, description: 'Hébergement en France', formats: ['PDF'] },
      { nom: 'Attestation OFII', obligatoire: true, description: 'Enregistrement de la demande', formats: ['PDF'] },
    ],
    risquesJuridiques: [
      'Procédure Dublin si empreintes dans autre UE',
      'Placement en centre de rétention possible',
      'Rejet OFPRA = recours CNDA obligatoire',
    ],
    recoursDisponibles: [
      'Recours devant la CNDA (1 mois après rejet OFPRA)',
      'Nouvelle demande de réexamen si éléments nouveaux',
    ],
  },

  // === REGROUPEMENT FAMILIAL ===
  'regroupement-familial': {
    type: 'Regroupement familial',
    categorie: 'Famille',
    description: 'Faire venir conjoint et enfants en France',
    delaiMoyen: '180',
    urgence: 'normal',
    documentsNecessaires: [
      { nom: 'Formulaire cerfa', obligatoire: true, description: 'Cerfa n°11436', formats: ['PDF'] },
      { nom: 'Titre de séjour', obligatoire: true, description: 'Validité > 1 an', formats: ['PDF'] },
      { nom: 'Justificatif de ressources', obligatoire: true, description: 'SMIC sur 12 mois', formats: ['PDF'] },
      { nom: 'Justificatif de logement', obligatoire: true, description: 'Bail + attestation surface suffisante', formats: ['PDF'] },
      { nom: 'Actes d\'état civil', obligatoire: true, description: 'Mariage, naissances avec traduction', formats: ['PDF'] },
    ],
    risquesJuridiques: [
      'Refus si ressources < SMIC',
      'Refus si logement trop petit',
      'Contrôle de l\'authenticité des documents',
    ],
    recoursDisponibles: [
      'Recours gracieux si conditions remplies',
      'Tribunal administratif',
    ],
  },
};

/**
 * Détecter le type de procédure depuis un email
 */
export function detectProcedureCESEDA(subject: string, body: string): ProcedureCESEDA | null {
  const text = `${subject} ${body}`.toLowerCase();

  // Détection par mots-clés
  if (text.includes('oqtf') || text.includes('obligation de quitter')) {
    return PROCEDURES_CESEDA['oqtf-recours'];
  }
  if (text.includes('asile') || text.includes('réfugié') || text.includes('ofpra')) {
    return PROCEDURES_CESEDA['demande-asile'];
  }
  if (text.includes('naturalisation') || text.includes('nationalité française')) {
    return PROCEDURES_CESEDA['naturalisation'];
  }
  if (text.includes('regroupement familial')) {
    return PROCEDURES_CESEDA['regroupement-familial'];
  }
  if (text.includes('visa')) {
    return PROCEDURES_CESEDA['visa-long-sejour'];
  }
  if (text.includes('étudiant') || text.includes('université')) {
    return PROCEDURES_CESEDA['titre-sejour-etudiant'];
  }
  if (text.includes('vie privée') || text.includes('conjoint') || text.includes('mariage')) {
    return PROCEDURES_CESEDA['titre-sejour-vie-privee'];
  }
  if (text.includes('titre de séjour') || text.includes('salarié') || text.includes('travail')) {
    return PROCEDURES_CESEDA['titre-sejour-salarie'];
  }

  return null;
}
