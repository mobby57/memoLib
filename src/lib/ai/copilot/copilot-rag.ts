/**
 * Copilote CESEDA — RAG (Retrieval-Augmented Generation)
 *
 * Recherche dans les documents du cabinet pour enrichir les analyses.
 * Utilise les embeddings Ollama (nomic-embed-text) + similarité cosinus.
 *
 * Cas d'usage :
 * - Trouver des mémoires similaires déjà rédigés
 * - Identifier des jurisprudences déjà utilisées
 * - Réutiliser des arguments qui ont fonctionné
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

export interface RAGResult {
  documentId: string;
  documentName: string;
  relevance: number;
  excerpt: string;
  dossierId?: string;
  dossierNumero?: string;
}

/**
 * Recherche des documents similaires dans le cabinet
 */
export async function searchSimilarDocuments(query: string, tenantId: string, limit = 5): Promise<RAGResult[]> {
  // Obtenir l'embedding de la requête
  const queryEmbedding = await getEmbedding(query);
  if (!queryEmbedding) return [];

  // En production : chercher dans pgvector
  // Pour l'instant : recherche textuelle fallback
  return searchByKeywords(query, tenantId, limit);
}

/**
 * Trouve des dossiers similaires pour s'en inspirer
 */
export async function findSimilarCases(typeDossier: string, situation: string[], tenantId: string): Promise<RAGResult[]> {
  const query = `${typeDossier} ${situation.join(' ')}`;
  return searchSimilarDocuments(query, tenantId, 3);
}

/**
 * Obtient un embedding via Ollama (nomic-embed-text)
 */
async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'nomic-embed-text', prompt: text.slice(0, 2000) }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.embedding || null;
  } catch {
    return null;
  }
}

/**
 * Similarité cosinus entre deux vecteurs
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Fallback : recherche par mots-clés (quand embeddings indisponibles)
 */
async function searchByKeywords(query: string, tenantId: string, limit: number): Promise<RAGResult[]> {
  // Import dynamique pour éviter les erreurs côté client
  const { prisma } = await import('@/lib/prisma');

  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 5);
  if (keywords.length === 0) return [];

  const documents = await prisma.document.findMany({
    where: {
      tenantId,
      OR: keywords.map(k => ({ name: { contains: k, mode: 'insensitive' as const } })),
    },
    select: { id: true, name: true, dossierId: true, dossier: { select: { numero: true } } },
    take: limit,
  });

  return documents.map((doc, i) => ({
    documentId: doc.id,
    documentName: doc.name || 'Document sans nom',
    relevance: 1 - (i * 0.15),
    excerpt: '',
    dossierId: doc.dossierId || undefined,
    dossierNumero: doc.dossier?.numero,
  }));
}
