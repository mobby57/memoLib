/**
 * CloudFlare Edge Cache Worker
 * 
 * Caches responses at the edge for maximum performance
 * Handles cache invalidation and purging
 */

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;

    // Try to get from cache first
    let response = await cache.match(cacheKey);

    if (!response) {
        // Not in cache, fetch from origin
        response = await fetch(request);

        // Clone the response before caching
        const responseToCache = response.clone();

        // Determine cache TTL based on path
        const cacheTtl = getCacheTtl(url.pathname);

        if (cacheTtl > 0) {
            // Add cache headers
            const headers = new Headers(responseToCache.headers);
            headers.set('Cache-Control', `public, max-age=${cacheTtl}`);
            headers.set('X-Cache', 'MISS');
            headers.set('X-Cache-TTL', cacheTtl.toString());

            const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers,
            });

            // Cache the response
            event.waitUntil(cache.put(cacheKey, cachedResponse));
        }
    } else {
        // Add cache hit header
        const headers = new Headers(response.headers);
        headers.set('X-Cache', 'HIT');
        response = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    }

    return response;
}

function getCacheTtl(pathname) {
    // API endpoints - no cache
    if (pathname.startsWith('/api/')) {
        return 0;
    }

    // Static assets - 1 year
    if (pathname.match(/\.(css|js|woff|woff2|ttf|eot|svg|jpg|jpeg|png|gif|webp|avif|ico)$/)) {
        return 31536000; // 1 year
    }

    // HTML pages - 5 minutes
    if (pathname.match(/\.html$/) || pathname === '/') {
        return 300;
    }

    // Default - 1 hour
    return 3600;
}
