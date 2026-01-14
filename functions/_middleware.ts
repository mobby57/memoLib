/**
 * Cloudflare Pages Functions - Global Middleware
 * 
 * S'applique à TOUTES les requêtes
 * 
 * Features:
 * - Security headers globaux
 * - Logging analytics
 * - Performance monitoring
 * - Bot detection
 */

interface Env {
  // Bindings Cloudflare
  iaposte_production_db?: any; // D1 Database
  CACHE?: any; // KV Namespace
  DOCUMENTS?: any; // R2 Bucket
  AI?: any; // Workers AI
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  params: any;
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
}): Promise<Response> {
  const { request, env, waitUntil, next } = context;

  const startTime = Date.now();
  
  // Détection bot/crawler
  const userAgent = request.headers.get('User-Agent') || '';
  const isBot = /bot|crawler|spider|scraper/i.test(userAgent);

  // Geo-blocking (optionnel)
  const country = request.headers.get('CF-IPCountry') || 'unknown';
  // const blockedCountries = ['XX', 'YY']; // À configurer
  // if (blockedCountries.includes(country)) {
  //   return new Response('Access Denied', { status: 403 });
  // }

  try {
    // Continuer vers la requête
    const response = await next();

    // Ajouter headers de performance
    const duration = Date.now() - startTime;
    const newHeaders = new Headers(response.headers);
    
    newHeaders.set('X-Response-Time', `${duration}ms`);
    newHeaders.set('X-Powered-By', 'Cloudflare Pages');
    newHeaders.set('X-Edge-Location', request.cf?.colo as string || 'unknown');
    
    // Analytics asynchrone (ne bloque pas la réponse)
    waitUntil(
      logAnalytics({
        path: new URL(request.url).pathname,
        method: request.method,
        duration,
        status: response.status,
        country,
        isBot,
        timestamp: new Date().toISOString(),
      }, env)
    );

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
    
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Log l'erreur asynchrone
    waitUntil(
      logError({
        path: new URL(request.url).pathname,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }, env)
    );
    
    // Retourner une erreur 500 propre
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * Log analytics vers D1 ou KV (async)
 */
async function logAnalytics(data: any, env: Env): Promise<void> {
  try {
    // TODO: Stocker dans D1 ou KV
    // if (env.iaposte_production_db) {
    //   await env.iaposte_production_db.prepare(
    //     'INSERT INTO analytics (...) VALUES (...)'
    //   ).bind(...).run();
    // }
    console.log('[Analytics]', data);
  } catch (error) {
    console.error('Analytics logging failed:', error);
  }
}

/**
 * Log erreurs vers D1 ou service externe (async)
 */
async function logError(data: any, env: Env): Promise<void> {
  try {
    // TODO: Envoyer vers Sentry ou stocker dans D1
    console.error('[Error Log]', data);
  } catch (error) {
    console.error('Error logging failed:', error);
  }
}
