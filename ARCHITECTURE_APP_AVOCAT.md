# 📋 Architecture memoLib - App d'Avocat + Clients + SuperAdmin

## 🎯 Vision Globale

**memoLib** = Plateforme de gestion juridique pour avocats
- **Avocats** : gèrent dossiers, clients, documents, facturation
- **Clients** : consultent dossiers, pièces, factures, communiquent
- **SuperAdmin** : supervision complète, audit, configuration globale

---

## 👥 Hiérarchie des Rôles

```
SuperAdmin (1 compte)
    ├── Avocats (illimité)
    │   ├── Dossiers (illimité par avocat)
    │   │   └── Clients (illimité par dossier)
    │   │       └── Documents (illimité)
    │   └── Collaborateurs (équipe interne)
    │
    └── Configuration Globale
        ├── Settings système
        ├── Audit & Logs
        └── Facturation globale
```

---

## 🏢 Modules Principaux

### 1. AUTHENTIFICATION & PERMISSIONS
```
├── Login / Register (avocats)
├── Invitation clients (email + code)
├── 2FA (avocat + client)
├── SSO (copie d'écran: Azure AD)
├── Permissions:
│   ├── Public (home, faire connaissance)
│   ├── Avocat (tous dossiers/clients)
│   ├── Client (son dossier uniquement)
│   └── SuperAdmin (tout + audit)
└── Roles:
    ├── AVOCAT_PRINCIPAL
    ├── AVOCAT_JUNIOR
    ├── CLIENT
    ├── COLLABORATEUR (secrétaire)
    └── SUPER_ADMIN
```

### 2. GESTION DOSSIERS
**Pour Avocats:**
```
Dossiers (CRUD)
├── Créer dossier (client + type)
├── Informations dossier:
│   ├── Numéro dossier
│   ├── Type (civil/penal/administratif/fiscal)
│   ├── Statut (ouvert/fermé/en attente)
│   ├── Date création
│   ├── Montant en litige
│   ├── Échéance (date limite)
│   ├── Tribunal compétent
│   └── Juge assigné
├── Parties impliquées
├── Jalons/Étapes
├── Budget alloué
└── Archive/Supprimer
```

**Pour Clients:**
```
Consultation Dossier
├── Résumé exécutif
├── Étapes actuelles
├── Prochaines actions
├── Statut global
├── Frais estimés
└── Timeline publique
```

### 3. GESTION CLIENTS
**Pour Avocat:**
```
Clients (CRUD)
├── Profil client:
│   ├── Nom complet
│   ├── Email
│   ├── Téléphone
│   ├── Adresse
│   ├── SIRET (si entreprise)
│   ├── Date d'engagement
│   └── Statut (actif/inactif)
├── Dossiers associés
├── Historique factures
├── Documents signés
├── Notes confidentielles (avocat uniquement)
├── Acceptation conditions
└── Consentement RGPD
```

**Pour Client:**
```
Mon Profil
├── Sauvegarder coordonnées
├── Voir mes dossiers
├── Accès documents
├── Historique messages
└── Télécharger factures
```

### 4. GESTION DOCUMENTS
```
Documents (CRUD)
├── Catégories:
│   ├── Contrats
│   ├── Courriers
│   ├── Pièces justificatives
│   ├── Jugements
│   ├── Conclusions
│   ├── Mémoires
│   └── Devis/Factures
├── Upload (drag & drop)
├── Versioning
├── Métadonnées:
│   ├── Titre
│   ├── Date
│   ├── Auteur
│   ├── Confidentialité
│   │   ├── Avocat seul
│   │   ├── Client + Avocat
│   │   └── Public
│   └── Signature électronique
├── Prévisualisation
├── Télécharger
├── Partager
├── Supprimer (soft delete)
└── OCR (extraction texte)
```

### 5. COMMUNICATION
```
Messages & Notifications
├── Chat par dossier (client ↔ avocat)
├── Notifications:
│   ├── Email digests
│   ├── SMS urgence
│   ├── In-app real-time
│   └── Préférences utilisateur
├── Historique complet
├── Recherche dans messages
├── Archivage
└── Pièces jointes dans messages
```

### 6. FACTURATION & PAIEMENT
**Pour Avocat:**
```
Facturation
├── Devis (avant dossier)
├── Factures:
│   ├── Numérotation auto
│   ├── Tarification:
│   │   ├── Forfait
│   │   ├── Horaire
│   │   └── Mixte
│   ├── TVA gérée
│   ├── Délai paiement
│   ├── Conditions paiement
│   └── Relance auto
├── Paiement:
│   ├── Stripe (CB)
│   ├── Virement (SEPA)
│   ├── Chèque
│   └── Portefeuille client
├── Rappels de paiement
├── Historique
└── Rapports (CSV/PDF)
```

**Pour Client:**
```
Factures
├── Voir factures
├── Télécharger PDF
├── Payer en ligne (Stripe)
├── Historique paiements
└── Justificatifs
```

### 7. AGENDA & JALONS
```
Calendrier
├── Dates clés (tribunal, délais)
├── Rappels:
│   ├── E-mail
│   ├── SMS
│   └── Notification app
├── Récurrence (délais réguliers)
├── Intégration calendrier (Google/Outlook)
├── Vue mois/semaine/jour
├── Partage clients (dates publiques)
└── Blocage de la date (indisponibilités)
```

### 8. TÂCHES & CHECKLIST
```
Gestion Tâches
├── Créer tâche:
│   ├── Titre
│   ├── Assigné à (avocat/collaborateur)
│   ├── Dossier lié
│   ├── Date limite
│   ├── Priorité
│   └── Checklist
├── Statut (todo/in-progress/done)
├── Timeline / Burndown
├── Rappels
├── Dépendances tâches
└── Tableau Kanban
```

### 9. MODÈLES & TEMPLATES
```
Templates
├── Lettres types
├── Contrats
├── Conclusions
├── Mémoires
├── Devis
├── Conditions générales
├── Clauses standards
└── Générateur (merge champs)
```

### 10. RAPPORTS & ANALYTICS
**Pour Avocat:**
```
Rapports
├── Activité:
│   ├── Temps passé par dossier
│   ├── Nombre clients
│   ├── Dossiers ouverts/fermés
│   └── Taux fermeture
├── Financier:
│   ├── Revenu par mois
│   ├── Dossiers rentables
│   ├── Arriérés paiement
│   └── Prévisions CA
├── Performance:
│   ├── Temps moyen résolution
│   ├── Satisfaction clients (note)
│   └── Coût moyen/dossier
└── Export (PDF/CSV/Excel)
```

**Pour SuperAdmin:**
```
Dashboards
├── Vue globale:
│   ├── Nombre avocats actifs
│   ├── Total clients
│   ├── Chiffre d'affaires
│   ├── Statut système
│   └── Santé application
├── Audit:
│   ├── Logs d'accès
│   ├── Logs modifications
│   ├── Connexions suspectes
│   ├── Suppressions documents
│   └── Exportations données
├── Conformité:
│   ├── RGPD compliance
│   ├── Traces audit
│   ├── Sauvegardes
│   └── Chiffrement
└── Gestion serveur (CPU, RAM, DB)
```

### 11. RECHERCHE GLOBALE
```
Search
├── Full-text search:
│   ├── Documents (OCR)
│   ├── Dossiers
│   ├── Clients
│   ├── Messages
│   └── Factures
├── Filtres avancés
├── Sauvegarde recherches
├── Facettes (par type/date/client)
└── Suggestions (autocomplete)
```

### 12. INTÉGRATIONS EXTERNES
```
Intégrations
├── Calendrier:
│   ├── Google Calendar
│   ├── Outlook/Teams
│   └── Sync bidirectionnel
├── Email:
│   ├── Gmail (mise en copie auto)
│   ├── Outlook
│   └── IMAP/SMTP custom
├── Signature électronique:
│   ├── DocuSign
│   ├── Yousign
│   └── Signature cloud
├── Paiement:
│   ├── Stripe
│   ├── PayPal
│   └── Virement SEPA
├── CRM:
│   ├── Salesforce sync
│   └── Pipedrive
└── Cloud Storage:
    ├── Google Drive
    ├── OneDrive
    └── Dropbox
```

### 13. SÉCURITÉ & CONFORMITÉ
```
Sécurité
├── Authentification:
│   ├── 2FA (TOTP/SMS)
│   ├── SSO (Azure AD)
│   ├── SAML
│   └── API Keys
├── Données:
│   ├── Chiffrement E2E
│   ├── Chiffrement base (AES-256)
│   ├── Masquage IP (logs)
│   └── Anonymisation auto
├── Conformité:
│   ├── RGPD (droit à l'oubli)
│   ├── Secret professionnel
│   ├── DPA signé
│   ├── CNIL notification
│   └── Audit externe
├── Logs:
│   ├── Qui? Quand? Quoi?
│   ├── Stockage 1 an
│   ├── Alert patterns suspects
│   └── Exports pour CNIL
└── Sauvegardes:
    ├── Daily backup
    ├── Geo-redundancy
    ├── Restore tests
    └── 30 jours rétention
```

### 14. MOBILE APP
```
App iOS/Android
├── Authentification (biométrie)
├── Voir dossiers (lecture seule)
├── Chat en temps réel
├── Push notifications
├── Calendrier offline
├── Documents (PDFs offline)
├── Signature mobile
└── Synchronisation auto
```

---

## 🗄️ Base de Données - Schéma Principal

```sql
-- Utilisateurs
users
├── id (UUID)
├── email (unique)
├── password_hash
├── full_name
├── role (AVOCAT, CLIENT, SUPER_ADMIN, COLLABORATEUR)
├── avatar_url
├── phone
├── 2fa_enabled
├── created_at
├── updated_at
└── deleted_at (soft delete)

-- Avocats (extension users)
lawyers
├── user_id (FK)
├── bar_number (numéro barreau)
├── specialization (civil/penal/etc)
├── bio
├── photo
├── verified (badge)
├── hourly_rate
└── max_clients

-- Clients (extension users)
clients
├── user_id (FK)
├── user_type (individual/company)
├── siret (si empresa)
├── address
├── tax_id
├── phone_verified
└── rgpd_accepted

-- Dossiers
cases
├── id (UUID)
├── case_number (auto)
├── lawyer_id (FK → lawyers)
├── client_id (FK → clients)
├── title
├── description
├── type (civil/penal/admin/fiscal)
├── status (open/closed/pending)
├── amount_in_litigation
├── budget_allocated
├── deadline
├── court_name
├── judge_name
├── created_at
├── updated_at
├── closed_at
└── deleted_at

-- Documents
documents
├── id (UUID)
├── case_id (FK → cases)
├── title
├── file_url (S3)
├── file_size
├── mime_type
├── category (contract/letter/evidence/judgment)
├── visibility (avocat_only/client_visible/public)
├── uploaded_by (user_id)
├── version
├── signature_data (JSON)
├── created_at
├── deleted_at (soft)

-- Messages
messages
├── id (UUID)
├── case_id (FK → cases)
├── from_user_id (FK)
├── to_user_id (FK)
├── content
├── attachments (JSON array)
├── read_at
├── created_at
└── deleted_at

-- Factures
invoices
├── id (UUID)
├── invoice_number (auto: "FAC-2026-001")
├── case_id (FK)
├── client_id (FK)
├── lawyer_id (FK)
├── amount_ht
├── vat_rate (20%)
├── amount_ttc
├── status (draft/sent/paid/overdue)
├── due_date
├── payment_date
├── payment_method
├── created_at
├── sent_at
└── stripe_charge_id

-- Paiements
payments
├── id (UUID)
├── invoice_id (FK)
├── amount
├── method (card/transfer/check)
├── stripe_payment_intent_id
├── status (pending/succeeded/failed)
├── created_at
└── receipt_url

-- Audit Logs
audit_logs
├── id (UUID)
├── user_id (FK → users)
├── action (CREATE/UPDATE/DELETE/READ)
├── entity_type (case/document/invoice)
├── entity_id
├── before_data (JSON)
├── after_data (JSON)
├── ip_address (anonymisée)
├── ip_country
├── user_agent
├── created_at (UTC)
└── retention_until

-- Tasks
tasks
├── id (UUID)
├── case_id (FK)
├── created_by (user_id)
├── assigned_to (user_id)
├── title
├── description
├── due_date
├── priority (low/medium/high)
├── status (todo/in_progress/done)
├── completed_at
└── created_at

-- Calendar Events
events
├── id (UUID)
├── case_id (FK)
├── created_by (user_id)
├── title
├── start_time
├── end_time
├── location
├── is_recurring (bool)
├── recurrence_rule
├── reminders (JSON: ["1day_before", "1hour_before"])
├── visible_to_client (bool)
└── created_at

-- Settings/Config
settings
├── id (UUID)
├── user_id (FK, NULL = global)
├── key (e.g., "timezone", "invoice_prefix")
├── value
└── updated_at

-- Notifications
notifications
├── id (UUID)
├── user_id (FK)
├── type (invoice_sent/client_message/deadline/payment)
├── related_entity_type (invoice/message)
├── related_entity_id
├── title
├── message
├── read_at
├── channels (JSON: [email, sms, in_app])
└── created_at
```

---

## 🔗 API Endpoints (RESTful)

### Authentication
```
POST   /api/v1/auth/register          (avocat signup)
POST   /api/v1/auth/login             (avocat + client)
POST   /api/v1/auth/2fa/setup         (enable TOTP)
POST   /api/v1/auth/2fa/verify        (verify code)
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
GET    /api/v1/auth/profile           (current user)
POST   /api/v1/auth/send-invite       (avocat → client)
```

### Cases (Dossiers)
```
GET    /api/v1/cases                  (list avec filters)
POST   /api/v1/cases                  (create)
GET    /api/v1/cases/:id              (detail)
PUT    /api/v1/cases/:id              (update)
DELETE /api/v1/cases/:id              (soft delete)
GET    /api/v1/cases/:id/timeline     (jalons/étapes)
GET    /api/v1/cases/:id/financials   (budget, factures)
```

### Clients
```
GET    /api/v1/clients                (avocat view)
POST   /api/v1/clients                (register new)
GET    /api/v1/clients/:id
PUT    /api/v1/clients/:id
GET    /api/v1/clients/:id/cases
GET    /api/v1/clients/:id/invoices
```

### Documents
```
GET    /api/v1/documents              (by case)
POST   /api/v1/documents              (upload)
GET    /api/v1/documents/:id
GET    /api/v1/documents/:id/preview  (OCR result)
PUT    /api/v1/documents/:id
DELETE /api/v1/documents/:id
POST   /api/v1/documents/:id/sign     (e-signature)
```

### Messages
```
GET    /api/v1/cases/:id/messages
POST   /api/v1/cases/:id/messages
GET    /api/v1/cases/:id/messages/:msg_id
```

### Invoices & Payments
```
GET    /api/v1/invoices
POST   /api/v1/invoices               (create devis/facture)
GET    /api/v1/invoices/:id
PUT    /api/v1/invoices/:id
DELETE /api/v1/invoices/:id
POST   /api/v1/invoices/:id/send      (email client)
POST   /api/v1/invoices/:id/reminder  (relance)
POST   /api/v1/payments               (webhook Stripe)
GET    /api/v1/payments/:id/receipt
```

### Calendar & Tasks
```
GET    /api/v1/events
POST   /api/v1/events                 (create)
PUT    /api/v1/events/:id
DELETE /api/v1/events/:id
GET    /api/v1/tasks
POST   /api/v1/tasks
PATCH  /api/v1/tasks/:id/status
```

### Search
```
POST   /api/v1/search                 (full-text)
GET    /api/v1/search/suggestions
```

### Admin/Audit
```
GET    /api/v1/admin/users            (SuperAdmin only)
GET    /api/v1/admin/audit-logs       (filters)
GET    /api/v1/admin/statistics
POST   /api/v1/admin/backup
GET    /api/v1/admin/health           (system status)
```

---

## 🎨 Interface Utilisateur

### Pages Avocat
```
Dashboard
├── Résumé: clients actifs, dossiers ouverts, montant en attente
├── Dossiers récents
├── Factures à envoyer
├── Rappels/Deadlines proches
└── Graphiques: CA, temps passé

Dossiers
├── Liste avec filtres (statut, client, type)
├── Carte dossier: titre, client, statut, montant, deadline
├── Detail:
│   ├── Infos générales
│   ├── Clients
│   ├── Documents (catégorisés)
│   ├── Timeline/Jalons
│   ├── Messages
│   ├── Tasks
│   ├── Factures
│   └── Historique

Clients
├── Directory (liste tous)
├── Profil client:
│   ├── Infos contact
│   ├── Dossiers associés
│   ├── Factures
│   └── Notes confidentielles

Documents
├── Vault (tous les documents)
├── Filtres: type, dossier, date
├── Upload drag & drop
├── Versioning
└── Signature électronique

Factures
├── Liste factures/devis
├── Créer facture (template)
├── Envoyer client
├── Relances auto
└── Statistiques financières

Calendar
├── Vue mois/semaine/jour
├── Deadlines dossiers
├── RDV avec clients
└── Blocages indisponibilités

Tasks & Kanban
├── Board Kanban (todo/doing/done)
├── Timeline burndown
└── Assignation

Rapports
├── Activité
├── Financier
├── Performance
└── Exports
```

### Pages Client
```
Dashboard (minimal)
├── Mes dossiers (lecture seule)
├── Statut global
├── Documents importants
├── Prochaines échéances
├── Montant restant dû

Dossier Detail (public view)
├── Résumé exécutif
├── Timeline (jalons publiques)
├── Documents autorisés
├── Frais estimés
└── Chat avec avocat

Messages
├── Chat dossier
├── Notifications
└── Historique

Factures
├── Voir factures
├── Payer en ligne (Stripe)
├── Télécharger PDF
└── Historique paiements

Profil
├── Infos personnelles
├── Mot de passe
└── Préférences notifications
```

### Pages SuperAdmin
```
Dashboard
├── Statistiques globales
├── Santé système
├── Alertes
└── Graphiques

Users Management
├── Liste tous avocats
├── Activer/désactiver
├── Vérifier (badge)
└── Limites (max clients)

Audit
├── Logs complets (qui/quoi/quand)
├── Filtres avancés
├── Alertes (patterns suspects)
└── Exports CNIL

Settings
├── Configuration générale
├── Sécurité (2FA, SAML)
├── Limites système
├── Mails (SMTP config)
└── S3/Cloud storage

Monitoring
├── CPU, RAM, Disk
├── DB performance
├── API response times
├── Erreurs applicatives
└── Alerts automatiques

Backup & Restore
├── Dernières sauvegardes
├── Historique
├── Test restore
└── Rétention
```

---

## 🚀 Stack Technique Recommandé

```
Frontend:
├── Next.js 16+ (App Router)
├── React 19
├── TypeScript
├── TailwindCSS + shadcn/ui
├── Zustand (state)
├── React Query (data fetching)
├── Socket.io (réaltime messages)
└── Electron (desktop app)

Backend:
├── Node.js (v20+)
├── Express.js ou Hono
├── TypeScript
├── PostgreSQL (Neon - serverless)
├── Prisma ORM
├── Redis (Upstash)
├── Bull (job queue)
└── Passport.js (auth)

DevOps:
├── Docker + Docker Compose
├── GitHub Actions (CI/CD)
├── Vercel (frontend)
├── Railway/Render (backend)
├── AWS S3 (documents)
└── Cloudflare (CDN + caching)

Monitoring:
├── Sentry (errors)
├── LogRocket (session replay)
├── PostHog (analytics)
├── DataDog (infrastructure)
└── Uptime Robot (monitoring)

Security:
├── Auth0 ou NextAuth.js
├── JWT tokens
├── Rate limiting (Upstash)
├── Helmet.js
├── CORS policies
├── SSL/TLS (auto)
└── Password encryption (bcrypt)

External Services:
├── Stripe (paiement)
├── SendGrid (emails)
├── Twilio (SMS)
├── DocuSign (e-signature)
├── Firebase Cloud Storage
└── Slack (notifications)
```

---

## 📊 Priorisation Features (MVP → V2 → V3)

### MVP (1 mois)
- ✅ Auth (avocat + client)
- ✅ CRUD dossiers + clients
- ✅ Upload documents
- ✅ Chat simple
- ✅ Factures de base
- ✅ Sécurité RGPD minimale

### V1.0 (2 mois)
- ✅ Calendrier + jalons
- ✅ Tasks + Kanban
- ✅ E-signature
- ✅ Paiement Stripe
- ✅ Rapports basiques
- ✅ 2FA

### V2 (3 mois)
- ✅ Mobile app (iOS/Android)
- ✅ Intégrations (Google Cal, Outlook)
- ✅ Full-text search + OCR
- ✅ Advanced analytics
- ✅ Templates + merge fields
- ✅ Collaborateurs (team)

### V3 (6 mois)
- ✅ AI features (resumes auto, suggestions)
- ✅ Webhook integrations
- ✅ White-label
- ✅ Marketplace (plugins)
- ✅ Advanced audit trail
- ✅ Blockchain timestamps

---

## ⚖️ Conformité & Sécurité

### RGPD
```
✅ Consentement explicite
✅ Droit à l'oubli (suppression données)
✅ Portabilité données (export)
✅ Chiffrement des données
✅ DPA signé avec clients
✅ CNIL notification
✅ Responsable données nommé
✅ Privacy policy + CGU
```

### Secret Professionnel
```
✅ Accès restreint (avocat + client)
✅ Notes confidentielles (avocat seul)
✅ Audit complet (qui accède quand)
✅ Chiffrement E2E
✅ Suppression sécurisée
✅ Pas d'accès SuperAdmin aux contenus
```

### Sécurité
```
✅ HTTPS/TLS
✅ Rate limiting
✅ 2FA/TOTP
✅ SAML/SSO
✅ Logs immutables
✅ Audit trail
✅ Backups geo-redundants
✅ Disaster recovery plan
✅ Pentest annuel
✅ Certification ISO 27001 (optionnel)
```

---

## 💰 Modèle Économique

```
Pricing Avocats:
├── Starter: 29€/mois (1-5 clients, features basiques)
├── Pro: 79€/mois (illimité clients, features avancées)
├── Enterprise: custom (white-label, API, support 24/7)
└── Setup: 199€ (configuration + migration données)

Paiement Clients:
└── 2.9% + 0,30€ par transaction Stripe (avocat paie)

PJJ:
└── Intégration possible (cas d'usage professionnel)

Marges:
└── SaaS = 70% margin typique
```

---

## 🎯 Prochaines Étapes

1. **Design complet** : Wireframes + figma
2. **Prototype** : MVP interactive
3. **Backend API** : Spécifications OpenAPI
4. **Frontend** : Composants réutilisables
5. **Testing** : E2E + unitaires
6. **Deployment** : Staging → Production
7. **Launch** : Early access avocats
8. **Iterate** : Feedback + ajustements

Tu veux que je développe un aspect spécifique ? (API, DB, UI, etc.)
