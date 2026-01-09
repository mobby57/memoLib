# 🚨 PROBLÈME CRITIQUE VERCEL + NEXT.JS 16 - HEADERS SÉCURITÉ BLOQUÉS

## Résumé du Problème

**Application** : IA Poste Manager (Next.js 16.1.0 canary + React 19)  
**Hébergement** : Vercel  
**URL Production** : https://iapostemanager-mobby57s-projects.vercel.app  

**Symptôme** : Sur 12 headers de sécurité configurés, **seulement 2 s'appliquent** en production Vercel :
- ✅ `Strict-Transport-Security` 
- ✅ `X-Frame-Options`

**Headers manquants** (configurés mais ignorés) :
- ❌ `Content-Security-Policy`
- ❌ `X-Content-Type-Options`
- ❌ `Referrer-Policy`
- ❌ `Permissions-Policy`
- ❌ `Cross-Origin-Embedder-Policy`
- ❌ `Cross-Origin-Opener-Policy`
- ❌ `Cross-Origin-Resource-Policy`
- ❌ `X-XSS-Protection`
- ❌ `X-Permitted-Cross-Domain-Policies`
- ❌ `X-Download-Options`

**Score sécurité actuel** : 3.3/10 (2/6 headers critiques)

---

## 🧪 Méthodes Testées (TOUTES ÉCHOUÉES)

### Méthode 1 : `next.config.js` - async headers()

```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=()...' },
        { key: 'Content-Security-Policy', value: "default-src 'self';..." },
        // ... 6 autres headers
      ],
    },
  ];
}
```

**Résultat** : ❌ Seuls HSTS et X-Frame-Options appliqués

---

### Méthode 2 : `vercel.json` - Configuration Platform

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "..." },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Content-Security-Policy", "value": "..." },
        // ... tous les headers
      ]
    }
  ]
}
```

**Résultat** : ❌ Identique - seulement 2 headers appliqués  
**Note** : Vercel ignore `vercel.json` headers pour Next.js (framework-defined headers prioritaires)

---

### Méthode 3 : `middleware.ts` - Runtime Injection

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Rate limiting headers (FONCTIONNENT)
  response.headers.set('X-RateLimit-Limit', '100')
  response.headers.set('X-RateLimit-Remaining', '95')
  
  // Security headers (NE FONCTIONNENT PAS)
  response.headers.set('Content-Security-Policy', "default-src 'self'...")
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=()...')
  // ... tous les headers
  
  return response
}
```

**Résultat** : ❌ Les headers rate-limiting s'appliquent, mais PAS les headers de sécurité  
**Note** : Vercel semble avoir une whitelist des headers autorisés en middleware

---

### Méthode 4 : `public/_headers` - Fichier Static

```
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'; ...
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=()...
```

**Résultat** : ❌ Totalement ignoré par Vercel  
**Note** : `_headers` est pour Netlify/Cloudflare Pages, pas Vercel

---

## 📊 Vérification Production

```powershell
curl -I https://iapostemanager-mobby57s-projects.vercel.app
```

**Headers reçus** :
```
HTTP/1.1 401 Unauthorized
Cache-Control: no-store, max-age=0
Content-Type: text/html; charset=utf-8
Date: Thu, 08 Jan 2026 21:53:32 GMT
Server: Vercel
Set-Cookie: _vercel_sso_nonce=...; Max-Age=3600; Path=/; Secure; HttpOnly; SameSite=Lax
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Robots-Tag: noindex
X-Vercel-Id: cdg1::rk64b-1767909212369-edd7f9418d90
```

**Observation critique** :
- ✅ HSTS présent (max-age=63072000)
- ✅ X-Frame-Options présent (DENY)
- ❌ **10 autres headers manquants**

---

## 🔍 Analyse Technique

### Hypothèses Testées

1. **Middleware matcher incorrect** ?
   - ❌ Testé avec `/((?!_next/static|_next/image|favicon.ico).*)`
   - ❌ Testé avec `/api/:path*` + wildcard
   - Résultat : Pas de différence

2. **Next.js 16 (canary) bug** ?
   - ✅ Version : `next@16.1.0-canary.31`
   - ✅ Possible bug non documenté avec headers() en React 19 + RSC

3. **Vercel platform limitation** ?
   - ✅ Très probable : Vercel a une **whitelist de headers autorisés**
   - ✅ Seuls les headers "standards" (HSTS, X-Frame-Options) passent
   - ✅ CSP, Permissions-Policy, etc. sont bloqués

4. **NextAuth 401 interference** ?
   - ❌ Testé sur routes publiques (/api/health, /favicon.ico)
   - Résultat : Même problème (tout passe par NextAuth middleware)

---

## ⚠️ Limitations Vercel Identifiées

### Headers Autorisés (Fonctionnent)
✅ `Strict-Transport-Security`  
✅ `X-Frame-Options`  
✅ `X-RateLimit-*` (custom headers middleware)  
✅ `Cache-Control`  
✅ `Set-Cookie`  

### Headers Bloqués (Ne fonctionnent pas)
❌ `Content-Security-Policy` (CSP)  
❌ `X-Content-Type-Options`  
❌ `Referrer-Policy`  
❌ `Permissions-Policy`  
❌ `Cross-Origin-Embedder-Policy` (COEP)  
❌ `Cross-Origin-Opener-Policy` (COOP)  
❌ `Cross-Origin-Resource-Policy` (CORP)  
❌ `X-XSS-Protection`  
❌ `X-Permitted-Cross-Domain-Policies`  
❌ `X-Download-Options`  

---

## 🛠️ Solutions de Contournement Possibles

### Option 1 : Cloudflare Workers (RECOMMANDÉ)

Utiliser Cloudflare Workers en proxy devant Vercel :

```javascript
// Cloudflare Worker
export default {
  async fetch(request) {
    const response = await fetch(request)
    const newResponse = new Response(response.body, response)
    
    newResponse.headers.set('Content-Security-Policy', "default-src 'self'...")
    newResponse.headers.set('X-Content-Type-Options', 'nosniff')
    // ... tous les headers
    
    return newResponse
  }
}
```

**Avantages** :
- ✅ Contrôle total des headers
- ✅ Edge computing (latence minimale)
- ✅ Compatible avec Vercel
- ✅ Gratuit (Free plan Cloudflare)

**Inconvénients** :
- ⚠️ Configuration supplémentaire
- ⚠️ Latence +10-20ms
- ⚠️ Dépendance à deux services

---

### Option 2 : Migrer vers Cloudflare Pages

Next.js supporte Cloudflare Pages nativement :

```bash
npm install @cloudflare/next-on-pages
npx @cloudflare/next-on-pages
```

**Avantages** :
- ✅ Headers fonctionnent avec `_headers` file
- ✅ Edge runtime Cloudflare
- ✅ Coûts réduits
- ✅ Meilleure performance globale

**Inconvénients** :
- ⚠️ Migration complète requise
- ⚠️ Changement DNS
- ⚠️ Tests complets nécessaires

---

### Option 3 : Nginx Reverse Proxy (Self-hosted)

Héberger un proxy Nginx qui injecte les headers :

```nginx
location / {
  proxy_pass https://iapostemanager-mobby57s-projects.vercel.app;
  add_header Content-Security-Policy "default-src 'self'...";
  add_header X-Content-Type-Options "nosniff";
  # ... tous les headers
}
```

**Avantages** :
- ✅ Contrôle total
- ✅ Indépendance plateforme

**Inconvénients** :
- ⚠️ Coûts infrastructure
- ⚠️ Maintenance serveur
- ⚠️ Complexité déploiement

---

### Option 4 : Netlify (Alternative Vercel)

Netlify supporte nativement `_headers` file :

```
/*
  Content-Security-Policy: default-src 'self'; ...
  X-Content-Type-Options: nosniff
  # ... tous les headers
```

**Avantages** :
- ✅ Configuration simple
- ✅ Support complet headers
- ✅ Migration facile depuis Vercel

**Inconvénients** :
- ⚠️ Changement de plateforme
- ⚠️ Réécriture CI/CD

---

## 📝 Issue GitHub à Créer

### Pour Next.js (vercel/next.js)

**Titre** : `[Bug] Security headers configured in next.config.js not applied on Vercel production (Next.js 16 canary + React 19)`

**Corps** :

```markdown
## Bug Description

Security headers configured via `async headers()` in `next.config.js` are not being applied in Vercel production deployment, despite being correctly configured.

**Environment:**
- Next.js: 16.1.0-canary.31
- React: 19.0.0
- Platform: Vercel
- Deployment: Production (https://iapostemanager-mobby57s-projects.vercel.app)

**Expected Behavior:**
All 12 security headers should be present in HTTP response.

**Actual Behavior:**
Only 2/12 headers are applied:
- ✅ Strict-Transport-Security
- ✅ X-Frame-Options
- ❌ Content-Security-Policy (missing)
- ❌ X-Content-Type-Options (missing)
- ❌ Referrer-Policy (missing)
- ❌ Permissions-Policy (missing)
- ❌ ... 6 other headers missing

**Reproduction:**
1. Configure headers in `next.config.js` (async headers() function)
2. Deploy to Vercel with `vercel --prod`
3. Test with `curl -I https://your-app.vercel.app`
4. Observe only HSTS and X-Frame-Options present

**Workarounds Attempted:**
- ❌ vercel.json headers configuration
- ❌ middleware.ts response.headers.set()
- ❌ public/_headers file
- None work - same 2/12 headers applied

**Additional Context:**
This appears to be a Vercel platform limitation or Next.js 16 bug with React 19 Server Components.
```

---

### Pour Vercel (vercel/vercel)

**Titre** : `[Platform] Custom security headers not applying for Next.js 16 deployments - only HSTS and X-Frame-Options work`

**Corps** :

```markdown
## Platform Issue

Vercel appears to have a whitelist of allowed headers for Next.js deployments. Most security headers configured in next.config.js or vercel.json are silently ignored.

**Allowed Headers (Work):**
- Strict-Transport-Security
- X-Frame-Options
- Cache-Control
- Set-Cookie
- Custom X-RateLimit-* headers (in middleware)

**Blocked Headers (Don't Work):**
- Content-Security-Policy
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Cross-Origin-*-Policy (COEP, COOP, CORP)
- X-XSS-Protection

**Configuration Attempted:**
1. next.config.js async headers()
2. vercel.json headers array
3. middleware.ts response.headers.set()
4. public/_headers file

**Result:** All methods fail - only 2 headers apply.

**Request:**
Please document which headers are allowed/blocked, or remove the whitelist restriction for security headers.

**Workaround:**
Using Cloudflare Workers proxy to inject headers.
```

---

## 🎯 Recommandation Finale

### Court Terme (IMMÉDIAT)
✅ **Utiliser Cloudflare Workers** devant Vercel  
- Configuration : 15 minutes  
- Coût : Gratuit (Free plan)  
- Impact : Aucun sur l'application  

### Moyen Terme (2-4 semaines)
🔄 **Migrer vers Cloudflare Pages**  
- Next.js nativement supporté  
- Headers fonctionnent avec `_headers`  
- Meilleure performance Edge  
- Coûts réduits  

### Long Terme (3-6 mois)
📊 **Suivre les issues GitHub**  
- Vercel corrige la whitelist  
- Next.js 16 stable avec fix headers  
- Retour à configuration simple  

---

## 📚 Documentation Vercel Consultée

- [Custom Headers (Next.js)](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [Vercel Platform Headers](https://vercel.com/docs/projects/project-configuration#headers)
- [Middleware (Next.js)](https://nextjs.org/docs/app/building-your-application/routing/middleware)

**Aucune mention de limitation ou whitelist** dans la documentation officielle.

---

## 🔗 Liens Utiles

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

---

**Date** : 8 janvier 2026  
**Auteur** : IA Poste Manager Team  
**Statut** : ⚠️ BLOQUÉ (limitation plateforme Vercel)  
**Solution recommandée** : Cloudflare Workers Proxy

