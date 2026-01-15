# 🔴 Configuration Upstash Redis

## ✅ Installation Complète

Le package `@upstash/redis` a été installé avec succès !

---

## 📋 Étapes de Configuration

### 1️⃣ Créer une base de données Upstash Redis

1. **Aller sur** : [https://console.upstash.com/](https://console.upstash.com/)
2. **Se connecter** ou créer un compte (gratuit)
3. **Créer une nouvelle base Redis** :
   - Cliquer sur "Create Database"
   - Choisir un nom : `iapostemanager-redis`
   - Région : Europe (Frankfurt) ou la plus proche
   - Type : **Free** (250MB gratuit)
   - Cliquer sur "Create"

### 2️⃣ Obtenir les credentials

Une fois la base créée :

1. Cliquer sur votre base de données
2. Copier les valeurs suivantes :
   - **UPSTASH_REDIS_REST_URL** : `https://your-endpoint.upstash.io`
   - **UPSTASH_REDIS_REST_TOKEN** : `AXXXXXXxxxxxxx...`

### 3️⃣ Mettre à jour le fichier `.env.local`

Remplacer les valeurs dans la section Redis :

```env
# 🔴 REDIS - CACHE & QUEUES
REDIS_ENABLED=true
UPSTASH_REDIS_REST_URL=https://your-actual-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXXXxxxxxxx...
UPSTASH_DISABLE_TELEMETRY=false
```

### 4️⃣ Ajouter à Vercel (Production)

```bash
# Ajouter les variables d'environnement Vercel
vercel env add UPSTASH_REDIS_REST_URL
# Coller la valeur: https://your-endpoint.upstash.io

vercel env add UPSTASH_REDIS_REST_TOKEN
# Coller la valeur: AXXXXXXxxxxxxx...
```

---

## 🚀 Utilisation

### Import du client Redis

```typescript
import { redis, cache, queue, session, sortedSet, hashMap } from '@/lib/upstash'
```

### Exemples d'utilisation

#### 1. Cache simple

```typescript
// Stocker une valeur (expire après 3600 secondes)
await cache.set('user:123', { name: 'John', role: 'admin' }, 3600)

// Récupérer
const user = await cache.get<User>('user:123')

// Supprimer
await cache.del('user:123')

// Vérifier existence
const exists = await cache.exists('user:123')
```

#### 2. Sessions utilisateur

```typescript
// Créer une session (expire après 1h par défaut)
await session.set('user-abc', {
  userId: 'abc',
  tenantId: 'tenant-xyz',
  role: 'ADMIN',
})

// Récupérer la session
const sessionData = await session.get('user-abc')

// Supprimer (logout)
await session.delete('user-abc')
```

#### 3. Rate Limiting

```typescript
// Limiter à 100 requêtes par 15 minutes (900s)
const { allowed, remaining, resetAt } = await session.rateLimit(
  `api:${userId}`,
  100,
  900
)

if (!allowed) {
  return new Response('Too many requests', { status: 429 })
}
```

#### 4. Queues (files d'attente)

```typescript
// Ajouter une tâche à la queue
await queue.push('email-queue', {
  to: 'client@example.com',
  subject: 'Welcome!',
  template: 'welcome',
})

// Récupérer et traiter
const task = await queue.pop<EmailTask>('email-queue')
if (task) {
  await sendEmail(task)
}

// Voir la longueur de la queue
const length = await queue.length('email-queue')
```

#### 5. Sorted Sets (classements, scores)

```typescript
// Ajouter un score
await sortedSet.add('dossier-activity', 'dossier-123', Date.now())

// Top 10 dossiers les plus actifs
const topDossiers = await sortedSet.top('dossier-activity', 10)

// Incrémenter un score
await sortedSet.increment('user-points', 'user-123', 10)
```

#### 6. Hash Maps (objets structurés)

```typescript
// Stocker des données structurées
await hashMap.set('tenant:xyz', {
  name: 'Cabinet Dupont',
  plan: 'PREMIUM',
  activeDossiers: 42,
})

// Récupérer un champ
const plan = await hashMap.get('tenant:xyz', 'plan')

// Récupérer tout l'objet
const tenant = await hashMap.getAll('tenant:xyz')
```

---

## 🎯 Cas d'usage dans IA Poste Manager

### 1. Cache des requêtes Prisma

```typescript
// src/lib/cached-queries.ts
import { cache } from '@/lib/upstash'

export async function getCachedDossiers(tenantId: string) {
  const cacheKey = `dossiers:${tenantId}`
  
  // Vérifier le cache
  let dossiers = await cache.get(cacheKey)
  
  if (!dossiers) {
    // Si pas en cache, requête DB
    dossiers = await prisma.dossier.findMany({
      where: { tenantId },
    })
    
    // Mettre en cache (5 minutes)
    await cache.set(cacheKey, dossiers, 300)
  }
  
  return dossiers
}
```

### 2. Rate Limiting API

```typescript
// src/middleware.ts
import { session } from '@/lib/upstash'

export async function middleware(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  
  const { allowed, remaining } = await session.rateLimit(
    `api:${userId}`,
    100, // 100 requêtes
    900  // par 15 minutes
  )
  
  if (!allowed) {
    return new Response('Rate limit exceeded', { status: 429 })
  }
  
  return NextResponse.next()
}
```

### 3. Queue de tâches IA

```typescript
// src/lib/ai-queue.ts
import { queue } from '@/lib/upstash'

// Ajouter une analyse IA en queue
export async function queueAIAnalysis(dossierId: string) {
  await queue.push('ai-analysis-queue', {
    dossierId,
    timestamp: Date.now(),
    priority: 'normal',
  })
}

// Worker qui traite la queue
export async function processAIQueue() {
  const task = await queue.pop('ai-analysis-queue')
  
  if (task) {
    await analyzeWithAI(task.dossierId)
  }
}
```

### 4. Leaderboard des cabinets

```typescript
// src/lib/leaderboard.ts
import { sortedSet } from '@/lib/upstash'

// Mettre à jour le score d'un cabinet
export async function updateTenantScore(tenantId: string, points: number) {
  await sortedSet.increment('tenant-leaderboard', tenantId, points)
}

// Top 10 cabinets
export async function getTopTenants() {
  return await sortedSet.top('tenant-leaderboard', 10)
}
```

---

## 📊 Monitoring

### Tableau de bord Upstash

Accessible sur : [https://console.upstash.com/](https://console.upstash.com/)

**Métriques disponibles** :
- Nombre de commandes/jour
- Bande passante utilisée
- Taille de la base
- Latence moyenne
- Taux d'erreur

### Health Check

```typescript
import { isRedisAvailable } from '@/lib/upstash'

// Vérifier la disponibilité
const healthy = await isRedisAvailable()
console.log('Redis healthy:', healthy)
```

---

## 💰 Limites Plan Gratuit

**Upstash Free Tier** :
- ✅ 10,000 commandes/jour
- ✅ 250 MB de stockage
- ✅ Multi-région disponible
- ✅ Pas d'expiration

**Pour upgrader** : [Upstash Pricing](https://upstash.com/pricing)

---

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne JAMAIS commiter les tokens** dans Git
2. **Utiliser `.env.local`** pour le développement
3. **Variables d'environnement Vercel** pour la production
4. **Désactiver la télémétrie** si nécessaire :
   ```env
   UPSTASH_DISABLE_TELEMETRY=true
   ```

### Rotation des tokens

Si un token est compromis :
1. Aller sur [Upstash Console](https://console.upstash.com/)
2. Sélectionner la base → **Settings** → **Reset Password**
3. Mettre à jour les variables d'environnement

---

## 🧪 Tests

### Test de connexion

```typescript
// scripts/test-upstash.ts
import { redis } from '@/lib/upstash'

async function testUpstash() {
  try {
    // Test ping
    const pong = await redis.ping()
    console.log('✅ Ping:', pong)
    
    // Test set/get
    await redis.set('test-key', 'Hello Upstash!', { ex: 60 })
    const value = await redis.get('test-key')
    console.log('✅ Set/Get:', value)
    
    // Test delete
    await redis.del('test-key')
    console.log('✅ Delete successful')
    
    console.log('✅ Upstash Redis fonctionne parfaitement!')
  } catch (error) {
    console.error('❌ Erreur Upstash:', error)
  }
}

testUpstash()
```

Exécuter :
```bash
npx tsx scripts/test-upstash.ts
```

---

## 📚 Documentation Complète

- **Upstash Redis Docs** : [https://upstash.com/docs/redis](https://upstash.com/docs/redis)
- **SDK Node.js** : [https://github.com/upstash/upstash-redis](https://github.com/upstash/upstash-redis)
- **API Reference** : [https://upstash.com/docs/redis/sdks/ts/overview](https://upstash.com/docs/redis/sdks/ts/overview)

---

## ✅ Checklist de Configuration

- [ ] Compte Upstash créé
- [ ] Base de données Redis créée
- [ ] Credentials copiés dans `.env.local`
- [ ] Package `@upstash/redis` installé
- [ ] Fichier `src/lib/upstash.ts` créé
- [ ] Test de connexion effectué
- [ ] Variables ajoutées à Vercel (production)
- [ ] Ancien Redis local désactivé (si applicable)

---

**Upstash Redis est maintenant configuré et prêt à l'emploi !** 🎉🔴
