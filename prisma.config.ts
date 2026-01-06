import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Configuration Prisma Avancée - Expert Level
 * 
 * Cette configuration utilise l'approche moderne ESM-first avec:
 * - Driver adapter pour meilleures performances
 * - Gestion optimisée des migrations
 * - Configuration centralisée
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  
  migrations: {
    path: 'prisma/migrations',
  },
  
  datasource: {
    url: env('DATABASE_URL'),
  },
});
