/**
 * Templates de checklist par type de procédure CESEDA.
 * Génère automatiquement la liste des pièces requises à la création du dossier.
 */

export interface ChecklistTemplate {
  label: string;
  category: 'identite' | 'document' | 'justificatif' | 'medical' | 'juridique';
  required: boolean;
}

export const CHECKLIST_TEMPLATES: Record<string, ChecklistTemplate[]> = {
  OQTF: [
    { label: 'Copie OQTF notifiee', category: 'juridique', required: true },
    { label: 'Passeport ou titre identite', category: 'identite', required: true },
    { label: 'Justificatif de domicile', category: 'justificatif', required: true },
    { label: 'Certificats de scolarite enfants', category: 'justificatif', required: false },
    { label: 'Avis imposition ou non-imposition', category: 'justificatif', required: true },
    { label: 'Attestation employeur ou fiches de paie', category: 'justificatif', required: false },
    { label: 'Certificat medical (si applicable)', category: 'medical', required: false },
    { label: 'Preuves integration (attestations, diplomes)', category: 'justificatif', required: false },
    { label: 'Photos identite recentes', category: 'identite', required: true },
  ],
  OQTF_SANS_DELAI: [
    { label: 'Copie OQTF sans delai notifiee', category: 'juridique', required: true },
    { label: 'Passeport ou titre identite', category: 'identite', required: true },
    { label: 'Justificatif de domicile', category: 'justificatif', required: true },
    { label: 'Tout element urgence (medical, familial)', category: 'justificatif', required: true },
    { label: 'Photos identite', category: 'identite', required: true },
  ],
  Asile: [
    { label: 'Recit de vie detaille', category: 'juridique', required: true },
    { label: 'Passeport ou document de voyage', category: 'identite', required: true },
    { label: 'Certificat medical (traces violences)', category: 'medical', required: true },
    { label: 'Preuves de persecution (articles, photos, temoignages)', category: 'justificatif', required: true },
    { label: 'Attestation OFPRA ou convocation', category: 'juridique', required: true },
    { label: 'Photos identite', category: 'identite', required: true },
    { label: 'Justificatif hebergement (CADA ou autre)', category: 'justificatif', required: true },
    { label: 'Traductions certifiees documents etrangers', category: 'document', required: false },
  ],
  TitreSejour: [
    { label: 'Passeport en cours de validite', category: 'identite', required: true },
    { label: 'Justificatif de domicile (moins de 3 mois)', category: 'justificatif', required: true },
    { label: 'Photos identite recentes', category: 'identite', required: true },
    { label: 'Fiches de paie (3 derniers mois)', category: 'justificatif', required: true },
    { label: 'Contrat de travail ou attestation employeur', category: 'justificatif', required: true },
    { label: 'Avis imposition', category: 'justificatif', required: true },
    { label: 'Attestation assurance maladie', category: 'justificatif', required: false },
    { label: 'Acte de naissance traduit', category: 'identite', required: false },
    { label: 'Timbres fiscaux (ou preuve achat)', category: 'document', required: true },
  ],
  Naturalisation: [
    { label: 'Passeport', category: 'identite', required: true },
    { label: 'Titre de sejour en cours', category: 'identite', required: true },
    { label: 'Acte de naissance traduit', category: 'identite', required: true },
    { label: 'Justificatif domicile', category: 'justificatif', required: true },
    { label: 'Avis imposition (3 dernieres annees)', category: 'justificatif', required: true },
    { label: 'Attestation employeur + fiches de paie', category: 'justificatif', required: true },
    { label: 'Diplome ou attestation niveau B1 francais', category: 'document', required: true },
    { label: 'Casier judiciaire (pays origine)', category: 'juridique', required: true },
    { label: 'Certificats scolarite enfants', category: 'justificatif', required: false },
    { label: 'Photos identite', category: 'identite', required: true },
  ],
  RegroupementFamilial: [
    { label: 'Passeport demandeur', category: 'identite', required: true },
    { label: 'Titre de sejour demandeur', category: 'identite', required: true },
    { label: 'Acte de mariage traduit', category: 'identite', required: true },
    { label: 'Actes naissance enfants traduits', category: 'identite', required: false },
    { label: 'Justificatif domicile (surface + conformite)', category: 'justificatif', required: true },
    { label: 'Fiches de paie (12 derniers mois)', category: 'justificatif', required: true },
    { label: 'Avis imposition', category: 'justificatif', required: true },
    { label: 'Attestation assurance maladie', category: 'justificatif', required: true },
    { label: 'Photos identite famille', category: 'identite', required: true },
  ],
};

/**
 * Génère l'adresse email inbox unique pour un dossier
 */
export function generateDossierInboxEmail(numero: string): string {
  const slug = numero.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${slug}@inbox.memolib.space`;
}

/**
 * Retourne la checklist template pour un type de dossier
 */
export function getChecklistForType(typeDossier: string): ChecklistTemplate[] {
  return CHECKLIST_TEMPLATES[typeDossier] || CHECKLIST_TEMPLATES['TitreSejour'];
}
