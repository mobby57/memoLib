/**
 * Service IA - Utilise Llama via Ollama (local)
 * Configuration: OLLAMA_BASE_URL dans .env
 */

export interface AIUsageStats {
  totalRequests: number
  totalTokens: number
  estimatedCost: number
}

export interface RiskAnalysis {
  score: number
  level: 'faible' | 'moyen' | 'élevé' | 'critique'
  factors: Array<{
    factor: string
    impact: 'positive' | 'negative'
    description: string
  }>
  recommendations: string[]
}

export interface DocumentSummary {
  summary: string
  keyPoints: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
}

export interface ExtractedEntities {
  personnes: string[]
  dates: string[]
  montants: string[]
  references: string[]
}

export interface ComplianceCheck {
  compliant: boolean
  issues: Array<{
    severity: 'error' | 'warning' | 'info'
    message: string
    suggestion: string
  }>
}

// Mock delay pour simulation
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 1500))

/**
 * Génération de documents juridiques
 */
export async function generateDocument(
  type: 'contrat' | 'mise_en_demeure' | 'assignation' | 'courrier',
  context: any
): Promise<string> {
  await simulateDelay()
  
  const templates = {
    contrat: `CONTRAT DE PRESTATION DE SERVICES

Entre les soussignés :

[Nom du client], ci-après dénommé "le Client"
ET
[Nom du prestataire], ci-après dénommé "le Prestataire"

Article 1 - Objet
Le présent contrat a pour objet...

Article 2 - Durée
Le contrat est conclu pour une durée de...

Article 3 - Conditions financières
Le montant total de la prestation s'élève à ${context?.montant || 'XXX'} euros.

Fait à ${context?.lieu || '[Ville]'}, le ${new Date().toLocaleDateString('fr-FR')}

Signatures :
Le Client                    Le Prestataire`,

    mise_en_demeure: `MISE EN DEMEURE

Recommandé avec accusé de réception

De : [Votre nom/société]
À : ${context?.destinataire || '[Destinataire]'}

Objet : Mise en demeure de payer

Madame, Monsieur,

Par la présente, nous vous mettons en demeure de bien vouloir procéder au règlement de la somme de ${context?.montant || 'XXX'} euros, correspondant à ${context?.motif || 'la facture n°XXX'}.

Malgré nos relances, cette somme reste impayée à ce jour.

Vous disposez d'un délai de 8 jours à compter de la réception de cette lettre pour régulariser votre situation.

À défaut, nous nous réserverons le droit d'engager toute action en justice.

Fait le ${new Date().toLocaleDateString('fr-FR')}`,

    assignation: `ASSIGNATION EN JUSTICE

TRIBUNAL JUDICIAIRE DE ${context?.tribunal || '[Ville]'}

DEMANDEUR :
${context?.demandeur || '[Nom du demandeur]'}

DÉFENDEUR :
${context?.defendeur || '[Nom du défendeur]'}

OBJET : ${context?.objet || 'Recouvrement de créance'}

EXPOSÉ DES FAITS :
[Description détaillée des faits]

DEMANDES :
1. Condamner le défendeur au paiement de ${context?.montant || 'XXX'} euros
2. Condamner le défendeur aux dépens

Fait le ${new Date().toLocaleDateString('fr-FR')}`,

    courrier: `Objet : ${context?.objet || '[Objet du courrier]'}

Madame, Monsieur,

${context?.contenu || 'Contenu du courrier...'}

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

Fait le ${new Date().toLocaleDateString('fr-FR')}`
  }
  
  return templates[type] || templates.courrier
}

/**
 * Suggestions d'actions basées sur un dossier
 */
export async function getSuggestions(dossier: any): Promise<string[]> {
  await simulateDelay()
  
  const suggestions = [
    `Vérifier l'échéance du ${dossier.dateEcheance || 'XX/XX/XXXX'}`,
    `Contacter ${dossier.client || 'le client'} pour mise à jour du dossier`,
    `Préparer les documents pour l'audience`,
    `Effectuer une relance amiable avant procédure`,
    `Consulter la jurisprudence similaire`
  ]
  
  return suggestions
}

/**
 * Analyse des risques d'un dossier
 */
export async function analyzeRisk(dossier: any): Promise<RiskAnalysis> {
  await simulateDelay()
  
  // Calcul simplifié du score de risque
  let score = 50
  const factors: RiskAnalysis['factors'] = []
  
  if (dossier.montant && dossier.montant > 10000) {
    score += 15
    factors.push({
      factor: 'Montant élevé',
      impact: 'negative',
      description: `Le montant de ${dossier.montant}€ augmente le risque financier`
    })
  }
  
  if (dossier.urgence === 'critique') {
    score += 20
    factors.push({
      factor: 'Urgence critique',
      impact: 'negative',
      description: 'Délai très court nécessitant une action immédiate'
    })
  }
  
  if (dossier.documents && dossier.documents.length > 5) {
    score -= 10
    factors.push({
      factor: 'Bonne documentation',
      impact: 'positive',
      description: 'Nombreuses pièces justificatives au dossier'
    })
  }
  
  const level = score >= 75 ? 'critique' : score >= 60 ? 'élevé' : score >= 40 ? 'moyen' : 'faible'
  
  const recommendations = [
    'Prioriser ce dossier dans le planning',
    'Prévoir une audience de mise en état',
    'Constituer un dossier de preuves solide',
    'Envisager une médiation préalable'
  ]
  
  return { score, level, factors, recommendations }
}

/**
 * Résumé d'un document
 */
export async function summarizeDocument(text: string): Promise<DocumentSummary> {
  await simulateDelay()
  
  const words = text.split(' ')
  const summary = words.slice(0, 50).join(' ') + '...'
  
  const keyPoints = [
    'Point clé identifié dans le document',
    'Élément important à retenir',
    'Information cruciale pour le dossier'
  ]
  
  return {
    summary,
    keyPoints,
    sentiment: 'neutral'
  }
}

/**
 * Chat avec l'assistant IA
 */
export async function chatWithAI(message: string, context?: any): Promise<string> {
  await simulateDelay()
  
  // Simulation de réponses contextuelles
  if (message.toLowerCase().includes('délai')) {
    return 'En matière de procédure civile, les délais de recours sont généralement de 15 jours à compter de la notification de la décision. Pour un appel, ce délai est d\'un mois.'
  }
  
  if (message.toLowerCase().includes('référé')) {
    return 'Le référé est une procédure d\'urgence permettant d\'obtenir une décision rapide du juge. Il existe plusieurs types : référé-provision, référé-injonction, référé-expertise...'
  }
  
  return `En tant qu'assistant juridique IA, je vous recommande de consulter les articles pertinents du Code de procédure civile et la jurisprudence récente sur ce sujet. Pour une question aussi spécifique, il serait prudent de vérifier auprès d'un avocat.`
}

/**
 * Extraction d'entités d'un texte
 */
export async function extractEntities(text: string): Promise<ExtractedEntities> {
  await simulateDelay()
  
  // Regex simples pour extraction
  const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}/g
  const montantRegex = /\d+\s*(?:€|euros?)/gi
  const refRegex = /(?:RG|n°|ref\.?)\s*[\d/]+/gi
  
  return {
    personnes: ['M. Dupont', 'Mme Martin'], // Mock - nécessiterait NLP réel
    dates: text.match(dateRegex) || [],
    montants: text.match(montantRegex) || [],
    references: text.match(refRegex) || []
  }
}

/**
 * Vérification de conformité d'un document
 */
export async function checkCompliance(document: string): Promise<ComplianceCheck> {
  await simulateDelay()
  
  const issues: ComplianceCheck['issues'] = []
  
  if (!document.includes('signature')) {
    issues.push({
      severity: 'warning',
      message: 'Aucune mention de signature trouvée',
      suggestion: 'Ajouter un bloc de signatures'
    })
  }
  
  if (!document.includes('date')) {
    issues.push({
      severity: 'error',
      message: 'Aucune date trouvée dans le document',
      suggestion: 'Indiquer la date de rédaction'
    })
  }
  
  if (document.length < 100) {
    issues.push({
      severity: 'info',
      message: 'Document très court',
      suggestion: 'Vérifier que tous les éléments sont présents'
    })
  }
  
  return {
    compliant: issues.filter(i => i.severity === 'error').length === 0,
    issues
  }
}

/**
 * Statistiques d'utilisation IA
 */
export function getAIUsageStats(): AIUsageStats {
  // Vérifier si on est côté client
  if (typeof window === 'undefined') {
    return {
      totalRequests: 0,
      totalTokens: 0,
      estimatedCost: 0
    }
  }
  
  const stats = localStorage.getItem('ai-usage-stats')
  if (stats) {
    return JSON.parse(stats)
  }
  
  return {
    totalRequests: 0,
    totalTokens: 0,
    estimatedCost: 0
  }
}

/**
 * Log d'utilisation
 */
export function logAIUsage(tokens: number) {
  // Vérifier si on est côté client
  if (typeof window === 'undefined') {
    return
  }
  
  const stats = getAIUsageStats()
  stats.totalRequests += 1
  stats.totalTokens += tokens
  stats.estimatedCost = stats.totalTokens * 0.00002 // Simulation de coût
  
  localStorage.setItem('ai-usage-stats', JSON.stringify(stats))
}
