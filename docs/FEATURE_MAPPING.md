# 🧩 MAPPING FONCTIONNALITÉS → MODULES EXISTANTS

Document de correspondance entre les **9 fonctionnalités produit** et **l'architecture technique actuelle**.

---

## 📊 MATRICE DE CORRESPONDANCE

| #     | Fonctionnalité Produit              | Existant ? | Modules Backend                                                                                                  | Modules Frontend                                                                      | Gap à combler                                                     |
| ----- | ----------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **1** | **Monitoring des flux (ingestion)** | ✅ 70%     | `src/lib/email/gmail-monitor.ts`<br>`scripts/email-monitor-integrated.ts`<br>`backend-python/app.py` (endpoints) | `src/app/emails/page.tsx`<br>`src/app/admin/email-monitoring/page.tsx`                | - Upload manuel horodaté<br>- Réception API déclarée              |
| **2** | **Normalisation**                   | ✅ 60%     | `src/lib/email/email-monitor-service.ts` (classifyEmail)<br>`src/lib/workflows/email-intelligence.ts`            | `src/app/api/emails/incoming/route.ts`                                                | - Hash cryptographique<br>- Système de versioning                 |
| **3** | **Traçabilité (EventLog immuable)** | ⚠️ 30%     | `src/lib/dev/advanced-logger.ts`<br>`src/backend/mvp_orchestrator.py` (log_event)                                | Timeline UI existe (`WorkspaceTimeline`)                                              | **MANQUANT** : EventLog DB table<br>**MANQUANT** : Audit trail UI |
| **4** | **Regroupement (Dossiers/Entités)** | ✅ 50%     | Prisma schema (Client, Dossier)<br>`src/lib/email/email-monitor-service.ts`                                      | `src/app/admin/dossiers/[id]/page.tsx`<br>`src/app/workspaces/[id]/page.tsx`          | - Suggestions IA automatiques<br>- Workflow validation humaine    |
| **5** | **Gestion doublons**                | ❌ 0%      | **INEXISTANT**                                                                                                   | **INEXISTANT**                                                                        | **TOUT À CRÉER**                                                  |
| **6** | **Supervision humaine**             | ✅ 40%     | Dashboard exists                                                                                                 | `src/app/admin/email-monitoring/page.tsx`<br>`src/app/lawyer/workspace/[id]/page.tsx` | - Alertes flux non classés<br>- Commentaires internes             |
| **7** | **Recherche & Relecture**           | ✅ 50%     | Prisma queries basiques                                                                                          | Filtres UI basiques                                                                   | - Recherche full-text avancée<br>- Historique explicable          |
| **8** | **Sécurité & Droits**               | ✅ 80%     | NextAuth + Azure AD<br>`src/frontend/app/api/auth/*`                                                             | Session management                                                                    | - Journal d'accès détaillé<br>- Rôles granulaires                 |
| **9** | **Valeur monétisable**              | 🧪 MVP     | Orchestration partielle                                                                                          | Dashboard basique                                                                     | - Métriques de valeur<br>- Preuves légales exportables            |

---

## 🔍 ANALYSE PAR FONCTIONNALITÉ

### 1️⃣ MONITORING DES FLUX (Ingestion)

**État actuel : 70% implémenté**

#### ✅ Ce qui existe

- Email monitoring via Gmail API (`src/lib/email/gmail-monitor.ts`)
- Polling toutes les 30s
- Parsing emails + attachments
- Sauvegarde Prisma (`Email` model)

#### Fichiers clés

```
src/lib/email/
├── gmail-monitor.ts          # Gmail API wrapper
├── email-monitor-service.ts  # Business logic
└── service.ts               # Email service abstraction

scripts/
├── email-monitor-integrated.ts  # Standalone monitoring
└── email-setup.ts              # Configuration wizard

backend-python/
└── app.py                      # Flask endpoints (health, auth)
```

#### ❌ Ce qui manque

1. **Upload manuel horodaté**
   - Interface de dépôt documentaire
   - Endpoint `/api/documents/upload`
   - Horodatage cryptographique

2. **Réception API déclarée**
   - Webhooks REST pour intégrations tierces
   - Documentation API publique

---

### 2️⃣ NORMALISATION

**État actuel : 60% implémenté**

#### ✅ Ce qui existe

- Classification IA (Ollama/LLaMA) dans `email-monitor-service.ts`
- Extraction métadonnées (from, to, subject, date)
- Workflow analysis (`src/lib/workflows/email-intelligence.ts`)

#### Fichiers clés

```
src/lib/workflows/
└── email-intelligence.ts    # analyzeEmail()

src/lib/email/
└── email-monitor-service.ts  # classifyEmail()

backend-python/
└── app.py                   # /api/ceseda/predict (IA)
```

#### ❌ Ce qui manque

1. **Hash cryptographique du contenu**
   - Fonction de hashing (SHA-256)
   - Stockage en DB (`contentHash` field)

2. **Système de versioning**
   - Table `DocumentVersion`
   - Historique des transformations

---

### 3️⃣ TRAÇABILITÉ (EventLog immuable)

**État actuel : 30% implémenté ⚠️ CRITIQUE**

#### ✅ Ce qui existe

- Logging applicatif (`advanced-logger.ts`)
- Timeline UI partielle (`WorkspaceTimeline` component)
- Quelques événements trackés (message_received)

#### Fichiers clés

```
src/lib/dev/
└── advanced-logger.ts       # Application logging

src/backend/
└── mvp_orchestrator.py      # log_event() method

src/app/workspaces/[id]/
└── page.tsx                 # Timeline UI
```

#### ❌ Ce qui manque **[PRIORITÉ ABSOLUE]**

1. **Table EventLog en base**

   ```prisma
   model EventLog {
     id          String   @id @default(cuid())
     timestamp   DateTime @default(now())
     eventType   String   // 'received', 'classified', 'assigned', etc.
     userId      String?
     entityId    String   // Email, Dossier, Document ID
     entityType  String   // 'email', 'dossier', 'document'
     metadata    Json
     immutable   Boolean  @default(true)
   }
   ```

2. **API d'audit**
   - `GET /api/audit/timeline/:entityId`
   - `GET /api/audit/user/:userId`

3. **UI d'audit complète**
   - Visualisation chronologique
   - Filtres par type/utilisateur/période
   - Export PDF pour preuves légales

---

### 4️⃣ REGROUPEMENT (Dossiers/Entités)

**État actuel : 50% implémenté**

#### ✅ Ce qui existe

- Modèles Prisma (`Client`, `Dossier`)
- Création dossier semi-automatique
- Association email → dossier

#### Fichiers clés

```
prisma/schema.prisma          # Client, Dossier models

src/lib/email/
└── email-monitor-service.ts  # Auto-linking logic

src/app/admin/dossiers/
└── [id]/page.tsx            # Dossier detail view
```

#### ❌ Ce qui manque

1. **Suggestions IA non contraignantes**
   - UI "Suggestion : associer au dossier #123 ?"
   - Confiance score (0-100%)

2. **Validation humaine explicite**
   - Workflow d'approbation
   - Historique des validations refusées

---

### 5️⃣ GESTION DOUBLONS

**État actuel : 0% ❌ INEXISTANT**

#### Ce qui manque **[PRIORITÉ HAUTE]**

1. **Détection doublons**
   - Algorithme similarité (Levenshtein pour noms)
   - Hash de fichiers identiques
   - Détection emails threads

2. **Table `Duplicate`**

   ```prisma
   model DuplicateAlert {
     id              String   @id @default(cuid())
     entity1Id       String
     entity2Id       String
     similarityScore Float    // 0.0 - 1.0
     type            String   // 'email', 'client', 'document'
     status          String   // 'pending', 'merged', 'dismissed'
     resolvedBy      String?
     resolvedAt      DateTime?
   }
   ```

3. **UI de résolution**
   - Vue côte-à-côte
   - Boutons "Fusionner" / "Ignorer"
   - Traçabilité de la décision

---

### 6️⃣ SUPERVISION HUMAINE

**État actuel : 40% implémenté**

#### ✅ Ce qui existe

- Dashboard admin basique
- Filtres emails (pending/processed)
- Actions manuelles (create dossier)

#### Fichiers clés

```
src/app/admin/email-monitoring/page.tsx
src/app/lawyer/workspace/[id]/page.tsx
```

#### ❌ Ce qui manque

1. **Système d'alertes**
   - Badge "X flux non classés"
   - Notifications push
   - Emails digest quotidien

2. **Commentaires internes**
   - Thread de discussion par flux
   - Mentions @utilisateur

---

### 7️⃣ RECHERCHE & RELECTURE

**État actuel : 50% implémenté**

#### ✅ Ce qui existe

- Recherche basique Prisma
- Filtres par statut/catégorie

#### ❌ Ce qui manque

1. **Full-text search**
   - PostgreSQL `tsvector` ou Algolia
   - Recherche dans pièces jointes (OCR)

2. **Explicabilité des résultats**
   - Score de pertinence
   - Snippets mis en évidence

---

### 8️⃣ SÉCURITÉ & DROITS

**État actuel : 80% implémenté ✅**

#### ✅ Ce qui existe

- NextAuth + Azure AD SSO
- Session management
- Rôles basiques

#### Fichiers clés

```
src/frontend/app/api/auth/[...nextauth]/route.ts
docs/SECURITY_CHECKLIST.md
```

#### ❌ Ce qui manque

1. **Journal d'accès détaillé**
   - Qui a vu quoi, quand
   - Stockage sécurisé (append-only)

2. **Rôles granulaires**
   - RBAC : Admin / Supervisor / Reader
   - Permissions par module

---

### 9️⃣ VALEUR MONÉTISABLE

**État actuel : MVP expérimental 🧪**

#### ✅ Ce qui existe

- Orchestration workflows partielle
- Métriques basiques

#### ❌ Ce qui manque **[PRIORITÉ BUSINESS]**

1. **Métriques de valeur**
   - Temps gagné par assistant
   - Nombre de flux traités automatiquement
   - Taux de précision IA

2. **Preuves légales exportables**
   - Export PDF timeline
   - Certificat d'horodatage
   - Rapport d'audit conforme

---

## 🎯 PRIORITÉS D'IMPLÉMENTATION

### 🔥 P0 - CRITIQUE (Sans ça, pas de produit défendable)

1. **EventLog immuable** (Fonctionnalité #3)
2. **Gestion doublons** (Fonctionnalité #5)
3. **Validation humaine explicite** (Fonctionnalité #4)

### ⚠️ P1 - IMPORTANT (Différenciation produit)

4. **Hash cryptographique** (Fonctionnalité #2)
5. **Système d'alertes** (Fonctionnalité #6)
6. **Full-text search** (Fonctionnalité #7)

### 📈 P2 - AMÉLIORATION (Monétisation)

7. **Métriques de valeur** (Fonctionnalité #9)
8. **Preuves légales exportables** (Fonctionnalité #9)
9. **Upload manuel** (Fonctionnalité #1)

---

## 📁 MODULES À CRÉER

### Backend

```
src/backend/services/
├── audit/
│   ├── event_log.py           # Service EventLog
│   └── timeline_generator.py  # Générateur timeline
├── deduplication/
│   ├── detector.py            # Détection doublons
│   └── resolver.py            # Résolution doublons
└── security/
    ├── crypto_hasher.py       # Hashing cryptographique
    └── access_logger.py       # Journal d'accès
```

### Frontend

```
src/frontend/app/api/
├── audit/
│   ├── timeline/route.ts      # GET /api/audit/timeline/:id
│   └── export/route.ts        # POST /api/audit/export (PDF)
├── duplicates/
│   ├── detect/route.ts        # POST /api/duplicates/detect
│   └── resolve/route.ts       # POST /api/duplicates/resolve
└── documents/
    └── upload/route.ts        # POST /api/documents/upload

src/frontend/components/
├── audit/
│   ├── AuditTimeline.tsx
│   └── ExportAuditButton.tsx
├── duplicates/
│   ├── DuplicateAlert.tsx
│   └── DuplicateMerger.tsx
└── supervision/
    ├── AlertBadge.tsx
    └── UnclassifiedFlowsWidget.tsx
```

---

## 🔗 LIENS AVEC L'EXISTANT

### Intégrations à préserver

- Email monitoring (`gmail-monitor.ts`) → enrichir avec EventLog
- Workflow orchestration (`mvp_orchestrator.py`) → ajouter audit
- Prisma models → étendre avec EventLog, DuplicateAlert, DocumentVersion

### Points d'extension

1. `email-monitor-service.ts::processEmail()` → ajouter hashing + EventLog
2. `analyzeEmail()` → générer suggestions avec score de confiance
3. Dashboard admin → intégrer widgets d'alertes

---

## ✅ PROCHAINE ÉTAPE

Ce mapping servira de base pour :

1. **PRODUCT_SPEC.md** : spec fonctionnelle officielle
2. **BUSINESS_RULES.md** : règles métier testables
3. **MVP_ROADMAP.md** : roadmap 90 jours

**Question pour toi** : Est-ce que ce mapping correspond à ta vision ? Y a-t-il des fonctionnalités manquantes ou à prioriser différemment ?
