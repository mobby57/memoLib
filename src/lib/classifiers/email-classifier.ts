import type { TypeDossierCeseda } from '@/types/dossier.types';

// ============================================
// TYPES
// ============================================

export interface EmailClassification {
  caseType?: TypeDossierCeseda;
  priority: 'basse' | 'normale' | 'haute' | 'critique';
  urgency: boolean;
  confidence: number; // 0-1
  matchedKeywords: string[];
  needsHumanReview: boolean;
}

interface ClassifierRule {
  caseType: TypeDossierCeseda;
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
    weight: 0.9,
  },
  {
    caseType: 'Asile',
    keywords: ['asile', 'réfugié', 'ofpra', 'cnda', 'protection subsidiaire', 'persécution'],
    boostKeywords: ['récépissé', 'convocation', 'entretien ofpra'],
    weight: 0.85,
  },
  {
    caseType: 'TitreSejour',
    keywords: ['titre de séjour', 'carte de séjour', 'renouvellement', 'première demande', 'récépissé', 'préfecture'],
    boostKeywords: ['vie privée', 'salarié', 'étudiant', 'famille'],
    weight: 0.8,
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
    weight: 0.75,
  },
  {
    caseType: 'AppelDecision',
    keywords: ['appel', 'contestation', 'annulation', 'recours contentieux', 'tribunal administratif'],
    boostKeywords: ['référé', 'suspension', 'sursis'],
    weight: 0.7,
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

const URGENCY_KEYWORDS = [
  'urgent', 'urgence', 'immédiat', 'délai', '48h', '24h',
  'demain', 'aujourd\'hui', 'rétention', 'garde à vue',
  'expulsion imminente', 'sans délai', 'référé liberté',
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

    const baseScore = (matched.length / rule.keywords.length) * rule.weight;
    const boostMatched = rule.boostKeywords ? countMatches(fullText, rule.boostKeywords) : [];
    const boost = boostMatched.length > 0 ? 0.1 * Math.min(boostMatched.length, 3) : 0;
    const score = Math.min(baseScore + boost, 1);

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { rule, score, matched: [...matched, ...boostMatched] };
    }
  }

  const urgencyMatched = countMatches(fullText, URGENCY_KEYWORDS);
  const urgency = urgencyMatched.length > 0;

  if (!bestMatch) {
    return {
      priority: urgency ? 'haute' : 'normale',
      urgency,
      confidence: 0,
      matchedKeywords: urgencyMatched,
      needsHumanReview: true,
    };
  }

  const priority = urgency
    ? 'critique'
    : bestMatch.score >= 0.7
      ? 'haute'
      : bestMatch.score >= 0.4
        ? 'normale'
        : 'basse';

  return {
    caseType: bestMatch.rule.caseType,
    priority,
    urgency,
    confidence: Math.round(bestMatch.score * 100) / 100,
    matchedKeywords: [...bestMatch.matched, ...urgencyMatched],
    needsHumanReview: bestMatch.score < 0.7,
  };
}
