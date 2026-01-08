import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Rate Limiting Middleware
 * Limite : 100 requêtes/minute par IP
 * Protection DDoS et brute force
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Store en mémoire (production: utiliser Redis/Vercel KV)
const rateLimitStore = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100

// Nettoyage automatique toutes les 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip)
    }
  }
}, 5 * 60 * 1000)

export function middleware(request: NextRequest) {
  // Exemption pour les assets statiques
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // Obtenir l'IP réelle (derrière Vercel proxy)
  const ip = 
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.ip ||
    'anonymous'

  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || now > entry.resetTime) {
    // Nouvelle fenêtre
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    })
    return NextResponse.next()
  }

  if (entry.count >= MAX_REQUESTS) {
    // Limite atteinte
    const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000)
    
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
        retryAfter: resetInSeconds,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': resetInSeconds.toString(),
          'X-RateLimit-Limit': MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
        },
      }
    )
  }

  // Incrémenter le compteur
  entry.count++
  rateLimitStore.set(ip, entry)

  // Ajouter les headers de rate limit à la réponse
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString())
  response.headers.set('X-RateLimit-Remaining', (MAX_REQUESTS - entry.count).toString())
  response.headers.set('X-RateLimit-Reset', entry.resetTime.toString())

  return response
}

// Appliquer sur toutes les routes API
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
