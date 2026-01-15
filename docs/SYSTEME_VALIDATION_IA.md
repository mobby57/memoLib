# 🤖 Système de Validation IA - IA Poste Manager

## 📋 Vue d'ensemble

Le système de validation IA implémente une approche **juridiquement conforme** pour l'assistance automatisée dans la gestion de dossiers juridiques. Basé sur la **CHARTE_IA_JURIDIQUE**, ce système garantit que :

- ✅ **L'IA prépare, l'humain décide**
- ✅ Aucune décision juridique n'est prise automatiquement
- ✅ Toutes les actions sensibles nécessitent une validation humaine
- ✅ Traçabilité complète de toutes les opérations

## 🎯 Principe Fondamental

> **IA Poste Manager est un assistant juridique digital de premier niveau, PAS un avocat.**

Le système fonctionne selon 3 niveaux d'autonomie basés sur le risque juridique :

### 🟢 Niveau GREEN (Autonomie Complète)
**Actions automatiques sans validation humaine**

- ✓ Tri et classification des emails
- ✓ Analyse de type de dossier
- ✓ Création de workspace structuré
- ✓ Alertes de délais et échéances

**Critères** : Confiance ≥ 85% + Aucune implication juridique

### 🟠 Niveau ORANGE (Validation Requise)
**Actions nécessitant approbation avant exécution**

- ⚠️ Génération de formulaires de collecte
- ⚠️ Création de brouillons de documents
- ⚠️ Rédaction de courriers simples
- ⚠️ Détection d'alertes complexes

**Critères** : Confiance 70-85% OU Contenu visible par le client

### 🔴 Niveau RED (Décision Humaine Obligatoire)
**L'IA propose, l'humain décide**

- 🚨 Stratégies juridiques
- 🚨 Conseils juridiques
- 🚨 Choix de procédures
- 🚨 Envoi de documents au client

**Critères** : Impact juridique direct OU Représentation du cabinet

## 🏗️ Architecture du Système

### Composants Principaux

```
src/
├── lib/
│   ├── services/
│   │   └── aiService.ts          # Service principal d'IA (Ollama)
│   └── templates/
│       └── documents.ts           # Templates pré-validés
├── components/
│   ├── ValidationQueue.tsx        # UI pour valider les actions
│   └── AlertCenter.tsx            # Centre d'alertes intelligentes
├── hooks/
│   └── useValidation.ts           # Hook React pour validation
└── app/
    ├── dashboard/
    │   └── page.tsx               # Dashboard principal
    ├── demo/
    │   └── page.tsx               # Page de démonstration
    └── api/
        └── tenant/[id]/
            ├── ai-actions/        # API des actions IA
            ├── alerts/            # API des alertes
            └── dashboard/         # API des statistiques
```

### Base de Données (Prisma)

```prisma
model AIAction {
  id                String           # UUID unique
  tenantId          String           # Tenant propriétaire
  actionType        AIActionType     # Type d'action (EMAIL_TRIAGE, etc.)
  autonomyLevel     AutonomyLevel    # GREEN/ORANGE/RED
  validationStatus  ValidationStatus # PENDING/APPROVED/REJECTED
  confidence        Float            # Score de confiance (0-1)
  rationale         String           # Justification de l'IA
  input             Json             # Données d'entrée
  output            Json?            # Résultat de l'action
  validatedBy       String?          # ID de l'utilisateur validateur
  validatedAt       DateTime?        # Date de validation
  validationComment String?          # Commentaire de validation
  createdAt         DateTime         # Date de création
}

model Alert {
  id               String        # UUID unique
  tenantId         String        # Tenant propriétaire
  type             AlertType     # DEADLINE/DOCUMENT/PAYMENT/OTHER
  severity         UrgencyLevel  # CRITICAL/ALERT/WARNING/INFO
  message          String        # Message de l'alerte
  dossierId        String?       # Dossier concerné
  deadline         DateTime?     # Échéance associée
  suggestedActions String[]      # Actions suggérées
  read             Boolean       # Lu/non lu
  snoozedUntil     DateTime?     # Report d'alerte
}
```

## 🚀 Utilisation

### 1. Démarrer les Services

```bash
# 1. Démarrer Ollama (IA locale)
ollama serve

# 2. Vérifier que le modèle est disponible
ollama pull llama3.2:latest

# 3. Démarrer Next.js
npm run dev

# 4. Accéder à l'application
# - Dashboard: http://localhost:3000/dashboard
# - Démo: http://localhost:3000/demo
```

### 2. Tester la Connexion Ollama

```bash
# Script de test de connexion
npx tsx scripts/test-ollama.ts
```

### 3. Tester le Workflow Complet

```bash
# Script de test du workflow IA
npx tsx scripts/test-ai-workflow.ts
```

## 📊 Workflow Typique

### Exemple : Réception d'un Email Client

```typescript
// 1. Triage automatique (GREEN)
const triage = await aiService.triageEmail(
  emailContent,
  emailSubject
);
// ➜ Confiance: 92% → AUTO-APPROUVÉ
// ➜ Type détecté: "Régularisation par le travail"

// 2. Analyse du dossier (GREEN)
const analysis = await aiService.analyzeCaseType(caseDescription);
// ➜ Workspace créé automatiquement
// ➜ Documents requis listés

// 3. Génération de formulaire (ORANGE)
const form = await aiService.generateCollectionForm(caseType, existingInfo);
// ➜ Confiance: 78% → VALIDATION REQUISE
// ➜ Ajouté à la file de validation

// 4. Validation humaine
// L'utilisateur voit le formulaire dans ValidationQueue
// ➜ Approuve / Rejette / Modifie

// 5. Génération de brouillon (ORANGE)
const draft = await aiService.generateDraft(templateId, variables);
// ➜ Utilise un template pré-validé
// ➜ Validation requise avant envoi

// 6. Décision d'envoi (RED)
const options = await aiService.proposeOptions(context);
// ➜ Présente les options possibles
// ➜ AUCUNE décision automatique
// ➜ Validation OBLIGATOIRE
```

## 🔒 Sécurité et Conformité

### Formulations Interdites

Le système refuse automatiquement ces formulations :

❌ **INTERDIT**
- "Vous devez"
- "Je vous conseille"
- "Je recommande"
- "Il faut"
- "Vous êtes obligé de"

✅ **AUTORISÉ**
- "Il serait possible de"
- "Une option serait"
- "Selon la réglementation"
- "D'après les informations fournies"

### Audit et Traçabilité

Chaque action IA est tracée :

```typescript
// Création automatique d'un log d'audit
{
  actionId: "uuid-action",
  userId: "user-123",
  action: "VALIDATE_AI_ACTION",
  entityType: "AIAction",
  entityId: "uuid-action",
  changes: {
    validationStatus: "APPROVED",
    comment: "Formulaire conforme aux exigences"
  },
  createdAt: "2026-01-01T12:00:00Z"
}
```

## 📖 Documentation

- **[ROLE_FONDATEUR.md](../docs/ROLE_FONDATEUR.md)** : Définition du rôle de l'IA
- **[CHARTE_IA_JURIDIQUE.md](../docs/CHARTE_IA_JURIDIQUE.md)** : Charte opérationnelle complète
- **[SYSTEM_PROMPTS.md](../docs/prompts/SYSTEM_PROMPTS.md)** : Prompts système pour Ollama

## 🧪 Tests

### Test de Connexion Ollama
```bash
npx tsx scripts/test-ollama.ts
```

**Vérifie :**
- ✓ Serveur Ollama accessible
- ✓ Modèle llama3.2:latest disponible
- ✓ Respect des prompts système
- ✓ Absence de formulations interdites

### Test du Workflow Complet
```bash
npx tsx scripts/test-ai-workflow.ts
```

**Teste :**
- ✓ Triage d'email (GREEN)
- ✓ Analyse de dossier (GREEN)
- ✓ Génération de formulaire (ORANGE)
- ✓ Génération de brouillon (ORANGE)
- ✓ Détection d'alertes (ORANGE)
- ✓ Proposition d'options (RED)

### Page de Démonstration
```
http://localhost:3000/demo
```

**Permet de :**
- Tester les API en temps réel
- Créer des actions de test
- Visualiser les résultats JSON
- Vérifier la file de validation

## 🎯 Métriques de Performance

Le système collecte automatiquement :

- **Taux d'adoption IA** : Actions auto-approuvées / Total actions
- **Confiance moyenne** : Moyenne des scores de confiance
- **Temps de traitement** : Durée moyenne par action
- **Taux de rejet** : Actions rejetées / Total validations

Consultez les métriques dans le dashboard : `/dashboard`

## 🚨 Alertes Intelligentes

Le système génère des alertes automatiques pour :

### Alertes de Délai (DEADLINE)
- Échéance dans moins de 7 jours
- Échéance dans moins de 48h (CRITIQUE)

### Alertes de Document (DOCUMENT)
- Documents manquants détectés
- Documents expirés

### Alertes de Paiement (PAYMENT)
- Factures impayées > 30 jours

### Alertes Système (OTHER)
- Anomalies détectées
- Incohérences de données

## 🛠️ Configuration

### Variables d'Environnement

```bash
# .env.local
DATABASE_URL="file:./dev.db"
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2:latest"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### Modèles Ollama Recommandés

- **Production** : `llama3.2:latest` (équilibré)
- **Rapide** : `llama3.2:1b` (réponses rapides)
- **Précis** : `llama3.1:8b` (haute qualité)

## 📈 Prochaines Étapes

- [ ] Tests end-to-end complets
- [ ] Migration SQLite → PostgreSQL
- [ ] Rate limiting pour Ollama
- [ ] Monitoring avec Application Insights
- [ ] Export des métriques vers Grafana
- [ ] CI/CD avec GitHub Actions

## 🤝 Contribution

Le système est conçu pour être extensible. Pour ajouter un nouveau type d'action :

1. Ajouter le type dans `src/types/index.ts`
2. Créer le prompt système dans `docs/prompts/SYSTEM_PROMPTS.md`
3. Implémenter la méthode dans `aiService.ts`
4. Définir les règles de validation dans la charte
5. Ajouter les tests correspondants

## 📄 Licence

Propriété de **IA Poste Manager**  
Tous droits réservés © 2026

---

**🎉 Le système de validation IA est opérationnel et conforme à la charte juridique !**
