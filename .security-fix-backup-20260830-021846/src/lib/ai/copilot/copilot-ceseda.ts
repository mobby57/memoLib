/**
 * Copilote CESEDA — Orchestrateur Multi-Agents
 *
 * Analyse complète d'un dossier via agents spécialisés :
 * - Agent Résumé stratégique
 * - Agent Forces/Faiblesses
 * - Agent Complétude documentaire
 * - Agent CESEDA (articles applicables)
 * - Agent Délais/Risques
 * - Agent Actions recommandées
 *
 * IMPORTANT : Toutes les analyses sont des SUGGESTIONS nécessitant validation humaine.
 * Le système ne fournit JAMAIS de conseil juridique définitif.
 */

// Données CESEDA intégrées (source de vérité locale)

const DELAIS_CESEDA = [
  { procedure: 'OQTF avec délai', delai: '30 jours', jours: 30, article: 'Art. L611-1 CESEDA', consequence: 'Exécution forcée' },
  { procedure: 'OQTF sans délai', delai: '48 heures', jours: 2, article: 'Art. L612-2 CESEDA', consequence: 'Placement en rétention' },
  { procedure: 'Recours CNDA normal', delai: '1 mois', jours: 30, article: 'Art. L532-1 CESEDA', consequence: 'Rejet définitif asile' },
  { procedure: 'Recours CNDA accéléré', delai: '15 jours', jours: 15, article: 'Art. L532-4 CESEDA', consequence: 'Perte droit au maintien' },
  { procedure: 'Demande asile (OFPRA)', delai: '21 jours', jours: 21, article: 'Art. L531-27 CESEDA', consequence: 'Perte conditions accueil' },
  { procedure: 'Renouvellement titre séjour', delai: '2 mois avant', jours: 60, article: 'Art. R431-5 CESEDA', consequence: 'Situation irrégulière' },
  { procedure: 'Recours refus titre', delai: '2 mois', jours: 60, article: 'Art. R421-1 CJA', consequence: 'Forclusion' },
  { procedure: 'Recours naturalisation', delai: '2 mois', jours: 60, article: 'Art. 45 Décret 93-1362', consequence: 'Forclusion définitive' },
  { procedure: 'Rétention (JLD)', delai: '48 heures', jours: 2, article: 'Art. L742-1 CESEDA', consequence: 'Libération si pas saisine' },
];

const ARTICLES_CLES: Record<string, { article: string; objet: string }[]> = {
  OQTF: [
    { article: 'Art. L611-1 CESEDA', objet: 'Cas de délivrance OQTF' },
    { article: 'Art. L612-1 CESEDA', objet: 'Délai départ volontaire (30j)' },
    { article: 'Art. L612-2 CESEDA', objet: 'OQTF sans délai' },
    { article: 'Art. L614-5 CESEDA', objet: 'Recours TA (30 jours)' },
    { article: 'Art. L614-6 CESEDA', objet: 'Recours 48h (sans délai)' },
    { article: 'Art. 8 CEDH', objet: 'Vie privée et familiale' },
    { article: 'Art. 3 CEDH', objet: 'Non-refoulement' },
  ],
  ASILE: [
    { article: 'Art. L511-1 CESEDA', objet: 'Droit d\'asile constitutionnel' },
    { article: 'Art. L512-1 CESEDA', objet: 'Statut de réfugié' },
    { article: 'Art. L512-2 CESEDA', objet: 'Protection subsidiaire' },
    { article: 'Art. L531-27 CESEDA', objet: 'Délai dépôt (21 jours)' },
    { article: 'Art. L532-1 CESEDA', objet: 'Recours CNDA' },
    { article: 'Convention de Genève 1951', objet: 'Définition du réfugié' },
  ],
  TITRE_SEJOUR: [
    { article: 'Art. L421-1 CESEDA', objet: 'Carte séjour salarié' },
    { article: 'Art. L423-7 CESEDA', objet: 'Parent enfant français' },
    { article: 'Art. L423-23 CESEDA', objet: 'Admission exceptionnelle' },
    { article: 'Art. L425-9 CESEDA', objet: 'Étranger malade' },
  ],
  NATURALISATION: [
    { article: 'Art. 21-2 Code civil', objet: 'Naturalisation par décret' },
    { article: 'Art. 21-15 Code civil', objet: 'Condition résidence 5 ans' },
    { article: 'Art. 21-24 Code civil', objet: 'Assimilation et langue' },
  ],
  RETENTION: [
    { article: 'Art. L741-1 CESEDA', objet: 'Placement en rétention' },
    { article: 'Art. L742-1 CESEDA', objet: 'Prolongation JLD' },
    { article: 'Art. 5 CEDH', objet: 'Droit à la liberté' },
  ],
};

const VOIES_DE_RECOURS: Record<string, { type: string; juridiction: string; delai: string; conseil: string }[]> = {
  OQTF: [
    { type: 'Recours contentieux', juridiction: 'Tribunal Administratif', delai: '30j / 48h', conseil: 'Vérifier vices de procédure' },
    { type: 'Référé-suspension', juridiction: 'TA (juge des référés)', delai: 'Pendant recours au fond', conseil: 'Si urgence + doute sérieux' },
    { type: 'Référé-liberté', juridiction: 'TA', delai: '48h jugement', conseil: 'Extrême urgence (rétention, vol)' },
  ],
  ASILE: [
    { type: 'Recours CNDA', juridiction: 'Cour Nationale du Droit d\'Asile', delai: '1 mois / 15 jours', conseil: 'Mémoire + preuves nouvelles' },
  ],
  TITRE_SEJOUR: [
    { type: 'Recours gracieux', juridiction: 'Préfet', delai: '2 mois', conseil: 'Éléments nouveaux' },
    { type: 'Recours contentieux', juridiction: 'Tribunal Administratif', delai: '2 mois', conseil: 'Art. 8 CEDH + erreur manifeste' },
  ],
  NATURALISATION: [
    { type: 'Recours gracieux', juridiction: 'Ministre', delai: '2 mois', conseil: 'Prouver levée des motifs' },
    { type: 'Recours contentieux', juridiction: 'TA Nantes', delai: '2 mois', conseil: 'Erreur manifeste' },
  ],
};

const JURISPRUDENCE_CLE = [
  { reference: 'CE, 19 avril 1991, Belgacem', domaine: 'OQTF', principe: 'Contrôle proportionnalité éloignement / vie privée (Art. 8 CEDH)' },
  { reference: 'CE, 8 décembre 1978, GISTI', domaine: 'GENERAL', principe: 'Droit à vie familiale normale' },
  { reference: 'CEDH, Ezzoudhi c/ France, 2001', domaine: 'OQTF', principe: 'Éloignement disproportionné si attaches fortes' },
  { reference: 'CE, 4 février 2013, n°356529', domaine: 'TITRE_SEJOUR', principe: 'Étranger malade : accès effectif aux soins' },
  { reference: 'CE Ass., 13 décembre 2016', domaine: 'ASILE', principe: 'Prise en compte situation générale pays' },
];

// ─── TYPES ───────────────────────────────────────────────────

export interface CopilotAnalysis {
  dossierId: string;
  generatedAt: string;
  disclaimer: string;
  summary: StrategicSummary;
  strengths: AnalysisPoint[];
  weaknesses: AnalysisPoint[];
  completeness: CompletenessAnalysis;
  cesedaAnalysis: CesedaArticleAnalysis;
  deadlines: DeadlineRisk[];
  blockages: Blockage[];
  actions: RecommendedAction[];
  confidence: number;
}

interface StrategicSummary {
  situation: string[];
  narrative: string;
  riskLevel: 'faible' | 'moyen' | 'élevé' | 'critique';
}

interface AnalysisPoint {
  label: string;
  explanation: string;
  confidence: number;
  source: string;
}

interface CompletenessAnalysis {
  score: number;
  missing: string[];
  available: string[];
  recommendation: string;
}

interface CesedaArticleAnalysis {
  procedure: string;
  articles: { reference: string; objet: string; pertinence: string }[];
  jurisprudences: { reference: string; principe: string; pertinence: string }[];
  recours: { type: string; juridiction: string; delai: string; conseil: string }[];
}

interface DeadlineRisk {
  label: string;
  date?: string;
  daysRemaining?: number;
  riskLevel: 'faible' | 'moyen' | 'élevé' | 'critique';
  explanation: string;
  article?: string;
}

interface Blockage {
  cause: string;
  severity: 'bloquant' | 'ralentissant';
  solution: string;
}

interface RecommendedAction {
  priority: number;
  action: string;
  reason: string;
  type: 'document' | 'contact' | 'recours' | 'verification' | 'urgent';
}

// ─── DONNÉES DOSSIER ─────────────────────────────────────────

export interface DossierInput {
  id: string;
  typeDossier: string;
  description?: string;
  notes?: string;
  statut: string;
  dateCreation: string;
  dateEcheance?: string;
  client: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  checklistItems: { label: string; status: string; required: boolean }[];
  legalDeadlines: { label: string; dueDate: string; status: string }[];
  emails: { subject: string; body: string; from: string; receivedDate: string }[];
  documents: { name: string; type: string }[];
}

// ─── ORCHESTRATEUR ───────────────────────────────────────────

const DISCLAIMER = "⚖️ Analyse produite par le Copilote CESEDA (assistant IA). Ces résultats sont des suggestions d'analyse et ne constituent pas un conseil juridique. Validation humaine obligatoire.";

export function analyzeDossier(dossier: DossierInput): CopilotAnalysis {
  const type = normalizeType(dossier.typeDossier);
  const allText = gatherText(dossier);

  return {
    dossierId: dossier.id,
    generatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
    summary: agentSummary(dossier, type, allText),
    strengths: agentStrengths(dossier, type, allText),
    weaknesses: agentWeaknesses(dossier, type, allText),
    completeness: agentCompleteness(dossier, type),
    cesedaAnalysis: agentCeseda(type),
    deadlines: agentDeadlines(dossier, type),
    blockages: agentBlockages(dossier),
    actions: agentActions(dossier, type),
    confidence: computeGlobalConfidence(dossier),
  };
}

// ─── AGENT : RÉSUMÉ STRATÉGIQUE ─────────────────────────────

function agentSummary(d: DossierInput, type: string, text: string): StrategicSummary {
  const situation: string[] = [type.replace(/_/g, ' ')];

  if (text.match(/oqtf|obligation de quitter/i)) situation.push('OQTF détectée');
  if (text.match(/enfant|scolari/i)) situation.push('Enfant(s) scolarisé(s)');
  if (text.match(/conjoint|mari[eé]|pacs/i)) situation.push('Vie familiale en France');
  if (text.match(/travail|employ|salar/i)) situation.push('Activité professionnelle');
  if (text.match(/sant[eé]|m[eé]dical|maladie|traitement/i)) situation.push('Problème de santé');
  if (text.match(/\d+\s*ans?\s*(en france|de pr[eé]sence|sur le territoire)/i)) situation.push('Ancienneté de présence');

  const missingCount = d.checklistItems.filter(i => i.status === 'missing' && i.required).length;
  const urgentDeadlines = d.legalDeadlines.filter(dl => {
    const days = (new Date(dl.dueDate).getTime() - Date.now()) / 86400000;
    return dl.status === 'PENDING' && days < 7;
  });

  let riskLevel: StrategicSummary['riskLevel'] = 'faible';
  if (urgentDeadlines.length > 0) riskLevel = 'critique';
  else if (missingCount > 3) riskLevel = 'élevé';
  else if (missingCount > 0) riskLevel = 'moyen';

  const narrative = `Le dossier concerne ${situation.slice(0, 3).join(', ').toLowerCase()}. ` +
    (missingCount > 0 ? `${missingCount} pièce(s) obligatoire(s) manquent. ` : 'Le dossier documentaire semble complet. ') +
    (urgentDeadlines.length > 0 ? `ATTENTION : ${urgentDeadlines.length} échéance(s) critique(s) dans les 7 prochains jours.` : '');

  return { situation, narrative, riskLevel };
}

// ─── AGENT : FORCES ─────────────────────────────────────────

function agentStrengths(d: DossierInput, type: string, text: string): AnalysisPoint[] {
  const strengths: AnalysisPoint[] = [];

  if (text.match(/\b([5-9]|[1-9]\d)\s*ans?\b.*(?:france|territoire|pr[eé]sence)/i)) {
    strengths.push({ label: 'Ancienneté de présence significative', explanation: 'Une présence longue en France renforce les arguments liés à la vie privée (Art. 8 CEDH).', confidence: 0.8, source: 'Analyse textuelle' });
  }
  if (text.match(/enfant|scolari/i)) {
    strengths.push({ label: 'Enfants scolarisés en France', explanation: 'L\'intérêt supérieur de l\'enfant (Art. 3-1 CIDE) est un argument fort contre l\'éloignement.', confidence: 0.85, source: 'Analyse textuelle' });
  }
  if (text.match(/cdi|contrat.*travail|employ[eé]/i)) {
    strengths.push({ label: 'Insertion professionnelle', explanation: 'Un emploi stable démontre l\'intégration et la capacité à subvenir à ses besoins.', confidence: 0.75, source: 'Analyse textuelle' });
  }
  if (text.match(/conjoint.*fran[cç]ais|mari[eé].*fran[cç]ais|pacs/i)) {
    strengths.push({ label: 'Vie familiale avec un(e) Français(e)', explanation: 'Protection renforcée au titre de l\'Art. 8 CEDH et Art. L423-7 CESEDA.', confidence: 0.9, source: 'Analyse textuelle' });
  }
  if (text.match(/imp[oô]t|fiscal|contribu/i)) {
    strengths.push({ label: 'Contribution fiscale', explanation: 'Le paiement des impôts démontre l\'intégration dans la société française.', confidence: 0.7, source: 'Analyse textuelle' });
  }
  if (text.match(/fran[cç]ais.*b[12]|dipl[oô]me|formation/i)) {
    strengths.push({ label: 'Maîtrise du français / formation', explanation: 'La maîtrise de la langue est un critère d\'intégration reconnu.', confidence: 0.7, source: 'Analyse textuelle' });
  }

  const docsReceived = d.checklistItems.filter(i => i.status === 'received' || i.status === 'validated').length;
  if (docsReceived > 5) {
    strengths.push({ label: 'Dossier bien documenté', explanation: `${docsReceived} pièces déjà fournies, ce qui facilite l'instruction.`, confidence: 0.9, source: 'Checklist' });
  }

  return strengths;
}

// ─── AGENT : FAIBLESSES ─────────────────────────────────────

function agentWeaknesses(d: DossierInput, type: string, text: string): AnalysisPoint[] {
  const weaknesses: AnalysisPoint[] = [];

  const missing = d.checklistItems.filter(i => i.status === 'missing' && i.required);
  if (missing.length > 0) {
    weaknesses.push({ label: `${missing.length} pièce(s) obligatoire(s) manquante(s)`, explanation: `Documents manquants : ${missing.slice(0, 5).map(m => m.label).join(', ')}.`, confidence: 1, source: 'Checklist' });
  }

  const urgentDl = d.legalDeadlines.filter(dl => dl.status === 'PENDING' && (new Date(dl.dueDate).getTime() - Date.now()) / 86400000 < 14);
  if (urgentDl.length > 0) {
    weaknesses.push({ label: 'Délais serrés', explanation: `${urgentDl.length} échéance(s) dans les 14 prochains jours.`, confidence: 1, source: 'Deadlines' });
  }

  if (!d.description && !d.notes) {
    weaknesses.push({ label: 'Dossier peu décrit', explanation: 'Aucune note ni description. L\'analyse IA est limitée sans contexte textuel.', confidence: 0.9, source: 'Métadonnées' });
  }

  if (text.match(/irr[eé]guli[eè]r|sans.?papier|clandestin/i)) {
    weaknesses.push({ label: 'Situation administrative irrégulière', explanation: 'La situation irrégulière peut affaiblir certains arguments, mais n\'empêche pas un recours.', confidence: 0.7, source: 'Analyse textuelle' });
  }

  if (text.match(/casier|condamn[eé]|p[eé]nal/i)) {
    weaknesses.push({ label: 'Antécédents judiciaires potentiels', explanation: 'Des mentions de condamnations peuvent compliquer la procédure. À vérifier.', confidence: 0.6, source: 'Analyse textuelle' });
  }

  return weaknesses;
}

// ─── AGENT : COMPLÉTUDE DOCUMENTAIRE ─────────────────────────

function agentCompleteness(d: DossierInput, type: string): CompletenessAnalysis {
  const total = d.checklistItems.length || 1;
  const received = d.checklistItems.filter(i => i.status !== 'missing').length;
  const missing = d.checklistItems.filter(i => i.status === 'missing' && i.required).map(i => i.label);
  const available = d.checklistItems.filter(i => i.status !== 'missing').map(i => i.label);
  const score = Math.round((received / total) * 100);

  let recommendation = '';
  if (score === 100) recommendation = 'Dossier complet. Prêt pour traitement.';
  else if (score >= 80) recommendation = `Presque complet. ${missing.length} pièce(s) restante(s) à obtenir en priorité.`;
  else if (score >= 50) recommendation = `Dossier incomplet. Relancer le client pour les ${missing.length} pièces manquantes.`;
  else recommendation = `Dossier très incomplet (${score}%). Impossible de traiter sans les pièces essentielles.`;

  return { score, missing, available, recommendation };
}

// ─── AGENT : CESEDA ─────────────────────────────────────────

function agentCeseda(type: string): CesedaArticleAnalysis {
  const articles = (ARTICLES_CLES[type] || []).map(a => ({
    reference: a.article,
    objet: a.objet,
    pertinence: `Applicable à la procédure ${type.replace(/_/g, ' ')}`,
  }));

  const jurisprudences = JURISPRUDENCE_CLE
    .filter(j => j.domaine === type || j.domaine === 'GENERAL')
    .map(j => ({
      reference: j.reference,
      principe: j.principe,
      pertinence: j.domaine === type ? 'Directement applicable' : 'Principe transversal',
    }));

  const recours = (VOIES_DE_RECOURS[type] || []).map(r => ({
    type: r.type,
    juridiction: r.juridiction,
    delai: r.delai,
    conseil: r.conseil,
  }));

  return { procedure: type, articles, jurisprudences, recours };
}

// ─── AGENT : DÉLAIS ─────────────────────────────────────────

function agentDeadlines(d: DossierInput, type: string): DeadlineRisk[] {
  const risks: DeadlineRisk[] = [];

  // Deadlines existantes en DB
  for (const dl of d.legalDeadlines) {
    if (dl.status !== 'PENDING') continue;
    const days = Math.ceil((new Date(dl.dueDate).getTime() - Date.now()) / 86400000);
    let riskLevel: DeadlineRisk['riskLevel'] = 'faible';
    if (days <= 2) riskLevel = 'critique';
    else if (days <= 7) riskLevel = 'élevé';
    else if (days <= 30) riskLevel = 'moyen';

    risks.push({
      label: dl.label,
      date: dl.dueDate,
      daysRemaining: days,
      riskLevel,
      explanation: days <= 0 ? 'DÉLAI DÉPASSÉ' : `${days} jour(s) restant(s)`,
    });
  }

  // Délais légaux par type (si aucun deadline en DB)
  if (risks.length === 0) {
    const delais = DELAIS_CESEDA.filter(d => d.procedure.toUpperCase().includes(type));
    for (const dl of delais.slice(0, 3)) {
      risks.push({
        label: dl.procedure,
        riskLevel: dl.jours <= 7 ? 'élevé' : 'moyen',
        explanation: `Délai légal : ${dl.delai} — ${dl.consequence}`,
        article: dl.article,
      });
    }
  }

  return risks.sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999));
}

// ─── AGENT : BLOCAGES ────────────────────────────────────────

function agentBlockages(d: DossierInput): Blockage[] {
  const blockages: Blockage[] = [];

  const missingRequired = d.checklistItems.filter(i => i.status === 'missing' && i.required);
  if (missingRequired.length > 0) {
    blockages.push({
      cause: `${missingRequired.length} document(s) obligatoire(s) manquant(s)`,
      severity: 'bloquant',
      solution: `Relancer le client pour : ${missingRequired.slice(0, 3).map(i => i.label).join(', ')}`,
    });
  }

  const overdue = d.legalDeadlines.filter(dl => dl.status === 'PENDING' && new Date(dl.dueDate) < new Date());
  if (overdue.length > 0) {
    blockages.push({
      cause: `${overdue.length} délai(s) dépassé(s)`,
      severity: 'bloquant',
      solution: 'Vérifier si un recours est encore possible (demande de relevé de forclusion)',
    });
  }

  if (d.statut === 'en_attente_client') {
    const lastEmail = d.emails[d.emails.length - 1];
    const daysSinceLastEmail = lastEmail ? Math.ceil((Date.now() - new Date(lastEmail.receivedDate).getTime()) / 86400000) : 999;
    if (daysSinceLastEmail > 7) {
      blockages.push({
        cause: `Aucune réponse client depuis ${daysSinceLastEmail} jours`,
        severity: 'ralentissant',
        solution: 'Envoyer une relance avec la liste des pièces attendues',
      });
    }
  }

  if (!d.description && d.emails.length === 0) {
    blockages.push({
      cause: 'Aucune information exploitable (pas de description, pas d\'email)',
      severity: 'bloquant',
      solution: 'Contacter le client pour un premier entretien',
    });
  }

  return blockages;
}

// ─── AGENT : ACTIONS RECOMMANDÉES ────────────────────────────

function agentActions(d: DossierInput, type: string): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  let priority = 1;

  // Deadlines critiques
  const criticalDl = d.legalDeadlines.filter(dl => {
    const days = (new Date(dl.dueDate).getTime() - Date.now()) / 86400000;
    return dl.status === 'PENDING' && days <= 7 && days > 0;
  });
  for (const dl of criticalDl) {
    actions.push({ priority: priority++, action: `Traiter d'urgence : ${dl.label}`, reason: `Échéance dans ${Math.ceil((new Date(dl.dueDate).getTime() - Date.now()) / 86400000)} jour(s)`, type: 'urgent' });
  }

  // Documents manquants
  const missing = d.checklistItems.filter(i => i.status === 'missing' && i.required);
  if (missing.length > 0) {
    actions.push({ priority: priority++, action: `Demander au client : ${missing.slice(0, 3).map(i => i.label).join(', ')}`, reason: `${missing.length} pièce(s) obligatoire(s) manquante(s)`, type: 'document' });
  }

  // Vérifications spécifiques au type
  if (type === 'OQTF') {
    actions.push({ priority: priority++, action: 'Vérifier la régularité de la notification', reason: 'Vice de procédure = moyen d\'annulation le plus efficace', type: 'verification' });
    actions.push({ priority: priority++, action: 'Préparer le recours contentieux devant le TA', reason: 'Art. L614-5 CESEDA — délai 30 jours', type: 'recours' });
  } else if (type === 'ASILE') {
    actions.push({ priority: priority++, action: 'Vérifier/compléter le récit de vie', reason: 'Fondement de la demande — doit être précis, chronologique et cohérent', type: 'verification' });
  } else if (type === 'TITRE_SEJOUR') {
    actions.push({ priority: priority++, action: 'Vérifier la validité du titre actuel', reason: 'Renouvellement 2 mois avant expiration obligatoire', type: 'verification' });
  }

  // Relance client si pas de nouvelles
  if (d.emails.length > 0) {
    const lastEmail = d.emails[d.emails.length - 1];
    const daysSince = Math.ceil((Date.now() - new Date(lastEmail.receivedDate).getTime()) / 86400000);
    if (daysSince > 5 && missing.length > 0) {
      actions.push({ priority: priority++, action: 'Relancer le client', reason: `Pas de nouvelles depuis ${daysSince} jours et pièces en attente`, type: 'contact' });
    }
  }

  return actions;
}

// ─── HELPERS ─────────────────────────────────────────────────

function normalizeType(type: string): string {
  const t = type.toUpperCase().replace(/[- ]/g, '_');
  if (t.includes('OQTF')) return 'OQTF';
  if (t.includes('ASILE')) return 'ASILE';
  if (t.includes('TITRE') || t.includes('SEJOUR')) return 'TITRE_SEJOUR';
  if (t.includes('NATURAL')) return 'NATURALISATION';
  if (t.includes('REGROUP')) return 'REGROUPEMENT_FAMILIAL';
  if (t.includes('RETEN')) return 'RETENTION';
  return t;
}

function gatherText(d: DossierInput): string {
  const parts = [d.description || '', d.notes || ''];
  for (const e of d.emails.slice(-5)) {
    parts.push(e.subject, e.body);
  }
  return parts.join(' ');
}

function computeGlobalConfidence(d: DossierInput): number {
  let score = 0.5; // base
  if (d.description) score += 0.1;
  if (d.emails.length > 0) score += 0.15;
  if (d.checklistItems.length > 0) score += 0.1;
  if (d.legalDeadlines.length > 0) score += 0.1;
  if (d.notes) score += 0.05;
  return Math.min(score, 0.95);
}
