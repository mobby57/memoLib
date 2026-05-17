-- CreateTable
CREATE TABLE "Jurisprudence" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "juridiction" TEXT NOT NULL,
    "numero" TEXT,
    "chambre" TEXT,
    "formation" TEXT,
    "solution" TEXT,
    "resume" TEXT,
    "texte" TEXT NOT NULL,
    "url" TEXT,
    "themes" TEXT[],
    "source" TEXT NOT NULL DEFAULT 'huggingface',
    "searchVector" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Jurisprudence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Jurisprudence_externalId_key" ON "Jurisprudence"("externalId");

-- CreateIndex
CREATE INDEX "Jurisprudence_juridiction_idx" ON "Jurisprudence"("juridiction");

-- CreateIndex
CREATE INDEX "Jurisprudence_date_idx" ON "Jurisprudence"("date");

-- CreateIndex
CREATE INDEX "Jurisprudence_themes_idx" ON "Jurisprudence"("themes");

-- Full-text search index (French)
CREATE INDEX "Jurisprudence_search_idx" ON "Jurisprudence" USING GIN ("searchVector");

-- Trigger to auto-update tsvector on insert/update
CREATE OR REPLACE FUNCTION jurisprudence_search_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('french', coalesce(NEW."titre", '')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW."resume", '')), 'B') ||
    setweight(to_tsvector('french', coalesce(NEW."numero", '')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW."juridiction", '')), 'C') ||
    setweight(to_tsvector('french', left(coalesce(NEW."texte", ''), 10000)), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jurisprudence_search_trigger
  BEFORE INSERT OR UPDATE ON "Jurisprudence"
  FOR EACH ROW EXECUTE FUNCTION jurisprudence_search_update();
