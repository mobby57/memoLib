import dotenv from 'dotenv';

dotenv.config({
  path: '.env.production',
});

async function main() {
  const { judilibreClient } = await import(
    '../src/lib/legifrance/judilibre-client'
  );

  console.log('\n========================================');
  console.log('TEST VRAIE DÉCISION JUDILIBRE');
  console.log('========================================\n');

  // 1. Recherche d'une vraie décision
  const search = await judilibreClient.search({
    query: 'OQTF',
    sort: 'date',
    order: 'desc',
    page_size: 1,
  });

  console.log('Nombre de résultats :', search.total);

  if (!search.results.length) {
    throw new Error('Aucune décision trouvée.');
  }

  const result = search.results[0];

  console.log('\n--- RÉSULTAT DE RECHERCHE ---');
  console.dir(
    {
      id: result.id,
      number: result.number,
      jurisdiction: result.jurisdiction,
      chamber: result.chamber,
      formation: result.formation,
      type: result.type,
      solution: result.solution,
      publication: result.publication,
      ecli: result.ecli,
      decision_date: result.decision_date,
    },
    { depth: null }
  );

  // 2. Récupération de la décision complète
  console.log('\nRécupération de la décision complète...');

  const decision = await judilibreClient.getDecision(result.id, {
    resolve_references: true,
  });

  console.log('\n--- DÉCISION COMPLÈTE ---');

  console.dir(
    {
      id: decision.id,
      number: decision.number,
      numbers: decision.numbers,
      jurisdiction: decision.jurisdiction,
      chamber: decision.chamber,
      formation: decision.formation,
      type: decision.type,
      solution: decision.solution,
      publication: decision.publication,
      ecli: decision.ecli,
      decision_date: decision.decision_date,
      themes: decision.themes,

      hasSummary: Boolean(decision.summary),
      summaryLength: decision.summary?.length ?? 0,

      hasText: Boolean(decision.text),
      textLength: decision.text?.length ?? 0,

      zoneCount: decision.zones
        ? Object.keys(decision.zones).length
        : 0,

      highlightFields: decision.highlights
        ? Object.keys(decision.highlights)
        : [],
    },
    { depth: null }
  );

  // 3. Résumé
  console.log('\n--- SUMMARY ---');

  console.log(
    decision.summary
      ? decision.summary
      : '(aucun résumé)'
  );

  // 4. Texte réel
  console.log('\n--- TEXTE DE LA DÉCISION ---');

  if (decision.text) {
    console.log(decision.text.slice(0, 10000));

    if (decision.text.length > 10000) {
      console.log(
        `\n...[texte tronqué : ${decision.text.length} caractères au total]`
      );
    }
  } else {
    console.log('(aucun texte)');
  }

  // 5. Références
  console.log('\n--- RÉFÉRENCES ---');

  console.dir(
    decision.numbers,
    { depth: null }
  );

  // 6. Zones
  console.log('\n--- ZONES ---');

  console.dir(
    decision.zones,
    { depth: 3 }
  );

  // 7. Validation finale
  console.log('\n========================================');
  console.log('VALIDATION');
  console.log('========================================');

  console.log(
    '✓ ID :',
    Boolean(decision.id)
  );

  console.log(
    '✓ Date :',
    Boolean(decision.decision_date)
  );

  console.log(
    '✓ Juridiction :',
    Boolean(decision.jurisdiction)
  );

  console.log(
    '✓ Texte :',
    Boolean(decision.text)
  );

  console.log(
    '✓ Longueur texte :',
    decision.text?.length ?? 0
  );

  console.log(
    '✓ Références :',
    decision.numbers?.length ?? 0
  );

  console.log('\n✓ TEST TERMINÉ');
}

main().catch((error) => {
  console.error('\n❌ TEST ÉCHOUÉ');

  console.error(
    error instanceof Error
      ? error.stack
      : error
  );

  process.exit(1);
});