/**
 * Backfill du lien jurisprudence ↔ articles CESEDA.
 *
 * Usage :
 *   npx tsx scripts/link-jurisprudence.ts            # traite les décisions non liées
 *   npx tsx scripts/link-jurisprudence.ts --all      # retraite TOUTES les décisions
 *
 * Pour chaque décision, extrait les références d'articles (L/R/D) citées dans
 * `texte` (via extractArticleReferences) et renseigne `relatedArticles`.
 *
 * Propriétés :
 * - Aucun appel externe : travaille uniquement sur les données déjà en base.
 * - Idempotent : relancé, il recalcule les mêmes clés déterministes.
 * - Batché : traite par lots pour ne pas charger toute la table en mémoire.
 * - Par défaut, ne traite que les décisions dont `relatedArticles` est vide
 *   (--all force le retraitement complet).
 */

import { PrismaClient } from '@prisma/client';
import { extractArticleReferences } from '../src/lib/legal/ingestion-core';

const prisma = new PrismaClient();
const BATCH_SIZE = 200;

/** Compare deux listes d'articles (ordre indifférent) pour éviter des writes inutiles. */
function sameArticles(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((x) => setB.has(x));
}

async function main() {
  const processAll = process.argv.includes('--all');

  const total = await prisma.jurisprudence.count();
  console.log(`🔗 Backfill liens jurisprudence→articles sur ${total} décision(s)...`);
  console.log(`   Mode : ${processAll ? 'TOUTES les décisions' : 'uniquement les non liées'}`);

  let processed = 0;
  let updated = 0;
  let cursor: string | undefined;

  // Pagination par curseur (id) pour un parcours stable et peu gourmand.
  for (;;) {
    const batch = await prisma.jurisprudence.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
      select: { id: true, texte: true, relatedArticles: true },
    });

    if (batch.length === 0) break;

    for (const decision of batch) {
      processed++;

      // En mode incrémental, on saute les décisions déjà liées.
      if (!processAll && decision.relatedArticles.length > 0) continue;

      const articles = extractArticleReferences(decision.texte || '');

      // Pas de changement → pas d'écriture (idempotence + économie DB).
      if (sameArticles(articles, decision.relatedArticles)) continue;

      await prisma.jurisprudence.update({
        where: { id: decision.id },
        data: { relatedArticles: articles },
      });
      updated++;
    }

    cursor = batch[batch.length - 1].id;
    process.stdout.write(`\r   Progression : ${processed}/${total} (maj: ${updated})`);
  }

  console.log(`\n🎯 Terminé : ${processed} parcourue(s), ${updated} mise(s) à jour.`);
}

main()
  .catch((e) => {
    console.error('❌ Échec backfill liens jurisprudence:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
