/**
 * Service de consultation de la jurisprudence liée aux articles CESEDA.
 *
 * S'appuie sur le champ `Jurisprudence.relatedArticles` (rempli par
 * scripts/link-jurisprudence.ts) pour répondre à :
 *   « Quelles décisions interprètent l'article R431-2 ? »
 *
 * Comme le service de corpus, il ne lève jamais : en cas de table vide ou
 * d'erreur, il renvoie `[]` pour laisser l'appelant retomber sur ses constantes.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface LinkedDecision {
  id: string;
  titre: string;
  date: Date;
  juridiction: string;
  numero: string | null;
  solution: string | null;
  resume: string | null;
  url: string | null;
  themes: string[];
  relatedArticles: string[];
}

interface RawDecision {
  id: string;
  titre: string;
  date: Date;
  juridiction: string;
  numero: string | null;
  solution: string | null;
  resume: string | null;
  url: string | null;
  themes: string[];
  relatedArticles: string[];
}

export interface GetJurisprudenceOptions {
  /**
   * Ne retenir que les décisions rendues à cette date ou avant (pertinent pour
   * raisonner "à la date des faits"). Défaut : pas de borne.
   */
  at?: Date;
  /** Nombre maximum de décisions. Défaut : 5. */
  limit?: number;
}

function toDecision(row: RawDecision): LinkedDecision {
  return {
    id: row.id,
    titre: row.titre,
    date: row.date,
    juridiction: row.juridiction,
    numero: row.numero,
    solution: row.solution,
    resume: row.resume,
    url: row.url,
    themes: row.themes,
    relatedArticles: row.relatedArticles,
  };
}

/**
 * Retourne les décisions liées à un article (clé normalisée, ex: "R431-2"),
 * les plus récentes d'abord. `[]` si aucune / table vide / erreur.
 */
export async function getJurisprudenceForArticle(
  articleKey: string,
  options: GetJurisprudenceOptions = {},
): Promise<LinkedDecision[]> {
  const limit = options.limit ?? 5;

  try {
    const rows: RawDecision[] = await prisma.jurisprudence.findMany({
      where: {
        relatedArticles: { has: articleKey },
        ...(options.at ? { date: { lte: options.at } } : {}),
      },
      orderBy: { date: 'desc' },
      take: limit,
      select: {
        id: true,
        titre: true,
        date: true,
        juridiction: true,
        numero: true,
        solution: true,
        resume: true,
        url: true,
        themes: true,
        relatedArticles: true,
      },
    });
    if (!rows || rows.length === 0) return [];
    return rows.map(toDecision);
  } catch (error) {
    logger.warn('[jurisprudence] getJurisprudenceForArticle a échoué, fallback appelant', {
      articleKey,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Variante multi-articles : retourne une map articleKey → décisions liées.
 * Les articles sans décision sont absents de la map.
 */
export async function getJurisprudenceForArticles(
  articleKeys: string[],
  options: GetJurisprudenceOptions = {},
): Promise<Map<string, LinkedDecision[]>> {
  const result = new Map<string, LinkedDecision[]>();
  if (articleKeys.length === 0) return result;

  const limit = options.limit ?? 5;

  try {
    // Une requête par article : simple, borné par la liste courte d'articles
    // d'un dossier, et évite de ramener puis re-trier côté app.
    await Promise.all(
      articleKeys.map(async (key) => {
        const decisions = await getJurisprudenceForArticle(key, { ...options, limit });
        if (decisions.length > 0) result.set(key, decisions);
      }),
    );
    return result;
  } catch (error) {
    logger.warn('[jurisprudence] getJurisprudenceForArticles a échoué', {
      count: articleKeys.length,
      error: error instanceof Error ? error.message : String(error),
    });
    return result;
  }
}
