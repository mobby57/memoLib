-- Ajoute la colonne uploadedFiles (métadonnées des pièces déposées) à
-- IntakeRequest. Additive et nullable.
ALTER TABLE "IntakeRequest" ADD COLUMN IF NOT EXISTS "uploadedFiles" JSONB;
