import type { MetadataRoute } from 'next';

// Les pages privées ne doivent PAS être indexées.
// Seul src/app/sitemap.ts gère les routes publiques.
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
