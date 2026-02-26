/**
 * 🏥 EDGE FUNCTION - HEALTH CHECK
 * 
 * Health check ultra-rapide au edge
 * Cache agressif pour réduire latence
 */

export async function onRequest(context) {
  const {
    request,
    env,
    waitUntil,
  } = context;

  try {
    // Vérifier cache KV d'abord
    if (env.CACHE_KV) {
      const cached = await env.CACHE_KV.get('health:status', 'json');
      
      if (cached) {
        console.log('✅ [Health] Cache hit');
        
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60',
            'X-Cache': 'HIT',
          },
        });
      }
    }

    // Health check basique
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      edge: true,
      region: request.cf?.colo || 'unknown',
      
      services: {
        database: 'unknown', // Sera vérifié par Next.js
        redis: 'unknown',
        kv: env.CACHE_KV ? 'connected' : 'disabled',
      },
    };

    // Vérifier Redis Upstash si configuré
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const redisResponse = await fetch(
          `${env.UPSTASH_REDIS_REST_URL}/ping`,
          {
            headers: {
              Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
            },
            signal: AbortSignal.timeout(2000), // 2s timeout
          }
        );
        
        health.services.redis = redisResponse.ok ? 'connected' : 'error';
      } catch (error) {
        console.error('❌ [Health] Redis check failed:', error);
        health.services.redis = 'error';
      }
    }

    // Mettre en cache pour 1 minute
    if (env.CACHE_KV) {
      waitUntil(
        env.CACHE_KV.put('health:status', JSON.stringify(health), {
          expirationTtl: 60,
        })
      );
    }

    return new Response(JSON.stringify(health), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        'X-Cache': 'MISS',
      },
    });

  } catch (error) {
    console.error('❌ [Health] Error:', error);
    
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
