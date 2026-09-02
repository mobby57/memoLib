import 'dotenv/config';
import {
  judilibreClient,
} from '../src/lib/legifrance/judilibre-client';

async function main() {
  console.log('\n=== JUDILIBRE PRODUCTION ===\n');

  console.log('Disponible:', judilibreClient.isAvailable());

  // 1. Recherche simple
  console.log('\n--- 1. Recherche OQTF ---');

  const search = await judilibreClient.search({
    query: 'OQTF',
    page_size: 5,
    sort: 'date',
    order: 'desc',
  });

  console.log({
    total: search.total,
    page: search.page,
    page_size: search.page_size,
    took: search.took,
    results: search.results.length,
  });

  for (const result of search.results) {
    console.log({
      id: result.id,
      jurisdiction: result.jurisdiction,
      chamber: result.chamber,
      number: result.number,
      date: result.decision_date,
      solution: result.solution,
      type: result.type,
    });
  }

  // 2. Recherche CESEDA
  console.log('\n--- 2. Recherche CESEDA/OQTF ---');

  const ceseda = await judilibreClient.searchCesedaCaseLaw(
    'OQTF',
    {
      months: 12,
      pageSize: 10,
      jurisdiction: ['cc', 'ca'],
    }
  );

  console.log({
    total: ceseda.total,
    results: ceseda.results.length,
  });

  // 3. Recherche par numéro
  if (search.results[0]?.number) {
    console.log('\n--- 3. Recherche par numéro ---');

    const byNumber = await judilibreClient.searchByNumber(
      search.results[0].number
    );

    console.log({
      total: byNumber.total,
      results: byNumber.results.length,
    });
  }

  // 4. Récupération décision complète
  if (search.results[0]?.id) {
    console.log('\n--- 4. Décision complète ---');

    const decision = await judilibreClient.getDecision(
      search.results[0].id,
      {
        resolve_references: true,
      }
    );

    console.log({
      id: decision.id,
      number: decision.number,
      jurisdiction: decision.jurisdiction,
      chamber: decision.chamber,
      date: decision.decision_date,
      solution: decision.solution,
      hasText: !!decision.text,
      textLength: decision.text?.length ?? 0,
      references: decision.numbers?.length ?? 0,
    });
  }

  // 5. Taxonomie
  console.log('\n--- 5. Taxonomie ---');

  const taxonomy = await judilibreClient.getTaxonomy();

  console.log(JSON.stringify(taxonomy, null, 2).slice(0, 3000));

  // 6. Statistiques
  console.log('\n--- 6. Statistiques ---');

  const stats = await judilibreClient.getStats();

  console.log({
    oldestDecision: stats.oldestDecision,
    newestDecision: stats.newestDecision,
    indexedTotal: stats.indexedTotal,
    requestPerDay: stats.requestPerDay,
  });

  console.log('\n=== TEST TERMINÉ ===\n');
}

main().catch((error) => {
  console.error('\n❌ TEST JUDILIBRE ÉCHOUÉ');
  console.error(error);
  process.exit(1);
});