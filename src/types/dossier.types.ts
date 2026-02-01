/**
 * Types et utilitaires pour la gestion des dossiers
 * Synchronise avec le schema Prisma enrichi
 */

import { Dossier, TacheDossier, EvenementDossier, CommentaireDossier } from './index';

// ============================================
// ENUMS ET CONSTANTES
// ============================================

export const STATUTS_DOSSIER = [
  'nouveau',
  'en_cours',
  'urgent',
  'en_attente',
  'termine',
  'suspendu',
  'archive'
] as const;

export const PRIORITES = [
  'basse',
  'normale',
  'haute',
  'critique'
] as const;

export const PHASES_DOSSIER = [
  'instruction',
  'recours',
  'audience',
  'decision',
  'execution'
] as const;

export const TYPES_DOSSIER_CESEDA = [
  'OQTF',
  'Naturalisation',
  'Asile',
  'TitreSejour',
  'CarteResident',
  'RegroupementFamilial',
  'AppelDecision',
  'Refoulement',
  'AssignationResidence'
] as const;

export const JURIDICTIONS = [
  'Prefecture',
  'Tribunal administratif',
  'Cour administrative d\'appel',
  'CNDA',
  'Conseil d\'etat',
  'Tribunal judiciaire',
  'Cour d\'appel',
  'Cour de cassation'
] as const;

export const TYPES_RECOURS = [
  'Gracieux',
  'Contentieux',
  'Refere',
  'Refere suspension',
  'Refere liberte',
  'Plein contentieux'
] as const;

export const INSTANCES = [
  'Premiere instance',
  'Appel',
  'Cassation'
] as const;

export const MODES_FACTURATION = [
  'forfait',
  'horaire',
  'resultat',
  'mixte'
] as const;

export const NIVEAUX_CONFIDENTIALITE = [
  'public',
  'normal',
  'confidentiel',
  'secret'
] as const;

export const CANAUX_CONTACT = [
  'email',
  'telephone',
  'courrier',
  'visio'
] as const;

export const FREQUENCES_RELANCE = [
  'hebdomadaire',
  'mensuelle',
  'trimestrielle'
] as const;

// ============================================
// TYPES HELPERS
// ============================================

export type StatutDossier = typeof STATUTS_DOSSIER[number];
export type Priorite = typeof PRIORITES[number];
export type PhaseDossier = typeof PHASES_DOSSIER[number];
export type TypeDossierCeseda = typeof TYPES_DOSSIER_CESEDA[number];
export type Juridiction = typeof JURIDICTIONS[number];
export type TypeRecours = typeof TYPES_RECOURS[number];
export type Instance = typeof INSTANCES[number];
export type ModeFacturation = typeof MODES_FACTURATION[number];
export type NiveauConfidentialite = typeof NIVEAUX_CONFIDENTIALITE[number];
export type CanalContact = typeof CANAUX_CONTACT[number];
export type FrequenceRelance = typeof FREQUENCES_RELANCE[number];

// ============================================
// INTERFACES eTENDUES
// ============================================

/**
 * Dossier avec toutes ses relations chargees
 */
export interface DossierComplet {
  id: string;
  numero: string;
  nom: string;
  statut: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  factures: any[];
  documents: any[];
  rendezVous: any[];
  taches: TacheDossier[];
  evenements: EvenementDossier[];
  commentaires: CommentaireDossier[];
  client: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  responsable?: {
    id: string;
    nom: string;
    email: string;
  };
}

/**
 * Vue simplifiee d'un dossier pour les listes
 */
export interface DossierListItem {
  id: string;
  numero: string;
  clientNom: string;
  typeDossier: string;
  statut: StatutDossier;
  priorite: Priorite;
  phase: PhaseDossier;
  dateEcheance?: string | Date;
  responsable?: string;
  nombreTaches?: number;
  nombreEvenements?: number;
  lastActivityAt?: string | Date;
  tags?: string[];
  couleurEtiquette?: string;
}

/**
 * Statistiques d'un dossier
 */
export interface DossierStats {
  nombreDocuments: number;
  nombreFactures: number;
  nombreRendezVous: number;
  nombreTaches: number;
  tachesTerminees: number;
  tachesEnRetard: number;
  nombreEvenements: number;
  nombreCommentaires: number;
  tempsTotal: number; // heures
  montantFacture: number;
  montantPaye: number;
  tauxCompletionTaches: number; // %
  joursOuverts: number;
  prochaineEcheance?: string | Date;
}

/**
 * Filtres pour recherche de dossiers
 */
export interface DossierFilters {
  statuts?: StatutDossier[];
  priorites?: Priorite[];
  phases?: PhaseDossier[];
  typesDossier?: string[];
  responsables?: string[];
  clients?: string[];
  juridictions?: string[];
  dateCreationDebut?: string | Date;
  dateCreationFin?: string | Date;
  dateEcheanceDebut?: string | Date;
  dateEcheanceFin?: string | Date;
  tags?: string[];
  recherche?: string; // Recherche textuelle
  confidentialite?: NiveauConfidentialite[];
}

/**
 * Options de tri
 */
export interface DossierSortOptions {
  champ: 'numero' | 'dateCreation' | 'dateEcheance' | 'priorite' | 'lastActivityAt' | 'clientNom';
  ordre: 'asc' | 'desc';
}

/**
 * Creation/Mise a jour de dossier
 */
export interface DossierInput {
  numero?: string; // Genere automatiquement si absent
  clientId: string;
  typeDossier: string;
  articleCeseda?: string;
  categorieJuridique?: string;
  
  statut?: StatutDossier;
  priorite?: Priorite;
  phase?: PhaseDossier;
  
  dateOuverture?: string | Date;
  dateEcheance?: string | Date;
  
  juridiction?: string;
  typeRecours?: string;
  instanceRecours?: string;
  
  responsableId?: string;
  collaborateurs?: string[];
  
  objet?: string;
  description?: string;
  contexteLegal?: string;
  notes?: string;
  
  honorairesEstimes?: number;
  modeFacturation?: ModeFacturation;
  tauxHoraire?: number;
  
  niveauConfidentialite?: NiveauConfidentialite;
  
  tags?: string[];
  couleurEtiquette?: string;
  emoji?: string;
}

// ============================================
// TYPES POUR TaCHES
// ============================================

export const TYPES_TACHE = [
  'administrative',
  'juridique',
  'client',
  'interne'
] as const;

export const STATUTS_TACHE = [
  'a_faire',
  'en_cours',
  'bloquee',
  'terminee',
  'annulee'
] as const;

export type TypeTache = typeof TYPES_TACHE[number];
export type StatutTache = typeof STATUTS_TACHE[number];

export interface TacheInput {
  dossierId: string;
  titre: string;
  description?: string;
  type: TypeTache;
  priorite: Priorite;
  assigneA?: string;
  dateEcheance?: string | Date;
  tempsEstime?: number; // minutes
  dependances?: string[];
  sousCategorie?: string;
}

// ============================================
// TYPES POUR eVeNEMENTS
// ============================================

export const TYPES_EVENEMENT = [
  'action',
  'decision',
  'courrier',
  'appel',
  'email',
  'reunion',
  'audience',
  'depot'
] as const;

export const IMPORTANCES_EVENEMENT = [
  'critique',
  'importante',
  'normale',
  'mineure'
] as const;

export const CATEGORIES_EVENEMENT = [
  'procedure',
  'communication',
  'finance',
  'administratif'
] as const;

export type TypeEvenement = typeof TYPES_EVENEMENT[number];
export type ImportanceEvenement = typeof IMPORTANCES_EVENEMENT[number];
export type CategorieEvenement = typeof CATEGORIES_EVENEMENT[number];

export interface EvenementInput {
  dossierId: string;
  type: TypeEvenement;
  titre: string;
  description?: string;
  dateEvenement?: string | Date;
  importance?: ImportanceEvenement;
  categorie?: CategorieEvenement;
  localisation?: string;
  duree?: number; // minutes
  participants?: Array<{
    nom: string;
    role: string;
    email?: string;
  }>;
  resultats?: string;
  suitesDonner?: string;
  visible?: boolean;
}

// ============================================
// TYPES POUR COMMENTAIRES
// ============================================

export const TYPES_COMMENTAIRE = [
  'note',
  'analyse',
  'remarque',
  'question',
  'reponse'
] as const;

export type TypeCommentaire = typeof TYPES_COMMENTAIRE[number];

export interface CommentaireInput {
  dossierId: string;
  contenu: string;
  type?: TypeCommentaire;
  important?: boolean;
  prive?: boolean;
  reponseA?: string;
  mentions?: string[];
  tags?: string[];
}

// ============================================
// HELPERS ET UTILITAIRES
// ============================================

/**
 * Verifie si un dossier est en retard
 */
export function isDossierEnRetard(dossier: Dossier): boolean {
  if (!dossier.dateEcheance) return false;
  const echeance = new Date(dossier.dateEcheance);
  const maintenant = new Date();
  return echeance < maintenant && dossier.statut !== 'termine' && dossier.statut !== 'archive';
}

/**
 * Calcule le nombre de jours avant echeance
 */
export function joursAvantEcheance(dossier: Dossier): number | null {
  if (!dossier.dateEcheance) return null;
  const echeance = new Date(dossier.dateEcheance);
  const maintenant = new Date();
  const diff = echeance.getTime() - maintenant.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Retourne la couleur associee a une priorite
 */
export function couleurPriorite(priorite: Priorite): string {
  const couleurs: Record<Priorite, string> = {
    critique: '#DC2626', // red-600
    haute: '#F59E0B',    // amber-500
    normale: '#3B82F6',   // blue-500
    basse: '#10B981'      // green-500
  };
  return couleurs[priorite];
}

/**
 * Retourne la couleur associee a un statut
 */
export function couleurStatut(statut: StatutDossier): string {
  const couleurs: Record<StatutDossier, string> = {
    nouveau: '#8B5CF6',     // violet-500
    en_cours: '#3B82F6',    // blue-500
    urgent: '#DC2626',      // red-600
    en_attente: '#F59E0B',  // amber-500
    termine: '#10B981',     // green-500
    suspendu: '#6B7280',    // gray-500
    archive: '#9CA3AF'      // gray-400
  };
  return couleurs[statut];
}

/**
 * Genere un numero de dossier
 */
export function genererNumeroDossier(annee?: number, sequence?: number): string {
  const year = annee || new Date().getFullYear();
  const seq = (sequence || 1).toString().padStart(4, '0');
  return `D-${year}-${seq}`;
}

/**
 * Formate le nom complet d'un client
 */
export function formatNomClient(client: { firstName: string; lastName: string; civilite?: string }): string {
  const civilite = client.civilite ? `${client.civilite} ` : '';
  return `${civilite}${client.firstName} ${client.lastName.toUpperCase()}`;
}

/**
 * Calcule le taux de progression d'un dossier
 */
export function calculerProgression(stats: DossierStats): number {
  if (stats.nombreTaches === 0) return 0;
  return Math.round((stats.tachesTerminees / stats.nombreTaches) * 100);
}

/**
 * Determine l'urgence basee sur l'echeance
 */
export function determinerUrgence(dossier: Dossier): 'critique' | 'haute' | 'normale' | 'basse' {
  const jours = joursAvantEcheance(dossier);
  if (jours === null) return 'normale';
  
  if (jours < 0) return 'critique';
  if (jours <= 2) return 'critique';
  if (jours <= 7) return 'haute';
  if (jours <= 30) return 'normale';
  return 'basse';
}

// ============================================
// TYPES POUR NOUVELLE ARCHITECTURE CLIENT/AVOCAT
// ============================================

import type { StatutUI, PrioriteUI, TypeDossier } from '../lib/constants/dossier.constants'

// Interface pour les donnes venant de la DB (Prisma)
export interface DossierDB {
  id: string
  numero: string
  typeDossier: string
  objet: string | null
  statut: string
  priorite: string
  dateCreation: Date
  dateEcheance: Date | null
  notes: string | null
  tenantId: string
  clientId: string
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  _count?: {
    documents: number
    echeances: number
  }
}

// Interface pour l'affichage UI (front-end)
export interface DossierUI {
  id: string
  numeroDossier: string
  typeDossier: string
  objetDemande: string
  statut: string
  priorite: string
  dateCreation: Date | string
  dateEcheance?: Date | string | null
  client: {
    nom: string
    prenom: string
    email: string
  }
  _count?: {
    documents: number
    echeances: number
  }
}

// DTOs pour les APIs
export interface CreateDossierDTO {
  clientId: string
  typeDossier: string
  objetDemande: string
  priorite?: string
  statut?: string
  dateEcheance?: string
  notes?: string
}

export interface CreateDemandeClientDTO {
  typeDossier: string
  objetDemande: string
  dateEcheance?: string
  urgence?: boolean
  complementInfo?: string
}

export interface UpdateDossierDTO {
  typeDossier?: string
  objetDemande?: string
  priorite?: string
  statut?: string
  dateEcheance?: string
  notes?: string
}
