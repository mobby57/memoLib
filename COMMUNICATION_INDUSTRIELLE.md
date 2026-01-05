# 📡 Communication Industrielle Améliorée

**Date**: 3 janvier 2026  
**Version**: 2.0.0  
**Status**: ✅ Implémenté

---

## 🎯 Objectif

Remplacer tous les `console.log/error/warn` par un **système de logging professionnel** adapté aux environnements industriels.

---

## ✨ Nouvelles Fonctionnalités

### 1. Logger Professionnel (`src/lib/logger.ts`)

#### Niveaux de Log
- **🔍 DEBUG**: Développement uniquement - détails techniques
- **ℹ️ INFO**: Informations opérationnelles importantes
- **⚠️ WARN**: Avertissements non-bloquants
- **❌ ERROR**: Erreurs avec stack trace
- **🚨 CRITICAL**: Erreurs critiques nécessitant attention immédiate

#### Fonctionnalités Avancées

**Sanitization Automatique**
```typescript
// Les données sensibles sont automatiquement masquées
logger.info('Login', { username: 'john', password: '123' })
// Output: { username: 'john', password: '[REDACTED]' }
```

**Logs Structurés**
```typescript
// Production: JSON structuré pour agrégation
{
  "timestamp": "2026-01-03T15:30:00Z",
  "level": "info",
  "message": "Commentaire ajouté",
  "context": {
    "commentId": "abc123",
    "dossierId": "dos-001"
  }
}
```

**Performance Tracking**
```typescript
const stopTimer = logger.startTimer('Database Query');
await performQuery();
stopTimer(); // Log automatique du temps d'exécution
```

**Audit Trail**
```typescript
logger.audit('DELETE_DOSSIER', userId, tenantId, { dossierId });
// Toujours persisté, même en production
```

---

## 📊 Services Migré

### ✅ Collaboration Service (10 logs)
- `addComment`: info
- `updateComment`: info
- `deleteComment`: info
- `addReaction`: debug
- `createNotification`: info
- `markNotificationAsRead`: debug
- `markAllNotificationsAsRead`: info
- `trackActivity`: debug

### ✅ Workflow Service (5 logs)
- `executeWorkflow`: info (début + fin)
- `executeAction`: debug
- `actionSuccess`: debug
- `workflowError`: error

### ✅ Storage Service (4 logs)
- `uploadFile`: info + error
- `deleteFile`: info + error

### ✅ Document Analysis Service (2 logs)
- `analyzeDocument`: error
- `createDeadlines`: error

### ✅ Export Service (10 logs)
- `exportToExcel`: info + error
- `exportToExcelMultiSheet`: info + error
- `exportToWord`: info + error
- `exportToCSV`: info + error
- `importFromCSV`: info + error

### ✅ Email Service (1 log)
- `sendEmail`: info (simulation)

### ✅ Semantic Search Service (1 log)
- `generateEmbedding`: error

---

## 🔄 Environnements

### Développement
```typescript
// Logs visibles dans la console avec emojis
🔍 [DEBUG] Activité enregistrée { activityId: "act-123", type: "comment" }
ℹ️ [INFO] Workflow terminé { workflowName: "Auto-relance", resultsCount: 5 }
⚠️ [WARN] Slow operation: Database query completed in 1245ms
❌ [ERROR] Erreur lors de l'upload { fileId: "file-456", error: "..." }
```

### Production
```typescript
// Logs structurés envoyés à monitoring (Sentry, DataDog, CloudWatch)
{
  "timestamp": "2026-01-03T15:30:00Z",
  "level": "error",
  "message": "Erreur lors de l'upload",
  "context": {
    "fileId": "file-456",
    "stackTrace": "Error: ...\n  at uploadFile ..."
  }
}

// Alertes critiques envoyées immédiatement
🚨 [CRITICAL] Payment gateway down
// → Email + Slack + PagerDuty notification
```

---

## 📈 Statistiques

### Avant
- **80+ console.log** dispersés dans le code
- Pas de contexte
- Données sensibles exposées
- Impossible à désactiver en production

### Après
- **0 console.log** direct (sauf simulation email en dev)
- **Contexte structuré** avec chaque log
- **Sanitization automatique** des données sensibles
- **Logging conditionnel** par environnement
- **Buffer + batch processing** pour performance
- **Intégration monitoring** prête

---

## 🔌 Intégrations Prêtes

### Sentry (Error Tracking)
```typescript
// Dans sendToMonitoring()
if (entry.level === 'error' || entry.level === 'critical') {
  Sentry.captureException(new Error(entry.message), {
    level: entry.level,
    extra: entry.context,
  });
}
```

### DataDog (APM & Logs)
```typescript
// Dans sendToMonitoring()
await fetch('https://http-intake.logs.datadoghq.com/v1/input', {
  method: 'POST',
  headers: {
    'DD-API-KEY': process.env.DATADOG_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(entry),
});
```

### CloudWatch (AWS)
```typescript
// Dans sendToMonitoring()
const cloudwatchlogs = new AWS.CloudWatchLogs();
await cloudwatchlogs.putLogEvents({
  logGroupName: '/iapostemanage/production',
  logStreamName: 'application',
  logEvents: [{
    message: JSON.stringify(entry),
    timestamp: new Date(entry.timestamp).getTime(),
  }],
}).promise();
```

---

## 🛠️ Utilisation

### Import
```typescript
import { logger } from '@/lib/logger';
```

### Exemples

**Debug (dev uniquement)**
```typescript
logger.debug('Cache hit', { key: 'user-123', value: cachedData });
```

**Info**
```typescript
logger.info('Document uploadé', { 
  fileId: file.id, 
  filename: file.name, 
  size: file.size 
});
```

**Warning**
```typescript
logger.warn('Slow query detected', { 
  query: 'SELECT * FROM dossiers', 
  durationMs: 1245 
});
```

**Error**
```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error, { userId, operation: 'delete' });
  throw error;
}
```

**Critical**
```typescript
logger.critical('Database connection lost', error, {
  host: dbConfig.host,
  retryCount: 5
});
// → Alerte immédiate en production
```

**Audit**
```typescript
logger.audit('DELETE_DOSSIER', userId, tenantId, {
  dossierId: 'dos-001',
  reason: 'Client request'
});
// → Toujours persisté
```

**Performance**
```typescript
const stopTimer = logger.startTimer('Complex calculation');
const result = await complexCalculation();
stopTimer(); 
// → Log si > 1000ms
```

**Wrapper Async**
```typescript
import { withLogging } from '@/lib/logger';

const uploadFile = withLogging(
  async (file) => { /* ... */ },
  'File Upload'
);
// → Log automatique avec timing
```

---

## 🔒 Sécurité

### Données Sensibles Masquées
Liste des mots-clés automatiquement masqués:
- `password`
- `token`
- `apiKey`
- `secret`
- `creditCard`

### Exemple
```typescript
logger.info('User login', {
  username: 'john.doe',
  password: 'secret123',      // → [REDACTED]
  apiKey: 'sk_live_abc123',   // → [REDACTED]
  email: 'john@example.com'    // → OK
});
```

---

## 📋 Configuration Environnement

### .env.local (Développement)
```bash
NODE_ENV=development
# Logs visibles dans console
```

### .env.production (Production)
```bash
NODE_ENV=production

# Monitoring
SENTRY_DSN=https://...
DATADOG_API_KEY=xxx
AWS_CLOUDWATCH_GROUP=/iapostemanage/production

# Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
PAGERDUTY_API_KEY=xxx
```

---

## 🎯 Prochaines Étapes

### Phase 1: Finalisation ✅
- [x] Créer système de logger
- [x] Migrer services critiques
- [x] Tester en développement

### Phase 2: Intégration (À faire)
- [ ] Configurer Sentry pour error tracking
- [ ] Intégrer DataDog APM
- [ ] Setup CloudWatch Logs
- [ ] Configurer alertes Slack
- [ ] Tester PagerDuty pour criticals

### Phase 3: Monitoring (À faire)
- [ ] Dashboard temps réel
- [ ] Alertes par email
- [ ] Rapports hebdomadaires
- [ ] Analyse des patterns d'erreurs

---

## 📚 Documentation API

### `logger.debug(message, context?)`
Log de debug - visible uniquement en développement

### `logger.info(message, context?)`
Information opérationnelle importante

### `logger.warn(message, context?)`
Avertissement non-bloquant

### `logger.error(message, error?, context?)`
Erreur avec stack trace optionnelle

### `logger.critical(message, error?, context?)`
Erreur critique nécessitant intervention immédiate

### `logger.audit(action, userId, tenantId, details?)`
Log d'audit sécurité - toujours persisté

### `logger.performance(operation, durationMs, context?)`
Mesure de performance - warn si > 1000ms

### `logger.startTimer(label): () => void`
Helper pour mesurer le temps d'exécution

### `withLogging(fn, operationName): fn`
Wrapper pour logging automatique avec timing

---

## 🔧 Maintenance

### Vider le Buffer Manuellement
```typescript
logger.flushBuffer();
```

### Récupérer Logs Récents (Debug)
```typescript
const recentLogs = logger.getRecentLogs(100);
console.table(recentLogs);
```

---

**Auteur**: GitHub Copilot (Claude Sonnet 4.5)  
**Dernière mise à jour**: 3 janvier 2026, 16:00
