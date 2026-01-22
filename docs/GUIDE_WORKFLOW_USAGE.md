# 🔄 GUIDE D'UTILISATION - SYSTÈME DE WORKFLOW CONDITIONNEL AVANCÉ

## 🎯 Vue d'Ensemble

Le système de workflow conditionnel permet d'**automatiser des chaînes d'actions complexes** qui s'exécutent automatiquement selon des événements et des conditions.

**Cas d'usage typiques :**
- Email urgent CESEDA reçu → Créer workspace → Créer procédure → Alerter avocat → Envoyer notification
- Document uploadé → Analyser avec IA → Classifier → Extraire données → Logger événement
- Échéance approchante → Créer alerte → Envoyer email → Notifier équipe → Escalader si critique

---

## 🚀 Démarrage Rapide

### 1. Lancer les Tests de Démonstration

```bash
# Tester tous les workflows
npm run workflow:test

# OU
npm run workflow:demo
```

**Ce que vous verrez :**
- ✅ Test 1 : Email urgent → Cascade complète (workspace + procédure + alertes)
- ✅ Test 2 : Document uploadé → Analyse IA automatique
- ✅ Test 3 : Échéances approchantes → Alertes multi-niveaux
- ✅ Test 4 : Conditions complexes (AND/OR imbriqués)
- ✅ Test 5 : Templates dynamiques ({{event}}, {{payload}}, {{context}})
- ✅ Test 6 : Validation IA selon niveaux GREEN/ORANGE/RED
- ✅ Test 7 : Performance (10 événements simultanés)

### 2. Utilisation de Base

```typescript
import { triggerWorkflowEvent } from '@/lib/workflows/advanced-workflow-engine';

// Déclencher un événement
await triggerWorkflowEvent(
  'email:urgent',           // Type d'événement
  'tenant_abc',             // ID du tenant
  {                         // Données de l'événement
    classification: 'ceseda',
    clientEmail: 'client@example.com',
    priority: 'critical'
  }
);
```

**Résultat :**
- Le système trouve toutes les règles qui matchent cet événement
- Évalue les conditions de chaque règle
- Exécute les actions des règles validées
- Déclenche les workflows en cascade (onSuccess, onFailure, onTimeout)

---

## 📚 Concepts Clés

### 🎯 Événements (60+ types disponibles)

Les événements déclenchent les workflows. Catégories principales :

#### Workspaces & Clients
```typescript
'workspace:created'         // Nouveau workspace client créé
'workspace:updated'         // Workspace modifié
'workspace:status_changed'  // Statut changé (active → archived)
'client:created'            // Nouveau client créé
'client:updated'            // Informations client modifiées
```

#### Procédures CESEDA
```typescript
'procedure:created'         // Nouvelle procédure juridique
'procedure:status_changed'  // Statut procédure changé
'procedure:completed'       // Procédure terminée
'procedure:urgent'          // Procédure marquée urgente
```

#### Emails & Messages
```typescript
'email:received'            // Nouvel email reçu
'email:urgent'              // Email classifié urgent
'email:classified'          // Email classifié par IA
'message:new'               // Nouveau message interne
```

#### Documents
```typescript
'document:uploaded'         // Document uploadé
'document:analyzed'         // Document analysé par IA
'document:classified'       // Document classifié
'document:missing'          // Document manquant détecté
```

#### Échéances & Alertes
```typescript
'deadline:created'          // Nouvelle échéance créée
'deadline:approaching'      // Échéance approchante
'deadline:critical'         // Échéance critique (< 3j)
'deadline:missed'           // Échéance dépassée
'alert:created'             // Nouvelle alerte créée
```

#### IA & Automatisation
```typescript
'ai:analysis_complete'      // Analyse IA terminée
'ai:validation_required'    // Validation humaine requise
'ai:suggestion_generated'   // Suggestion IA générée
```

**📖 Voir la liste complète des 60+ événements dans [WORKFLOW_CONDITIONNEL_AVANCE.md](./WORKFLOW_CONDITIONNEL_AVANCE.md#catalogue-des-événements)**

### ⚡ Actions (40+ types disponibles)

Les actions sont exécutées quand une règle matche. Catégories principales :

#### Création d'Entités
```typescript
'create_workspace'          // Créer nouveau workspace client
'create_procedure'          // Créer procédure CESEDA
'create_alert'              // Créer alerte système
'create_timeline_event'     // Créer événement timeline
'create_deadline'           // Créer échéance
```

#### Communication
```typescript
'send_email'                // Envoyer email
'send_notification'         // Envoyer notification push
'send_sms'                  // Envoyer SMS
'create_message'            // Créer message interne
```

#### IA & Analyse
```typescript
'analyze_with_ai'           // Analyser contenu avec IA
'classify_document'         // Classifier document
'extract_metadata'          // Extraire métadonnées
'request_ai_validation'     // Demander validation IA
```

#### Mise à Jour
```typescript
'update_workspace'          // Mettre à jour workspace
'update_procedure'          // Mettre à jour procédure
'update_priority'           // Changer priorité
'update_status'             // Changer statut
```

#### Système
```typescript
'log_event'                 // Logger événement
'execute_webhook'           // Appeler webhook externe
'wait'                      // Attendre (délai)
```

**📖 Voir la liste complète des 40+ actions dans [WORKFLOW_CONDITIONNEL_AVANCE.md](./WORKFLOW_CONDITIONNEL_AVANCE.md#catalogue-des-actions)**

### 🧮 Conditions (15 opérateurs)

Les conditions déterminent si une règle doit s'exécuter.

#### Opérateurs de Comparaison
```typescript
'equals'                    // field === value
'not_equals'                // field !== value
'greater_than'              // field > value
'less_than'                 // field < value
'greater_or_equal'          // field >= value
'less_or_equal'             // field <= value
```

#### Opérateurs de Chaînes
```typescript
'contains'                  // field.includes(value)
'not_contains'              // !field.includes(value)
'starts_with'               // field.startsWith(value)
'ends_with'                 // field.endsWith(value)
'regex'                     // value.test(field)
```

#### Opérateurs de Tableaux
```typescript
'in_array'                  // value.includes(field)
'not_in_array'              // !value.includes(field)
```

#### Opérateurs d'Existence
```typescript
'exists'                    // field !== undefined && field !== null
'not_exists'                // field === undefined || field === null
```

### 🔗 Conditions Imbriquées (AND/OR)

Combinez les conditions avec `logicalOperator` :

```typescript
conditions: [
  {
    id: 'cond1',
    field: 'payload.priority',
    operator: 'equals',
    value: 'critical',
    logicalOperator: 'AND',      // Condition suivante doit être vraie
    nested: [
      {
        id: 'cond1_1',
        field: 'payload.daysRemaining',
        operator: 'less_than',
        value: 3,
        logicalOperator: 'OR',   // OU la condition suivante
        nested: [
          {
            id: 'cond1_1_1',
            field: 'payload.status',
            operator: 'equals',
            value: 'urgent'
          }
        ]
      }
    ]
  }
]
```

**Résultat :** `(priority === 'critical' AND (daysRemaining < 3 OR status === 'urgent'))`

### 🎨 Templates Dynamiques

Utilisez des variables dynamiques dans les paramètres d'action :

```typescript
{
  type: 'send_email',
  params: {
    to: '{{payload.clientEmail}}',
    subject: 'URGENT : {{payload.procedureType}}',
    body: `
      Bonjour {{payload.clientName}},
      
      Événement détecté : {{event.type}}
      Date : {{event.timestamp}}
      Priorité : {{payload.priority}}
      
      Tenant : {{context.tenantId}}
    `
  }
}
```

**Résolution automatique :**
- `{{event.xxx}}` → Données de l'événement
- `{{payload.xxx}}` → Données du payload
- `{{context.xxx}}` → Contexte d'exécution

### ⛓️ Cascade d'Actions

Chaque action peut déclencher d'autres workflows selon son résultat :

```typescript
{
  type: 'create_workspace',
  params: { /* ... */ },
  onSuccess: [
    {
      event: 'workspace:created',
      payload: { workspaceId: '{{result.id}}' }
    }
  ],
  onFailure: [
    {
      event: 'workspace:creation_failed',
      payload: { error: '{{error.message}}' }
    }
  ],
  onTimeout: [
    {
      event: 'workspace:creation_timeout',
      payload: { duration: '{{execution.duration}}' }
    }
  ]
}
```

**Profondeur illimitée** : Une cascade peut déclencher une cascade qui déclenche une cascade...

### 🤖 Validation IA (3 Niveaux d'Autonomie)

Le système respecte les niveaux d'autonomie définis dans la [Charte IA Juridique](../CHARTE_IA_JURIDIQUE.md) :

#### 🟢 Niveau GREEN (Confiance >= 0.8)
- **Auto-approbation** sans demander à l'IA
- Exécution immédiate
- Actions simples et sûres

#### 🟠 Niveau ORANGE (0.5 <= Confiance < 0.8)
- **Validation IA** via Ollama
- L'IA analyse le contexte et décide
- Actions semi-automatiques

#### 🔴 Niveau RED (Confiance < 0.5)
- **Validation humaine obligatoire**
- Action bloquée en attente
- Actions critiques/juridiques

```typescript
{
  type: 'send_email',
  requiresValidation: true,
  autonomyLevel: 'ORANGE',  // Demander validation IA
  aiValidation: {
    prompt: 'Analyser si cet email est approprié',
    model: 'llama3.2:latest',
    confidenceThreshold: 0.7
  },
  params: { /* ... */ }
}
```

---

## 🛠️ Exemples Pratiques

### Exemple 1 : Email Urgent → Création Workspace Complète

```typescript
import { workflowEngine } from '@/lib/workflows/advanced-workflow-engine';

workflowEngine.registerRule({
  id: 'rule_email_urgent_workspace',
  name: 'Email Urgent → Création Workspace',
  description: 'Création automatique workspace + procédure + alertes',
  enabled: true,
  priority: 100,
  
  trigger: {
    events: ['email:urgent'],
    conditions: [
      {
        id: 'cond_classification',
        field: 'payload.classification',
        operator: 'equals',
        value: 'ceseda'
      }
    ]
  },
  
  actions: [
    // 1. Créer workspace
    {
      id: 'action_create_workspace',
      type: 'create_workspace',
      name: 'Créer workspace client',
      params: {
        clientId: '{{payload.clientId}}',
        title: 'Espace {{payload.clientName}}',
        description: 'Créé automatiquement depuis email urgent',
        priority: 'critique',
        status: 'active'
      },
      // APRÈS SUCCÈS → Déclencher création de procédure
      onSuccess: [
        {
          event: 'workspace:created',
          payload: {
            workspaceId: '{{result.id}}',
            clientId: '{{payload.clientId}}',
            procedureType: '{{payload.extractedInfo.procedureType}}',
            notificationDate: '{{payload.extractedInfo.notificationDate}}',
            deadlineDate: '{{payload.extractedInfo.deadlineDate}}'
          }
        }
      ]
    },
    
    // 2. Créer alerte immédiate
    {
      id: 'action_create_alert',
      type: 'create_alert',
      name: 'Alerte email urgent',
      params: {
        alertType: 'email_urgent',
        severity: 'CRITICAL',
        title: 'Email CESEDA urgent reçu',
        message: 'Email de {{payload.clientName}} : {{payload.emailSubject}}',
        workspaceId: null  // Sera lié au workspace après création
      }
    },
    
    // 3. Notifier avocat
    {
      id: 'action_notify_lawyer',
      type: 'send_notification',
      name: 'Notifier avocat responsable',
      params: {
        recipientRole: 'ADMIN',
        title: '🚨 Email urgent CESEDA',
        message: 'Nouveau client {{payload.clientName}} - {{payload.emailSubject}}',
        priority: 'critical',
        actionUrl: '/lawyer/workspaces'
      }
    }
  ],
  
  executionMode: 'sequential',
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date(),
  executionCount: 0,
  successCount: 0,
  failureCount: 0
});
```

**Déclenchement :**
```typescript
await triggerWorkflowEvent(
  'email:urgent',
  'tenant_abc',
  {
    classification: 'ceseda',
    clientId: 'client_123',
    clientName: 'M. Jean DUBOIS',
    clientEmail: 'dubois@example.com',
    emailSubject: 'URGENT : Notification OQTF reçue',
    priority: 'critical',
    extractedInfo: {
      procedureType: 'OQTF',
      notificationDate: '2026-01-15',
      deadlineDate: '2026-01-17'
    }
  }
);
```

**Cascade déclenchée :**
1. ✅ Workspace créé → Événement `workspace:created`
2. ✅ Procédure créée (via règle séparée)
3. ✅ Échéances extraites
4. ✅ Alertes envoyées
5. ✅ Notifications push

### Exemple 2 : Document Upload → Analyse IA Automatique

```typescript
workflowEngine.registerRule({
  id: 'rule_document_ai_analysis',
  name: 'Document → Analyse IA',
  description: 'Analyse automatique document avec IA',
  enabled: true,
  priority: 80,
  
  trigger: {
    events: ['document:uploaded']
  },
  
  actions: [
    // 1. Analyser avec IA
    {
      id: 'action_analyze',
      type: 'analyze_with_ai',
      name: 'Analyser contenu document',
      params: {
        content: '{{payload.documentContent}}',
        analysisType: 'document_classification',
        model: 'llama3.2:latest'
      },
      // APRÈS ANALYSE → Classifier
      onSuccess: [
        {
          event: 'document:analyzed',
          payload: {
            documentId: '{{payload.documentId}}',
            analysis: '{{result}}',
            confidence: '{{result.confidence}}'
          }
        }
      ]
    },
    
    // 2. Logger événement
    {
      id: 'action_log',
      type: 'log_event',
      name: 'Logger upload',
      params: {
        message: 'Document {{payload.filename}} uploadé et analysé',
        level: 'info',
        data: {
          documentId: '{{payload.documentId}}',
          workspaceId: '{{payload.workspaceId}}'
        }
      }
    }
  ],
  
  executionMode: 'parallel',
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date(),
  executionCount: 0,
  successCount: 0,
  failureCount: 0
});
```

### Exemple 3 : Échéance Critique → Escalade Multi-Niveaux

```typescript
workflowEngine.registerRule({
  id: 'rule_deadline_escalation',
  name: 'Échéance → Escalade Multi-Niveaux',
  description: 'Alertes selon gravité (7j → 3j → 1j)',
  enabled: true,
  priority: 95,
  
  trigger: {
    events: ['deadline:approaching'],
    conditions: [
      {
        id: 'cond_critical',
        field: 'payload.daysRemaining',
        operator: 'less_or_equal',
        value: 3
      }
    ]
  },
  
  actions: [
    // 1. Créer alerte critique
    {
      id: 'action_alert_critical',
      type: 'create_alert',
      name: 'Alerte échéance critique',
      params: {
        alertType: 'deadline_critical',
        severity: 'CRITICAL',
        title: 'Échéance dans {{payload.daysRemaining}} jours',
        message: '{{payload.deadlineTitle}} - {{payload.deadlineDate}}',
        workspaceId: '{{payload.workspaceId}}',
        deadline: '{{payload.deadlineDate}}'
      }
    },
    
    // 2. Email immédiat
    {
      id: 'action_email',
      type: 'send_email',
      name: 'Email urgent avocat',
      params: {
        to: '{{payload.responsableEmail}}',
        subject: '🚨 URGENT : Échéance {{payload.deadlineTitle}}',
        body: `
          Échéance critique dans {{payload.daysRemaining}} jours !
          
          Type : {{payload.deadlineType}}
          Date limite : {{payload.deadlineDate}}
          Workspace : {{payload.workspaceId}}
        `,
        priority: 'high'
      }
    },
    
    // 3. Notification push
    {
      id: 'action_notification',
      type: 'send_notification',
      name: 'Notification push',
      params: {
        recipientId: '{{payload.responsableId}}',
        title: '🚨 Échéance critique',
        message: '{{payload.deadlineTitle}} dans {{payload.daysRemaining}} jours',
        priority: 'critical',
        actionUrl: '/lawyer/workspaces/{{payload.workspaceId}}'
      }
    },
    
    // 4. SMS si < 24h
    {
      id: 'action_sms',
      type: 'send_sms',
      name: 'SMS si < 24h',
      conditions: [
        {
          id: 'cond_ultra_critical',
          field: 'payload.daysRemaining',
          operator: 'less_or_equal',
          value: 1
        }
      ],
      params: {
        to: '{{payload.responsablePhone}}',
        message: 'URGENT : {{payload.deadlineTitle}} demain !'
      }
    }
  ],
  
  executionMode: 'sequential',
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date(),
  executionCount: 0,
  successCount: 0,
  failureCount: 0
});
```

---

## 🎛️ Modes d'Exécution

### Mode Séquentiel
```typescript
executionMode: 'sequential'
```
- Actions exécutées **une par une** dans l'ordre
- Utile quand une action dépend de la précédente
- Si une action échoue, les suivantes ne s'exécutent pas (sauf skip_on_error)

### Mode Parallèle
```typescript
executionMode: 'parallel'
```
- Toutes les actions s'exécutent **en même temps**
- Maximum de performance
- Utile pour actions indépendantes

### Mode Conditionnel
```typescript
executionMode: 'conditional'
```
- Chaque action a ses propres conditions
- Actions exécutées si leurs conditions sont vraies
- Utile pour logique complexe

---

## 📊 Monitoring & Statistiques

### Vérifier l'État du Système

```typescript
import { workflowEngine } from '@/lib/workflows/advanced-workflow-engine';

// Statistiques globales
const stats = workflowEngine.getStats();
console.log(stats);
// {
//   totalRules: 15,
//   enabledRules: 12,
//   totalExecutions: 245,
//   successRate: 0.96
// }

// Liste des règles
const rules = workflowEngine.getRules();
console.log(rules);

// Règles par événement
const emailRules = workflowEngine.getRulesByEvent('email:urgent');
console.log(emailRules);
```

### Historique d'Exécutions

```typescript
// Récupérer les 10 dernières exécutions
const history = workflowEngine.getExecutionHistory(10);

for (const execution of history) {
  console.log(`
    ID: ${execution.id}
    Rule: ${execution.ruleName}
    Status: ${execution.status}
    Duration: ${execution.duration}ms
    Actions: ${execution.results.length}
    Success: ${execution.results.filter(r => r.status === 'success').length}
    Failed: ${execution.results.filter(r => r.status === 'failed').length}
  `);
}
```

---

## 🔧 Configuration Avancée

### Désactiver/Activer une Règle

```typescript
// Désactiver
workflowEngine.disableRule('rule_email_urgent_workspace');

// Activer
workflowEngine.enableRule('rule_email_urgent_workspace');
```

### Supprimer une Règle

```typescript
workflowEngine.removeRule('rule_test_123');
```

### Charger Règles depuis Fichier

```typescript
// Charger règles depuis JSON
const rules = await loadRulesFromFile('./workflows.json');
rules.forEach(rule => workflowEngine.registerRule(rule));
```

### Sauvegarder Règles

```typescript
const rules = workflowEngine.getRules();
await saveRulesToFile('./workflows.json', rules);
```

---

## 🧪 Tests & Validation

### Tester une Règle Spécifique

```typescript
// Créer règle de test
workflowEngine.registerRule({
  id: 'test_rule',
  name: 'Test',
  enabled: true,
  priority: 50,
  trigger: {
    events: ['test:event']
  },
  actions: [
    {
      id: 'action_test',
      type: 'log_event',
      params: {
        message: 'Test réussi !',
        data: { test: true }
      }
    }
  ],
  executionMode: 'sequential',
  createdBy: 'test',
  createdAt: new Date(),
  updatedAt: new Date(),
  executionCount: 0,
  successCount: 0,
  failureCount: 0
});

// Déclencher
const executions = await triggerWorkflowEvent('test:event', 'tenant_test', {});

// Vérifier
console.assert(executions.length === 1, 'Une exécution attendue');
console.assert(executions[0].status === 'completed', 'Exécution complétée');
```

### Simuler Échec d'Action

```typescript
{
  type: 'send_email',
  params: { /* ... */ },
  retries: 3,           // Réessayer 3 fois
  timeout: 5000,        // Timeout 5 secondes
  skip_on_error: true,  // Continuer même si échec
  onFailure: [
    {
      event: 'email:send_failed',
      payload: {
        error: '{{error.message}}',
        retries: '{{execution.retries}}'
      }
    }
  ]
}
```

---

## 🚨 Troubleshooting

### Règle Ne Se Déclenche Pas

**Vérifier :**
1. ✅ Règle activée (`enabled: true`)
2. ✅ Événement correspond (`events` dans trigger)
3. ✅ Conditions validées (vérifier payload)
4. ✅ Priorité correcte (règles haute priorité d'abord)

**Debug :**
```typescript
const rules = workflowEngine.getRulesByEvent('email:urgent');
console.log('Règles pour email:urgent:', rules);

// Tester conditions manuellement
const event = { type: 'email:urgent', /* ... */ };
const matches = rules.filter(rule => 
  workflowEngine.evaluateConditions(rule.trigger.conditions, event, {})
);
console.log('Règles qui matchent:', matches);
```

### Action Échoue Toujours

**Vérifier :**
1. ✅ Paramètres corrects (templates résolus)
2. ✅ Dépendances disponibles (Prisma, Ollama)
3. ✅ Timeout suffisant
4. ✅ Validation IA configurée

**Debug :**
```typescript
// Activer logs détaillés
process.env.DEBUG = 'workflow:*';

// Vérifier résolution templates
const resolved = workflowEngine.resolveTemplates(
  action.params,
  event,
  payload,
  context
);
console.log('Paramètres résolus:', resolved);
```

### Cascade Infinie

**Protection intégrée :**
- Profondeur max : 10 niveaux
- Timeout global : 30 secondes
- Détection de boucles

**Vérifier :**
```typescript
// Une action ne doit pas déclencher l'événement qui l'a créée
{
  type: 'create_workspace',
  onSuccess: [
    {
      event: 'workspace:created',  // ✅ OK - Événement différent
      payload: { /* ... */ }
    }
  ]
}

// ❌ INTERDIT - Boucle infinie
{
  type: 'create_workspace',
  onSuccess: [
    {
      event: 'email:urgent',  // ❌ Événement qui a déclenché cette règle
      payload: { /* ... */ }
    }
  ]
}
```

---

## 📖 Ressources

- **Documentation Complète :** [WORKFLOW_CONDITIONNEL_AVANCE.md](./WORKFLOW_CONDITIONNEL_AVANCE.md)
- **Code Source :** [advanced-workflow-engine.ts](../src/lib/workflows/advanced-workflow-engine.ts)
- **Tests :** [test-workflow-cascade.ts](../scripts/test-workflow-cascade.ts)
- **Charte IA :** [CHARTE_IA_JURIDIQUE.md](../CHARTE_IA_JURIDIQUE.md)

---

## 🎓 Formation

### Niveau Débutant (1h)
1. Lire ce guide
2. Lancer `npm run workflow:test`
3. Observer les résultats
4. Modifier les règles pré-définies

### Niveau Intermédiaire (3h)
1. Créer sa première règle personnalisée
2. Tester avec conditions complexes
3. Implémenter cascade d'actions
4. Intégrer validation IA

### Niveau Avancé (1 jour)
1. Créer workflow complet multi-étapes
2. Optimiser performance (parallèle vs séquentiel)
3. Implémenter logique métier complexe
4. Créer dashboard de monitoring

---

## 💡 Bonnes Pratiques

### ✅ À FAIRE

1. **Nommer clairement** les règles et actions
2. **Documenter** le but de chaque règle
3. **Tester** chaque règle individuellement
4. **Logger** les actions importantes
5. **Gérer les erreurs** avec onFailure
6. **Limiter la profondeur** des cascades (< 5 niveaux)
7. **Utiliser les templates** pour flexibilité
8. **Valider avec IA** les actions critiques

### ❌ À ÉVITER

1. **Règles trop génériques** (matchent tout)
2. **Conditions trop complexes** (difficiles à débugger)
3. **Cascades infinies** (toujours tester)
4. **Actions sans timeout** (peuvent bloquer)
5. **Ignorer les erreurs** (toujours logger)
6. **Règles en doublon** (vérifier avant d'ajouter)
7. **Pas de validation** pour actions critiques
8. **Oublier les retries** pour actions réseau

---

## 🎯 Cas d'Usage Métier

### Cabinet d'Avocat CESEDA

#### 1. Onboarding Client Automatique
- Email reçu → Créer workspace → Envoyer formulaire → Planifier RDV

#### 2. Gestion Échéances OQTF
- Échéance détectée → Alerter avocat → Préparer documents → Rappeler client

#### 3. Analyse Documents
- Upload passeport → Extraire données → Vérifier validité → Logger événement

#### 4. Suivi Procédures
- Statut changé → Notifier client → Mettre à jour timeline → Envoyer facture

### Multi-Tenant SaaS

#### 1. Onboarding Nouveau Tenant
- Tenant créé → Configurer plan → Créer admin → Envoyer bienvenue

#### 2. Monitoring Limites
- Quota atteint → Alerter admin → Proposer upgrade → Bloquer si nécessaire

#### 3. Support Client
- Ticket créé → Classifier urgence → Assigner agent → Notifier équipe

---

**🎉 Vous êtes prêt à utiliser le système de workflow conditionnel avancé !**

**Commencez par :** `npm run workflow:test`

*Documentation créée le 7 janvier 2026*
