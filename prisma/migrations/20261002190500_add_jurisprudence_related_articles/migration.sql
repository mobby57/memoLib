-- Lien jurisprudence ↔ articles CESEDA
-- Ajoute la colonne relatedArticles (clés d'articles cités par la décision,
-- ex: ['R431-2','L611-1']) et son index GIN pour les requêtes de containment
-- (relatedArticles @> ARRAY[...] / = ANY).
--
-- Idempotent : réexécutable sans erreur (IF NOT EXISTS).

-- AlterTable
ALTER TABLE "Jurisprudence"
  ADD COLUMN IF NOT EXISTS "relatedArticles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateIndex (GIN pour recherche dans le tableau — cohérent avec Prisma pour String[])
CREATE INDEX IF NOT EXISTS "Jurisprudence_relatedArticles_idx"
  ON "Jurisprudence" USING GIN ("relatedArticles");
