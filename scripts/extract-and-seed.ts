/**
 * Extract CESEDA decisions from parquet using DuckDB, then import to PostgreSQL
 * Usage: npx tsx scripts/extract-and-seed.ts
 */
import { Database } from 'duckdb-async';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function classifyThemes(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  if (/oqtf|obligation de quitter/.test(lower)) tags.push('OQTF');
  if (/asile|réfugié|refugie|ofpra|cnda|protection subsidiaire/.test(lower)) tags.push('asile');
  if (/titre de séjour|titre de sejour|carte de séjour/.test(lower)) tags.push('titre_sejour');
  if (/expulsion|reconduite|éloignement|eloignement/.test(lower)) tags.push('expulsion');
  if (/naturalisation|déchéance/.test(lower)) tags.push('naturalisation');
  if (/regroupement familial/.test(lower)) tags.push('regroupement_familial');
  if (/rétention|retention|assignation/.test(lower)) tags.push('retention');
  if (/visa|consulat/.test(lower)) tags.push('visa');
  if (tags.length === 0) tags.push('droit_etrangers');
  return tags;
}

async function main() {
  console.log('🏛️  Extract CESEDA from Parquet + Import to PostgreSQL\n');

  const db = await Database.create(':memory:');

  console.log('📂 Reading parquet file (this may take a moment)...');
  const rows = await db.all(`
    SELECT id, text, decision_date, number, chamber, formation, solution, location
    FROM 'cour_de_cassation.parquet'
    WHERE text ILIKE '%CESEDA%' OR text ILIKE '%OQTF%'
       OR text ILIKE '%titre de séjour%' OR text ILIKE '%titre de sejour%'
       OR text ILIKE '%asile%' OR text ILIKE '%expulsion%'
       OR text ILIKE '%obligation de quitter%' OR text ILIKE '%rétention administrative%'
       OR text ILIKE '%regroupement familial%' OR text ILIKE '%naturalisation%'
       OR text ILIKE '%reconduite%' OR text ILIKE '%L.511-1%'
    LIMIT 3000
  `);

  console.log(`✅ Found ${rows.length} CESEDA-related decisions\n`);
  console.log('📥 Importing to PostgreSQL...');

  let imported = 0;
  for (const row of rows) {
    try {
      await prisma.jurisprudence.upsert({
        where: { externalId: row.id },
        update: {},
        create: {
          externalId: row.id,
          titre: row.solution || `Décision ${row.number || ''}`.trim(),
          date: row.decision_date ? new Date(row.decision_date) : new Date('2024-01-01'),
          juridiction: row.location || 'Cour de cassation',
          numero: row.number || null,
          chambre: row.chamber || null,
          formation: row.formation || null,
          solution: row.solution || null,
          resume: (row.text || '').slice(0, 500),
          texte: (row.text || '').slice(0, 50000),
          url: `https://www.courdecassation.fr/decision/${row.id}`,
          themes: classifyThemes(row.text || ''),
          source: 'huggingface',
        },
      });
      imported++;
      if (imported % 100 === 0) process.stdout.write(`\r  Imported: ${imported}/${rows.length}`);
    } catch (e: any) {
      // Skip errors silently
    }
  }

  await db.close();
  const total = await prisma.jurisprudence.count();
  console.log(`\n\n🎉 Done! Imported ${imported} decisions. Total in DB: ${total}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
