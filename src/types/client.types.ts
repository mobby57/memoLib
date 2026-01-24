/**
 * Types et utilitaires pour la gestion des clients
 * Synchronise avec le schema Prisma enrichi
 */

import { Client } from './index';

// ============================================
// ENUMS ET CONSTANTES
// ============================================

export const CIVILITES = ['M.', 'Mme', 'Autre'] as const;

export const STATUTS_CLIENT = [
  'actif',
  'inactif',
  'archive',
  'prospect'
] as const;

export const SITUATIONS_FAMILIALES = [
  'celibataire',
  'marie',
  'pacse',
  'divorce',
  'veuf'
] as const;

export const SITUATIONS_PROFESSIONNELLES = [
  'emploi_cdi',
  'emploi_cdd',
  'chomage',
  'etudiant',
  'retraite',
  'sans_emploi'
] as const;

export const CATEGORIES_CLIENT = [
  'particulier',
  'entreprise',
  'association'
] as const;

export const QUALITES_CLIENT = [
  'vip',
  'standard',
  'risque'
] as const;

export const CANAUX_COMMUNICATION = [
  'email',
  'telephone',
  'courrier',
  'sms'
] as const;

export const FREQUENCES_CONTACT = [
  'hebdomadaire',
  'mensuelle',
  'trimestrielle'
] as const;

export const NIVEAUX_CONFIDENTIALITE_CLIENT = [
  'public',
  'normal',
  'confidentiel'
] as const;

// ============================================
// TYPES HELPERS
// ============================================

export type Civilite = typeof CIVILITES[number];
export type StatutClient = typeof STATUTS_CLIENT[number];
export type SituationFamiliale = typeof SITUATIONS_FAMILIALES[number];
export type SituationProfessionnelle = typeof SITUATIONS_PROFESSIONNELLES[number];
export type CategorieClient = typeof CATEGORIES_CLIENT[number];
export type QualiteClient = typeof QUALITES_CLIENT[number];
export type CanalCommunication = typeof CANAUX_COMMUNICATION[number];
export type FrequenceContact = typeof FREQUENCES_CONTACT[number];
export type NiveauConfidentialiteClient = typeof NIVEAUX_CONFIDENTIALITE_CLIENT[number];

// ============================================
// INTERFACES eTENDUES
// ============================================

/**
 * Client avec toutes ses relations
 */
export interface ClientComplet {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  dossiers: Array<{
    id: string;
    numero: string;
    typeDossier: string;
    statut: string;
    dateCreation: string | Date;
  }>;
  stats: ClientStats;
}

/**
 * Vue simplifiee pour les listes
 */
export interface ClientListItem {
  id: string;
  civilite?: Civilite;
  firstName: string;
  lastName: string;
  nomComplet: string;
  email: string;
  telephone?: string;
  status: StatutClient;
  nombreDossiers: number;
  dossiersActifs: number;
  dernierContact?: string | Date;
  tags?: string[];
  qualite?: QualiteClient;
  couleurEtiquette?: string;
  emoji?: string;
}

/**
 * Statistiques d'un client
 */
export interface ClientStats {
  nombreDossiers: number;
  dossiersActifs: number;
  dossiersTermines: number;
  tauxReussite: number; // %
  chiffreAffaires: number;
  honorairesTotaux: number;
  montantPaye: number;
  montantEnAttente: number;
  tempsTotal: number; // heures
  anciennete: number; // jours depuis premiere visite
  dernierContact?: string | Date;
  prochaineEcheance?: string | Date;
  satisfactionMoyenne?: number; // 1-5
}

/**
 * Filtres pour recherche de clients
 */
export interface ClientFilters {
  statuts?: StatutClient[];
  categories?: CategorieClient[];
  qualites?: QualiteClient[];
  nationalites?: string[];
  situationsFamiliales?: SituationFamiliale[];
  situationsPro?: SituationProfessionnelle[];
  dateCreationDebut?: string | Date;
  dateCreationFin?: string | Date;
  tags?: string[];
  recherche?: string;
  avecDossiersActifs?: boolean;
  sansDossier?: boolean;
}

/**
 * Options de tri
 */
export interface ClientSortOptions {
  champ: 'lastName' | 'firstName' | 'createdAt' | 'lastActivityAt' | 'nombreDossiers' | 'chiffreAffaires';
  ordre: 'asc' | 'desc';
}

/**
 * Creation/Mise a jour de client
 */
export interface ClientInput {
  // Obligatoires
  firstName: string;
  lastName: string;
  email: string;
  
  // Identite
  civilite?: Civilite;
  nomNaissance?: string;
  prenomUsuel?: string;
  dateOfBirth?: string | Date;
  lieuNaissance?: string;
  nationality?: string;
  nationaliteOrigine?: string;
  
  // Contacts
  emailSecondaire?: string;
  telephone?: string;
  phoneSecondaire?: string;
  telephoneUrgence?: string;
  
  // Adresse
  address?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  
  // Adresse correspondance
  adresseCorrespondance?: string;
  codePostalCorrespondance?: string;
  villeCorrespondance?: string;
  paysCorrespondance?: string;
  
  // Documents
  passportNumber?: string;
  passportExpiry?: string | Date;
  passportCountry?: string;
  idCardNumber?: string;
  idCardExpiry?: string | Date;
  titreSejourNumber?: string;
  titreSejourType?: string;
  titreSejourExpiry?: string | Date;
  numeroOFII?: string;
  numeroAgrefe?: string;
  
  // Situation
  situationFamiliale?: SituationFamiliale;
  nombreEnfants?: number;
  personneACharge?: number;
  profession?: string;
  employeur?: string;
  secteurActivite?: string;
  situationPro?: SituationProfessionnelle;
  revenusAnnuels?: number;
  
  // Bancaire
  iban?: string;
  bic?: string;
  titulaireBancaire?: string;
  
  // Contact urgence
  contactUrgenceNom?: string;
  contactUrgenceLien?: string;
  contactUrgenceTel?: string;
  
  // Preferences
  languePrincipale?: string;
  languesSecondaires?: string[];
  prefCommunication?: CanalCommunication;
  accepteNotifications?: boolean;
  accepteNewsletter?: boolean;
  
  // Classification
  status?: StatutClient;
  categorie?: CategorieClient;
  source?: string;
  qualite?: QualiteClient;
  
  // Financier
  tarifHoraire?: number;
  plafondHoraire?: number;
  modeFacturation?: 'forfait' | 'horaire' | 'resultat';
  delaiPaiement?: number;
  
  // Suivi
  origineClient?: string;
  frequenceContact?: FrequenceContact;
  
  // Confidentialite
  niveauConfidentialite?: NiveauConfidentialiteClient;
  consentementRGPD?: boolean;
  
  // Metadonnees
  notes?: string;
  notesPrivees?: string;
  tags?: string[];
  couleurEtiquette?: string;
  emoji?: string;
  
  champsPersonnalises?: Record<string, any>;
}

/**
 * Validation de document d'identite
 */
export interface DocumentIdentite {
  type: 'passeport' | 'carte_identite' | 'titre_sejour';
  numero: string;
  dateExpiration?: string | Date;
  pays?: string;
  valide: boolean;
  joursAvantExpiration?: number;
}

/**
 * Contact d'urgence
 */
export interface ContactUrgence {
  nom: string;
  lien: string; // relation avec le client
  telephone: string;
  email?: string;
}

/**
 * Adresse complete
 */
export interface Adresse {
  ligne1: string;
  ligne2?: string;
  codePostal: string;
  ville: string;
  pays: string;
  type: 'principale' | 'correspondance';
}

// ============================================
// HELPERS ET UTILITAIRES
// ============================================

/**
 * Formate le nom complet d'un client
 */
export function formatNomComplet(client: {
  civilite?: string;
  firstName: string;
  lastName: string;
  prenomUsuel?: string;
}): string {
  const civilite = client.civilite ? `${client.civilite} ` : '';
  const prenom = client.prenomUsuel || client.firstName;
  return `${civilite}${prenom} ${client.lastName.toUpperCase()}`;
}

/**
 * Formate le nom avec initiales
 */
export function formatNomInitiales(client: {
  firstName: string;
  lastName: string;
}): string {
  const initiale = client.firstName.charAt(0).toUpperCase();
  return `${initiale}. ${client.lastName.toUpperCase()}`;
}

/**
 * Calcule l'age du client
 */
export function calculerAge(dateNaissance: string | Date): number | null {
  if (!dateNaissance) return null;
  
  const naissance = new Date(dateNaissance);
  const aujourdhui = new Date();
  let age = aujourdhui.getFullYear() - naissance.getFullYear();
  const mois = aujourdhui.getMonth() - naissance.getMonth();
  
  if (mois < 0 || (mois === 0 && aujourdhui.getDate() < naissance.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Verifie si un document est expire ou va expirer
 */
export function verifierExpirationDocument(dateExpiration?: string | Date, delaiAlerte: number = 30): {
  expire: boolean;
  alerte: boolean;
  joursRestants: number | null;
} {
  if (!dateExpiration) {
    return { expire: false, alerte: false, joursRestants: null };
  }
  
  const expiration = new Date(dateExpiration);
  const maintenant = new Date();
  const diff = expiration.getTime() - maintenant.getTime();
  const joursRestants = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  return {
    expire: joursRestants < 0,
    alerte: joursRestants >= 0 && joursRestants <= delaiAlerte,
    joursRestants
  };
}

/**
 * Retourne tous les documents d'identite d'un client
 */
export function getDocumentsIdentite(client: Client): DocumentIdentite[] {
  const documents: DocumentIdentite[] = [];
  
  if (client.passportNumber) {
    const verification = verifierExpirationDocument(client.passportExpiry);
    documents.push({
      type: 'passeport',
      numero: client.passportNumber,
      dateExpiration: client.passportExpiry,
      pays: client.passportCountry,
      valide: !verification.expire,
      joursAvantExpiration: verification.joursRestants ?? undefined
    });
  }
  
  if (client.idCardNumber) {
    const verification = verifierExpirationDocument(client.idCardExpiry);
    documents.push({
      type: 'carte_identite',
      numero: client.idCardNumber,
      dateExpiration: client.idCardExpiry,
      valide: !verification.expire,
      joursAvantExpiration: verification.joursRestants ?? undefined
    });
  }
  
  if (client.titreSejourNumber) {
    const verification = verifierExpirationDocument(client.titreSejourExpiry);
    documents.push({
      type: 'titre_sejour',
      numero: client.titreSejourNumber,
      dateExpiration: client.titreSejourExpiry,
      valide: !verification.expire,
      joursAvantExpiration: verification.joursRestants ?? undefined
    });
  }
  
  return documents;
}

/**
 * Verifie si le consentement RGPD est valide
 */
export function consentementRGPDValide(client: Client): boolean {
  if (!client.consentementRGPD) return false;
  if (!client.dateConsentementRGPD) return false;
  
  // Le consentement est valide pendant 3 ans
  const dateConsentement = new Date(client.dateConsentementRGPD);
  const maintenant = new Date();
  const diff = maintenant.getTime() - dateConsentement.getTime();
  const joursEcoules = diff / (1000 * 60 * 60 * 24);
  const DUREE_VALIDITE = 3 * 365; // 3 ans
  
  return joursEcoules < DUREE_VALIDITE;
}

/**
 * Genere les initiales du client
 */
export function getInitiales(client: { firstName: string; lastName: string }): string {
  return `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();
}

/**
 * Retourne la couleur associee a une qualite client
 */
export function couleurQualite(qualite?: QualiteClient): string {
  if (!qualite) return '#6B7280'; // gray-500
  
  const couleurs: Record<QualiteClient, string> = {
    vip: '#F59E0B',      // amber-500
    standard: '#3B82F6', // blue-500
    risque: '#DC2626'    // red-600
  };
  
  return couleurs[qualite];
}

/**
 * Retourne la couleur associee au statut
 */
export function couleurStatutClient(statut: StatutClient): string {
  const couleurs: Record<StatutClient, string> = {
    actif: '#10B981',    // green-500
    inactif: '#6B7280',  // gray-500
    archive: '#9CA3AF',  // gray-400
    prospect: '#8B5CF6'  // violet-500
  };
  
  return couleurs[statut];
}

/**
 * Formatte une adresse complete
 */
export function formatAdresse(client: Client, type: 'principale' | 'correspondance' = 'principale'): string {
  if (type === 'correspondance' && client.adresseCorrespondance) {
    const parts = [
      client.adresseCorrespondance,
      client.codePostalCorrespondance && client.villeCorrespondance 
        ? `${client.codePostalCorrespondance} ${client.villeCorrespondance}`
        : null,
      client.paysCorrespondance
    ].filter(Boolean);
    
    return parts.join(', ');
  }
  
  const parts = [
    client.address,
    client.codePostal && client.ville ? `${client.codePostal} ${client.ville}` : null,
    client.pays
  ].filter(Boolean);
  
  return parts.join(', ');
}

/**
 * Verifie si les informations du client sont completes
 */
export function informationsCompletes(client: Client): {
  complet: boolean;
  champsManquants: string[];
  pourcentageComplet: number;
} {
  const champsEssentiels = [
    'firstName',
    'lastName',
    'email',
    'telephone',
    'address',
    'codePostal',
    'ville',
    'dateOfBirth',
    'nationality'
  ];
  
  const champsManquants: string[] = [];
  let champsRemplis = 0;
  
  for (const champ of champsEssentiels) {
    if (client[champ as keyof Client]) {
      champsRemplis++;
    } else {
      champsManquants.push(champ);
    }
  }
  
  const pourcentageComplet = Math.round((champsRemplis / champsEssentiels.length) * 100);
  
  return {
    complet: champsManquants.length === 0,
    champsManquants,
    pourcentageComplet
  };
}

/**
 * Valide un email
 */
export function validerEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valide un numero de telephone francais
 */
export function validerTelephoneFR(telephone: string): boolean {
  // Formats acceptes: 0123456789, 01 23 45 67 89, 01.23.45.67.89, +33123456789
  const regex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return regex.test(telephone);
}

/**
 * Calcule le score de risque du client
 */
export function calculerScoreRisque(client: Client, stats: ClientStats): number {
  let score = 0;
  
  // Retards de paiement
  if (stats.montantEnAttente > 0) {
    const ratioImpaye = stats.montantEnAttente / stats.honorairesTotaux;
    score += ratioImpaye * 30;
  }
  
  // Qualite client
  if (client.qualite === 'risque') score += 20;
  if (client.qualite === 'vip') score -= 10;
  
  // Documents expires
  const documents = getDocumentsIdentite(client);
  const documentsExpires = documents.filter(d => !d.valide).length;
  score += documentsExpires * 10;
  
  // Pas de contact recent
  if (client.dateDernierContact) {
    const jours = Math.floor((Date.now() - new Date(client.dateDernierContact).getTime()) / (1000 * 60 * 60 * 24));
    if (jours > 180) score += 15; // Plus de 6 mois
  }
  
  // Informations incompletes
  const { pourcentageComplet } = informationsCompletes(client);
  score += (100 - pourcentageComplet) * 0.2;
  
  return Math.min(100, Math.max(0, Math.round(score)));
}
