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
  level: 'faible' | 'moyen' | 'eleve' | 'critique'
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
 * Generation de documents juridiques
 */
export async function generateDocument(
  type: 'contrat' | 'mise_en_demeure' | 'assignation' | 'courrier',
  context: any
): Promise<string> {
  await simulateDelay()
  
  const templates = {
    contrat: `CONTRAT DE PRESTATION DE SERVICES

Entre les soussignes :

[Nom du client], ci-apres denomme "le Client"
ET
[Nom du prestataire], ci-apres denomme "le Prestataire"

Article 1 - Objet
Le present contrat a pour objet...

Article 2 - Duree
Le contrat est conclu pour une duree de...

Article 3 - Conditions financieres
Le montant total de la prestation s'eleve a ${context?.montant || 'XXX'} euros.

Fait a ${context?.lieu || '[Ville]'}, le ${new Date().toLocaleDateString('fr-FR')}

Signatures :
Le Client                    Le Prestataire`,

    mise_en_demeure: `MISE EN DEMEURE

Recommande avec accuse de reception

De : [Votre nom/societe]
a : ${context?.destinataire || '[Destinataire]'}

Objet : Mise en demeure de payer

Madame, Monsieur,

Par la presente, nous vous mettons en demeure de bien vouloir proceder au reglement de la somme de ${context?.montant || 'XXX'} euros, correspondant a ${context?.motif || 'la facture n degXXX'}.

Malgre nos relances, cette somme reste impayee a ce jour.

Vous disposez d'un delai de 8 jours a compter de la reception de cette lettre pour regulariser votre situation.

a defaut, nous nous reserverons le droit d'engager toute action en justice.

Fait le ${new Date().toLocaleDateString('fr-FR')}`,

    assignation: `ASSIGNATION EN JUSTICE

TRIBUNAL JUDICIAIRE DE ${context?.tribunal || '[Ville]'}

DEMANDEUR :
${context?.demandeur || '[Nom du demandeur]'}

DeFENDEUR :
${context?.defendeur || '[Nom du defendeur]'}

OBJET : ${context?.objet || 'Recouvrement de creance'}

EXPOSe DES FAITS :
[Description detaillee des faits]

DEMANDES :
1. Condamner le defendeur au paiement de ${context?.montant || 'XXX'} euros
2. Condamner le defendeur aux depens

Fait le ${new Date().toLocaleDateString('fr-FR')}`,

    courrier: `Objet : ${context?.objet || '[Objet du courrier]'}

Madame, Monsieur,

${context?.contenu || 'Contenu du courrier...'}

Je vous prie d'agreer, Madame, Monsieur, l'expression de mes salutations distinguees.

Fait le ${new Date().toLocaleDateString('fr-FR')}`
  }
  
  return templates[type] || templates.courrier
}

/**
 * Suggestions d'actions basees sur un dossier
 */
export async function getSuggestions(dossier: any): Promise<string[]> {
  await simulateDelay()
  
  const suggestions = [
    `Verifier l'echeance du ${dossier.dateEcheance || 'XX/XX/XXXX'}`,
    `Contacter ${dossier.client || 'le client'} pour mise a jour du dossier`,
    `Preparer les documents pour l'audience`,
    `Effectuer une relance amiable avant procedure`,
    `Consulter la jurisprudence similaire`
  ]
  
  return suggestions
}

/**
 * Analyse des risques d'un dossier
 */
export async function analyzeRisk(dossier: any): Promise<RiskAnalysis> {
  await simulateDelay()
  
  // Calcul simplifie du score de risque
  let score = 50
  const factors: RiskAnalysis['factors'] = []
  
  if (dossier.montant && dossier.montant > 10000) {
    score += 15
    factors.push({
      factor: 'Montant eleve',
      impact: 'negative',
      description: `Le montant de ${dossier.montant}€ augmente le risque financier`
    })
  }
  
  if (dossier.urgence === 'critique') {
    score += 20
    factors.push({
      factor: 'Urgence critique',
      impact: 'negative',
      description: 'Delai tres court necessitant une action immediate'
    })
  }
  
  if (dossier.documents && dossier.documents.length > 5) {
    score -= 10
    factors.push({
      factor: 'Bonne documentation',
      impact: 'positive',
      description: 'Nombreuses pieces justificatives au dossier'
    })
  }
  
  const level = score >= 75 ? 'critique' : score >= 60 ? 'eleve' : score >= 40 ? 'moyen' : 'faible'
  
  const recommendations = [
    'Prioriser ce dossier dans le planning',
    'Prevoir une audience de mise en etat',
    'Constituer un dossier de preuves solide',
    'Envisager une mediation prealable'
  ]
  
  return { score, level, factors, recommendations }
}

/**
 * Resume d'un document
 */
export async function summarizeDocument(text: string): Promise<DocumentSummary> {
  await simulateDelay()
  
  const words = text.split(' ')
  const summary = words.slice(0, 50).join(' ') + '...'
  
  const keyPoints = [
    'Point cle identifie dans le document',
    'element important a retenir',
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
  
  // Simulation de reponses contextuelles
  if (message.toLowerCase().includes('delai')) {
    return 'En matiere de procedure civile, les delais de recours sont generalement de 15 jours a compter de la notification de la decision. Pour un appel, ce delai est d\'un mois.'
  }
  
  if (message.toLowerCase().includes('refere')) {
    return 'Le refere est une procedure d\'urgence permettant d\'obtenir une decision rapide du juge. Il existe plusieurs types : refere-provision, refere-injonction, refere-expertise...'
  }
  
  return `En tant qu'assistant juridique IA, je vous recommande de consulter les articles pertinents du Code de procedure civile et la jurisprudence recente sur ce sujet. Pour une question aussi specifique, il serait prudent de verifier aupres d'un avocat.`
}

/**
 * Extraction d'entites d'un texte
 */
export async function extractEntities(text: string): Promise<ExtractedEntities> {
  await simulateDelay()
  
  // Regex simples pour extraction
  const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}/g
  const montantRegex = /\d+\s*(?:€|euros?)/gi
  const refRegex = /(?:RG|n deg|ref\.?)\s*[\d/]+/gi
  
  return {
    personnes: ['M. Dupont', 'Mme Martin'], // Mock - necessiterait NLP reel
    dates: text.match(dateRegex) || [],
    montants: text.match(montantRegex) || [],
    references: text.match(refRegex) || []
  }
}

/**
 * Verification de conformite d'un document
 */
export async function checkCompliance(document: string): Promise<ComplianceCheck> {
  await simulateDelay()
  
  const issues: ComplianceCheck['issues'] = []
  
  if (!document.includes('signature')) {
    issues.push({
      severity: 'warning',
      message: 'Aucune mention de signature trouvee',
      suggestion: 'Ajouter un bloc de signatures'
    })
  }
  
  if (!document.includes('date')) {
    issues.push({
      severity: 'error',
      message: 'Aucune date trouvee dans le document',
      suggestion: 'Indiquer la date de redaction'
    })
  }
  
  if (document.length < 100) {
    issues.push({
      severity: 'info',
      message: 'Document tres court',
      suggestion: 'Verifier que tous les elements sont presents'
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
  // Verifier si on est cote client
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
  // Verifier si on est cote client
  if (typeof window === 'undefined') {
    return
  }
  
  const stats = getAIUsageStats()
  stats.totalRequests += 1
  stats.totalTokens += tokens
  stats.estimatedCost = stats.totalTokens * 0.00002 // Simulation de cout
  
  localStorage.setItem('ai-usage-stats', JSON.stringify(stats))
}
