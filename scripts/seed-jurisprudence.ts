/**
 * Seed script: Download CESEDA jurisprudence from HuggingFace via search/filter API
 * Usage: npx tsx scripts/seed-jurisprudence.ts
 * 
 * Alternative approach: downloads parquet directly if API fails
 * pip install duckdb && python scripts/extract-ceseda-parquet.py
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HF_SEARCH = 'https://datasets-server.huggingface.co/search';
const DATASET = 'antoinejeannot/jurisprudence';

const CESEDA_QUERIES = [
  'OQTF', 'obligation de quitter le territoire', 'CESEDA',
  'titre de séjour', 'droit des étrangers', 'expulsion étranger',
  'demande asile', 'protection subsidiaire', 'rétention administrative',
  'regroupement familial', 'naturalisation refus', 'reconduite frontière',
];

function classifyThemes(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  if (/oqtf|obligation de quitter/.test(lower)) tags.push('OQTF');
  if (/asile|réfugié|refugie|ofpra|cnda|protection subsidiaire/.test(lower)) tags.push('asile');
  if (/titre de séjour|titre de sejour|carte de séjour/.test(lower)) tags.push('titre_sejour');
  if (/expulsion|reconduite|éloignement|eloignement/.test(lower)) tags.push('expulsion');
  if (/naturalisation|déchéance de nationalité/.test(lower)) tags.push('naturalisation');
  if (/regroupement familial/.test(lower)) tags.push('regroupement_familial');
  if (/rétention|retention|assignation/.test(lower)) tags.push('retention');
  if (/visa|consulat/.test(lower)) tags.push('visa');
  if (tags.length === 0) tags.push('droit_etrangers');
  return tags;
}

async function searchHF(query: string, split: string, offset = 0): Promise<any[]> {
  const url = `${HF_SEARCH}?dataset=${DATASET}&config=${split}&split=${split}&query=${encodeURIComponent(query)}&offset=${offset}&length=100`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.rows || [];
}

async function importRows(rows: any[], source: string) {
  let imported = 0;
  for (const { row } of rows) {
    try {
      await prisma.jurisprudence.upsert({
        where: { externalId: row.id },
        update: {},
        create: {
          externalId: row.id,
          titre: row.solution || `Décision ${row.number || ''}`.trim(),
          date: row.decision_datetime ? new Date(row.decision_datetime) : new Date(row.decision_date || '2024-01-01'),
          juridiction: row.location || source,
          numero: row.number || null,
          chambre: row.chamber || null,
          formation: row.formation || null,
          solution: row.solution || null,
          resume: row.summary || null,
          texte: (row.text || '').slice(0, 50000),
          url: `https://www.courdecassation.fr/decision/${row.id}`,
          themes: classifyThemes(row.text || ''),
          source: 'huggingface',
        },
      });
      imported++;
    } catch (e: any) {
      // Skip duplicates silently
    }
  }
  return imported;
}

async function main() {
  console.log('🏛️  Seed Jurisprudence — HuggingFace Search API');
  console.log(`   Queries: ${CESEDA_QUERIES.length} CESEDA keywords\n`);

  const existing = await prisma.jurisprudence.count();
  console.log(`📊 Existing records: ${existing}`);

  let total = 0;
  const splits = ['cour_de_cassation', 'cour_d_appel'];

  for (const split of splits) {
    console.log(`\n📥 Searching ${split}...`);
    for (const query of CESEDA_QUERIES) {
      process.stdout.write(`  🔍 "${query}"...`);
      const rows = await searchHF(query, split);
      if (rows.length > 0) {
        const n = await importRows(rows, split === 'cour_de_cassation' ? 'Cour de cassation' : "Cour d'appel");
        total += n;
        process.stdout.write(` ${n} imported\n`);
      } else {
        process.stdout.write(` 0 results\n`);
      }
      // Respect rate limits
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  const finalCount = await prisma.jurisprudence.count();
  console.log(`\n🎉 Done! Total: ${finalCount} records (${total} new this run)`);
  console.log('\n💡 For bulk import, download parquet directly:');
  console.log('   curl -L -o cour_de_cassation.parquet "https://huggingface.co/datasets/antoinejeannot/jurisprudence/resolve/main/cour_de_cassation.parquet"');
  console.log('   Then use DuckDB or pandas to filter and import.');

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Fatal:', e);
  prisma.$disconnect();
  process.exit(1);
});
