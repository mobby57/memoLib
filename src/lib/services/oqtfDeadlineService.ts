/**
 * Service d'extraction intelligente des delais OQTF
 * Amelioration avec templates juridiques et confidence scoring
 */

import { logger } from '@/lib/logger';

// Types de dossiers CESEDA avec delais specifiques
export enum TypeDossierCESEDA {
  OQTF = 'OQTF',
  REFUS_TITRE = 'REFUS_TITRE',
  RETRAIT_TITRE = 'RETRAIT_TITRE',
  NATURALISATION = 'NATURALISATION',
  REGROUPEMENT_FAMILIAL = 'REGROUPEMENT_FAMILIAL',
  ASILE = 'ASILE'
}

// Templates juridiques pour reconnaissance OQTF
interface TemplateJuridique {
  type: TypeDossierCESEDA;
  patterns: string[];
  articles: string[];
  delaisStandard: {
    departVolontaire: number; // jours
    recoursTA: number; // jours
    recoursCAA: number; // mois
  };
  keywords: string[];
}

const TEMPLATES_OQTF: TemplateJuridique[] = [
  {
    type: TypeDossierCESEDA.OQTF,
    patterns: [
      'obligation de quitter le territoire francais',
      'OQTF',
      'decision d\'eloignement',
      'mesure d\'eloignement',
      'reconduite a la frontiere'
    ],
    articles: [
      'L.511-1',
      'L.512-1',
      'L.513-1',
      'L.511-1 II',
      'L.511-1 III',
      'Article L.511-1 du CESEDA'
    ],
    delaisStandard: {
      departVolontaire: 30, // 30 jours pour depart volontaire
      recoursTA: 48, // 48h si retention/assignation, sinon 30 jours
      recoursCAA: 2 // 2 mois pour appel CAA
    },
    keywords: [
      'prefecture',
      'arrete prefectoral',
      'territoire francais',
      'sejour irregulier',
      'titre de sejour',
      'visa',
      'reconduite',
      'eloignement',
      'tribunal administratif',
      'TA',
      'refere-liberte',
      'assignation a residence',
      'centre de retention',
      'CRA'
    ]
  },
  {
    type: TypeDossierCESEDA.REFUS_TITRE,
    patterns: [
      'refus de titre de sejour',
      'rejet de demande',
      'refus de renouvellement',
      'decision de refus'
    ],
    articles: [
      'L.313-11',
      'L.313-14',
      'L.314-11',
      'L.431-2'
    ],
    delaisStandard: {
      departVolontaire: 30,
      recoursTA: 60, // 2 mois pour recours contre refus
      recoursCAA: 2
    },
    keywords: [
      'vie privee et familiale',
      'CEDH Article 8',
      'conjoint de francais',
      'parent d\'enfant francais',
      'ressources suffisantes',
      'integration republicaine'
    ]
  },
  {
    type: TypeDossierCESEDA.ASILE,
    patterns: [
      'demande d\'asile',
      'protection internationale',
      'statut de refugie',
      'protection subsidiaire',
      'OFPRA',
      'CNDA'
    ],
    articles: [
      'L.511-1 IV',
      'L.743-1',
      'L.723-2',
      'Convention de Geneve Article 1A'
    ],
    delaisStandard: {
      departVolontaire: 0, // Pas de depart volontaire pendant procedure asile
      recoursTA: 30, // 1 mois pour recours OFPRA
      recoursCAA: 1 // 1 mois pour recours CNDA
    },
    keywords: [
      'persecutions',
      'pays d\'origine',
      'crainte fondee',
      'torture',
      'traitement inhumain',
      'OFPRA',
      'CNDA',
      'Dublin',
      'pays tiers sur'
    ]
  }
];

interface DelaiExtrait {
  type: 'OQTF' | 'REFUS_TITRE' | 'ASILE' | 'AUTRE';
  date: Date;
  description: string;
  priorite: 'CRITIQUE' | 'HAUTE' | 'NORMALE';
  joursRestants: number;
  confidence: number; // 0-100%
  articlesCeseda: string[];
  suggestionsRecours: string[];
  checklistRecommandee: string[];
}

/**
 * Calcule le score de confiance base sur les patterns detectes
 */
function calculateConfidence(
  text: string,
  template: TemplateJuridique
): number {
  let score = 0;
  const textLower = text.toLowerCase();

  // Patterns principaux (40 points max)
  const patternMatches = template.patterns.filter(p => 
    textLower.includes(p.toLowerCase())
  );
  score += Math.min(patternMatches.length * 20, 40);

  // Articles CESEDA (30 points max)
  const articleMatches = template.articles.filter(a => 
    textLower.includes(a.toLowerCase())
  );
  score += Math.min(articleMatches.length * 15, 30);

  // Keywords juridiques (30 points max)
  const keywordMatches = template.keywords.filter(k => 
    textLower.includes(k.toLowerCase())
  );
  score += Math.min(keywordMatches.length * 3, 30);

  return Math.min(score, 100);
}

/**
 * Identifie automatiquement le type de dossier CESEDA
 */
export function identifierTypeDossier(
  texte: string
): { type: TypeDossierCESEDA; confidence: number; articles: string[] } | null {
  let bestMatch = {
    template: null as TemplateJuridique | null,
    confidence: 0
  };

  for (const template of TEMPLATES_OQTF) {
    const confidence = calculateConfidence(texte, template);
    if (confidence > bestMatch.confidence) {
      bestMatch = { template, confidence };
    }
  }

  // Seuil minimum de confiance: 40%
  if (bestMatch.confidence < 40 || !bestMatch.template) {
    return null;
  }

  const articlesDetectes = bestMatch.template.articles.filter(article =>
    texte.toLowerCase().includes(article.toLowerCase())
  );

  logger.logAIAction('ANALYSIS', 'system', 'auto', {
    type: bestMatch.template.type,
    confidence: bestMatch.confidence,
    articles: articlesDetectes
  });

  return {
    type: bestMatch.template.type,
    confidence: bestMatch.confidence,
    articles: articlesDetectes
  };
}

/**
 * Extrait les dates critiques d'un document OQTF avec IA
 */
export async function extraireDelaisOQTF(
  texteDocument: string,
  dossierId: string,
  tenantId: string
): Promise<DelaiExtrait[]> {
  const delais: DelaiExtrait[] = [];

  try {
    // 1. Identifier le type de dossier
    const identification = identifierTypeDossier(texteDocument);
    
    if (!identification) {
      logger.warn('Type de dossier CESEDA non identifie', {
        dossierId,
        tenantId,
        textLength: texteDocument.length
      });
      return [];
    }

    const template = TEMPLATES_OQTF.find(t => t.type === identification.type);
    if (!template) return [];

    // 2. Patterns de dates juridiques
    const datePatterns = [
      // Format francais: "15 janvier 2024", "15/01/2024"
      /(\d{1,2})\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+(\d{4})/gi,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
      
      // Delais relatifs: "dans un delai de 48 heures", "sous 30 jours"
      /dans un delai de (\d+)\s+(heures?|jours?|mois)/gi,
      /sous (\d+)\s+(heures?|jours?|mois)/gi,
      /avant le (\d{1,2})\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+(\d{4})/gi
    ];

    const texteLower = texteDocument.toLowerCase();

    // 3. Detection delai de depart volontaire (OQTF)
    if (template.type === TypeDossierCESEDA.OQTF) {
      const departVolontaireMatch = texteLower.match(/depart volontaire.*?(\d{1,2})\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+(\d{4})/i);
      
      if (departVolontaireMatch) {
        const dateDepart = parseDate(departVolontaireMatch[1], departVolontaireMatch[2], departVolontaireMatch[3]);
        const joursRestants = Math.ceil((dateDepart.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        delais.push({
          type: 'OQTF',
          date: dateDepart,
          description: `Delai de depart volontaire (${template.delaisStandard.departVolontaire} jours)`,
          priorite: joursRestants <= 7 ? 'CRITIQUE' : joursRestants <= 15 ? 'HAUTE' : 'NORMALE',
          joursRestants,
          confidence: identification.confidence,
          articlesCeseda: identification.articles,
          suggestionsRecours: [
            'Recours en annulation devant le Tribunal Administratif (48h si retention)',
            'Refere-suspension si OQTF manifestement illegale',
            'Demande d\'aide juridictionnelle si necessaire'
          ],
          checklistRecommandee: [
            'Rassembler preuves d\'integration (contrat travail, attestations)',
            'Certificats medicaux si problemes de sante',
            'Preuves de vie privee et familiale (CEDH Article 8)',
            'Justificatifs de domicile et ressources',
            'Certificat de scolarite des enfants si applicable'
          ]
        });
      }
    }

    // 4. Detection delai de recours TA
    const recoursMatch = texteLower.match(/recours.*?tribunal administratif.*?(\d{1,2})\s+(heures?|jours?)/i);
    if (recoursMatch) {
      const delaiJours = recoursMatch[1] === '48' ? 2 : parseInt(recoursMatch[1]);
      const dateRecours = new Date(Date.now() + delaiJours * 24 * 60 * 60 * 1000);
      const joursRestants = delaiJours;

      delais.push({
        type: template.type === TypeDossierCESEDA.OQTF ? 'OQTF' : 'REFUS_TITRE',
        date: dateRecours,
        description: `Delai de recours devant le TA (${delaiJours} jours)`,
        priorite: joursRestants <= 2 ? 'CRITIQUE' : 'HAUTE',
        joursRestants,
        confidence: identification.confidence * 0.9, // Legere reduction si detection indirecte
        articlesCeseda: identification.articles,
        suggestionsRecours: [
          'Preparer requete en annulation avec conclusions detaillees',
          'Invoquer Article 8 CEDH (vie privee et familiale)',
          'Refere-liberte si atteinte grave et manifestement illegale'
        ],
        checklistRecommandee: [
          'Rediger memoire juridique avec jurisprudence',
          'Collecter preuves materielles',
          'Preparer audition si necessaire',
          'Anticiper refere-suspension si urgence'
        ]
      });
    }

    // 5. Log de l'extraction pour audit
    logger.logAIAction('ANALYSIS', 'system', tenantId, {
      dossierId,
      typeDossier: identification.type,
      delaisExtraits: delais.length,
      confidence: identification.confidence,
      articles: identification.articles
    });

    return delais;

  } catch (error) {
    logger.error('Erreur extraction delais OQTF intelligente', {
      error,
      dossierId,
      tenantId
    });
    return [];
  }
}

/**
 * Parse une date francaise en objet Date
 */
function parseDate(jour: string, mois: string, annee: string): Date {
  const moisMap: Record<string, number> = {
    'janvier': 0, 'fevrier': 1, 'mars': 2, 'avril': 3,
    'mai': 4, 'juin': 5, 'juillet': 6, 'aout': 7,
    'septembre': 8, 'octobre': 9, 'novembre': 10, 'decembre': 11
  };
  
  return new Date(
    parseInt(annee),
    moisMap[mois.toLowerCase()],
    parseInt(jour)
  );
}

/**
 * Genere une checklist automatique basee sur le type de dossier
 */
export function genererChecklistOQTF(
  typeDossier: TypeDossierCESEDA,
  delaisCritiques: DelaiExtrait[]
): string[] {
  const checklistBase = [
    '[emoji] Verifier la notification de la decision (date et mode)',
    '[emoji] Analyser les motifs juridiques de la decision',
    '️ Identifier les vices de forme ou de fond',
    '[emoji] Collecter les preuves d\'integration et d\'attaches en France'
  ];

  const delaiCritique = delaisCritiques.find(d => d.priorite === 'CRITIQUE');
  
  if (delaiCritique && delaiCritique.joursRestants <= 2) {
    return [
      '[emoji] URGENCE ABSOLUE - Action immediate requise',
      ` ${delaiCritique.joursRestants} jour(s) restant(s) avant echeance critique`,
      ' Preparer refere-liberte si assignation/retention',
      '[emoji] Contacter avocat specialise droit des etrangers',
      ...checklistBase,
      ...delaiCritique.checklistRecommandee
    ];
  }

  return [...checklistBase, ...delaisCritiques[0]?.checklistRecommandee || []];
}

/**
 * Export des fonctions utilitaires
 */
export default {
  identifierTypeDossier,
  extraireDelaisOQTF,
  genererChecklistOQTF,
  calculateConfidence
};
