/**
 * Script de synchronisation des depots Legifrance
 *
 * Usage: npx tsx scripts/sync-legifrance.ts
 */

import { syncAllSources, getSourcesStatus } from '../src/lib/legifrance/git-sources';
import { listAvailableCodes, parseConstitution, parseCode } from '../src/lib/legifrance/code-parser';

async function main() {
  console.log('📥 Synchronisation des depots Legifrance...\n');

  const results = syncAllSources();

  for (const r of results) {
    const icon = r.action === 'error' ? '❌' : r.action === 'cloned' ? '🆕' : '✅';
    console.log(`${icon} ${r.source}: ${r.action}${r.commitHash ? ` (${r.commitHash})` : ''}${r.error ? ` — ${r.error}` : ''}`);
  }

  console.log('\n📊 Statut des sources:');
  for (const s of getSourcesStatus()) {
    console.log(`  ${s.available ? '✅' : '❌'} ${s.description} ${s.commitHash ? `(${s.commitHash})` : ''}`);
  }

  const codes = listAvailableCodes();
  if (codes.length > 0) {
    console.log(`\n📚 ${codes.length} codes disponibles:`);
    codes.forEach((c) => console.log(`  - ${c}`));

    const ceseda = codes.find((c) => c.toLowerCase().includes('ceseda') || c.toLowerCase().includes('etranger'));
    if (ceseda) {
      const articles = parseCode(ceseda);
      console.log(`\n🔍 ${ceseda}: ${articles.length} articles parses`);
    }
  }

  const constitution = parseConstitution();
  if (constitution.length > 0) {
    console.log(`\n🏛️ Constitution: ${constitution.length} articles parses`);
  }

  console.log('\n✅ Synchronisation terminee.');
}

main().catch(console.error);
