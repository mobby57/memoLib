/**
 * Cloudflare Pages Functions - API Middleware
 * 
 * Ce fichier capture toutes les requêtes /api/* et ajoute:
 * - Rate limiting avancé
 * - Headers de sécurité spécifiques API
 * - Logging des requêtes
 * - CORS configuration
 * 
 * Documentation: https://developers.cloudflare.com/pages/functions/
 */

export async function onRequest(context: {
  request: Request;
  env: any;
  params: any;
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
}) {
  const { request, env, next } = context;

  // CORS Headers pour API
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  // Répondre aux preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Rate Limiting (basique - à améliorer avec KV)
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimit = await checkRateLimit(ip, env);
  
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: rateLimit.retryAfter,
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(rateLimit.retryAfter),
        ...corsHeaders,
      },
    });
  }

  // Continuer vers Next.js API route
  const response = await next();

  // Ajouter headers de sécurité API
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  // Headers spécifiques API
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  newHeaders.set('X-Frame-Options', 'DENY');
  newHeaders.set('X-API-Version', '1.0.0');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Rate Limiting basique (à améliorer avec KV pour production)
 */
async function checkRateLimit(ip: string, env: any): Promise<{
  allowed: boolean;
  retryAfter: number;
}> {
  // TODO: Implémenter avec Cloudflare KV pour persistence
  // Pour l'instant, toujours autoriser
  return {
    allowed: true,
    retryAfter: 0,
  };
}
