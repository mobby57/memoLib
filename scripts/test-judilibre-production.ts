import dotenv from 'dotenv';

dotenv.config({
  path: '.env.production',
});

import type {
  JudilibreDecision,
  JudilibreSearchResult,
} from '../src/lib/legifrance/judilibre-client';

let judilibreClient:
  typeof import('../src/lib/legifrance/judilibre-client').judilibreClient;

function separator(title: string) {
  console.log('\n' + '='.repeat(90));
  console.log(title);
  console.log('='.repeat(90));
}

function compactDecision(d: JudilibreDecision) {
  return {
    id: d.id,
    number: d.number,
    numbers: d.numbers,
    jurisdiction: d.jurisdiction,
    chamber: d.chamber,
    formation: d.formation,
    type: d.type,
    solution: d.solution,
    publication: d.publication,
    ecli: d.ecli,
    decision_date: d.decision_date,
    themes: d.themes,
    hasSummary: !!d.summary,
    summaryLength: d.summary?.length ?? 0,
    hasText: !!d.text,
    textLength: d.text?.length ?? 0,
    zones: d.zones ? Object.keys(d.zones) : [],
    highlightFields: d.highlights
      ? Object.keys(d.highlights)
      : [],
  };
}

function printSearch(
  label: string,
  result: JudilibreSearchResult
) {
  console.log(`\n${label}`);

  console.log({
    total: result.total,
    page: result.page,
    page_size: result.page_size,
    took: result.took,
    max_score: result.max_score,
    results: result.results.length,
    previous_page: result.previous_page,
    next_page: result.next_page,
  });

  for (const [index, d] of result.results.entries()) {
    console.log(`\n[${index + 1}]`);
    console.log(compactDecision(d));
  }
}

async function testSearches() {
  separator('1. SEARCH — CAPACITÉS DE RECHERCHE');

  const tests: Array<{
    name: string;
    params: Parameters<typeof judilibreClient.search>[0];
  }> = [
    {
      name: 'Recherche simple',
      params: {
        query: 'OQTF',
        page_size: 5,
      },
    },
    {
      name: 'AND',
      params: {
        query: 'OQTF titre séjour',
        operator: 'and',
        page_size: 5,
      },
    },
    {
      name: 'OR',
      params: {
        query: 'OQTF titre séjour',
        operator: 'or',
        page_size: 5,
      },
    },
    {
      name: 'EXACT',
      params: {
        query: 'obligation de quitter le territoire',
        operator: 'exact',
        page_size: 5,
      },
    },
    {
      name: 'Tri par date',
      params: {
        query: 'OQTF',
        sort: 'date',
        order: 'desc',
        page_size: 5,
      },
    },
    {
      name: 'Tri par score',
      params: {
        query: 'OQTF',
        sort: 'score',
        order: 'desc',
        page_size: 5,
      },
    },
    {
      name: 'Tri score publication',
      params: {
        query: 'OQTF',
        sort: 'scorepub',
        order: 'desc',
        page_size: 5,
      },
    },
    {
      name: 'Cour de cassation',
      params: {
        query: 'OQTF',
        jurisdiction: ['cc'],
        page_size: 5,
      },
    },
    {
      name: 'Cour d’appel',
      params: {
        query: 'OQTF',
        jurisdiction: ['ca'],
        page_size: 5,
      },
    },
    {
      name: 'Période récente',
      params: {
        query: 'OQTF',
        date_start: '2025-01-01',
        date_end: '2026-08-25',
        sort: 'date',
        order: 'desc',
        page_size: 5,
      },
    },
    {
      name: 'Références résolues',
      params: {
        query: 'OQTF',
        resolve_references: true,
        page_size: 5,
      },
    },
  ];

  for (const test of tests) {
    try {
      const result = await judilibreClient.search(
        test.params
      );

      printSearch(`✓ ${test.name}`, result);
    } catch (error) {
      console.error(`✗ ${test.name}`);
      console.error(
        error instanceof Error ? error.message : error
      );
    }
  }
}

async function testCeseda() {
  separator('2. CESEDA — RECHERCHE MÉTIER');

  const searches = [
    'OQTF',
    'rétention administrative',
    'assignation à résidence',
    'titre de séjour',
    'obligation de quitter le territoire',
    'asile',
    'L. 511-1 CESEDA',
  ];

  for (const query of searches) {
    try {
      const result =
        await judilibreClient.searchCesedaCaseLaw(query, {
          months: 24,
          pageSize: 10,
          jurisdiction: ['cc', 'ca'],
        });

      printSearch(`✓ CESEDA: ${query}`, result);
    } catch (error) {
      console.error(`✗ CESEDA: ${query}`);
      console.error(
        error instanceof Error ? error.message : error
      );
    }
  }
}

async function testDecision() {
  separator('3. DECISION — DONNÉES COMPLÈTES');

  const search = await judilibreClient.search({
    query: 'OQTF',
    sort: 'date',
    order: 'desc',
    page_size: 1,
  });

  if (!search.results[0]) {
    console.log('Aucune décision trouvée.');
    return;
  }

  const id = search.results[0].id;

  console.log('ID sélectionné:', id);

  const decision = await judilibreClient.getDecision(id, {
    resolve_references: true,
  });

  console.log('\nMétadonnées:');
  console.dir(compactDecision(decision), {
    depth: null,
  });

  console.log('\n--- SUMMARY ---');
  console.log(decision.summary ?? '(aucun)');

  console.log('\n--- TEXT PREVIEW ---');
  console.log(
    (decision.text ?? '(aucun texte)').slice(0, 5000)
  );

  console.log('\n--- ZONES ---');
  console.dir(decision.zones, {
    depth: 3,
  });

  console.log('\n--- HIGHLIGHTS ---');
  console.dir(decision.highlights, {
    depth: 3,
  });

  console.log('\n--- REFERENCES / NUMBERS ---');
  console.dir(decision.numbers, {
    depth: 3,
  });
}

async function testSearchByNumber() {
  separator('4. RECHERCHE PAR NUMÉRO DE POURVOI');

  const search = await judilibreClient.search({
    query: 'OQTF',
    page_size: 1,
  });

  const number = search.results[0]?.number;

  if (!number) {
    console.log('Aucun numéro de pourvoi trouvé.');
    return;
  }

  console.log('Numéro testé:', number);

  const result =
    await judilibreClient.searchByNumber(number);

  printSearch('Résultat', result);
}

async function testTaxonomy() {
  separator('5. TAXONOMIE');

  const ids = [
    'chamber',
    'formation',
    'solution',
    'publication',
    'type',
    'theme',
    'jurisdiction',
  ];

  for (const id of ids) {
    try {
      const result =
        await judilibreClient.getTaxonomy(id);

      console.log(`\n✓ ${id}`);

      console.dir(result, {
        depth: 5,
      });
    } catch (error) {
      console.error(`✗ taxonomy/${id}`);
      console.error(
        error instanceof Error ? error.message : error
      );
    }
  }
}

async function testStats() {
  separator('6. STATISTIQUES');

  try {
    const stats =
      await judilibreClient.getStats();

    console.dir(stats, {
      depth: 10,
    });
  } catch (error) {
    console.error('✗ Stats');
    console.error(
      error instanceof Error ? error.message : error
    );
  }
}

async function testPagination() {
  separator('7. PAGINATION');

  try {
    const page0 = await judilibreClient.search({
      query: 'OQTF',
      page_size: 5,
      page: 0,
      sort: 'date',
      order: 'desc',
    });

    const page1 = await judilibreClient.search({
      query: 'OQTF',
      page_size: 5,
      page: 1,
      sort: 'date',
      order: 'desc',
    });

    console.log('PAGE 0:', {
      page: page0.page,
      total: page0.total,
      results: page0.results.length,
      ids: page0.results.map(x => x.id),
      next_page: page0.next_page,
    });

    console.log('\nPAGE 1:', {
      page: page1.page,
      total: page1.total,
      results: page1.results.length,
      ids: page1.results.map(x => x.id),
      previous_page: page1.previous_page,
      next_page: page1.next_page,
    });

    const overlap = page0.results
      .map(x => x.id)
      .filter(id =>
        page1.results.some(x => x.id === id)
      );

    console.log(
      '\nIDs en double entre pages:',
      overlap
    );
  } catch (error) {
    console.error('✗ Pagination');
    console.error(
      error instanceof Error ? error.message : error
    );
  }
}

async function main() {
  /*
   * IMPORTANT :
   * dotenv doit être chargé avant la création du singleton
   * JudilibreClient.
   *
   * L'import dynamique garantit cet ordre.
   */
  const module =
    await import('../src/lib/legifrance/judilibre-client');

  judilibreClient = module.judilibreClient;

  separator('JUDILIBRE — AUDIT COMPLET PRODUCTION');

  console.log({
    JUDILIBRE_ENVIRONMENT:
      process.env.JUDILIBRE_ENVIRONMENT,

    PISTE_ENVIRONMENT:
      process.env.PISTE_ENVIRONMENT,

    hasJudilibreKeyId:
      !!process.env.JUDILIBRE_KEY_ID,

    hasProdClientId:
      !!process.env.PISTE_PROD_CLIENT_ID,

    hasProdClientSecret:
      !!process.env.PISTE_PROD_CLIENT_SECRET,

    oauthUrl:
      process.env.PISTE_PROD_OAUTH_URL ??
      'https://oauth.piste.gouv.fr/api/oauth/token',

    apiUrl:
      process.env.PISTE_PROD_API_URL ??
      'https://api.piste.gouv.fr/cassation/judilibre/v1.0',

    available:
      judilibreClient.isAvailable(),
  });

  if (!judilibreClient.isAvailable()) {
    throw new Error(
      'Judilibre n’est pas configuré.'
    );
  }

  await testSearches();
  await testCeseda();
  await testDecision();
  await testSearchByNumber();
  await testTaxonomy();
  await testStats();
  await testPagination();

  separator('AUDIT TERMINÉ');
}

main().catch(error => {
  console.error(
    '\n❌ AUDIT JUDILIBRE ÉCHOUÉ'
  );

  console.error(
    error instanceof Error
      ? error.stack
      : error
  );

  process.exit(1);
});