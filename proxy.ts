import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proxy Handler (Next.js 16+ Convention)
 * Remplace l'ancien middleware.ts
 * 
 * Fonctionnalités:
 * - Rate Limiting (100 req/min par IP)
 * - Headers de sécurité
 * - Protection DDoS et brute force
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Store en mémoire (production: utiliser Redis/Vercel KV)
const rateLimitStore = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100

// Nettoyage automatique (uniquement en runtime)
let cleanupInterval: NodeJS.Timeout | null = null

function initCleanup() {
  if (typeof window === 'undefined' && !cleanupInterval) {
    cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [ip, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
          rateLimitStore.delete(ip)
        }
      }
    }, 5 * 60 * 1000)
  }
}

export default function proxy(request: NextRequest) {
  // ⚡ BYPASS complet en mode développement pour les performances
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  // Initialiser le nettoyage si nécessaire
  initCleanup()
  
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

  // Créer la réponse avec headers de sécurité
  const response = NextResponse.next()
  
  // Headers Rate Limiting
  response.headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString())
  response.headers.set('X-RateLimit-Remaining', (MAX_REQUESTS - entry.count).toString())
  response.headers.set('X-RateLimit-Reset', entry.resetTime.toString())
  
  // Headers de sécurité - FORCE L'APPLICATION
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()')
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://*.sentry.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https: wss:; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;")
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')

  return response
}

// Configuration du proxy - appliqué sur toutes les routes API
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
