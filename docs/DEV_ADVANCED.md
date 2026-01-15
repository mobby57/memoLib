# 🔍 DÉVELOPPEMENT AVANCÉ - Guide Complet

## Vue d'ensemble

Système de développement avancé avec monitoring temps réel, debugging IA, et métriques de performance.

## 🎯 Composants Principaux

### 1. Advanced Logger (`src/lib/dev/advanced-logger.ts`)

Logger sophistiqué avec traçabilité complète et métriques temps réel.

#### Fonctionnalités

- **Logs multi-niveaux**: DEBUG, INFO, WARN, ERROR, CRITICAL
- **Catégories**: AI, WORKFLOW, EMAIL, NOTIFICATION, FORM, CALENDAR, DATABASE, SECURITY, PERFORMANCE, API
- **Trace IDs**: Traçabilité complète des requêtes
- **Performance Metrics**: Mesure automatique de durée
- **Console colorée**: Logs formatés avec emojis
- **Export**: JSON et CSV

#### Utilisation

```typescript
import { logger, LogCategory, LogLevel, measure } from '@/lib/dev/advanced-logger';

// Log simple
logger.log(LogLevel.INFO, LogCategory.AI, '🤖 Analyse IA démarrée');

// Log avec contexte
logger.log(LogLevel.INFO, LogCategory.WORKFLOW, 'Workflow exécuté', {
  workflowId: 'urgent-email',
  duration: 1250,
  success: true,
});

// Mesure de performance automatique
const result = await measure(
  LogCategory.AI,
  'analyzeEmail',
  async () => {
    // Votre code ici
    return await analyzeEmail(emailData);
  }
);

// Logging spécialisé IA
logger.logAIAnalysis(
  'llama3.2:latest',
  'Analyser cet email urgent...',
  'Catégorie: client-urgent, Urgence: high',
  1234, // duration ms
  { prompt: 150, completion: 350, total: 500 }
);

// Logging workflow
logger.logWorkflowExecution(
  'workflow-urgent-email',
  'step-1-analysis',
  'completed',
  { emailId: '123', category: 'urgent' }
);

// Sécurité
logger.logSecurityEvent(
  'failed_login_attempt',
  'medium',
  { userId: '123', ip: '192.168.1.1' }
);
```

#### Helpers rapides

```typescript
import { logAI, logWorkflow, logEmail, logError } from '@/lib/dev/advanced-logger';

logAI('Analyse terminée', { model: 'llama3.2', duration: 1234 });
logWorkflow('Workflow démarré', { id: 'urgent-email' });
logEmail('Email traité', { emailId: '123' });
logError('Erreur connexion Ollama', { error: 'ECONNREFUSED' });
```

### 2. Dashboard Développement (`/dev/dashboard`)

Interface de monitoring temps réel avec 4 onglets principaux.

#### Accès

```
http://localhost:3000/dev/dashboard
```

#### Fonctionnalités

**📋 Onglet Logs**
- Logs temps réel (refresh 5s)
- Filtrage par niveau et catégorie
- Couleurs par gravité (rouge = erreur, jaune = warning)
- Context complet en JSON

**🤖 Onglet IA**
- Total requêtes IA
- Taux de succès
- Durée moyenne
- Requêtes les plus lentes
- Modèles utilisés

**🔄 Onglet Workflows**
- Workflows actifs/complétés/échoués
- Taux de succès par workflow
- Statistiques par type

**⚡ Onglet Performance**
- Opérations les plus lentes
- Durée moyenne globale
- Taux de succès
- Top 10 opérations critiques

#### Actions

- **🔄 Refresh**: Recharge les données manuellement
- **📥 Export JSON**: Télécharge tous les logs en JSON
- **📊 Export CSV**: Télécharge tous les logs en CSV
- **🗑️ Clear Logs**: Nettoie tous les logs

### 3. API Endpoints

#### GET `/api/dev/logs`
Récupère les logs filtrés.

**Query params:**
- `level`: DEBUG | INFO | WARN | ERROR | CRITICAL
- `category`: AI | WORKFLOW | EMAIL | etc.
- `limit`: nombre de logs (défaut: 100)
- `since`: ISO timestamp

```bash
# Derniers 50 logs
curl http://localhost:3000/api/dev/logs?limit=50

# Logs d'erreur seulement
curl http://localhost:3000/api/dev/logs?level=ERROR

# Logs IA des dernières 24h
curl http://localhost:3000/api/dev/logs?category=AI&since=2026-01-06T00:00:00Z
```

#### DELETE `/api/dev/logs`
Nettoie tous les logs.

```bash
curl -X DELETE http://localhost:3000/api/dev/logs
```

#### GET `/api/dev/logs/export`
Exporte les logs.

```bash
# Export JSON
curl http://localhost:3000/api/dev/logs/export?format=json -o logs.json

# Export CSV
curl http://localhost:3000/api/dev/logs/export?format=csv -o logs.csv
```

#### GET `/api/dev/metrics`
Récupère les métriques de performance.

**Réponse:**
```json
{
  "averageDuration": 245.67,
  "successRate": 98.5,
  "totalOperations": 1250,
  "slowestOperations": [
    {
      "category": "AI",
      "operation": "analyzeEmail",
      "duration": 3456,
      "timestamp": "2026-01-07T10:30:00Z",
      "success": true
    }
  ]
}
```

#### GET `/api/dev/ai-stats`
Statistiques IA détaillées.

**Réponse:**
```json
{
  "total": 150,
  "averageDuration": 1234,
  "successRate": 97.3,
  "models": [
    { "name": "llama3.2:latest", "count": 120 },
    { "name": "mistral:latest", "count": 30 }
  ],
  "slowest": [...]
}
```

#### GET `/api/dev/workflow-stats`
Statistiques workflows.

**Réponse:**
```json
{
  "active": 5,
  "completed": 120,
  "failed": 3,
  "pending": 2,
  "successRate": 97.6,
  "byType": [
    {
      "name": "urgent-email",
      "count": 50,
      "successRate": 98.0
    }
  ]
}
```

#### GET `/api/dev/health`
Health check système.

**Réponse:**
```json
{
  "status": "healthy",
  "uptime": "2j 5h",
  "uptimeMs": 183600000,
  "timestamp": "2026-01-07T10:30:00Z",
  "checks": {
    "database": { "healthy": true, "message": "Database OK" },
    "ollama": { "healthy": true, "message": "Ollama OK" },
    "memory": { 
      "healthy": true, 
      "message": "Memory: 256MB / 512MB (50%)",
      "usage": 50
    }
  }
}
```

## 🚀 Intégration dans Votre Code

### Email Analysis

```typescript
import { logger, LogCategory, measure } from '@/lib/dev/advanced-logger';

async function analyzeEmail(email: any) {
  return await measure(
    LogCategory.AI,
    'analyzeEmail',
    async () => {
      logger.logEmail('Début analyse', { emailId: email.id });

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3.2:latest',
          prompt: `Analyser: ${email.subject}`,
        }),
      });

      const result = await response.json();

      logger.logAIAnalysis(
        'llama3.2:latest',
        email.subject,
        result.response,
        performance.now()
      );

      return result;
    }
  );
}
```

### Workflow Execution

```typescript
import { logger, LogCategory } from '@/lib/dev/advanced-logger';

async function executeWorkflow(workflowId: string, data: any) {
  logger.logWorkflowExecution(workflowId, 'start', 'started', data);

  try {
    // Étapes du workflow...
    for (const step of workflow.steps) {
      logger.logWorkflowExecution(workflowId, step.name, 'started');
      await executeStep(step);
      logger.logWorkflowExecution(workflowId, step.name, 'completed');
    }

    logger.logWorkflowExecution(workflowId, 'end', 'completed');
  } catch (error) {
    logger.logWorkflowExecution(workflowId, 'error', 'failed', {
      error: error.message,
    });
    throw error;
  }
}
```

### Performance Monitoring

```typescript
import { measure, LogCategory } from '@/lib/dev/advanced-logger';

// Mesure automatique de durée
const result = await measure(
  LogCategory.DATABASE,
  'complexQuery',
  async () => {
    return await prisma.user.findMany({
      include: { posts: true },
    });
  }
);

// Le logger enregistre automatiquement:
// - Durée d'exécution
// - Succès/échec
// - Timestamp
// - Context
```

## 🎨 Personnalisation

### Ajouter une nouvelle catégorie

```typescript
// Dans advanced-logger.ts
export enum LogCategory {
  AI = 'AI',
  WORKFLOW = 'WORKFLOW',
  CUSTOM_FEATURE = 'CUSTOM_FEATURE', // Nouvelle catégorie
}

// Ajouter emoji
const categoryEmojis = {
  [LogCategory.CUSTOM_FEATURE]: '🎨',
};
```

### Modifier le comportement de flush

```typescript
// Dans advanced-logger.ts
private flushInterval = 60000; // 1 minute au lieu de 30s
private maxLogsInMemory = 50000; // Plus de logs en mémoire
```

### Désactiver en production

```typescript
// Dans advanced-logger.ts
private isEnabled = process.env.ENABLE_ADVANCED_LOGGING === 'true';
```

## 📊 Métriques Clés

### Performance Alerts

Le logger détecte automatiquement:
- ✅ **Rapide**: < 100ms (🟢)
- ⚠️ **Normal**: 100-500ms (🟡)
- 🔴 **Lent**: > 500ms (🔴)
- 🚨 **Critique**: > 5000ms (Alerte logged)

### IA Anomalies

Détection automatique:
- Durée > 10s
- Réponse < 10 caractères
- Échec de parsing JSON
- Taux d'erreur > 5%

## 🔒 Sécurité

- **PII Masking**: Emails, noms, IPs automatiquement masqués
- **Audit Trail**: Tous les événements sécurité loggés
- **Encryption**: Logs sensibles chiffrés avant sauvegarde
- **Rétention**: Auto-nettoyage après X jours

## 🧪 Testing

```bash
# Test du logger
npm run test:logger

# Test des endpoints dev
npm run test:dev-api

# Générer des logs de test
npm run dev:generate-logs
```

## 📈 Best Practices

1. **Toujours mesurer les opérations coûteuses**
   ```typescript
   await measure(LogCategory.AI, 'operation', fn);
   ```

2. **Logger les transitions de workflow**
   ```typescript
   logger.logWorkflowExecution(id, step, status);
   ```

3. **Enrichir le contexte**
   ```typescript
   logger.log(level, category, message, {
     userId,
     traceId,
     metadata: { ... }
   });
   ```

4. **Utiliser les helpers pour code plus propre**
   ```typescript
   logAI('Message', context);
   logWorkflow('Message', context);
   ```

5. **Monitorer le dashboard régulièrement**
   - Vérifier taux de succès
   - Identifier opérations lentes
   - Détecter anomalies IA

## 🚨 Troubleshooting

### Dashboard ne charge pas

1. Vérifier que le serveur dev tourne
2. Vérifier console navigateur pour erreurs
3. Tester les endpoints API manuellement

### Logs manquants

1. Vérifier `isEnabled = true`
2. Vérifier niveau de log (DEBUG vs INFO)
3. Vérifier limite de logs en mémoire

### Performance dégradée

1. Réduire `maxLogsInMemory`
2. Augmenter `flushInterval`
3. Désactiver logs DEBUG en production

## 🎯 Prochaines Étapes

- [ ] Persist logs en database (MongoDB/PostgreSQL)
- [ ] Alertes Slack/Email automatiques
- [ ] Graphiques temps réel avec Chart.js
- [ ] Intégration Sentry/DataDog
- [ ] Machine learning pour détection anomalies
