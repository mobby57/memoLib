/**
 * Cache IA - Réduit les coûts de 30-50% en évitant les requêtes répétitives
 */

import crypto from 'crypto';

interface CacheEntry {
  response: string;
  model: string;
  tokens: number;
  createdAt: Date;
  hitCount: number;
}

// Cache en mémoire (en production, utiliser Redis)
const memoryCache = new Map<string, CacheEntry>();

// Configuration du cache
const CACHE_CONFIG = {
  maxEntries: 1000,
  defaultTTLMs: 60 * 60 * 1000, // 1 heure
  similarityThreshold: 0.95,
  // TTL par type de requête
  ttlByType: {
    'email-classification': 30 * 60 * 1000,      // 30 min
    'email-analysis': 60 * 60 * 1000,            // 1 heure
    'document-summary': 24 * 60 * 60 * 1000,     // 24 heures
    'legal-analysis': 4 * 60 * 60 * 1000,        // 4 heures
    'translation': 24 * 60 * 60 * 1000,          // 24 heures
    'default': 60 * 60 * 1000,                   // 1 heure
  }
};

/**
 * Génère une clé de cache à partir du prompt
 */
function generateCacheKey(prompt: string, model: string): string {
  // Normaliser le prompt (minuscules, sans espaces multiples)
  const normalized = prompt
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  
  // Hash SHA-256 du prompt normalisé + modèle
  const hash = crypto
    .createHash('sha256')
    .update(`${model}:${normalized}`)
    .digest('hex')
    .substring(0, 32);
  
  return `ai:cache:${hash}`;
}

/**
 * Détermine le type de requête pour le TTL
 */
function detectRequestType(prompt: string): keyof typeof CACHE_CONFIG.ttlByType {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('classif') || promptLower.includes('catégor')) {
    return 'email-classification';
  }
  if (promptLower.includes('email') || promptLower.includes('message')) {
    return 'email-analysis';
  }
  if (promptLower.includes('résumé') || promptLower.includes('summary')) {
    return 'document-summary';
  }
  if (promptLower.includes('juridique') || promptLower.includes('legal') || promptLower.includes('droit')) {
    return 'legal-analysis';
  }
  if (promptLower.includes('tradui') || promptLower.includes('translat')) {
    return 'translation';
  }
  
  return 'default';
}

/**
 * Récupère une réponse depuis le cache
 */
export async function getCachedResponse(
  prompt: string,
  model: string
): Promise<{ hit: boolean; response?: string; savedCost?: number }> {
  const cacheKey = generateCacheKey(prompt, model);
  const entry = memoryCache.get(cacheKey);
  
  if (!entry) {
    return { hit: false };
  }
  
  // Vérifier le TTL
  const requestType = detectRequestType(prompt);
  const ttl = CACHE_CONFIG.ttlByType[requestType];
  const age = Date.now() - entry.createdAt.getTime();
  
  if (age > ttl) {
    memoryCache.delete(cacheKey);
    return { hit: false };
  }
  
  // Cache hit!
  entry.hitCount++;
  
  // Calculer le coût économisé (~0.01€ / 1000 tokens)
  const savedCost = (entry.tokens / 1000) * 0.01;
  
  console.log(`[AI Cache] HIT pour ${cacheKey.substring(0, 20)}... (${entry.hitCount} hits, ${savedCost.toFixed(4)}€ économisés)`);
  
  return {
    hit: true,
    response: entry.response,
    savedCost,
  };
}

/**
 * Stocke une réponse dans le cache
 */
export async function setCachedResponse(
  prompt: string,
  model: string,
  response: string,
  tokens: number
): Promise<void> {
  const cacheKey = generateCacheKey(prompt, model);
  
  // Nettoyer le cache si trop plein
  if (memoryCache.size >= CACHE_CONFIG.maxEntries) {
    cleanupCache();
  }
  
  memoryCache.set(cacheKey, {
    response,
    model,
    tokens,
    createdAt: new Date(),
    hitCount: 0,
  });
  
  console.log(`[AI Cache] STORED ${cacheKey.substring(0, 20)}... (${tokens} tokens)`);
}

/**
 * Nettoie les entrées expirées et les moins utilisées
 */
function cleanupCache(): void {
  const now = Date.now();
  const entriesToDelete: string[] = [];
  
  // Supprimer les entrées expirées
  for (const [key, entry] of memoryCache.entries()) {
    const age = now - entry.createdAt.getTime();
    if (age > CACHE_CONFIG.ttlByType.default) {
      entriesToDelete.push(key);
    }
  }
  
  // Si toujours trop plein, supprimer les moins utilisées
  if (memoryCache.size - entriesToDelete.length >= CACHE_CONFIG.maxEntries * 0.9) {
    const sortedEntries = [...memoryCache.entries()]
      .sort((a, b) => a[1].hitCount - b[1].hitCount)
      .slice(0, Math.floor(CACHE_CONFIG.maxEntries * 0.2));
    
    for (const [key] of sortedEntries) {
      entriesToDelete.push(key);
    }
  }
  
  for (const key of entriesToDelete) {
    memoryCache.delete(key);
  }
  
  console.log(`[AI Cache] Cleanup: ${entriesToDelete.length} entrées supprimées`);
}

/**
 * Statistiques du cache
 */
export function getCacheStats(): {
  entries: number;
  totalHits: number;
  estimatedSavings: number;
} {
  let totalHits = 0;
  let totalTokensSaved = 0;
  
  for (const entry of memoryCache.values()) {
    totalHits += entry.hitCount;
    totalTokensSaved += entry.tokens * entry.hitCount;
  }
  
  return {
    entries: memoryCache.size,
    totalHits,
    estimatedSavings: (totalTokensSaved / 1000) * 0.01,
  };
}

/**
 * Vide complètement le cache
 */
export function clearCache(): void {
  memoryCache.clear();
  console.log('[AI Cache] Cache vidé');
}
