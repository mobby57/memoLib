import type { TypeDossierCeseda } from '@/types/dossier.types';

// ============================================
// TYPES
// ============================================

export interface EmailClassification {
  caseType?: TypeDossierCeseda | 'Recours';
  priority: 'basse' | 'normale' | 'haute' | 'critique';
  urgency: boolean;
  confidence: number; // 0-1
  matchedKeywords: string[];
  needsHumanReview: boolean;
}

interface ClassifierRule {
  caseType: TypeDossierCeseda | 'Recours';
  keywords: string[];
  boostKeywords?: string[]; // augmentent la confiance
  weight: number; // poids de base
}

// ============================================
// RÈGLES MÉTIER
// ============================================

const RULES: ClassifierRule[] = [
  {
    caseType: 'OQTF',
    keywords: ['oqtf', 'obligation de quitter', 'expulsion', 'éloignement', 'reconduite'],
    boostKeywords: ['48h', '30 jours', 'sans délai', 'rétention'],
    weight: 0.95,
  },
  {
    caseType: 'Asile',
    keywords: ['asile', 'réfugié', 'ofpra', 'cnda', 'protection subsidiaire', 'persécution'],
    boostKeywords: ['récépissé', 'convocation', 'entretien ofpra'],
    weight: 0.9,
  },
  {
    caseType: 'TitreSejour',
    keywords: ['titre de séjour', 'carte de séjour', 'renouvellement', 'première demande', 'récépissé', 'préfecture'],
    boostKeywords: ['vie privée', 'salarié', 'étudiant', 'famille'],
    weight: 0.85,
  },
  {
    caseType: 'Naturalisation',
    keywords: ['naturalisation', 'nationalité française', 'décret', 'acquisition nationalité'],
    boostKeywords: ['ajournement', 'irrecevabilité'],
    weight: 0.85,
  },
  {
    caseType: 'CarteResident',
    keywords: ['carte de résident', 'carte résident', 'résidence permanente', '10 ans'],
    weight: 0.8,
  },
  {
    caseType: 'RegroupementFamilial',
    keywords: ['regroupement familial', 'réunification', 'conjoint', 'famille'],
    boostKeywords: ['ofii', 'ressources', 'logement'],
    weight: 0.8,
  },
  {
    caseType: 'Recours', // Renommé pour correspondre aux tests
    keywords: ['recours', 'appel', 'contestation', 'annulation', 'recours contentieux', 'tribunal administratif'],
    boostKeywords: ['référé', 'suspension', 'sursis'],
    weight: 0.9,
  },
  {
    caseType: 'Refoulement',
    keywords: ['refoulement', 'non-admission', 'zone d\'attente', 'frontière'],
    weight: 0.9,
  },
  {
    caseType: 'AssignationResidence',
    keywords: ['assignation à résidence', 'assignation résidence', 'pointage', 'bracelet'],
    weight: 0.85,
  },
];

const CRITICAL_KEYWORDS = [
  'urgent', 'urgence', 'immédiat', '48h', '24h',
  'demain', 'aujourd\'hui', 'rétention', 'garde à vue',
  'expulsion imminente', 'sans délai', 'référé liberté',
];

const HIGH_KEYWORDS = [
  'délai', 'convoqué', 'notification', 'reçu', 'décision', 'recours', 'tribunal', 'cnda', 'oqtf',
];

// ============================================
// CLASSIFIER
// ============================================

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime accents pour matching souple
    .replace(/['']/g, "'");
}

function countMatches(text: string, keywords: string[]): string[] {
  const normalizedText = normalize(text);
  return keywords.filter(kw => normalizedText.includes(normalize(kw)));
}

export function classifyEmail(subject: string, body: string): EmailClassification {
  const fullText = `${subject}\n${body}`;
  let bestMatch: { rule: ClassifierRule; score: number; matched: string[] } | null = null;

  for (const rule of RULES) {
    const matched = countMatches(fullText, rule.keywords);
    if (matched.length === 0) continue;

    // Calcul du score amélioré
    const baseScore = (matched.length / rule.keywords.length);
    const boostMatched = rule.boostKeywords ? countMatches(fullText, rule.boostKeywords) : [];
    const boost = boostMatched.length > 0 ? 0.3 * Math.min(boostMatched.length, 2) : 0;
    const score = Math.min(baseScore * rule.weight + boost, 1);

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { rule, score, matched: [...matched, ...boostMatched] };
    }
  }

  const criticalMatched = countMatches(fullText, CRITICAL_KEYWORDS);
  const highMatched = countMatches(fullText, HIGH_KEYWORDS);
  
  const isCritical = criticalMatched.length > 0;
  const isHigh = highMatched.length > 0;

  if (!bestMatch) {
    return {
      priority: isCritical ? 'critique' : isHigh ? 'haute' : 'normale',
      urgency: isCritical,
      confidence: 0,
      matchedKeywords: [...criticalMatched, ...highMatched],
      needsHumanReview: true,
    };
  }

  const priority = isCritical
    ? 'critique'
    : (isHigh || bestMatch.score >= 0.8)
      ? 'haute'
      : bestMatch.score >= 0.5
        ? 'normale'
        : 'basse';

  return {
    caseType: bestMatch.rule.caseType,
    priority,
    urgency: isCritical,
    confidence: Math.round(bestMatch.score * 100) / 100,
    matchedKeywords: [...bestMatch.matched, ...criticalMatched, ...highMatched],
    needsHumanReview: bestMatch.score < 0.7,
  };
}
