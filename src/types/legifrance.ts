/**
 * Types TypeScript pour l'API Légifrance (PISTE)
 * 
 * Documentation officielle: https://developer.aife.economie.gouv.fr/
 */

// ============================================
// TYPES DE RECHERCHE
// ============================================

export type Fond = 
  | 'CODE_ETAT'         // Codes par état juridique
  | 'CODE_DATE'         // Codes par date de version
  | 'LODA_ETAT'         // Lois/ordonnances par état
  | 'LODA_DATE'         // Lois/ordonnances par date
  | 'CETAT'             // Jurisprudence administrative
  | 'JURI'              // Jurisprudence judiciaire
  | 'JORF'              // Journal officiel
  | 'KALI'              // Conventions collectives
  | 'CONSTIT'           // Constitution
  | 'CNIL';             // CNIL

export type TypeRecherche =
  | 'UN_DES_MOTS'
  | 'EXACTE'
  | 'TOUS_LES_MOTS_DANS_UN_CHAMP'
  | 'AUCUN_DES_MOTS'
  | 'AUCUNE_CORRESPONDANCE_A_CETTE_EXPRESSION';

export type TypeChamp =
  | 'ALL'
  | 'TITLE'
  | 'NUM'
  | 'NUM_ARTICLE'
  | 'ARTICLE'
  | 'NUM_AFFAIRE'
  | 'IDCC';

export type SortType =
  | 'PERTINENCE'
  | 'SIGNATURE_DATE_DESC'
  | 'DATE_DESC'
  | 'ID';

export type TypePagination = 'DEFAUT' | 'ARTICLE';

export type TextLegalStatus = 'VIGUEUR' | 'ABROGE' | 'MODIFIE';

// ============================================
// STRUCTURES DE REQUÊTE
// ============================================

export interface Critere {
  valeur: string;
  typeRecherche: TypeRecherche;
  operateur: 'ET' | 'OU';
  proximite?: number;
}

export interface Champ {
  typeChamp: TypeChamp;
  criteres: Critere[];
  operateur: 'ET' | 'OU';
}

export interface DateRange {
  start: string;  // Format: YYYY-MM-DD
  end: string;    // Format: YYYY-MM-DD
}

export interface Filtre {
  facette: string;
  valeurs?: string[];
  valeur?: string;
  singleDate?: number | string;  // Timestamp ou YYYY-MM-DD
  dates?: DateRange;
}

export interface Recherche {
  champs: Champ[];
  filtres?: Filtre[];
  pageNumber: number;
  pageSize: number;
  operateur: 'ET' | 'OU';
  sort: SortType;
  secondSort?: SortType;
  typePagination: TypePagination;
  fromAdvancedRecherche?: boolean;
}

export interface SearchRequest {
  fond: Fond;
  recherche: Recherche;
}

// ============================================
// STRUCTURES DE RÉPONSE
// ============================================

export interface SearchResult {
  results: Array<{
    id: string;
    type: string;
    title?: string;
    numero?: string;
    dateSignature?: string;
    dateDecision?: string;
    nature?: string;
    url?: string;
    summary?: string;
    [key: string]: any;
  }>;
  totalResultNumber: number;
  pageNumber: number;
  pageSize: number;
}

export interface Article {
  id: string;
  num?: string;
  etat?: string;
  dateDebut?: string;
  dateFin?: string;
  titre?: string;
  texte?: string;
  texteHtml?: string;
  nota?: string;
  cid?: string;
  nature?: string;
  [key: string]: any;
}

export interface TexteComplet {
  id: string;
  cid?: string;
  titre?: string;
  titrefull?: string;
  etat?: string;
  nature?: string;
  dateSignature?: string;
  datePubli?: string;
  num?: string;
  nor?: string;
  visas?: string;
  articles?: Article[];
  sections?: any[];
  [key: string]: any;
}

// ============================================
// REQUÊTES SPÉCIALISÉES CESEDA
// ============================================

export interface CesedaSearchParams {
  /** Numéro d'article (ex: "L313-11") */
  numeroArticle?: string;
  
  /** Mots-clés à rechercher */
  keywords?: string;
  
  /** Date de version (timestamp ou YYYY-MM-DD) */
  dateVersion?: number | string;
  
  /** État juridique */
  etat?: TextLegalStatus;
  
  /** Proximité entre mots-clés */
  proximite?: number;
  
  /** Pagination */
  pageNumber?: number;
  pageSize?: number;
}

export interface JurisprudenceSearchParams {
  /** Mots-clés */
  keywords: string;
  
  /** Numéro d'affaire */
  numeroAffaire?: string;
  
  /** Date de décision (range) */
  dateDebut?: string;  // YYYY-MM-DD
  dateFin?: string;    // YYYY-MM-DD
  
  /** Nature (ARRET, ORDONNANCE, etc.) */
  nature?: string;
  
  /** Juridiction (pour CETAT) */
  juridiction?: string;
  
  /** Pagination */
  pageNumber?: number;
  pageSize?: number;
}

// ============================================
// HELPERS DE CONSTRUCTION
// ============================================

/**
 * Builder pour recherche CESEDA simplifiée
 */
export function buildCesedaSearch(params: CesedaSearchParams): SearchRequest {
  const champs: Champ[] = [];
  const filtres: Filtre[] = [];

  // Recherche par numéro d'article
  if (params.numeroArticle) {
    champs.push({
      typeChamp: 'NUM_ARTICLE',
      criteres: [{
        valeur: params.numeroArticle,
        typeRecherche: 'EXACTE',
        operateur: 'ET',
      }],
      operateur: 'ET',
    });
  }

  // Recherche par mots-clés
  if (params.keywords) {
    champs.push({
      typeChamp: 'ARTICLE',
      criteres: [{
        valeur: params.keywords,
        typeRecherche: 'UN_DES_MOTS',
        operateur: 'ET',
        proximite: params.proximite || 2,
      }],
      operateur: 'ET',
    });
  }

  // Filtre sur le CESEDA
  filtres.push({
    facette: params.dateVersion ? 'NOM_CODE' : 'TEXT_NOM_CODE',
    valeurs: ['Code de l\'entrée et du séjour des étrangers et du droit d\'asile'],
  });

  // Date de version
  if (params.dateVersion) {
    filtres.push({
      facette: 'DATE_VERSION',
      singleDate: params.dateVersion,
    });
  }

  // État juridique
  if (params.etat) {
    filtres.push({
      facette: 'TEXT_LEGAL_STATUS',
      valeur: params.etat,
    });
  }

  return {
    fond: params.dateVersion ? 'CODE_DATE' : 'CODE_ETAT',
    recherche: {
      champs,
      filtres,
      pageNumber: params.pageNumber || 1,
      pageSize: params.pageSize || 10,
      operateur: 'ET',
      sort: 'PERTINENCE',
      typePagination: 'DEFAUT',
    },
  };
}

/**
 * Builder pour recherche jurisprudence CESEDA
 */
export function buildJurisprudenceSearch(
  params: JurisprudenceSearchParams,
  type: 'administrative' | 'judiciaire' = 'administrative'
): SearchRequest {
  const champs: Champ[] = [];
  const filtres: Filtre[] = [];

  // Mots-clés
  champs.push({
    typeChamp: params.numeroAffaire ? 'NUM_AFFAIRE' : 'ALL',
    criteres: [{
      valeur: params.numeroAffaire || params.keywords,
      typeRecherche: params.numeroAffaire ? 'EXACTE' : 'UN_DES_MOTS',
      operateur: 'ET',
      proximite: 2,
    }],
    operateur: 'ET',
  });

  // Filtre date de décision
  if (params.dateDebut && params.dateFin) {
    filtres.push({
      facette: 'DATE_DECISION',
      dates: {
        start: params.dateDebut,
        end: params.dateFin,
      },
    });
  }

  // Nature (pour JURI)
  if (params.nature && type === 'judiciaire') {
    filtres.push({
      facette: 'CASSATION_NATURE_DECISION',
      valeurs: [params.nature],
    });
  }

  return {
    fond: type === 'administrative' ? 'CETAT' : 'JURI',
    recherche: {
      champs,
      filtres,
      pageNumber: params.pageNumber || 1,
      pageSize: params.pageSize || 10,
      operateur: 'ET',
      sort: 'PERTINENCE',
      secondSort: 'DATE_DESC',
      typePagination: 'DEFAUT',
      fromAdvancedRecherche: false,
    },
  };
}
