# 🎯 Configuration Post-Déploiement Cloudflare

**Date:** 19 janvier 2026  
**Version:** 1.0

Après le déploiement initial, voici les configurations **essentielles** pour optimiser votre application.

---

## 📋 Checklist Immédiate (15 minutes)

### ✅ 1. Variables d'Environnement (CRITIQUE)

```powershell
# Générer un secret NextAuth fort
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Configurer NEXTAUTH_SECRET
Write-Output $secret | wrangler pages secret put NEXTAUTH_SECRET --project-name=iapostemanager

# Configurer NEXTAUTH_URL
wrangler pages secret put NEXTAUTH_URL --project-name=iapostemanager
# Entrer : https://votre-projet.pages.dev

# Vérifier les secrets
wrangler pages secret list --project-name=iapostemanager
```

**Variables requises :**
- ✅ `NEXTAUTH_SECRET` - Clé de chiffrement sessions (32+ caractères)
- ✅ `NEXTAUTH_URL` - URL complète de votre site
- ⚠️ `DATABASE_URL` - Géré automatiquement par D1 binding (pas besoin)

---

### ✅ 2. Configuration Domaine Personnalisé

#### Via Dashboard Cloudflare

1. **Accéder à Pages**
   ```
   Cloudflare Dashboard → Pages → Votre projet → Custom domains
   ```

2. **Ajouter domaine**
   ```
   Domaine principal : iapostemanager.fr
   Sous-domaine : app.iapostemanager.fr
   ```

3. **Configurer DNS**
   ```
   Type: CNAME
   Nom: @ (ou app)
   Cible: votre-projet.pages.dev
   Proxy: ✅ Activé (orange cloud)
   TTL: Auto
   ```

4. **Vérification SSL**
   - ✅ Certificat SSL automatique (Let's Encrypt)
   - ✅ HTTPS forcé
   - ✅ HTTP/2 activé
   - ✅ TLS 1.3 recommandé

#### Via Wrangler CLI

```powershell
# Ajouter domaine custom
wrangler pages domain add iapostemanager.fr --project-name=iapostemanager

# Vérifier statut
wrangler pages domain list --project-name=iapostemanager
```

---

### ✅ 3. Activation Analytics (Gratuit)

**Métriques temps réel disponibles :**
- 📊 Visites totales
- 🌍 Géolocalisation utilisateurs
- ⏱️ Temps de chargement (p50, p95, p99)
- 📈 Requêtes par seconde
- ❌ Taux d'erreurs 4xx/5xx
- 🔥 Pages les plus visitées

**Activation :**
```
Dashboard → Pages → Votre projet → Analytics
→ Activer "Web Analytics" (gratuit, illimité)
```

**Script à ajouter (optionnel - tracking avancé) :**
```html
<!-- Dans app/layout.tsx ou _app.tsx -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
        data-cf-beacon='{"token": "VOTRE_TOKEN_ANALYTICS"}'></script>
```

---

### ✅ 4. Configuration Cache & Performance

#### Headers de Performance

Créer `_headers` dans `public/` :

```
# Cache statique agressif (images, fonts, CSS, JS)
/static/*
  Cache-Control: public, max-age=31536000, immutable

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

# API routes - pas de cache
/api/*
  Cache-Control: no-store, no-cache, must-revalidate
  X-Robots-Tag: noindex

# Pages HTML - cache court
/*
  Cache-Control: public, max-age=300, s-maxage=600
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

#### Règles Page Rules (Dashboard)

```
1. Cache Everything pour /static/*
   → Cache Level: Cache Everything
   → Edge Cache TTL: 1 month

2. Bypass cache pour /api/*
   → Cache Level: Bypass
   → Disable Performance

3. Cache HTML pour pages statiques
   → Cache Level: Standard
   → Edge Cache TTL: 2 hours
   → Browser Cache TTL: 5 minutes
```

---

### ✅ 5. Sécurité Avancée (WAF)

#### Règles Firewall Recommandées

**1. Blocage pays à risque (si France uniquement) :**
```
Dashboard → Security → WAF → Custom rules → Create rule

Nom: "Block Non-FR Traffic"
Expression: (ip.geoip.country ne "FR")
Action: Block
```

**2. Rate Limiting Login :**
```
Nom: "Login Rate Limit"
Expression: (http.request.uri.path contains "/api/auth")
Action: Challenge
Limite: 5 requêtes / minute / IP
```

**3. Bot Protection :**
```
Dashboard → Security → Bots
→ Activer "Super Bot Fight Mode" (gratuit)
→ Bloquer bots définitivement
```

---

### ✅ 6. Monitoring & Alertes

#### Logs en Temps Réel

```powershell
# Logs production (tail)
wrangler pages deployment tail --project-name=iapostemanager

# Logs avec filtres
wrangler pages deployment tail --project-name=iapostemanager --format=pretty --level=error
```

#### Alertes Email (Dashboard)

```
Dashboard → Notifications → Add

1. Alerte "Deployment Failed"
   → Email + Webhook (Slack/Discord)

2. Alerte "Error Rate Spike"
   → Trigger si >5% erreurs 5xx

3. Alerte "Traffic Spike"
   → Trigger si >10x trafic normal
```

---

## 🚀 Optimisations Avancées (30 minutes)

### 🔥 1. Image Optimization (Cloudflare Images)

**Activation :**
```
Dashboard → Images → Enable Image Resizing
→ Prix: 5,000 images/mois gratuit
```

**Configuration Next.js :**
```typescript
// next.config.js
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './cloudflare-image-loader.ts',
  },
}

// cloudflare-image-loader.ts
export default function cloudflareLoader({ src, width, quality }) {
  const params = [`width=${width}`, `quality=${quality || 75}`, 'format=auto']
  return `https://iapostemanager.fr/cdn-cgi/image/${params.join(',')}${src}`
}
```

---

### ⚡ 2. Workers Functions (API Routes Edge)

**Migration API Routes vers Workers :**

```javascript
// functions/api/hello.ts (détecté automatiquement)
export async function onRequest(context) {
  const { request, env } = context
  
  // Accès direct à D1
  const db = env.DB
  const users = await db.prepare('SELECT * FROM User LIMIT 10').all()
  
  return new Response(JSON.stringify({ users }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

**Avantages :**
- ✅ 0ms cold start (vs 50-200ms Next.js API routes)
- ✅ Edge-native (300+ datacenters)
- ✅ Accès direct D1/KV/R2

---

### 📧 3. Email Workers (Monitoring Gmail Automatique)

**Configuration Email Routing :**

```
Dashboard → Email → Email Routing → Enable
→ Destination address: support@iapostemanager.fr
→ Create worker
```

**Worker automatique :**

```javascript
// workers/email-processor.ts
export default {
  async email(message, env, ctx) {
    // Parser email avec IA
    const { from, subject, text } = message
    
    // Classification automatique
    const category = await classifyEmail(text, env.AI)
    
    // Créer workspace si nouveau client
    if (category === 'nouveau_client') {
      await env.DB.prepare(`
        INSERT INTO Workspace (clientEmail, source)
        VALUES (?, 'email_inbound')
      `).bind(from).run()
    }
    
    // Stocker email
    await env.DB.prepare(`
      INSERT INTO Email (from, subject, body, classification)
      VALUES (?, ?, ?, ?)
    `).bind(from, subject, text, category).run()
    
    // Forward vers avocats
    await message.forward('avocat@iapostemanager.fr')
  }
}
```

---

### 🤖 4. Workers AI (Fallback Ollama)

**Activation :**
```
Dashboard → AI → Workers AI → Enable
→ Gratuit : 10,000 neurones/jour
```

**Configuration binding :**
```toml
# wrangler.toml
[ai]
binding = "AI"
```

**Utilisation :**
```typescript
// Appel IA sans serveur externe
const response = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
  messages: [
    { role: 'system', content: 'Assistant juridique CESEDA' },
    { role: 'user', content: 'Analyser ce dossier OQTF' }
  ]
})
```

---

### 📊 5. Durable Objects (WebSocket Temps Réel)

**Use case : Notifications avocat temps réel**

```javascript
// workers/notifications.ts
export class NotificationManager {
  constructor(state, env) {
    this.state = state
    this.sessions = []
  }
  
  async fetch(request) {
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader === 'websocket') {
      const [client, server] = Object.values(new WebSocketPair())
      
      this.sessions.push(server)
      
      server.addEventListener('message', async (event) => {
        // Broadcast à tous les avocats connectés
        this.sessions.forEach(session => {
          session.send(event.data)
        })
      })
      
      return new Response(null, { status: 101, webSocket: client })
    }
  }
}
```

**Configuration :**
```toml
# wrangler.toml
[durable_objects]
bindings = [
  { name = "NOTIFICATIONS", class_name = "NotificationManager" }
]
```

---

## 🔧 Scripts NPM Additionnels

Ajouter à `package.json` :

```json
{
  "scripts": {
    "cf:deploy": "powershell -ExecutionPolicy Bypass -File ./deploy-cloudflare-optimized.ps1",
    "cf:logs": "wrangler pages deployment tail --project-name=iapostemanager",
    "cf:logs:error": "wrangler pages deployment tail --project-name=iapostemanager --level=error",
    "cf:db:query": "wrangler d1 execute iapostemanager-db --command",
    "cf:db:backup": "wrangler d1 backup create iapostemanager-db",
    "cf:kv:list": "wrangler kv:key list --namespace-id=KV_SESSIONS",
    "cf:kv:get": "wrangler kv:key get --namespace-id=KV_SESSIONS",
    "cf:rollback": "wrangler pages deployment list --project-name=iapostemanager",
    "cf:preview": "npm run pages:build && wrangler pages dev .vercel/output/static"
  }
}
```

**Utilisation :**
```powershell
# Déployer
npm run cf:deploy

# Logs temps réel
npm run cf:logs

# Tester localement avec Cloudflare bindings
npm run cf:preview

# Query D1 directement
npm run cf:db:query "SELECT COUNT(*) FROM User"

# Backup D1
npm run cf:db:backup
```

---

## 📈 KPIs à Surveiller

### Performance
- ✅ **Time to First Byte (TTFB)** : <100ms (edge) <500ms (global)
- ✅ **Largest Contentful Paint (LCP)** : <2.5s
- ✅ **First Input Delay (FID)** : <100ms
- ✅ **Cumulative Layout Shift (CLS)** : <0.1

### Disponibilité
- ✅ **Uptime** : >99.9% (SLA Cloudflare)
- ✅ **Taux d'erreurs 5xx** : <0.1%
- ✅ **Taux d'erreurs 4xx** : <5%

### Coûts
- ✅ **Requests/jour** : Surveiller pour rester <100k (gratuit)
- ✅ **D1 reads/writes** : <5M/jour (gratuit)
- ✅ **KV operations** : <100k/jour (gratuit)

---

## 🎁 Ressources Complémentaires

### Documentation Officielle
- **Pages:** https://developers.cloudflare.com/pages
- **D1:** https://developers.cloudflare.com/d1
- **Workers:** https://developers.cloudflare.com/workers
- **Workers AI:** https://developers.cloudflare.com/workers-ai

### Communauté
- **Discord Cloudflare:** https://discord.gg/cloudflaredev
- **Forum:** https://community.cloudflare.com
- **GitHub Issues:** https://github.com/cloudflare

### Status & Incidents
- **Status page:** https://cloudflarestatus.com
- **RSS Feed:** https://cloudflarestatus.com/history.rss

---

## ✅ Checklist Finale

Après configuration, vérifiez :

- [ ] Variables d'environnement configurées (NEXTAUTH_SECRET, NEXTAUTH_URL)
- [ ] Domaine personnalisé ajouté et SSL actif
- [ ] Analytics activé et fonctionnel
- [ ] Headers de sécurité configurés (_headers)
- [ ] WAF rules activées (rate limiting, bot protection)
- [ ] Logs temps réel accessibles
- [ ] Alertes email configurées
- [ ] Tests de charge effectués (>1000 req/s OK)
- [ ] Backup D1 automatique activé
- [ ] Documentation équipe mise à jour

---

**Configuration terminée !** 🎉

Votre application est maintenant **production-ready** sur Cloudflare Pages avec performances optimales et coûts zéro.

---

**Créé le 19 janvier 2026**  
**Guide de configuration post-déploiement Cloudflare**
