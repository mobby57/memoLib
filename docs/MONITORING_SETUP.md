# Monitoring Production - MemoLib

## 🎯 Options de Monitoring

### **Option 1: Sentry (Recommandé)**

#### Installation
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

#### Configuration
```bash
# .env.local
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=memolib
SENTRY_PROJECT=memolib
SENTRY_AUTH_TOKEN=sntrys_xxx
```

#### Fichiers créés automatiquement
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

---

### **Option 2: Datadog (Enterprise)**

#### Installation
```bash
npm install dd-trace
```

#### Configuration
```javascript
// instrumentation.ts
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    require('dd-trace').init({
      service: 'memolib',
      env: process.env.NODE_ENV,
    });
  }
}
```

```bash
# .env.local
DD_API_KEY=xxx
DD_SITE=datadoghq.eu
DD_SERVICE=memolib
```

---

### **Option 3: Azure Application Insights**

#### Installation
```bash
npm install @azure/monitor-opentelemetry
```

#### Configuration
```typescript
// instrumentation.ts
import { useAzureMonitor } from '@azure/monitor-opentelemetry';

export function register() {
  useAzureMonitor({
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  });
}
```

```bash
# .env.local
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://xxx
```

---

### **Option 4: Simple Logging (Gratuit)**

#### Installation
```bash
npm install pino pino-pretty
```

#### Configuration
```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' }
    : undefined,
});
```

---

## 🚀 Setup Rapide (Sentry)

### 1. Installation
```bash
npm install @sentry/nextjs
```

### 2. Configuration automatique
```bash
npx @sentry/wizard@latest -i nextjs
```

### 3. Variables d'environnement
```bash
# .env.local
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx

# .env.production (Azure/Vercel)
SENTRY_DSN=@Microsoft.KeyVault(SecretUri=https://...)
```

### 4. Test
```typescript
// src/app/api/test-sentry/route.ts
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    throw new Error('Test Sentry');
  } catch (error) {
    Sentry.captureException(error);
    return Response.json({ error: 'Logged to Sentry' });
  }
}
```

---

## 📊 Métriques à Surveiller

### **Performance**
- Response time API (< 200ms)
- Page load time (< 2s)
- Time to First Byte (< 600ms)
- Core Web Vitals (LCP, FID, CLS)

### **Erreurs**
- Error rate (< 1%)
- 5xx errors
- Failed API calls
- Unhandled exceptions

### **Business**
- Active users
- Emails processed
- Documents uploaded
- API usage per plan

### **Sécurité**
- Failed auth attempts
- Rate limit hits
- Suspicious activity
- CORS violations

---

## 🔔 Alertes Recommandées

### **Critiques (Slack/Email)**
```yaml
- Error rate > 5%
- API response time > 2s
- Database connection failed
- Auth service down
```

### **Warnings (Slack)**
```yaml
- Error rate > 1%
- API response time > 1s
- Memory usage > 80%
- Disk space < 20%
```

### **Info (Dashboard)**
```yaml
- New deployment
- High traffic spike
- Quota warnings
```

---

## 🛠️ Configuration Avancée

### **Sentry - Performance Monitoring**
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
});
```

### **Custom Metrics**
```typescript
// src/lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

export function trackMetric(name: string, value: number) {
  Sentry.metrics.gauge(name, value);
}

export function trackEvent(name: string, data?: any) {
  Sentry.captureMessage(name, {
    level: 'info',
    extra: data,
  });
}
```

---

## 📈 Dashboard Recommandé

### **Grafana + Prometheus (Self-hosted)**
```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    ports: ["9090:9090"]
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
  
  grafana:
    image: grafana/grafana
    ports: ["3001:3000"]
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## 🔍 Troubleshooting

### Sentry non initialisé
```bash
# Vérifier installation
npm list @sentry/nextjs

# Réinstaller
npm install --save-exact @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Erreurs non capturées
```typescript
// Ajouter error boundary
// src/app/error.tsx
'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({ error }: { error: Error }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <div>Something went wrong!</div>;
}
```

---

## 📚 Ressources

- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Datadog APM](https://docs.datadoghq.com/tracing/)
- [Azure Monitor](https://learn.microsoft.com/azure/azure-monitor/)
- [Grafana](https://grafana.com/docs/)

---

**Recommandation**: Commencer avec Sentry (gratuit jusqu'à 5K events/mois)
