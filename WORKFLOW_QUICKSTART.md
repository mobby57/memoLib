# 🚀 WORKFLOW CONDITIONNEL - DÉMARRAGE EN 5 MINUTES

## ⚡ Installation Rapide

```bash
# 1. Le système est déjà installé dans votre projet !
# Aucune installation supplémentaire requise

# 2. Tester immédiatement
npm run workflow:test
```

**C'est tout !** Le système est prêt à l'emploi. ✅

---

## 🎯 Premier Workflow en 30 Secondes

### Créer une règle simple

```typescript
// fichier: my-first-workflow.ts
import { workflowEngine, triggerWorkflowEvent } from '@/lib/workflows/advanced-workflow-engine';

// 1. Enregistrer une règle
workflowEngine.registerRule({
  id: 'my_first_rule',
  name: 'Mon Premier Workflow',
  description: 'Test simple',
  enabled: true,
  priority: 50,
  
  // QUAND cet événement se produit
  trigger: {
    events: ['test:hello']
  },
  
  // FAIRE ces actions
  actions: [
    {
      id: 'action1',
      type: 'log_event',
      name: 'Logger un message',
      params: {
        message: 'Hello World! Mon premier workflow fonctionne!',
        level: 'info'
      }
    }
  ],
  
  executionMode: 'sequential',
  createdBy: 'me',
  createdAt: new Date(),
  updatedAt: new Date(),
  executionCount: 0,
  successCount: 0,
  failureCount: 0
});

// 2. Déclencher l'événement
await triggerWorkflowEvent('test:hello', 'tenant_demo', {});

// ✅ Résultat dans la console: "Hello World! Mon premier workflow fonctionne!"
```

---

## 📧 Exemple Réel : Email Urgent

```typescript
import { triggerWorkflowEvent } from '@/lib/workflows/advanced-workflow-engine';

// Déclencher quand un email urgent arrive
await triggerWorkflowEvent(
  'email:urgent',
  'tenant_abc',
  {
    classification: 'ceseda',
    clientName: 'M. DUBOIS',
    clientEmail: 'dubois@example.com',
    emailSubject: 'URGENT : Notification OQTF',
    priority: 'critical'
  }
);

// ✅ Actions automatiques :
// 1. Workspace créé
// 2. Procédure créée
// 3. Alertes envoyées
// 4. Avocat notifié
```

---

## 🎨 Ajouter des Conditions

```typescript
workflowEngine.registerRule({
  id: 'rule_with_conditions',
  name: 'Workflow avec conditions',
  enabled: true,
  priority: 80,
  
  trigger: {
    events: ['email:received'],
    
    // SEULEMENT SI ces conditions sont vraies
    conditions: [
      {
        id: 'cond1',
        field: 'payload.priority',
        operator: 'equals',
        value: 'critical'
      }
    ]
  },
  
  actions: [
    {
      id: 'action1',
      type: 'send_notification',
      params: {
        title: '🚨 Email critique',
        message: 'Email urgent de {{payload.clientName}}'
      }
    }
  ],
  
  executionMode: 'sequential',
  createdBy: 'me',
  createdAt: new Date(),
  updatedAt: new Date(),
  executionCount: 0,
  successCount: 0,
  failureCount: 0
});
```

---

## ⛓️ Cascade d'Actions

```typescript
actions: [
  {
    id: 'create_ws',
    type: 'create_workspace',
    params: {
      clientId: '{{payload.clientId}}',
      title: 'Espace {{payload.clientName}}'
    },
    
    // APRÈS SUCCÈS → Déclencher un autre workflow
    onSuccess: [
      {
        event: 'workspace:created',
        payload: {
          workspaceId: '{{result.id}}',
          clientId: '{{payload.clientId}}'
        }
      }
    ]
  }
]
```

**Résultat :** Création workspace → Événement 'workspace:created' → Autres workflows se déclenchent automatiquement

---

## 📊 Vérifier ce qui se passe

```typescript
import { workflowEngine } from '@/lib/workflows/advanced-workflow-engine';

// Statistiques
const stats = workflowEngine.getStats();
console.log(stats);
// → { totalRules: 15, enabledRules: 12, totalExecutions: 245 }

// Historique des 10 dernières exécutions
const history = workflowEngine.getExecutionHistory(10);
history.forEach(exec => {
  console.log(`${exec.ruleName}: ${exec.status} (${exec.duration}ms)`);
});
```

---

## 🎯 Événements Disponibles

### Les Plus Utilisés

```typescript
'email:urgent'              // Email urgent reçu
'email:classified'          // Email classifié par IA
'workspace:created'         // Nouveau workspace créé
'document:uploaded'         // Document uploadé
'deadline:approaching'      // Échéance approchante
'procedure:created'         // Nouvelle procédure
'alert:created'             // Nouvelle alerte
```

**[Voir les 60+ événements complets](./docs/WORKFLOW_CONDITIONNEL_AVANCE.md#catalogue-des-événements)**

---

## ⚡ Actions Disponibles

### Les Plus Utilisées

```typescript
'create_workspace'          // Créer workspace client
'create_procedure'          // Créer procédure CESEDA
'create_alert'              // Créer alerte
'send_email'                // Envoyer email
'send_notification'         // Notifier utilisateur
'analyze_with_ai'           // Analyser avec IA
'log_event'                 // Logger événement
```

**[Voir les 40+ actions complètes](./docs/WORKFLOW_CONDITIONNEL_AVANCE.md#catalogue-des-actions)**

---

## 📚 Prochaines Étapes

### 1. Comprendre les Bases (10 minutes)
→ Lire [GUIDE_WORKFLOW_USAGE.md](./docs/GUIDE_WORKFLOW_USAGE.md)

### 2. Comprendre l'Architecture (30 minutes)
→ Lire [WORKFLOW_CONDITIONNEL_AVANCE.md](./docs/WORKFLOW_CONDITIONNEL_AVANCE.md)

### 3. Créer Vos Workflows (1 heure)
→ Suivre les exemples du guide d'utilisation

---

## 🆘 Aide Rapide

### Workflow ne se déclenche pas ?

```typescript
// Vérifier que la règle est activée
const rules = workflowEngine.getRules();
console.log(rules.find(r => r.id === 'my_rule_id'));
// → { enabled: true } ✅

// Vérifier les événements qui déclenchent la règle
const emailRules = workflowEngine.getRulesByEvent('email:urgent');
console.log(emailRules);
```

### Action échoue ?

```typescript
// Vérifier l'historique des exécutions
const history = workflowEngine.getExecutionHistory(1);
console.log(history[0].results);
// → Voir les erreurs détaillées
```

---

## 🎉 Félicitations !

Vous savez maintenant :
- ✅ Lancer le système de test
- ✅ Créer une règle simple
- ✅ Déclencher un événement
- ✅ Ajouter des conditions
- ✅ Créer des cascades d'actions
- ✅ Vérifier l'état du système

**🚀 Commande pour tester :**
```bash
npm run workflow:test
```

**📚 Documentation complète :**
- [Guide d'Utilisation](./docs/GUIDE_WORKFLOW_USAGE.md)
- [Architecture Avancée](./docs/WORKFLOW_CONDITIONNEL_AVANCE.md)
- [Résumé du Système](./docs/WORKFLOW_RESUME.md)

---

*Guide créé le 7 janvier 2026*
