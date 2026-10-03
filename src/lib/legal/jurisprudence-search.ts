/**
 * Logique pure (testable) de la recherche de jurisprudence.
 *
 * Isole du handler de route (qui fait l'I/O : auth, Prisma, cache, Judilibre)
 * les fonctions déterministes :
 *  - normalizeArticleKey : normalise une clé d'article CESEDA.
 *  - buildPostgresSearch : construit la clause WHERE + les paramètres positionnels
 *    de la requête SQL paramétrée (anti-injection), avec les index LIMIT/OFFSET.
 *  - filterFallbackRefs : filtre le jeu statique CESEDA (par article ou requête).
 *
 * Ces fonctions ne touchent NI la base NI le réseau : elles sont unit-testables.
 */

/** Normalise une clé d'article CESEDA ("L. 611-1", "r431-2") → "L611-1" ; null sinon. */
export function normalizeArticleKey(raw: string): string | null {
  const m = raw.match(/\b([LRD])\.?\s?(\d+)\s?-\s?(\d+)\b/i);
  if (!m) return null;
  return `${m[1].toUpperCase()}${m[2]}-${m[3]}`;
}

export interface PostgresSearchPlan {
  /** Clause WHERE complète (hors LIMIT/OFFSET), paramétrée en $1..$n. */
  where: string;
  /** Paramètres positionnels dans l'ordre ($1 = tsQuery, puis thème, puis article). */
  params: unknown[];
  /** Index positionnel de LIMIT (= params.length + 1). */
  limitIdx: number;
  /** Index positionnel d'OFFSET (= params.length + 2). */
  offsetIdx: number;
}

/**
 * Construit la clause WHERE et la liste de paramètres pour la recherche Postgres.
 *
 * - $1 est toujours la requête plein-texte (tsQuery).
 * - Si `type` != 'all', ajoute un filtre `$n = ANY(themes)` (thème en MAJUSCULES).
 * - Si `article` est fourni (déjà normalisé), ajoute `"relatedArticles" @> $n::text[]`.
 *
 * LIMIT/OFFSET ne sont PAS inclus dans `params` : l'appelant les ajoute après
 * `...params` dans l'ordre, aux positions `limitIdx`/`offsetIdx`.
 */
export function buildPostgresSearch(
  tsQuery: string,
  type: string,
  article: string | null,
): PostgresSearchPlan {
  const params: unknown[] = [tsQuery];
  const whereExtra: string[] = [];

  if (type !== 'all') {
    params.push(type.toUpperCase());
    whereExtra.push(`$${params.length} = ANY(themes)`);
  }
  if (article) {
    params.push([article]); // text[] pour l'opérateur de containment @>
    whereExtra.push(`"relatedArticles" @> $${params.length}::text[]`);
  }

  const where =
    `"searchVector" @@ plainto_tsquery('french', $1)` +
    (whereExtra.length ? ' AND ' + whereExtra.join(' AND ') : '');

  return {
    where,
    params,
    limitIdx: params.length + 1,
    offsetIdx: params.length + 2,
  };
}

export interface CesedaRef {
  id: string;
  titre: string;
  date: string;
  juridiction: string;
  numero: string;
  resume: string;
  url: string;
  themes: string[];
}

/**
 * Jeu de secours statique (références CESEDA) utilisé quand ni Postgres ni
 * Judilibre ne sont disponibles. Données indicatives — à vérifier sur Légifrance.
 */
export const CESEDA_REFS: CesedaRef[] = [
  { id: 'L511-1', titre: 'OQTF - Obligation de quitter le territoire', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L511-1', resume: "L'autorité administrative peut obliger un étranger à quitter le territoire français lorsque...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776905', themes: ['OQTF'] },
  { id: 'L313-11', titre: 'Carte de séjour temporaire - Vie privée et familiale', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L313-11', resume: "La carte de séjour temporaire portant la mention 'vie privée et familiale' est délivrée de plein droit...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776832', themes: ['TITRE_SEJOUR'] },
  { id: 'L431-2', titre: 'Titre de séjour - Renouvellement', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L431-2', resume: "Le renouvellement du titre de séjour est subordonné au respect des conditions prévues pour sa délivrance...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776780', themes: ['TITRE_SEJOUR'] },
  { id: 'L521-1', titre: 'Expulsion - Conditions', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L521-1', resume: "L'expulsion peut être prononcée si la présence en France d'un étranger constitue une menace grave pour l'ordre public...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776900', themes: ['EXPULSION'] },
  { id: 'L741-1', titre: "Demande d'asile - Procédure", date: '2024-01-01', juridiction: 'CESEDA', numero: 'L741-1', resume: "Tout étranger présent sur le territoire français et souhaitant demander l'asile se présente en personne...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776700', themes: ['ASILE'] },
  { id: 'L421-1', titre: 'Regroupement familial - Conditions', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L421-1', resume: "Le ressortissant étranger qui séjourne régulièrement en France depuis au moins dix-huit mois peut demander à bénéficier du regroupement familial...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776850', themes: ['REGROUPEMENT_FAMILIAL'] },
  { id: 'L823-1', titre: 'Naturalisation - Conditions', date: '2024-01-01', juridiction: 'CESEDA', numero: 'L823-1', resume: "Nul ne peut être naturalisé s'il ne justifie d'une résidence habituelle en France pendant les cinq années qui précèdent le dépôt de sa demande...", url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042776600', themes: ['NATURALISATION'] },
];

/**
 * Filtre le jeu statique.
 * - Si `article` est fourni (normalisé), ne retient que la référence dont le
 *   numéro correspond exactement à la clé.
 * - Sinon, recherche textuelle sur titre/résumé/numéro/thèmes.
 * Limité à 10 résultats.
 */
export function filterFallbackRefs(
  query: string,
  _type: string,
  article: string | null,
  refs: CesedaRef[] = CESEDA_REFS,
): CesedaRef[] {
  if (article) {
    return refs.filter((r) => normalizeArticleKey(r.numero) === article).slice(0, 10);
  }
  const q = query.toLowerCase();
  return refs
    .filter(
      (r) =>
        r.titre.toLowerCase().includes(q) ||
        r.resume.toLowerCase().includes(q) ||
        r.numero.toLowerCase().includes(q) ||
        r.themes.some((t) => t.toLowerCase().includes(q)),
    )
    .slice(0, 10);
}
