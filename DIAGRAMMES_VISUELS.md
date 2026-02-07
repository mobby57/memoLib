# 📊 MemoLib - Diagrammes Visuels

## 🏗️ Architecture Globale

```mermaid
graph TB
    subgraph "👥 Utilisateurs"
        SA[🦸 SuperAdmin]
        AV[👨⚖️ Avocat]
        CL[👤 Client]
    end

    subgraph "🌐 Frontend - Next.js"
        AUTH[🔐 Auth Pages]
        DASH_SA[📊 Dashboard SuperAdmin]
        DASH_AV[📊 Dashboard Avocat]
        DASH_CL[📊 Dashboard Client]
    end

    subgraph "⚙️ Backend - API Routes"
        API[🔌 API REST]
        WS[💬 WebSocket]
        CRON[⏰ Cron Jobs]
    end

    subgraph "💾 Base de Données"
        PG[(🐘 PostgreSQL)]
        REDIS[(⚡ Redis Cache)]
    end

    subgraph "🔧 Services Externes"
        STRIPE[💳 Stripe]
        GMAIL[📧 Gmail API]
        SENTRY[📊 Sentry]
        AZURE[☁️ Azure Storage]
    end

    SA --> AUTH
    AV --> AUTH
    CL --> AUTH

    AUTH --> DASH_SA
    AUTH --> DASH_AV
    AUTH --> DASH_CL

    DASH_SA --> API
    DASH_AV --> API
    DASH_CL --> API

    DASH_AV --> WS
    DASH_CL --> WS

    API --> PG
    API --> REDIS
    API --> STRIPE
    API --> GMAIL
    API --> SENTRY
    API --> AZURE

    CRON --> API
```

## 👥 Hiérarchie des Rôles

```mermaid
graph TD
    SA[🦸 SuperAdmin<br/>Gestion Plateforme]
    
    SA --> AV1[👨⚖️ Avocat Principal]
    SA --> AV2[👨⚖️ Avocat Junior]
    SA --> COL[👔 Collaborateur]
    
    AV1 --> DOS1[📁 Dossier 1]
    AV1 --> DOS2[📁 Dossier 2]
    AV2 --> DOS3[📁 Dossier 3]
    
    DOS1 --> CL1[👤 Client A]
    DOS2 --> CL2[👤 Client B]
    DOS3 --> CL3[👤 Client C]
    
    DOS1 --> DOC1[📄 Documents]
    DOS2 --> DOC2[📄 Documents]
    DOS3 --> DOC3[📄 Documents]
    
    style SA fill:#e74c3c,color:#fff
    style AV1 fill:#3498db,color:#fff
    style AV2 fill:#3498db,color:#fff
    style COL fill:#95a5a6,color:#fff
    style CL1 fill:#2ecc71,color:#fff
    style CL2 fill:#2ecc71,color:#fff
    style CL3 fill:#2ecc71,color:#fff
```

## 📋 Flux Gestion Dossier

```mermaid
sequenceDiagram
    participant C as 👤 Client
    participant A as 👨⚖️ Avocat
    participant S as 💾 Système
    participant E as 📧 Email

    C->>A: 📞 Demande consultation
    A->>S: ➕ Créer dossier
    S->>S: 🔢 Générer numéro
    S->>C: 📧 Invitation client
    C->>S: ✅ Accepter invitation
    A->>S: 📄 Upload documents
    S->>C: 🔔 Notification
    C->>A: 💬 Message
    A->>C: 💬 Réponse
    A->>S: 💰 Créer facture
    S->>C: 📧 Facture envoyée
    C->>S: 💳 Paiement
    S->>A: ✅ Paiement confirmé
    A->>S: 🏁 Clôturer dossier
    S->>C: 📧 Dossier clôturé
```

## 🗄️ Modèle de Données

```mermaid
erDiagram
    USERS ||--o{ LAWYERS : "est"
    USERS ||--o{ CLIENTS : "est"
    LAWYERS ||--o{ CASES : "gère"
    CLIENTS ||--o{ CASES : "possède"
    CASES ||--o{ DOCUMENTS : "contient"
    CASES ||--o{ MESSAGES : "contient"
    CASES ||--o{ INVOICES : "génère"
    CASES ||--o{ TASKS : "contient"
    CASES ||--o{ EVENTS : "contient"
    USERS ||--o{ MESSAGES : "envoie"
    USERS ||--o{ TASKS : "assigné"

    USERS {
        uuid id PK
        string email UK
        string password_hash
        enum role
        string full_name
        boolean 2fa_enabled
        timestamp created_at
    }

    LAWYERS {
        uuid user_id PK,FK
        string bar_number
        string specialization
        decimal hourly_rate
    }

    CLIENTS {
        uuid user_id PK,FK
        string siret
        string address
        boolean rgpd_accepted
    }

    CASES {
        uuid id PK
        string case_number UK
        uuid lawyer_id FK
        uuid client_id FK
        enum type
        enum status
        decimal amount
        date deadline
        timestamp created_at
    }

    DOCUMENTS {
        uuid id PK
        uuid case_id FK
        string title
        string file_url
        enum category
        enum visibility
        int version
    }

    MESSAGES {
        uuid id PK
        uuid case_id FK
        uuid sender_id FK
        text content
        timestamp sent_at
    }

    INVOICES {
        uuid id PK
        uuid case_id FK
        string invoice_number UK
        decimal amount
        enum status
        date due_date
    }

    TASKS {
        uuid id PK
        uuid case_id FK
        uuid assigned_to FK
        string title
        enum status
        enum priority
        date due_date
    }

    EVENTS {
        uuid id PK
        uuid case_id FK
        string title
        datetime start_date
        datetime end_date
        enum type
    }
```

## 🔄 Workflow Complet

```mermaid
stateDiagram-v2
    [*] --> Nouveau: Client contacte
    Nouveau --> EnCours: Avocat accepte
    EnCours --> DocumentsEnvoyés: Upload docs
    DocumentsEnvoyés --> EnAttente: Attente tribunal
    EnAttente --> EnCours: Reprise
    EnCours --> Facturé: Créer facture
    Facturé --> Payé: Client paie
    Payé --> Clôturé: Avocat clôture
    Clôturé --> Archivé: Après 1 an
    Archivé --> [*]

    EnCours --> Annulé: Client annule
    Annulé --> [*]
```

## 📱 Navigation Pages

```mermaid
graph LR
    subgraph "🔐 Public"
        HOME[🏠 Home]
        LOGIN[🔑 Login]
        REGISTER[📝 Register]
    end

    subgraph "👨⚖️ Avocat"
        DASH_A[📊 Dashboard]
        DOSS[📁 Dossiers]
        CLI[👥 Clients]
        DOCS[📄 Documents]
        MSG[💬 Messages]
        FACT[💰 Factures]
        CAL[📅 Calendrier]
        TASK[✅ Tâches]
        ANAL[📊 Analytics]
    end

    subgraph "👤 Client"
        DASH_C[📊 Dashboard]
        MES_DOSS[📁 Mes Dossiers]
        MES_DOCS[📄 Mes Documents]
        MES_MSG[💬 Messages]
        MES_FACT[💰 Mes Factures]
        PROFIL[👤 Profil]
    end

    subgraph "🦸 SuperAdmin"
        DASH_SA[📊 Dashboard]
        USERS[👥 Utilisateurs]
        TENANTS[🏢 Tenants]
        PLANS[💎 Plans]
        LOGS[📋 Logs]
        SETTINGS[⚙️ Settings]
    end

    HOME --> LOGIN
    LOGIN --> DASH_A
    LOGIN --> DASH_C
    LOGIN --> DASH_SA

    DASH_A --> DOSS
    DASH_A --> CLI
    DASH_A --> DOCS
    DASH_A --> MSG
    DASH_A --> FACT
    DASH_A --> CAL
    DASH_A --> TASK
    DASH_A --> ANAL

    DASH_C --> MES_DOSS
    DASH_C --> MES_DOCS
    DASH_C --> MES_MSG
    DASH_C --> MES_FACT
    DASH_C --> PROFIL

    DASH_SA --> USERS
    DASH_SA --> TENANTS
    DASH_SA --> PLANS
    DASH_SA --> LOGS
    DASH_SA --> SETTINGS
```

## 🔒 Sécurité & Permissions

```mermaid
graph TB
    subgraph "🔐 Authentification"
        LOGIN[Login]
        2FA[2FA]
        SSO[SSO Azure AD]
    end

    subgraph "🛡️ Autorisation"
        ROLE{Rôle?}
        PERM_SA[Permissions SuperAdmin]
        PERM_AV[Permissions Avocat]
        PERM_CL[Permissions Client]
    end

    subgraph "🔒 Sécurité Données"
        ENCRYPT[Chiffrement AES-256]
        AUDIT[Audit Trail]
        RGPD[Conformité RGPD]
    end

    LOGIN --> 2FA
    2FA --> SSO
    SSO --> ROLE

    ROLE -->|SuperAdmin| PERM_SA
    ROLE -->|Avocat| PERM_AV
    ROLE -->|Client| PERM_CL

    PERM_SA --> ENCRYPT
    PERM_AV --> ENCRYPT
    PERM_CL --> ENCRYPT

    ENCRYPT --> AUDIT
    AUDIT --> RGPD

    style LOGIN fill:#3498db,color:#fff
    style 2FA fill:#e74c3c,color:#fff
    style SSO fill:#9b59b6,color:#fff
    style ENCRYPT fill:#27ae60,color:#fff
    style AUDIT fill:#f39c12,color:#fff
    style RGPD fill:#e67e22,color:#fff
```

## 📊 Stack Technologique

```mermaid
graph TB
    subgraph "🎨 Frontend"
        NEXT[Next.js 16]
        REACT[React 19]
        TS[TypeScript]
        TAILWIND[Tailwind CSS]
        SHADCN[Shadcn/ui]
    end

    subgraph "⚙️ Backend"
        API[API Routes]
        PRISMA[Prisma ORM]
        AUTH[NextAuth.js]
    end

    subgraph "💾 Données"
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis)]
        BLOB[Vercel Blob]
    end

    subgraph "🔧 Services"
        STRIPE[Stripe]
        SENDGRID[SendGrid]
        SENTRY[Sentry]
        GMAIL[Gmail API]
    end

    NEXT --> REACT
    REACT --> TS
    TS --> TAILWIND
    TAILWIND --> SHADCN

    NEXT --> API
    API --> PRISMA
    API --> AUTH

    PRISMA --> POSTGRES
    API --> REDIS
    API --> BLOB

    API --> STRIPE
    API --> SENDGRID
    API --> SENTRY
    API --> GMAIL

    style NEXT fill:#000,color:#fff
    style REACT fill:#61dafb,color:#000
    style TS fill:#3178c6,color:#fff
    style POSTGRES fill:#336791,color:#fff
    style REDIS fill:#dc382d,color:#fff
```

## 📈 Métriques & KPIs

```mermaid
graph LR
    subgraph "📊 Métriques Avocat"
        M1[Dossiers actifs]
        M2[Taux fermeture]
        M3[CA mensuel]
        M4[Temps moyen/dossier]
    end

    subgraph "👤 Métriques Client"
        M5[Satisfaction]
        M6[Temps réponse]
        M7[Documents partagés]
    end

    subgraph "🦸 Métriques SuperAdmin"
        M8[Uptime]
        M9[Utilisateurs actifs]
        M10[Revenus totaux]
        M11[Erreurs système]
    end

    M1 --> DASH[📊 Dashboard]
    M2 --> DASH
    M3 --> DASH
    M4 --> DASH
    M5 --> DASH
    M6 --> DASH
    M7 --> DASH
    M8 --> DASH
    M9 --> DASH
    M10 --> DASH
    M11 --> DASH

    style DASH fill:#2ecc71,color:#fff
```

---

## 🎯 Légende

- 🦸 SuperAdmin - Gestion plateforme
- 👨⚖️ Avocat - Gestion cabinet
- 👤 Client - Consultation dossiers
- 📁 Dossier - Cas juridique
- 📄 Document - Fichier
- 💬 Message - Communication
- 💰 Facture - Paiement
- ✅ Tâche - Action à faire
- 📅 Événement - Calendrier
- 🔐 Sécurisé - Chiffré
- ⚡ Temps réel - WebSocket

## 💬 Flux Communication Temps Réel

```mermaid
sequenceDiagram
    participant C as 👤 Client
    participant WS as 💬 WebSocket
    participant S as 💾 Serveur
    participant A as 👨⚖️ Avocat

    C->>WS: 🔌 Connexion
    A->>WS: 🔌 Connexion
    WS->>C: ✅ Connecté
    WS->>A: ✅ Connecté
    
    C->>WS: 💬 Nouveau message
    WS->>S: 💾 Sauvegarder
    S->>WS: ✅ Sauvegardé
    WS->>A: 🔔 Notification temps réel
    
    A->>WS: 💬 Réponse
    WS->>S: 💾 Sauvegarder
    S->>WS: ✅ Sauvegardé
    WS->>C: 🔔 Notification temps réel
    
    C->>WS: ✍️ En train d'écrire...
    WS->>A: 👀 Client écrit...
```

## 💳 Flux Facturation & Paiement

```mermaid
sequenceDiagram
    participant A as 👨⚖️ Avocat
    participant S as 💾 Système
    participant ST as 💳 Stripe
    participant C as 👤 Client
    participant E as 📧 Email

    A->>S: 📝 Créer devis
    S->>C: 📧 Envoyer devis
    C->>S: ✅ Accepter devis
    S->>A: 🔔 Devis accepté
    
    A->>S: 💰 Créer facture
    S->>S: 🔢 Générer numéro
    S->>C: 📧 Facture envoyée
    
    C->>ST: 💳 Paiement CB
    ST->>S: ✅ Paiement confirmé
    S->>A: 🔔 Paiement reçu
    S->>C: 📧 Reçu paiement
    
    alt Paiement échoué
        ST->>S: ❌ Échec paiement
        S->>C: 📧 Relance
        S->>A: ⚠️ Paiement échoué
    end
```

## 📄 Flux Gestion Documents

```mermaid
stateDiagram-v2
    [*] --> Upload: Avocat upload
    Upload --> Analyse: OCR + Métadonnées
    Analyse --> Stockage: Azure Blob
    Stockage --> Indexation: Recherche full-text
    Indexation --> Disponible: Prêt
    
    Disponible --> Partage: Partager client
    Partage --> Notification: Email client
    Notification --> Consultation: Client consulte
    
    Disponible --> Versioning: Nouvelle version
    Versioning --> Stockage
    
    Disponible --> Signature: Demander signature
    Signature --> EnAttente: Attente client
    EnAttente --> Signé: Client signe
    Signé --> Archivé: Archiver
    
    Disponible --> Suppression: Soft delete
    Suppression --> [*]
```

## 🔄 Cycle de Vie Dossier Complet

```mermaid
graph TD
    START([👤 Client contacte]) --> CONSULT{Consultation?}
    CONSULT -->|Oui| CREATE[📁 Créer dossier]
    CONSULT -->|Non| END1([Fin])
    
    CREATE --> INVITE[📧 Inviter client]
    INVITE --> ACCEPT{Client accepte?}
    ACCEPT -->|Non| END2([Annulé])
    ACCEPT -->|Oui| ACTIVE[✅ Dossier actif]
    
    ACTIVE --> DOCS[📄 Upload documents]
    DOCS --> ANALYSIS[🤖 Analyse IA]
    ANALYSIS --> TASKS[✅ Créer tâches]
    TASKS --> EVENTS[📅 Planifier événements]
    
    EVENTS --> WORK[⚖️ Travail juridique]
    WORK --> COMM[💬 Communication]
    COMM --> WORK
    
    WORK --> INVOICE[💰 Facturer]
    INVOICE --> PAYMENT{Paiement?}
    PAYMENT -->|Non| REMINDER[📧 Relance]
    REMINDER --> PAYMENT
    PAYMENT -->|Oui| CLOSE[🏁 Clôturer]
    
    CLOSE --> ARCHIVE[📦 Archiver]
    ARCHIVE --> END3([Fin])
    
    style START fill:#2ecc71,color:#fff
    style ACTIVE fill:#3498db,color:#fff
    style CLOSE fill:#e74c3c,color:#fff
    style END3 fill:#95a5a6,color:#fff
```

## 🔐 Architecture Sécurité Multi-Couches

```mermaid
graph TB
    subgraph "🌐 Couche Réseau"
        HTTPS[HTTPS/TLS 1.3]
        WAF[Web Application Firewall]
        DDOS[Protection DDoS]
    end
    
    subgraph "🔐 Couche Authentification"
        LOGIN[Login]
        MFA[2FA/MFA]
        SSO[SSO Azure AD]
        JWT[JWT Tokens]
    end
    
    subgraph "🛡️ Couche Autorisation"
        RBAC[Role-Based Access]
        ABAC[Attribute-Based Access]
        POLICY[Policy Engine]
    end
    
    subgraph "💾 Couche Données"
        ENCRYPT_REST[Encryption at Rest AES-256]
        ENCRYPT_TRANSIT[Encryption in Transit]
        BACKUP[Backups Chiffrés]
        MASK[Data Masking]
    end
    
    subgraph "📋 Couche Audit"
        LOGS[Audit Logs]
        SIEM[SIEM Integration]
        ALERT[Alertes Sécurité]
        COMPLIANCE[RGPD Compliance]
    end
    
    HTTPS --> LOGIN
    WAF --> LOGIN
    DDOS --> LOGIN
    
    LOGIN --> MFA
    MFA --> SSO
    SSO --> JWT
    
    JWT --> RBAC
    RBAC --> ABAC
    ABAC --> POLICY
    
    POLICY --> ENCRYPT_REST
    POLICY --> ENCRYPT_TRANSIT
    ENCRYPT_REST --> BACKUP
    ENCRYPT_TRANSIT --> MASK
    
    MASK --> LOGS
    LOGS --> SIEM
    SIEM --> ALERT
    ALERT --> COMPLIANCE
```

## 📊 Dashboard Analytics - Flux de Données

```mermaid
graph LR
    subgraph "📥 Sources de Données"
        DB[(PostgreSQL)]
        REDIS[(Redis)]
        SENTRY[Sentry]
        STRIPE[Stripe]
    end
    
    subgraph "⚙️ Traitement"
        ETL[ETL Pipeline]
        AGGR[Agrégation]
        CALC[Calculs KPIs]
    end
    
    subgraph "📊 Visualisation"
        DASH_AV[Dashboard Avocat]
        DASH_CL[Dashboard Client]
        DASH_SA[Dashboard SuperAdmin]
    end
    
    DB --> ETL
    REDIS --> ETL
    SENTRY --> ETL
    STRIPE --> ETL
    
    ETL --> AGGR
    AGGR --> CALC
    
    CALC --> DASH_AV
    CALC --> DASH_CL
    CALC --> DASH_SA
    
    DASH_AV --> |Temps réel| WS[WebSocket]
    DASH_CL --> |Temps réel| WS
    DASH_SA --> |Temps réel| WS
```

## 🔄 CI/CD Pipeline

```mermaid
graph LR
    DEV[👨‍💻 Développeur] --> GIT[📦 Git Push]
    GIT --> GITHUB[GitHub]
    
    GITHUB --> TESTS{🧪 Tests}
    TESTS -->|❌ Échec| NOTIF_FAIL[📧 Notification]
    TESTS -->|✅ Succès| BUILD[🏗️ Build]
    
    BUILD --> LINT[🔍 Lint]
    LINT --> TYPE[📝 Type Check]
    TYPE --> SECURITY[🔒 Security Scan]
    
    SECURITY --> PREVIEW{Branch?}
    PREVIEW -->|develop| STAGING[🎭 Staging]
    PREVIEW -->|main| PROD[🚀 Production]
    
    STAGING --> TEST_E2E[🧪 Tests E2E]
    TEST_E2E --> APPROVE{Approuvé?}
    APPROVE -->|Oui| PROD
    APPROVE -->|Non| DEV
    
    PROD --> MONITOR[📊 Monitoring]
    MONITOR --> SENTRY_PROD[Sentry]
    MONITOR --> METRICS[Métriques]
    
    style TESTS fill:#f39c12,color:#fff
    style PROD fill:#27ae60,color:#fff
    style MONITOR fill:#3498db,color:#fff
```

## 📱 Architecture Mobile (Future)

```mermaid
graph TB
    subgraph "📱 Applications Mobiles"
        IOS[📱 iOS App]
        ANDROID[🤖 Android App]
    end
    
    subgraph "🔄 Synchronisation"
        SYNC[Sync Engine]
        OFFLINE[Offline Storage]
        CONFLICT[Conflict Resolution]
    end
    
    subgraph "🔔 Notifications"
        FCM[Firebase Cloud Messaging]
        APNS[Apple Push Notification]
    end
    
    subgraph "🔐 Sécurité Mobile"
        BIO[Biométrie]
        KEYCHAIN[Secure Storage]
        CERT[Certificate Pinning]
    end
    
    IOS --> SYNC
    ANDROID --> SYNC
    
    SYNC --> OFFLINE
    OFFLINE --> CONFLICT
    CONFLICT --> API[API Backend]
    
    API --> FCM
    API --> APNS
    FCM --> ANDROID
    APNS --> IOS
    
    IOS --> BIO
    ANDROID --> BIO
    BIO --> KEYCHAIN
    KEYCHAIN --> CERT
    CERT --> API
```

## 🎯 Roadmap Visuelle

```mermaid
timeline
    title MemoLib - Roadmap 2026
    
    Q1 2026 : Core Features
              : Auth + Dossiers + Clients
              : Documents + Messages
              : Facturation basique
    
    Q2 2026 : Advanced Features
              : Chat temps réel
              : Gestion tâches
              : Templates
              : Analytics avancés
    
    Q3 2026 : Intégrations
              : Google Calendar
              : DocuSign
              : Stripe avancé
              : Gmail sync
    
    Q4 2026 : Mobile & Scale
              : App iOS/Android
              : Performance optimization
              : Multi-tenant
              : Enterprise features
```
