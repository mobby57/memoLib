# 🚀 Checklist Production - IAPosteManager / MemoLib

**Date de révision**: 2026-02-07
**Statut actuel**: ⚠️ **Développement avancé** (70% production-ready)
**Branche**: `phase7-stripe-billing`

---

## 📊 Vue d'ensemble - Score de préparation

| Catégorie | Score | Priorité | Statut |
|-----------|-------|----------|--------|
| **1. Infrastructure & Base de données** | 6/10 | 🔴 CRITIQUE | En cours |
| **2. Sécurité & Authentification** | 7/10 | 🔴 CRITIQUE | Partiel |
| **3. Monitoring & Observabilité** | 5/10 | 🟡 HAUTE | Incomplet |
| **4. Performance & Optimisation** | 7/10 | 🟡 HAUTE | Bon |
| **5. Tests & Qualité** | 4/10 | 🟡 HAUTE | Faible |
| **6. CI/CD & Déploiement** | 6/10 | 🟢 MOYENNE | Partiel |
| **7. Documentation** | 8/10 | 🟢 MOYENNE | Bon |
| **8. Conformité légale (RGPD/CNIL)** | 9/10 | 🔴 CRITIQUE | Excellent |

**Score global**: **6.5/10** → Nécessite compléments avant prod

---

## 🔴 CRITIQUE - À faire AVANT production

### 1. Infrastructure & Base de données

#### ❌ Problèmes actuels
- **PostgreSQL non fonctionnel en local**
  ```
  Erreur actuelle: "authentification par mot de passe échouée pour l'utilisateur « memolib »"
  Workaround: In-memory store (db.ts)
  ```
- **Migration Prisma non testée en production**
- **Pas de stratégie de backup automatique**
- **Pas de plan de disaster recovery**

#### ✅ Actions requises

**1.1 Configurer PostgreSQL production**
```bash
# Option A: Utiliser Neon (déjà configuré)
# Activer storage_DATABASE_URL dans .env.production
DATABASE_URL="${{ secrets.NEON_DATABASE_URL }}"

# Option B: Azure Database for PostgreSQL
# Créer instance managed
az postgres flexible-server create \
  --name memolib-prod \
  --resource-group memolib-rg \
  --sku-name Standard_B2s \
  --tier Burstable \
  --version 15

# Option C: Supabase (alternative Neon)
```

**1.2 Configurer backups automatiques**
```yaml
# À ajouter dans .github/workflows/backup-db.yml
name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *'  # 2h AM daily
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup PostgreSQL to Azure Blob
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          AZURE_STORAGE_CONNECTION: ${{ secrets.AZURE_STORAGE }}
        run: |
          pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz
          az storage blob upload --connection-string $AZURE_STORAGE_CONNECTION
```

**1.3 Tester migrations Prisma**
```bash
# Créer script de migration safe
# À créer: scripts/migrate-production.sh
#!/bin/bash
set -e

echo "🔒 Mode DRY-RUN (simulation sans modification)"
npx prisma migrate deploy --dry-run

echo "Continuer avec la migration réelle ? (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  echo "🚀 Migration en cours..."
  npx prisma migrate deploy
  echo "✅ Migration terminée"
else
  echo "❌ Migration annulée"
fi
```

**1.4 Variables d'environnement production manquantes**
```bash
# À créer: .env.production (jamais commité, uniquement dans secrets)
NODE_ENV=production
DATABASE_URL=<secret-neon-ou-azure>
NEXT_PUBLIC_API_URL=https://memolib.azurewebsites.net
NEXTAUTH_URL=https://memolib.azurewebsites.net
NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>

# Azure AD Production
AZURE_AD_CLIENT_ID=<prod-app-id>
AZURE_AD_CLIENT_SECRET=<prod-secret>
AZURE_AD_TENANT_ID=<tenant-id>

# Rate Limiting (Redis)
REDIS_URL=<redis-prod-connection>
UPSTASH_REDIS_REST_URL=<upstash-url>
UPSTASH_REDIS_REST_TOKEN=<upstash-token>

# Monitoring
SENTRY_DSN=<prod-dsn>
SENTRY_AUTH_TOKEN=<auth-token>
NEXT_PUBLIC_VERCEL_ENV=production
```

---

### 2. Sécurité & Authentification

#### ❌ Manques critiques

**2.1 Middleware de sécurité manquant**
```typescript
// À créer: src/frontend/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ⚠️ CRITIQUE: Security Headers manquants
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // CSP (Content Security Policy) MANQUANT
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://vercel.live https://*.sentry.io;"
  );

  // HSTS (HTTP Strict Transport Security)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
```

**2.2 Rate Limiting non implémenté**
```typescript
// À créer: src/frontend/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 req/10s
  analytics: true,
});

// Utilisation dans route API:
// const { success } = await ratelimit.limit(ip);
// if (!success) return new Response('Too Many Requests', { status: 429 });
```

**2.3 Validation des inputs manquante**
```bash
# Installer Zod pour validation
npm install zod

# À créer: src/frontend/lib/validators/webhook.ts
import { z } from 'zod';

export const EmailWebhookSchema = z.object({
  channel: z.literal('EMAIL'),
  messageId: z.string().min(1),
  from: z.string().email(),
  to: z.string().email(),
  subject: z.string().max(500),
  text: z.string().max(50000),
});

// Usage dans route:
// const validated = EmailWebhookSchema.parse(payload);
```

**2.4 Secrets management**
```bash
# ⚠️ CRITIQUE: Migrer vers Azure Key Vault pour production
# Actuellement: secrets en .env.local (dev OK, prod NON)

# À implémenter:
# src/frontend/lib/secrets.ts
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential();
const vaultUrl = process.env.AZURE_KEY_VAULT_URL!;
const client = new SecretClient(vaultUrl, credential);

export async function getSecret(name: string): Promise<string> {
  const secret = await client.getSecret(name);
  return secret.value!;
}
```

---

### 3. Monitoring & Observabilité

#### ❌ Manques critiques

**3.1 Logs structurés manquants**
```typescript
// À créer: src/frontend/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Usage:
// logger.info({ userId, action: 'login' }, 'User logged in');
// logger.error({ err, context }, 'Database error');
```

**3.2 Health checks manquants**
```typescript
// À créer: src/frontend/app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    azureAd: await checkAzureAD(),
    twilio: await checkTwilio(),
  };

  const healthy = Object.values(checks).every((c) => c.status === 'ok');
  const status = healthy ? 200 : 503;

  return Response.json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
  }, { status });
}
```

**3.3 Métriques applicatives manquantes**
```typescript
// À implémenter: métriques custom Sentry
import * as Sentry from '@sentry/nextjs';

// Track webhook processing time
Sentry.metrics.distribution('webhook.processing_time', duration, {
  tags: { channel: message.channel },
  unit: 'millisecond',
});

// Track deduplication rate
Sentry.metrics.increment('webhook.duplicate_detected', 1, {
  tags: { channel },
});
```

**3.4 Alerting manquant**
```yaml
# À créer: alerting-config.yml (Sentry/Datadog/Azure Monitor)
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    window: 5m
    notify: [email, slack]

  - name: Database Connection Failure
    condition: database_errors > 10
    window: 1m
    severity: critical
    notify: [pagerduty, slack]

  - name: API Response Time
    condition: p95_latency > 2000
    window: 10m
    severity: warning
```

---

### 4. Tests & Qualité

#### ❌ Coverage critique faible

**Statut actuel**:
- Tests unitaires: ❌ Quasi inexistants
- Tests d'intégration: ❌ Absents
- Tests E2E: ❌ Absents
- Coverage: ~5% (inacceptable pour prod)

**4.1 Tests E2E manquants (Playwright)**
```bash
# Installer Playwright
npm install --save-dev @playwright/test

# Créer tests/e2e/webhook-flow.spec.ts
```

```typescript
import { test, expect } from '@playwright/test';

test.describe('Webhook Multi-Canal Flow', () => {
  test('should process EMAIL webhook and deduplicate', async ({ request }) => {
    const payload = {
      channel: 'EMAIL',
      messageId: 'test_' + Date.now(),
      from: 'test@example.com',
      to: 'cabinet@example.com',
      subject: 'Test E2E',
      text: 'E2E test message',
    };

    // First request should succeed
    const response1 = await request.post('/api/webhooks/test-multichannel', {
      data: payload,
    });
    expect(response1.status()).toBe(200);
    const data1 = await response1.json();
    expect(data1.success).toBe(true);

    // Second request should detect duplicate
    const response2 = await request.post('/api/webhooks/test-multichannel', {
      data: payload,
    });
    expect(response2.status()).toBe(409);
    const data2 = await response2.json();
    expect(data2.error).toBe('DUPLICATE_MESSAGE');
  });
});
```

**4.2 Tests unitaires du Pattern Adapter**
```typescript
// À créer: src/frontend/lib/__tests__/deduplication-service.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { computeChecksum, checkDuplicate, storeChannelMessage } from '../deduplication-service';

describe('Deduplication Service', () => {
  beforeEach(() => {
    // Reset store
  });

  it('should compute deterministic checksum', async () => {
    const payload = { channel: 'EMAIL', text: 'test' };
    const checksum1 = await computeChecksum(payload);
    const checksum2 = await computeChecksum(payload);
    expect(checksum1).toBe(checksum2);
  });

  it('should detect duplicates', async () => {
    const data = {
      externalId: 'test_123',
      checksum: 'abc123',
      channel: 'EMAIL',
      sender: { email: 'test@test.com' },
      body: 'Test message',
    };

    await storeChannelMessage(data);
    const isDuplicate = await checkDuplicate('abc123');
    expect(isDuplicate).toBe(true);
  });
});
```

**4.3 Tests performance manquants**
```typescript
// À créer: tests/performance/webhook-load.test.ts
import { test } from '@playwright/test';

test('Webhook should handle 100 req/s', async ({ request }) => {
  const startTime = Date.now();
  const promises = [];

  for (let i = 0; i < 100; i++) {
    promises.push(
      request.post('/api/webhooks/test-multichannel', {
        data: {
          channel: 'EMAIL',
          messageId: 'perf_' + i,
          from: `test${i}@example.com`,
          text: 'Performance test',
        },
      })
    );
  }

  const responses = await Promise.all(promises);
  const duration = Date.now() - startTime;

  const successCount = responses.filter((r) => r.status() === 200).length;
  expect(successCount).toBe(100);
  expect(duration).toBeLessThan(10000); // < 10s pour 100 requêtes
});
```

---

### 5. Performance & Cache

#### ⚠️ Optimisations manquantes

**5.1 Cache stratégie non définie**
```typescript
// À créer: src/frontend/lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  const fresh = await fetcher();
  await redis.setex(key, ttl, fresh);
  return fresh;
}

// Usage:
// const user = await getCached(`user:${userId}`, () => prisma.user.findUnique(...), 300);
```

**5.2 CDN non configuré**
```javascript
// Dans next.config.js, ajouter:
assetPrefix: process.env.CDN_URL || undefined,

// Azure CDN configuration requise
// OU Cloudflare en front de Vercel/Azure
```

**5.3 Compression images manquante**
```bash
# Optimiser toutes les images statiques
npm install -g sharp-cli

# Script à créer: scripts/optimize-images.sh
find public -type f \( -name "*.jpg" -o -name "*.png" \) | while read img; do
  sharp -i "$img" -o "$img" --jpeg-quality 80 --png-compressionLevel 9
done
```

---

### 6. Conformité & Documentation

#### ✅ Bon (mais compléments requis)

**6.1 RGPD - À documenter formellement**
```markdown
# À créer: docs/RGPD_COMPLIANCE.md

## Traitement des données personnelles

### Base légale
- Consentement explicite (article 6.1.a RGPD)
- Exécution du contrat (article 6.1.b)

### Données traitées
- Identité: nom, prénom, email
- Correspondance: emails, SMS, WhatsApp
- Métadonnées: checksums, horodatages

### Durée de conservation
- Messages actifs: 3 ans maximum
- Archives: 10 ans (obligation légale avocats)

### Droits des personnes
- Droit d'accès: /api/gdpr/access
- Droit de rectification: /api/gdpr/rectify
- Droit à l'effacement: /api/gdpr/delete
- Portabilité: /api/gdpr/export
```

**6.2 API Documentation manquante**
```bash
# Installer Swagger/OpenAPI
npm install next-swagger-doc swagger-ui-react

# Générer docs automatiques
# À créer: src/frontend/pages/api-docs.tsx
```

---

## 🟡 HAUTE PRIORITÉ - Avant mise à l'échelle

### 7. Scalabilité

**7.1 Queue system manquant**
```bash
# Pour traitement asynchrone messages
npm install bullmq ioredis

# À créer: src/backend/queues/message-processor.ts
import { Queue, Worker } from 'bullmq';

export const messageQueue = new Queue('messages', {
  connection: { host: 'localhost', port: 6379 },
});

const worker = new Worker('messages', async (job) => {
  const { messageId } = job.data;
  await processMessageWithAI(messageId);
}, { connection: { host: 'localhost', port: 6379 } });
```

**7.2 Load balancing non configuré**
```yaml
# Azure: Ajouter Load Balancer
# OU Vercel Edge Network (automatique)
# OU Cloudflare Load Balancing
```

---

## 📋 Checklist de déploiement

### Pré-déploiement
- [ ] Tous les secrets dans Azure Key Vault / GitHub Secrets
- [ ] Variables d'environnement production validées
- [ ] Database migration testée sur staging
- [ ] Backups automatiques configurés
- [ ] Health checks implémentés
- [ ] Rate limiting activé
- [ ] Security headers configurés
- [ ] CSP policy définie

### Tests
- [ ] Tests E2E passent (Playwright)
- [ ] Coverage > 70%
- [ ] Tests de charge (100 req/s)
- [ ] Tests de sécurité (OWASP)
- [ ] Validation manuelle sur staging

### Monitoring
- [ ] Sentry configuré (production DSN)
- [ ] Logs centralisés (Azure Monitor / Datadog)
- [ ] Alertes configurées (erreurs, latence, downtime)
- [ ] Dashboard uptime (UptimeRobot / Pingdom)

### Documentation
- [ ] README mis à jour
- [ ] API documentation générée
- [ ] Runbook pour équipe ops
- [ ] Plan de disaster recovery

### Post-déploiement
- [ ] Smoke tests en production
- [ ] Vérification monitoring
- [ ] Rollback plan prêt
- [ ] Communication équipe/clients

---

## 🚀 Plan d'action prioritaire (3 semaines)

### Semaine 1: Fondations critiques
**Lundi-Mardi**: Base de données
- [ ] Configurer PostgreSQL production (Neon/Azure)
- [ ] Tester migrations Prisma
- [ ] Configurer backups quotidiens

**Mercredi-Jeudi**: Sécurité
- [ ] Implémenter middleware.ts avec security headers
- [ ] Ajouter rate limiting (Upstash Redis)
- [ ] Migrer secrets vers Azure Key Vault

**Vendredi**: Monitoring
- [ ] Health checks API
- [ ] Logger structuré (Pino)
- [ ] Alertes Sentry

### Semaine 2: Tests & Qualité
**Lundi-Mercredi**: Tests
- [ ] Tests E2E Pattern Adapter (Playwright)
- [ ] Tests unitaires services (Jest)
- [ ] Tests de charge (k6 / Artillery)

**Jeudi-Vendredi**: Performance
- [ ] Cache Redis
- [ ] Optimiser images
- [ ] CDN configuration

### Semaine 3: Documentation & Déploiement
**Lundi-Mardi**: Documentation
- [ ] RGPD compliance formelle
- [ ] API docs (OpenAPI)
- [ ] Runbook ops

**Mercredi-Vendredi**: Staging → Production
- [ ] Deploy staging complet
- [ ] Tests validation finale
- [ ] Production deployment
- [ ] Monitoring 48h post-launch

---

## 📞 Support & Ressources

**Documentation technique**:
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)
- [Azure Well-Architected Framework](https://learn.microsoft.com/azure/well-architected/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

**Contacts critiques**:
- Azure Support: [portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade]
- Sentry Support: support@sentry.io
- Neon Support: support@neon.tech

---

**Dernière mise à jour**: 2026-02-07
**Prochaine révision**: Après implémentation semaine 1
