import { defineConfig } from "prisma/config";
import "dotenv/config";

/**
 * Prisma 7 config.
 *
 * On lit DATABASE_URL via process.env avec un repli sûr : le helper strict
 * `env()` de prisma/config lève une erreur si la variable est absente, ce qui
 * casse `prisma generate` en CI/postinstall (où aucune DB n'est requise).
 * Les commandes qui touchent réellement la base (migrate/db push/studio)
 * utilisent la vraie valeur lorsqu'elle est définie.
 */
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://user:password@localhost:5432/memolib?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
});
