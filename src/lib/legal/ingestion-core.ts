/**
 * Cœur (testable) de l'ingestion du corpus CESEDA versionné.
 *
 * Responsabilités :
 * - Transformer un `Article` PISTE/Légifrance en enregistrement `LegalReference`.
 * - Appliquer une politique de VERSIONNEMENT NON DESTRUCTIVE :
 *     • si la version arrivante existe déjà → mise à jour en place (contenu/URL),
 *     • si c'est une nouvelle version → on CLÔT la version ouverte précédente
 *       (`validUntil` = `validFrom` de la nouvelle, `isActive=false`) PUIS on
 *       insère la nouvelle version. L'historique n'est JAMAIS écrasé.
 *
 * Aucune donnée juridique n'est fabriquée : tout provient de l'`Article` fourni
 * par l'appelant (lui-même issu de PISTE). Ce module ne contient aucun texte
 * de loi en dur.
 */

import type { Article } from '@/types/legifrance';

/** Sous-ensemble du client Prisma dont l'ingestion a besoin (facilite le mock). */
export interface LegalReferencePrisma {
  findMany: (args: {
    where: { code: string; article: string };
  }) => Promise<ExistingVersion[]>;
  update: (args: {
    where: { id: string };
    data: Record<string, unknown>;
  }) => Promise<unknown>;
  create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
}

export interface ExistingVersion {
  id: string;
  code: string;
  article: string;
  version: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  isActive: boolean;
}

export interface IngestOptions {
  code?: string;
  category?: string;
  /** Générateur d'identifiant (défaut : crypto.randomUUID). */
  idFactory?: () => string;
  /** Horloge injectable pour les tests. */
  now?: () => Date;
}

export interface IngestResult {
  code: string;
  article: string;
  version: string;
  action: 'created' | 'updated' | 'skipped';
  /** Nombre de versions précédentes clôturées (validUntil renseigné). */
  closedPrevious: number;
}

/** Normalise un numéro d'article PISTE ("L. 611-1", "L611-1") en clé "L611-1". */
export function normalizeArticleNumber(num: string): string {
  const match = num.match(/\b([LRD])\.?\s?(\d+)\s?-\s?(\d+)\b/i);
  if (match) return `${match[1].toUpperCase()}${match[2]}-${match[3]}`;
  return num.replace(/\s|\./g, '').toUpperCase();
}

/** Parse une date PISTE (YYYY-MM-DD ou timestamp ms) en Date, ou null. */
export function parsePisteDate(value: string | number | undefined | null): Date | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') {
    // PISTE renvoie parfois 32472144000000 (année 2999) pour "pas de fin".
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Date "ouverte" dans Légifrance : certaines fins de validité sont encodées très
 * loin dans le futur (ex: 2999-01-01). On considère ces dates comme "pas de fin".
 */
export function isOpenEndedDate(date: Date | null): boolean {
  if (!date) return true;
  return date.getUTCFullYear() >= 2999;
}

/** Convertit un Article PISTE en données `LegalReference` (sans id/updatedAt). */
export function articleToLegalReference(
  article: Article,
  options: IngestOptions = {},
): {
  code: string;
  article: string;
  version: string;
  title: string;
  content: string;
  summary: string | null;
  category: string;
  keywords: string;
  legifrance_url: string | null;
  isActive: boolean;
  validFrom: Date | null;
  validUntil: Date | null;
} {
  const code = options.code ?? 'CESEDA';
  const articleKey = normalizeArticleNumber(article.num ?? '');
  const validFrom = parsePisteDate(article.dateDebut);
  const rawUntil = parsePisteDate(article.dateFin);
  const validUntil = isOpenEndedDate(rawUntil) ? null : rawUntil;

  // La version = date de début de validité (ISO court), stable et lisible.
  const version = validFrom
    ? validFrom.toISOString().slice(0, 10)
    : article.id || articleKey;

  const content = (article.texte ?? article.texteHtml ?? '').trim();
  const isActive =
    (article.etat ? article.etat.toUpperCase() === 'VIGUEUR' : true) && validUntil === null;

  return {
    code,
    article: articleKey,
    version,
    title: article.titre || `${code} ${articleKey}`,
    content,
    summary: article.nota?.trim() || null,
    category: options.category ?? 'general',
    keywords: JSON.stringify([]),
    legifrance_url: article.cid
      ? `https://www.legifrance.gouv.fr/codes/article_lc/${article.id}`
      : null,
    isActive,
    validFrom,
    validUntil,
  };
}

/**
 * Ingère un article dans `LegalReference` de façon versionnée et non destructive.
 *
 * Logique :
 * 1. Récupère toutes les versions existantes de (code, article).
 * 2. Si la `version` arrivante existe déjà → `update` (rafraîchit contenu/URL/état),
 *    action = 'updated'. On ne touche pas à l'historique.
 * 3. Sinon :
 *    a. Pour chaque version ouverte (`validUntil == null`) dont `validFrom` est
 *       antérieure à la nouvelle, on clôt : `validUntil = nouvelle.validFrom`,
 *       `isActive = false`. (La règle précédente cesse quand la nouvelle commence.)
 *    b. On `create` la nouvelle version.
 *    action = 'created'.
 *
 * N'écrase JAMAIS le texte d'une version historique.
 */
export async function ingestArticleVersion(
  db: LegalReferencePrisma,
  article: Article,
  options: IngestOptions = {},
): Promise<IngestResult> {
  const idFactory = options.idFactory ?? (() => cryptoRandomUUID());
  const now = options.now ?? (() => new Date());

  const data = articleToLegalReference(article, options);
  const existing = await db.findMany({
    where: { code: data.code, article: data.article },
  });

  // Cas 2 : la version existe déjà → mise à jour en place.
  const sameVersion = existing.find((e) => e.version === data.version);
  if (sameVersion) {
    await db.update({
      where: { id: sameVersion.id },
      data: {
        title: data.title,
        content: data.content,
        summary: data.summary,
        legifrance_url: data.legifrance_url,
        isActive: data.isActive,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        updatedAt: now(),
      },
    });
    return {
      code: data.code,
      article: data.article,
      version: data.version,
      action: 'updated',
      closedPrevious: 0,
    };
  }

  // Cas 3a : clôturer les versions ouvertes antérieures.
  let closedPrevious = 0;
  if (data.validFrom) {
    for (const prev of existing) {
      const prevOpen = prev.validUntil === null;
      const prevStartsBefore =
        prev.validFrom === null || prev.validFrom.getTime() < data.validFrom.getTime();
      if (prevOpen && prevStartsBefore) {
        await db.update({
          where: { id: prev.id },
          data: {
            validUntil: data.validFrom,
            isActive: false,
            updatedAt: now(),
          },
        });
        closedPrevious++;
      }
    }
  }

  // Cas 3b : insérer la nouvelle version.
  await db.create({
    data: {
      id: idFactory(),
      ...data,
      updatedAt: now(),
    },
  });

  return {
    code: data.code,
    article: data.article,
    version: data.version,
    action: 'created',
    closedPrevious,
  };
}

/** randomUUID isolé pour permettre un fallback si crypto global absent. */
function cryptoRandomUUID(): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodeCrypto = require('crypto') as typeof import('crypto');
  return nodeCrypto.randomUUID();
}

// ─── LIAISON JURISPRUDENCE ↔ ARTICLES ────────────────────────

/**
 * Extrait les références d'articles (CESEDA L/R/D) citées dans un texte de
 * décision. Sert à relier une jurisprudence aux articles qu'elle interprète
 * (ex: associer CE 509812 à R431-2). Déduplique les clés normalisées.
 */
export function extractArticleReferences(text: string): string[] {
  if (!text) return [];
  const matches = text.matchAll(/\b([LRD])\.?\s?(\d+)\s?-\s?(\d+)\b/gi);
  const keys = new Set<string>();
  for (const m of matches) {
    keys.add(`${m[1].toUpperCase()}${m[2]}-${m[3]}`);
  }
  return [...keys];
}
