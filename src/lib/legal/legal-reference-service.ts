/**
 * Service de consultation du corpus juridique versionné (LegalReference).
 *
 * OBJECTIF : répondre à la question temporelle d'un avocat —
 *   « Quelle était la règle applicable à la date où la demande a été déposée ? »
 * et non uniquement « Quelle est la règle aujourd'hui ? ».
 *
 * Le modèle Prisma `LegalReference` stocke chaque article dans ses versions
 * successives (unique [code, article, version]) avec une fenêtre de validité
 * `validFrom`/`validUntil`. Ce service sélectionne la version EN VIGUEUR à une
 * date donnée, sans jamais écraser l'historique.
 *
 * IMPORTANT :
 * - Aucune donnée juridique n'est fabriquée ici. Le service ne fait que LIRE
 *   ce que l'ingestion (PISTE/Légifrance) a enregistré.
 * - Si la table est vide (corpus non encore ingéré), les lectures renvoient
 *   `null` / `[]` de façon gracieuse pour que l'appelant puisse retomber sur
 *   ses constantes de secours. Aucune exception non maîtrisée.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Représentation applicative d'une version d'article de corpus.
 * `keywords` est décodé depuis le JSON string stocké en base.
 */
export interface LegalReferenceVersion {
  id: string;
  code: string;
  article: string;
  version: string | null;
  title: string;
  content: string;
  summary: string | null;
  category: string;
  keywords: string[];
  defaultDeadlineDays: number | null;
  deadlineType: string | null;
  legifranceUrl: string | null;
  eurlexUrl: string | null;
  isActive: boolean;
  validFrom: Date | null;
  validUntil: Date | null;
}

/** Forme brute telle que renvoyée par Prisma (sous-ensemble utilisé). */
interface RawLegalReference {
  id: string;
  code: string;
  article: string;
  version: string | null;
  title: string;
  content: string;
  summary: string | null;
  category: string;
  keywords: string | null;
  defaultDeadlineDays: number | null;
  deadlineType: string | null;
  legifrance_url: string | null;
  eurlex_url: string | null;
  isActive: boolean;
  validFrom: Date | null;
  validUntil: Date | null;
}

/** Décode le champ `keywords` (JSON string en base) en tableau sûr. */
function parseKeywords(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((k): k is string => typeof k === 'string');
    }
    return [];
  } catch {
    // Tolère un champ non-JSON (ancienne donnée) : on le traite comme un mot-clé unique.
    return raw.trim() ? [raw.trim()] : [];
  }
}

/** Normalise une ligne Prisma vers le type applicatif. */
function toVersion(row: RawLegalReference): LegalReferenceVersion {
  return {
    id: row.id,
    code: row.code,
    article: row.article,
    version: row.version,
    title: row.title,
    content: row.content,
    summary: row.summary,
    category: row.category,
    keywords: parseKeywords(row.keywords),
    defaultDeadlineDays: row.defaultDeadlineDays,
    deadlineType: row.deadlineType,
    legifranceUrl: row.legifrance_url,
    eurlexUrl: row.eurlex_url,
    isActive: row.isActive,
    validFrom: row.validFrom,
    validUntil: row.validUntil,
  };
}

/**
 * Détermine si une version est en vigueur à une date donnée.
 *
 * Règles (bornes incluses côté `validFrom`, exclues côté `validUntil`) :
 * - `validFrom == null`  → pas de borne de début (toujours valable "avant").
 * - `validUntil == null` → encore en vigueur (pas de date de fin).
 * - En vigueur si : validFrom <= date ET (validUntil == null OU date < validUntil).
 *
 * `validUntil` est traité comme exclusif : une version close le 2026-09-30 avec
 * `validUntil = 2026-10-01` n'est plus en vigueur au 1er octobre, moment où la
 * version suivante (`validFrom = 2026-10-01`) prend le relais sans chevauchement.
 */
export function isInForceAt(
  version: Pick<LegalReferenceVersion, 'validFrom' | 'validUntil'>,
  date: Date,
): boolean {
  const t = date.getTime();
  if (version.validFrom && version.validFrom.getTime() > t) return false;
  if (version.validUntil && version.validUntil.getTime() <= t) return false;
  return true;
}

/**
 * Sélectionne, parmi plusieurs versions, celle en vigueur à `date`.
 * En cas d'ambiguïté (données qui se chevauchent), privilégie la version dont
 * `validFrom` est la plus récente mais <= date (la plus spécifique).
 */
export function selectVersionInForce(
  versions: LegalReferenceVersion[],
  date: Date,
): LegalReferenceVersion | null {
  const candidates = versions.filter((v) => isInForceAt(v, date));
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  return candidates.reduce((best, current) => {
    const bestFrom = best.validFrom?.getTime() ?? -Infinity;
    const currentFrom = current.validFrom?.getTime() ?? -Infinity;
    return currentFrom > bestFrom ? current : best;
  });
}

export interface GetArticleOptions {
  /** Date à laquelle on veut la version en vigueur. Défaut : maintenant. */
  at?: Date;
  /** Code du corpus. Défaut : "CESEDA". */
  code?: string;
}

/**
 * Retourne la version d'un article en vigueur à une date donnée, ou `null`.
 *
 * Ne lève jamais : en cas d'erreur DB ou de table vide, log + `null` pour
 * permettre un fallback propre côté appelant.
 */
export async function getArticleAtDate(
  article: string,
  options: GetArticleOptions = {},
): Promise<LegalReferenceVersion | null> {
  const code = options.code ?? 'CESEDA';
  const at = options.at ?? new Date();

  try {
    const rows: RawLegalReference[] = await prisma.legalReference.findMany({
      where: { code, article },
    });
    if (!rows || rows.length === 0) return null;

    return selectVersionInForce(rows.map(toVersion), at);
  } catch (error) {
    logger.warn('[legal-reference] getArticleAtDate a échoué, fallback appelant', {
      code,
      article,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Retourne, pour une liste d'articles, la version en vigueur à `date`.
 * Les articles absents du corpus sont simplement omis du résultat.
 */
export async function getArticlesAtDate(
  articles: string[],
  options: GetArticleOptions = {},
): Promise<LegalReferenceVersion[]> {
  const code = options.code ?? 'CESEDA';
  const at = options.at ?? new Date();
  if (articles.length === 0) return [];

  try {
    const rows: RawLegalReference[] = await prisma.legalReference.findMany({
      where: { code, article: { in: articles } },
    });
    if (!rows || rows.length === 0) return [];

    const byArticle = new Map<string, LegalReferenceVersion[]>();
    for (const row of rows.map(toVersion)) {
      const list = byArticle.get(row.article) ?? [];
      list.push(row);
      byArticle.set(row.article, list);
    }

    const result: LegalReferenceVersion[] = [];
    for (const art of articles) {
      const versions = byArticle.get(art);
      if (!versions) continue;
      const inForce = selectVersionInForce(versions, at);
      if (inForce) result.push(inForce);
    }
    return result;
  } catch (error) {
    logger.warn('[legal-reference] getArticlesAtDate a échoué, fallback appelant', {
      code,
      count: articles.length,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Retourne les versions en vigueur à `date` pour une catégorie (ex: "OQTF").
 * Utile pour alimenter l'agent CESEDA par thème de procédure.
 */
export async function getArticlesByCategoryAtDate(
  category: string,
  options: GetArticleOptions = {},
): Promise<LegalReferenceVersion[]> {
  const code = options.code ?? 'CESEDA';
  const at = options.at ?? new Date();

  try {
    const rows: RawLegalReference[] = await prisma.legalReference.findMany({
      where: { code, category },
    });
    if (!rows || rows.length === 0) return [];

    const byArticle = new Map<string, LegalReferenceVersion[]>();
    for (const row of rows.map(toVersion)) {
      const list = byArticle.get(row.article) ?? [];
      list.push(row);
      byArticle.set(row.article, list);
    }

    const result: LegalReferenceVersion[] = [];
    for (const versions of byArticle.values()) {
      const inForce = selectVersionInForce(versions, at);
      if (inForce) result.push(inForce);
    }
    return result;
  } catch (error) {
    logger.warn('[legal-reference] getArticlesByCategoryAtDate a échoué', {
      code,
      category,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Retourne l'historique complet (toutes versions) d'un article, trié par
 * `validFrom` croissant. Permet de montrer à l'avocat l'évolution d'un article.
 */
export async function getArticleHistory(
  article: string,
  options: Pick<GetArticleOptions, 'code'> = {},
): Promise<LegalReferenceVersion[]> {
  const code = options.code ?? 'CESEDA';

  try {
    const rows: RawLegalReference[] = await prisma.legalReference.findMany({
      where: { code, article },
    });
    if (!rows || rows.length === 0) return [];

    return rows
      .map(toVersion)
      .sort((a, b) => (a.validFrom?.getTime() ?? 0) - (b.validFrom?.getTime() ?? 0));
  } catch (error) {
    logger.warn('[legal-reference] getArticleHistory a échoué', {
      code,
      article,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Indique si le corpus contient au moins un article pour un code donné.
 * Permet à l'appelant de décider s'il utilise la base versionnée ou son
 * fallback statique.
 */
export async function isCorpusPopulated(code = 'CESEDA'): Promise<boolean> {
  try {
    const count = await prisma.legalReference.count({ where: { code } });
    return count > 0;
  } catch (error) {
    logger.warn('[legal-reference] isCorpusPopulated a échoué', {
      code,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
