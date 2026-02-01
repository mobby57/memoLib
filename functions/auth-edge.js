/**
 * 🔐 EDGE FUNCTION - AUTHENTICATION
 * 
 * Gère l'authentification au edge pour performance maximale
 * Exécuté sur Cloudflare Workers au plus près de l'utilisateur
 */

export async function onRequest(context) {
  const {
    request,
    env,
    params,
    waitUntil,
    next,
  } = context;

  console.log('🔐 [Auth Edge] Request:', request.url);

  try {
    // Récupérer session depuis KV Store
    const sessionId = request.headers.get('x-session-id');
    
    if (sessionId && env.SESSIONS_KV) {
      const session = await env.SESSIONS_KV.get(`session:${sessionId}`, 'json');
      
      if (session) {
        console.log('✅ [Auth Edge] Session trouvée:', session.userId);
        
        // Ajouter info session à la requête
        request.headers.set('x-user-id', session.userId);
        request.headers.set('x-user-role', session.role);
        request.headers.set('x-tenant-id', session.tenantId);
      } else {
        console.log('⚠️ [Auth Edge] Session expirée');
      }
    }

    // Rate limiting
    if (env.RATE_LIMIT_KV) {
      const ip = request.headers.get('cf-connecting-ip');
      const rateKey = `rate:${ip}:auth`;
      
      const count = await env.RATE_LIMIT_KV.get(rateKey);
      const currentCount = parseInt(count || '0');
      
      if (currentCount >= 10) {
        console.log('🚫 [Auth Edge] Rate limit dépassé:', ip);
        
        return new Response('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': '60',
            'Content-Type': 'text/plain',
          },
        });
      }
      
      // Incrémenter compteur
      await env.RATE_LIMIT_KV.put(rateKey, (currentCount + 1).toString(), {
        expirationTtl: 60, // 1 minute
      });
    }

    // Continuer vers Next.js
    return next();

  } catch (error) {
    console.error('❌ [Auth Edge] Erreur:', error);
    
    // En cas d'erreur, continuer quand même
    return next();
  }
}
