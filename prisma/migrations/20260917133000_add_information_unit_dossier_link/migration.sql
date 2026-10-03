-- Additive, non-destructive link between an information unit and a dossier.
ALTER TABLE "InformationUnit"
  ADD COLUMN IF NOT EXISTS "dossierId" TEXT,
  ADD COLUMN IF NOT EXISTS "matchConfidence" DOUBLE PRECISION;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'InformationUnit_dossierId_fkey'
  ) THEN
    ALTER TABLE "InformationUnit"
      ADD CONSTRAINT "InformationUnit_dossierId_fkey"
      FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "InformationUnit_dossierId_idx" ON "InformationUnit"("dossierId");
