# 📋 Guide Logging - IA POSTE MANAGER

**Logging spécialisé pour cabinet d'avocats CESEDA**

---

## 🎯 Philosophie

Le système de logging d'IA Poste Manager est conçu pour:

1. **Conformité déontologique** - Traçabilité complète des actions
2. **Conformité RGPD** - Anonymisation automatique des données personnelles
3. **Audit juridique** - Logs inaltérables (append-only)
4. **Transparence IA** - Toutes les actions IA sont tracées
5. **Alertes critiques** - Délais OQTF < 48h, échéances urgentes

---

## 📚 Fonctions Spécialisées

### 1. Actions sur Dossiers CESEDA

```typescript
import { logDossierAction } from '@/lib/logger';

// Création de dossier OQTF
logDossierAction(
  'CREATE_DOSSIER',
  userId,
  tenantId,
  dossierId,
  {
    typeDossier: 'OQTF',
    clientId: 'client-123',
    documentName: 'Decision_OQTF.pdf'
  }
);

// Ajout de document
logDossierAction(
  'ADD_DOCUMENT',
  userId,
  tenantId,
  dossierId,
  {
    documentName: 'Passeport.pdf',
    typeDossier: 'OQTF'
  }
);

// Génération de recours par IA
logDossierAction(
  'GENERATE_RECOURS',
  userId,
  tenantId,
  dossierId,
  {
    typeDossier: 'OQTF',
    aiGenerated: true,
    modelUsed: 'gpt-4'
  }
);
```

### 2. Alertes Délais Critiques

```typescript
import { logDeadlineCritique } from '@/lib/logger';

// Délai OQTF critique (< 48h)
logDeadlineCritique(
  dossierId,
  tenantId,
  {
    type: 'Recours OQTF',
    date: new Date('2026-01-05'),
    heuresRestantes: 36,
    typeDossier: 'OQTF'
  }
);
// → Log niveau CRITICAL + alerte immédiate

// Délai urgent (< 7 jours)
logDeadlineCritique(
  dossierId,
  tenantId,
  {
    type: 'Appel CAA',
    date: new Date('2026-01-08'),
    heuresRestantes: 120,
    typeDossier: 'REFUS_TITRE'
  }
);
// → Log niveau ERROR (urgent)
```

### 3. Utilisation IA (Transparence)

```typescript
import { logIAUsage } from '@/lib/logger';

// Analyse de document par IA
logIAUsage(
  'ANALYSIS',
  userId,
  tenantId,
  dossierId,
  {
    inputType: 'Decision_OQTF.pdf',
    outputType: 'Checklist OQTF',
    confidence: 0.95,
    modelUsed: 'gpt-4-vision',
    extractedDeadlines: 2
  }
);

// Suggestion IA pour checklist
logIAUsage(
  'CHECKLIST',
  userId,
  tenantId,
  dossierId,
  {
    workspaceType: 'OQTF',
    itemsGenerated: 15,
    itemsMissing: 3,
    confidence: 0.88
  }
);

// Génération de brouillon
logIAUsage(
  'GENERATION',
  userId,
  tenantId,
  dossierId,
  {
    documentType: 'Recours contentieux',
    templateUsed: 'OQTF_sans_delai',
    wordsGenerated: 1500
  }
);
```

### 4. Conformité RGPD

```typescript
import { logRGPDAction } from '@/lib/logger';

// Export de données personnelles (droit d'accès)
logRGPDAction(
  'EXPORT_DATA',
  userId,
  tenantId,
  clientId,
  {
    dataType: 'Tous dossiers',
    format: 'PDF',
    reason: 'Demande client Article 15 RGPD'
  }
);

// Anonymisation de données (après clôture)
logRGPDAction(
  'ANONYMIZE',
  userId,
  tenantId,
  clientId,
  {
    dossiersCount: 3,
    reason: 'Clôture dossier + 5 ans'
  }
);

// Suppression données personnelles (droit à l'oubli)
logRGPDAction(
  'DELETE_PERSONAL_DATA',
  userId,
  tenantId,
  clientId,
  {
    dataType: 'Identité + documents',
    reason: 'Demande client Article 17 RGPD'
  }
);
```

### 5. Audit Juridique Standard

```typescript
import { logger } from '@/lib/logger';

// Audit trail pour toute action sensible
logger.audit(
  'PERMISSION_DENIED',
  userId,
  tenantId,
  {
    attemptedAction: 'DELETE_DOSSIER',
    dossierId: 'dos-123',
    reason: 'User role: CLIENT, required: ADMIN'
  }
);

logger.audit(
  'EXPORT_DOSSIER',
  userId,
  tenantId,
  {
    dossierId: 'dos-123',
    format: 'PDF',
    includeDocuments: true
  }
);
```

---

## 🔒 Conformité RGPD Automatique

### Données Masquées Automatiquement

**Données techniques:**
- `password` → `[REDACTED]`
- `token` → `[REDACTED]`
- `apiKey` → `[REDACTED]`
- `secret` → `[REDACTED]`

**Données personnelles (sauf audit juridique explicite):**
- `nom`, `prenom` → `[DONNÉES PERSONNELLES]`
- `telephone` → `[DONNÉES PERSONNELLES]`
- `adresse` → `[DONNÉES PERSONNELLES]`
- `numeroPasseport` → `[DONNÉES PERSONNELLES]`
- `dateNaissance` → `[DONNÉES PERSONNELLES]`
- `email` → `***@domaine.com` (domaine préservé)

### Exemple

```typescript
logger.info('Client créé', {
  nom: 'Dupont',           // → [DONNÉES PERSONNELLES]
  prenom: 'Jean',          // → [DONNÉES PERSONNELLES]
  email: 'j.dupont@mail.fr', // → ***@mail.fr
  telephone: '0601020304', // → [DONNÉES PERSONNELLES]
  tenantId: 'cabinet-001'  // → OK (pas sensible)
});

// Log sauvegardé:
{
  "nom": "[DONNÉES PERSONNELLES]",
  "email": "***@mail.fr",
  "tenantId": "cabinet-001",
  "rgpdCompliant": true
}
```

---

## 📊 Types d'Actions Juridiques

```typescript
type ActionJuridique = 
  | 'CREATE_DOSSIER'         // Création nouveau dossier
  | 'UPDATE_DOSSIER'         // Modification dossier
  | 'DELETE_DOSSIER'         // Suppression dossier
  | 'ADD_DOCUMENT'           // Ajout document
  | 'DELETE_DOCUMENT'        // Suppression document
  | 'CREATE_DEADLINE'        // Création échéance
  | 'UPDATE_DEADLINE'        // Modification échéance
  | 'GENERATE_RECOURS'       // Génération recours (IA)
  | 'SEND_EMAIL_CLIENT'      // Email client
  | 'EXPORT_DOSSIER'         // Export dossier
  | 'AI_ANALYSIS'            // Analyse IA
  | 'AI_SUGGESTION'          // Suggestion IA
  | 'CHECKLIST_UPDATE'       // MAJ checklist
  | 'WORKSPACE_CHANGE'       // Changement workspace
  | 'USER_LOGIN'             // Connexion utilisateur
  | 'USER_LOGOUT'            // Déconnexion
  | 'PERMISSION_DENIED'      // Accès refusé
  | 'COMPLIANCE_CHECK';      // Vérification conformité

type TypeDossier = 
  | 'OQTF'                   // Obligation de Quitter le Territoire
  | 'REFUS_TITRE'            // Refus de titre de séjour
  | 'RETRAIT_TITRE'          // Retrait de titre
  | 'NATURALISATION'         // Demande naturalisation
  | 'REGROUPEMENT_FAMILIAL'  // Regroupement familial
  | 'AUTRE';                 // Autre type
```

---

## 🚨 Alertes Délais

### Niveaux de Sévérité

| Heures restantes | Sévérité | Niveau log | Action |
|-----------------|----------|------------|---------|
| **< 48h** | CRITIQUE | critical | Alerte immédiate (email + SMS) |
| **< 168h (7j)** | URGENT | error | Notification urgente |
| **> 168h** | RAPPEL | warn | Rappel standard |

### Cas d'Usage OQTF

```typescript
// OQTF avec délai de départ volontaire (30 jours)
// J-2 avant expiration → CRITIQUE
logDeadlineCritique(dossierId, tenantId, {
  type: 'Délai départ volontaire OQTF',
  date: dateExpiration,
  heuresRestantes: 36,
  typeDossier: 'OQTF'
});
// → 🚨 Alerte avocat + client immédiatement

// OQTF sans délai → recours TA 48h
// J-1 avant expiration → CRITIQUE
logDeadlineCritique(dossierId, tenantId, {
  type: 'Recours TA OQTF sans délai',
  date: dateNotification.addHours(48),
  heuresRestantes: 24,
  typeDossier: 'OQTF'
});
```

---

## 🤖 Transparence IA

### Principe Déontologique

> **L'avocat reste seul décisionnaire. L'IA assiste, ne décide jamais.**

Chaque action IA est tracée avec:
- Type d'opération (analyse, suggestion, génération)
- Modèle utilisé (GPT-4, Claude, etc.)
- Niveau de confiance (0-1)
- Données anonymisées (oui/non)
- Input/Output types

### Exemple Complet

```typescript
// 1. IA analyse un document OQTF
logIAUsage('ANALYSIS', userId, tenantId, dossierId, {
  inputType: 'PDF - Décision OQTF',
  outputType: 'Checklist structurée',
  confidence: 0.92,
  modelUsed: 'gpt-4-vision-preview',
  pagesAnalyzed: 5,
  deadlinesExtracted: 2,
  dataAnonymized: true
});

// 2. IA suggère pièces manquantes
logIAUsage('SUGGESTION', userId, tenantId, dossierId, {
  suggestionsCount: 8,
  itemsAlreadyPresent: 3,
  itemsMissing: 5,
  confidence: 0.88,
  workspaceType: 'OQTF'
});

// 3. Avocat valide et IA génère le brouillon
logDossierAction('GENERATE_RECOURS', userId, tenantId, dossierId, {
  aiGenerated: true,
  templateUsed: 'OQTF_avec_delai_30j',
  sectionsGenerated: ['Faits', 'Droit', 'Prétentions'],
  wordsCount: 1800,
  requiresLawyerReview: true // Toujours vrai
});
```

---

## 📈 Monitoring Production

### Variables d'Environnement

```bash
# .env.production
NODE_ENV=production

# Monitoring (optionnel)
SENTRY_DSN=https://...
DATADOG_API_KEY=xxx
SLACK_WEBHOOK_CRITICAL=https://hooks.slack.com/...

# Alerting email
SMTP_HOST=smtp.cabinet-avocat.fr
ALERT_EMAIL=avocat@cabinet.fr
```

### Intégrations Prêtes

Le logger est pré-configuré pour:
- **Sentry** - Error tracking
- **DataDog** - APM & Logs
- **CloudWatch** - AWS Logs
- **Slack** - Alertes critiques
- **Email** - Notifications délais

Activation: Décommenter dans `sendToMonitoring()` et `sendCriticalAlert()`

---

## 💡 Best Practices

### ✅ À FAIRE

```typescript
// Log avec contexte structuré
logDossierAction('CREATE_DOSSIER', userId, tenantId, dossierId, {
  typeDossier: 'OQTF',
  workspaceCreated: true,
  initialDocuments: 3
});

// Audit trail systématique
logger.audit('USER_LOGIN', userId, tenantId, {
  ip: request.ip,
  userAgent: request.headers['user-agent']
});

// Alertes délais automatiques
if (heuresRestantes < 48) {
  logDeadlineCritique(dossierId, tenantId, deadlineInfo);
}
```

### ❌ À ÉVITER

```typescript
// ❌ Ne jamais logger de données brutes sensibles
logger.info('Client créé', {
  nom: client.nom,              // ❌ Sera masqué automatiquement
  numeroPasseport: client.passport  // ❌ Sera masqué
});

// ❌ Ne pas utiliser console.log directement
console.log('Dossier créé:', dossier); // ❌ Non tracé, non structuré

// ✅ Utiliser le logger
logDossierAction('CREATE_DOSSIER', userId, tenantId, dossierId);
```

---

## 🎯 Checklist Migration

Lors de l'ajout de nouvelles fonctionnalités:

- [ ] Remplacer `console.log` par `logger.info/debug`
- [ ] Utiliser `logDossierAction()` pour actions métier
- [ ] Ajouter `logIAUsage()` pour toute utilisation IA
- [ ] Implémenter `logDeadlineCritique()` pour échéances
- [ ] Tracer RGPD avec `logRGPDAction()`
- [ ] Audit trail avec `logger.audit()` pour actions sensibles
- [ ] Vérifier anonymisation données personnelles

---

**IA Poste Manager - Logging Juridique Professionnel**  
*Conformité RGPD • Audit Inaltérable • Transparence IA*
