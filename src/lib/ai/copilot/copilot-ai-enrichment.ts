/**
 * Copilote CESEDA — Enrichissement IA (Ollama)
 *
 * Ajoute une couche d'analyse en langage naturel au-dessus
 * de l'analyse déterministe. Produit :
 * - Un résumé narratif en français juridique
 * - Une analyse de risque contextuelle
 * - Des recommandations stratégiques détaillées
 *
 * Fallback gracieux si Ollama indisponible.
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';

export interface AIEnrichment {
  narrative: string;
  strategicAdvice: string;
  riskExplanation: string;
  method: 'ollama' | 'fallback';
}

export async function enrichWithAI(context: {
  typeDossier: string;
  situation: string[];
  strengths: string[];
  weaknesses: string[];
  missingDocs: string[];
  deadlineDays?: number;
}): Promise<AIEnrichment> {
  const prompt = buildEnrichmentPrompt(context);

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false, options: { temperature: 0.3 } }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new Error('Ollama unavailable');
    const data = await res.json();
    const text = data.response || '';

    // Parser les sections
    const narrative = extractSection(text, 'RÉSUMÉ') || text.slice(0, 300);
    const strategicAdvice = extractSection(text, 'STRATÉGIE') || '';
    const riskExplanation = extractSection(text, 'RISQUE') || '';

    return { narrative, strategicAdvice, riskExplanation, method: 'ollama' };
  } catch {
    return fallbackEnrichment(context);
  }
}

function buildEnrichmentPrompt(ctx: {
  typeDossier: string;
  situation: string[];
  strengths: string[];
  weaknesses: string[];
  missingDocs: string[];
  deadlineDays?: number;
}): string {
  return `Tu es un assistant juridique spécialisé CESEDA. Analyse ce dossier et produis 3 sections.

DOSSIER:
- Type: ${ctx.typeDossier}
- Situation: ${ctx.situation.join(', ')}
- Forces: ${ctx.strengths.join(', ') || 'aucune identifiée'}
- Faiblesses: ${ctx.weaknesses.join(', ') || 'aucune identifiée'}
- Documents manquants: ${ctx.missingDocs.join(', ') || 'aucun'}
${ctx.deadlineDays !== undefined ? `- Délai le plus proche: J-${ctx.deadlineDays}` : ''}

Réponds en 3 sections (max 3 phrases chacune):

RÉSUMÉ:
[Synthèse factuelle de la situation juridique]

STRATÉGIE:
[Recommandation stratégique principale pour l'avocat]

RISQUE:
[Explication du niveau de risque et conséquences si inaction]

IMPORTANT: Ne donne JAMAIS de conseil juridique définitif. Utilise "semble", "pourrait", "à vérifier".`;
}

function extractSection(text: string, section: string): string {
  const regex = new RegExp(`${section}[:\\s]*([\\s\\S]*?)(?=(?:RÉSUMÉ|STRATÉGIE|RISQUE|$))`, 'i');
  const match = text.match(regex);
  return match?.[1]?.trim().slice(0, 500) || '';
}

function fallbackEnrichment(ctx: {
  typeDossier: string;
  situation: string[];
  strengths: string[];
  weaknesses: string[];
  deadlineDays?: number;
}): AIEnrichment {
  const type = ctx.typeDossier.replace(/_/g, ' ');
  const narrative = `Dossier de type ${type}. ${ctx.situation.slice(0, 3).join(', ')}. ${ctx.strengths.length > 0 ? `${ctx.strengths.length} élément(s) favorable(s) identifié(s).` : ''} ${ctx.weaknesses.length > 0 ? `${ctx.weaknesses.length} point(s) d'attention.` : ''}`;
  const strategicAdvice = ctx.deadlineDays !== undefined && ctx.deadlineDays <= 7
    ? `Priorité absolue : traiter le délai à J-${ctx.deadlineDays} avant toute autre action.`
    : `Compléter le dossier documentaire puis analyser les voies de recours.`;
  const riskExplanation = ctx.deadlineDays !== undefined && ctx.deadlineDays <= 3
    ? `Risque critique de forclusion. En cas d'inaction, perte définitive du droit de recours.`
    : `Risque modéré. Le dossier nécessite un suivi régulier.`;

  return { narrative, strategicAdvice, riskExplanation, method: 'fallback' };
}
