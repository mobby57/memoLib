import { addDays, addMonths, addHours, isWeekend } from 'date-fns';

// 1. Définition de TOUS les types de dossiers CESEDA
export type CategorieCESEDA = 
  | 'SEJOUR' 
  | 'ELOIGNEMENT' 
  | 'ASILE' 
  | 'NATIONALITE';

export type TypeProcedure = 
  // Séjour
  | 'REFUS_TITRE_2MOIS' | 'REFUS_RENOUVELLEMENT_2MOIS' | 'RETRAIT_TITRE_2MOIS'
  // Éloignement
  | 'OQTF_48H' | 'OQTF_7J' | 'OQTF_30J' | 'RETENTION_48H' | 'IRTF_2MOIS'
  // Asile
  | 'REFUS_OFPRA_1MOIS' | 'REFUS_CNDA_2MOIS'
  // Nationalité
  | 'REFUS_NATURALISATION_2MOIS' | 'REFUS_VISA_CRV_2MOIS';

// 2. Configuration des règles métier
interface RegleDelai {
  categorie: CategorieCESEDA;
  duree: number;
  unite: 'heures' | 'jours' | 'mois';
  juridiction: string; // Où on dépose le recours
  description: string;
}

export const CESEDA_TAXONOMY: Record<TypeProcedure, RegleDelai> = {
  // --- SÉJOUR ---
  'REFUS_TITRE_2MOIS': { categorie: 'SEJOUR', duree: 2, unite: 'mois', juridiction: 'Tribunal Administratif', description: 'Refus initial de titre de séjour' },
  'REFUS_RENOUVELLEMENT_2MOIS': { categorie: 'SEJOUR', duree: 2, unite: 'mois', juridiction: 'Tribunal Administratif', description: 'Refus de renouvellement' },
  'RETRAIT_TITRE_2MOIS': { categorie: 'SEJOUR', duree: 2, unite: 'mois', juridiction: 'Tribunal Administratif', description: 'Retrait de titre de séjour' },

  // --- ÉLOIGNEMENT ---
  'OQTF_48H': { categorie: 'ELOIGNEMENT', duree: 48, unite: 'heures', juridiction: 'Tribunal Administratif', description: 'OQTF sans délai (urgence absolue)' },
  'OQTF_7J': { categorie: 'ELOIGNEMENT', duree: 7, unite: 'jours', juridiction: 'Tribunal Administratif', description: 'OQTF avec délai de départ de 7 jours' },
  'OQTF_30J': { categorie: 'ELOIGNEMENT', duree: 30, unite: 'jours', juridiction: 'Tribunal Administratif', description: 'OQTF avec délai de départ de 30 jours' },
  'RETENTION_48H': { categorie: 'ELOIGNEMENT', duree: 48, unite: 'heures', juridiction: 'Juge des Libertés et de la Détention (JLD)', description: 'Contestation de placement en rétention' },
  'IRTF_2MOIS': { categorie: 'ELOIGNEMENT', duree: 2, unite: 'mois', juridiction: 'Tribunal Administratif', description: 'Interdiction de Retour sur le Territoire Français' },

  // --- ASILE ---
  'REFUS_OFPRA_1MOIS': { categorie: 'ASILE', duree: 1, unite: 'mois', juridiction: 'CNDA', description: "Recours contre refus de l'OFPRA" },
  'REFUS_CNDA_2MOIS': { categorie: 'ASILE', duree: 2, unite: 'mois', juridiction: "Conseil d'État", description: 'Recours contre décision de la CNDA' },

  // --- NATIONALITÉ / VISA ---
  'REFUS_NATURALISATION_2MOIS': { categorie: 'NATIONALITE', duree: 2, unite: 'mois', juridiction: 'Tribunal Administratif', description: 'Refus de naturalisation' },
  'REFUS_VISA_CRV_2MOIS': { categorie: 'NATIONALITE', duree: 2, unite: 'mois', juridiction: 'Commission de Recours contre les refus de Visa (CRV)', description: 'Refus de visa' }
};

// 3. Le Moteur de Calcul Universel
export function calculerDateLimiteUniverselle(type: TypeProcedure, dateNotification: Date): Date {
  const regle = CESEDA_TAXONOMY[type];
  if (!regle) throw new Error("Type de procédure inconnu dans la taxonomie");

  // Application des jours francs (on commence le lendemain pour les jours/mois)
  let dateDepart = new Date(dateNotification);
  if (regle.unite !== 'heures') {
    dateDepart.setDate(dateDepart.getDate() + 1);
    dateDepart.setHours(0, 0, 0, 0);
  }

  let dateLimite: Date;
  if (regle.unite === 'heures') {
    dateLimite = addHours(dateNotification, regle.duree);
  } else if (regle.unite === 'jours') {
    dateLimite = addDays(dateDepart, regle.duree);
  } else {
    dateLimite = addMonths(dateDepart, regle.duree);
  }

  // Report des week-ends (sauf si c'est de la rétention ou des heures strictes)
  if (regle.unite !== 'heures') {
    while (isWeekend(dateLimite)) {
      dateLimite = addDays(dateLimite, 1);
    }
  }

  return dateLimite;
}

export function getJuridiction(type: TypeProcedure): string {
  return CESEDA_TAXONOMY[type].juridiction;
}
