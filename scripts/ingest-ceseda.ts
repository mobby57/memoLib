/**
 * Ingestion du corpus CESEDA versionné depuis PISTE/Légifrance.
 *
 * Usage :
 *   npx tsx scripts/ingest-ceseda.ts            # ingère la liste d'articles clés
 *   npx tsx scripts/ingest-ceseda.ts L611-1 R431-2
 *
 * Comportement :
 * - Si les identifiants PISTE ne sont pas configurés, le script S'ARRÊTE
 *   proprement (exit 0) avec un message explicite — aucune donnée fabriquée.
 * - Pour chaque article, récupère la version EN VIGUEUR via PISTE et l'ingère
 *   dans `LegalReference` avec un versionnement non destructif (voir
 *   src/lib/legal/ingestion-core.ts).
 *
 * NB : ce script n'écrit AUCUN texte de loi en dur. Tout provient de PISTE.
 */

import { PrismaClient } from '@prisma/client';
import { legifranceApi } from '../src/lib/legifrance/api-client';
import { legifranceOAuth } from '../src/lib/legifrance/oauth-client';
import {
  ingestArticleVersion,
  type LegalReferencePrisma,
} from '../src/lib/legal/ingestion-core';

const prisma = new PrismaClient();

/**
 * Articles clés par catégorie (mêmes thèmes que le Copilote CESEDA).
 * Cette liste pilote QUOI ingérer ; le CONTENU vient exclusivement de PISTE.
 */
const KEY_ARTICLES: { article: string; category: string }[] = [
  { article: 'L611-1', category: 'OQTF' },
  { article: 'L612-1', category: 'OQTF' },
  { article: 'L612-2', category: 'OQTF' },
  { article: 'L614-5', category: 'OQTF' },
  { article: 'L614-6', category: 'OQTF' },
  { article: 'L531-27', category: 'ASILE' },
  { article: 'L532-1', category: 'ASILE' },
  { article: 'L532-4', category: 'ASILE' },
  { article: 'L421-1', category: 'TITRE_SEJOUR' },
  { article: 'L423-7', category: 'TITRE_SEJOUR' },
  { article: 'L423-23', category: 'TITRE_SEJOUR' },
  { article: 'L425-9', category: 'TITRE_SEJOUR' },
  { article: 'R431-2', category: 'TITRE_SEJOUR' },
  { article: 'R431-3', category: 'TITRE_SEJOUR' },
  { article: 'R431-5', category: 'TITRE_SEJOUR' },
  { article: 'L741-1', category: 'RETENTION' },
  { article: 'L742-1', category: 'RETENTION' },
];

async function main() {
  const argvArticles = process.argv.slice(2);

  // Garde-fou : sans identifiants PISTE, on ne fabrique rien.
  if (!legifranceOAuth.isAvailable()) {
    console.warn(
      '⚠️  PISTE non configuré (PISTE_SANDBOX_CLIENT_ID/SECRET absents).\n' +
        '    L\'ingestion CESEDA est ignorée — aucun texte de loi n\'est inventé.\n' +
        '    Configurez les identifiants PISTE puis relancez ce script.',
    );
    process.exit(0);
  }

  const targets =
    argvArticles.length > 0
      ? argvArticles.map((a) => ({ article: a, category: 'general' }))
      : KEY_ARTICLES;

  console.log(`🌱 Ingestion CESEDA : ${targets.length} article(s) depuis PISTE...`);

  const db = prisma.legalReference as unknown as LegalReferencePrisma;
  let created = 0;
  let updated = 0;
  let missing = 0;

  for (const target of targets) {
    try {
      const article = await legifranceApi.getCesedaArticle(target.article);
      if (!article) {
        console.warn(`   ⚠️  ${target.article} introuvable sur PISTE — ignoré.`);
        missing++;
        continue;
      }

      const result = await ingestArticleVersion(db, article, {
        category: target.category,
      });

      if (result.action === 'created') created++;
      else if (result.action === 'updated') updated++;

      console.log(
        `   ✅ ${result.article} v${result.version} → ${result.action}` +
          (result.closedPrevious > 0
            ? ` (${result.closedPrevious} version(s) clôturée(s))`
            : ''),
      );
    } catch (error) {
      console.error(
        `   ❌ Erreur ingestion ${target.article}:`,
        error instanceof Error ? error.message : error,
      );
      missing++;
    }
  }

  console.log(
    `\n🎯 Terminé : ${created} créé(s), ${updated} mis à jour, ${missing} en erreur/absent(s).`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Échec ingestion CESEDA:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
