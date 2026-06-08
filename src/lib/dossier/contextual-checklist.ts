/**
 * Génération contextuelle de checklist de documents.
 *
 * Contrairement aux templates statiques (checklist-templates.ts),
 * ce service génère une liste adaptée à la SITUATION SPÉCIFIQUE du client :
 * - Type de procédure
 * - Situation familiale (enfants, conjoint)
 * - Situation médicale
 * - Situation professionnelle
 * - Éléments déjà fournis
 */

import { ChecklistTemplate } from './checklist-templates';

export interface ClientContext {
  typeDossier: string;
  hasChildren?: boolean;
  childrenCount?: number;
  hasSpouse?: boolean;
  spouseHasTitle?: boolean;
  hasMedicalIssue?: boolean;
  isEmployed?: boolean;
  yearsInFrance?: number;
  hasOwnHousing?: boolean;
  isInRetention?: boolean;
  notificationDate?: string;
  specificNeeds?: string[]; // ex: ['vie_privee_familiale', 'etranger_malade']
}

interface ContextualChecklistItem extends ChecklistTemplate {
  reason: string; // Pourquoi ce document est demandé
  deadline?: string; // Date limite si applicable
  helpText?: string; // Aide pour le client
}

/**
 * Génère une checklist contextuelle basée sur la situation réelle du client
 */
export function generateContextualChecklist(ctx: ClientContext): ContextualChecklistItem[] {
  const items: ContextualChecklistItem[] = [];
  const type = ctx.typeDossier.toUpperCase().replace(/[- ]/g, '_');

  // ─── BASE COMMUNE ──────────────────────────────────────────
  items.push(
    { label: 'Passeport ou titre d\'identité', category: 'identite', required: true, reason: 'Identification obligatoire', helpText: 'Copie recto-verso de toutes les pages utilisées' },
    { label: 'Justificatif de domicile (< 3 mois)', category: 'justificatif', required: true, reason: 'Preuve de résidence', helpText: 'Facture EDF, eau, internet ou attestation d\'hébergement + pièce d\'identité de l\'hébergeant' },
    { label: 'Photos d\'identité récentes (x3)', category: 'identite', required: true, reason: 'Pièces administratives standard', helpText: 'Format 35x45mm, fond clair, récentes (< 6 mois)' },
  );

  // ─── OQTF ─────────────────────────────────────────────────
  if (type.includes('OQTF')) {
    items.push(
      { label: 'Copie intégrale de la décision OQTF', category: 'juridique', required: true, reason: 'Pièce fondamentale du recours', helpText: 'Le document notifié par la préfecture, recto-verso' },
      { label: 'Preuve de notification (AR ou PV)', category: 'juridique', required: true, reason: 'Calcul du délai de recours', helpText: 'Accusé de réception ou procès-verbal de notification' },
      { label: 'Avis d\'imposition ou de non-imposition', category: 'justificatif', required: true, reason: 'Preuve de contribution fiscale (Art. 8 CEDH)', helpText: 'Les 3 dernières années si possible' },
    );

    if (ctx.isInRetention) {
      items.push(
        { label: 'Procès-verbal de placement en rétention', category: 'juridique', required: true, reason: 'Contestation des conditions de rétention', helpText: 'Demandez une copie au greffe du CRA' },
        { label: 'Notification des droits en rétention', category: 'juridique', required: true, reason: 'Vérification du respect des droits (Art. L743-1)', helpText: 'Document remis à l\'arrivée au CRA' },
      );
    }
  }

  // ─── ASILE ─────────────────────────────────────────────────
  if (type.includes('ASILE')) {
    items.push(
      { label: 'Récit de vie détaillé et chronologique', category: 'juridique', required: true, reason: 'Fondement de la demande d\'asile', helpText: 'Précisez les dates, lieux, auteurs de persécutions. Soyez chronologique.' },
      { label: 'Formulaire OFPRA complété', category: 'juridique', required: true, reason: 'Demande officielle', helpText: 'Remplir avec soin, en français. Nous pouvons vous aider.' },
      { label: 'Attestation de demande d\'asile (ADA)', category: 'juridique', required: true, reason: 'Preuve du statut de demandeur', helpText: 'Délivrée par le guichet unique' },
      { label: 'Preuves de persécutions', category: 'justificatif', required: true, reason: 'Étayer le récit (Convention de Genève)', helpText: 'Photos, articles de presse, captures d\'écran, lettres de menace, témoignages' },
    );
  }

  // ─── TITRE DE SÉJOUR ───────────────────────────────────────
  if (type.includes('TITRE') || type.includes('SEJOUR')) {
    items.push(
      { label: 'Ancien titre de séjour ou récépissé', category: 'identite', required: true, reason: 'Continuité du droit au séjour', helpText: 'Copie recto-verso' },
      { label: 'Timbres fiscaux', category: 'document', required: true, reason: 'Obligation légale pour délivrance', helpText: 'Montant variable selon le titre (225€ à 269€). Achat en ligne sur timbres.impots.gouv.fr' },
    );

    if (ctx.isEmployed) {
      items.push(
        { label: 'Contrat de travail en cours', category: 'justificatif', required: true, reason: 'Justificatif d\'activité professionnelle', helpText: 'CDI, CDD, ou promesse d\'embauche' },
        { label: 'Bulletins de salaire (3 derniers mois)', category: 'justificatif', required: true, reason: 'Preuve de revenus', helpText: 'Les 3 derniers mois minimum' },
        { label: 'Attestation employeur', category: 'justificatif', required: false, reason: 'Confirme l\'emploi actuel', helpText: 'Sur papier à en-tête de l\'entreprise' },
      );
    }
  }

  // ─── NATURALISATION ────────────────────────────────────────
  if (type.includes('NATURALISATION')) {
    items.push(
      { label: 'Formulaire CERFA 12753*02 complété', category: 'document', required: true, reason: 'Formulaire officiel de demande', helpText: 'Téléchargeable sur service-public.fr' },
      { label: 'Acte de naissance + traduction assermentée', category: 'identite', required: true, reason: 'État civil obligatoire', helpText: 'Traduction par un traducteur assermenté auprès d\'une cour d\'appel' },
      { label: 'Titre de séjour en cours de validité', category: 'identite', required: true, reason: 'Preuve de résidence régulière', helpText: 'Copie recto-verso' },
      { label: 'Attestation niveau B1 en français', category: 'document', required: true, reason: 'Condition légale (Art. 21-24 Code civil)', helpText: 'TCF, TEF, DELF B1, ou diplôme français' },
      { label: 'Casier judiciaire du pays d\'origine', category: 'juridique', required: true, reason: 'Condition de moralité', helpText: 'Moins de 3 mois, apostillé ou légalisé' },
      { label: 'Justificatifs de résidence continue (5 ans)', category: 'justificatif', required: true, reason: 'Art. 21-15 Code civil', helpText: 'Avis d\'imposition, quittances, contrats... pour chaque année' },
      { label: 'Avis d\'imposition (3 dernières années)', category: 'justificatif', required: true, reason: 'Contribution fiscale et revenus', helpText: 'Téléchargeable sur impots.gouv.fr' },
    );
  }

  // ─── REGROUPEMENT FAMILIAL ─────────────────────────────────
  if (type.includes('REGROUPEMENT')) {
    items.push(
      { label: 'Titre de séjour du demandeur (> 1 an)', category: 'identite', required: true, reason: 'Condition de résidence régulière', helpText: 'Le titre doit avoir une validité supérieure à 1 an' },
      { label: 'Acte de mariage traduit et légalisé', category: 'identite', required: true, reason: 'Preuve du lien familial', helpText: 'Traduction assermentée + apostille ou légalisation' },
      { label: 'Justificatifs de revenus (12 derniers mois)', category: 'justificatif', required: true, reason: 'SMIC minimum exigé', helpText: 'Bulletins de salaire des 12 derniers mois' },
      { label: 'Justificatif de logement conforme', category: 'justificatif', required: true, reason: 'Surface minimale requise (Art. R434-20)', helpText: 'Bail + attestation de surface. Normes : 22m² pour 2 personnes, +10m² par personne supplémentaire' },
      { label: 'Formulaire CERFA 11436*05', category: 'document', required: true, reason: 'Formulaire officiel de demande', helpText: 'Téléchargeable sur service-public.fr' },
    );
  }

  // ─── CONTEXTE FAMILIAL ─────────────────────────────────────
  if (ctx.hasChildren) {
    items.push(
      { label: `Certificats de scolarité enfants (x${ctx.childrenCount || '?'})`, category: 'justificatif', required: true, reason: 'Intérêt supérieur de l\'enfant (Art. 3-1 CIDE)', helpText: 'Année en cours, pour chaque enfant scolarisé' },
      { label: 'Actes de naissance des enfants', category: 'identite', required: true, reason: 'Preuve du lien de filiation', helpText: 'Avec traduction si étrangers' },
    );
  }

  if (ctx.hasSpouse) {
    items.push(
      { label: 'Titre de séjour du conjoint', category: 'identite', required: ctx.spouseHasTitle || false, reason: 'Vie familiale en France (Art. 8 CEDH)', helpText: 'Copie recto-verso' },
      { label: 'Acte de mariage ou PACS', category: 'identite', required: true, reason: 'Preuve de la vie commune', helpText: 'Avec traduction assermentée si nécessaire' },
    );
  }

  // ─── CONTEXTE MÉDICAL ──────────────────────────────────────
  if (ctx.hasMedicalIssue) {
    items.push(
      { label: 'Certificat médical détaillé (médecin traitant)', category: 'medical', required: true, reason: 'Attestation de l\'état de santé', helpText: 'Doit préciser la pathologie, les traitements, et la nécessité de soins en France' },
      { label: 'Ordonnances et comptes-rendus médicaux', category: 'medical', required: true, reason: 'Preuve de suivi médical continu', helpText: 'Documents récents montrant le traitement en cours' },
      { label: 'Attestation ALD ou prise en charge CPAM', category: 'medical', required: false, reason: 'Prouve la gravité et le suivi', helpText: 'Si applicable à votre situation' },
    );

    if (ctx.specificNeeds?.includes('etranger_malade')) {
      items.push(
        { label: 'Rapport médical OFII (formulaire dédié)', category: 'medical', required: true, reason: 'Art. L425-9 CESEDA — étranger malade', helpText: 'À faire remplir par un médecin agréé, sous pli confidentiel' },
        { label: 'Preuve d\'indisponibilité des soins dans le pays d\'origine', category: 'medical', required: false, reason: 'Renforce le dossier médical', helpText: 'Rapports OMS, articles, attestations de médecins du pays d\'origine' },
      );
    }
  }

  // ─── ANCIENNETÉ EN FRANCE ──────────────────────────────────
  if (ctx.yearsInFrance && ctx.yearsInFrance >= 5) {
    items.push(
      { label: 'Preuves de présence continue (par année)', category: 'justificatif', required: false, reason: `${ctx.yearsInFrance} ans de présence — argument d'intégration fort`, helpText: 'Rassembler au moins 1 preuve par année : avis impôts, quittances, courriers administratifs' },
    );
  }

  if (ctx.yearsInFrance && ctx.yearsInFrance >= 10 && type.includes('TITRE')) {
    items.push(
      { label: 'Preuves de résidence sur 10 ans', category: 'justificatif', required: true, reason: 'Art. L423-23 CESEDA — admission exceptionnelle (10 ans)', helpText: 'Au minimum 3 preuves par année de présence' },
    );
  }

  // Dédupliquer par label
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.label)) return false;
    seen.add(item.label);
    return true;
  });
}

/**
 * Résumé de progression pour affichage
 */
export interface ChecklistProgress {
  total: number;
  received: number;
  validated: number;
  missing: number;
  percentage: number;
  missingRequired: string[];
  isComplete: boolean;
  nextAction: string;
}

export function computeProgress(items: { status: string; required: boolean; label: string }[]): ChecklistProgress {
  const total = items.length;
  const received = items.filter(i => i.status === 'received' || i.status === 'validated').length;
  const validated = items.filter(i => i.status === 'validated').length;
  const missingRequired = items.filter(i => i.status === 'missing' && i.required);
  const percentage = total > 0 ? Math.round((received / total) * 100) : 0;
  const isComplete = missingRequired.length === 0;

  let nextAction = '';
  if (isComplete) {
    nextAction = 'Dossier complet — prêt pour traitement';
  } else if (missingRequired.length <= 2) {
    nextAction = `Plus que ${missingRequired.length} pièce(s) : ${missingRequired.map(i => i.label).join(', ')}`;
  } else {
    nextAction = `${missingRequired.length} pièces obligatoires manquantes`;
  }

  return { total, received, validated, missing: total - received, percentage, missingRequired: missingRequired.map(i => i.label), isComplete, nextAction };
}
