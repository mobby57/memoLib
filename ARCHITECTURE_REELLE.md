# 🏗️ Architecture MemoLib.Api (.NET 9.0)

## 📐 Architecture Globale

```mermaid
graph TB
    subgraph "Frontend"
        HTML[📱 HTML/JS/CSS]
        DEMO[demo.html]
        OWNER[demo-owner.html]
        ADMIN[demo-admin.html]
    end
    
    subgraph "API Layer"
        AUTH[🔐 AuthController]
        CASE[📁 CaseController]
        CLIENT[👤 ClientController]
        EMAIL[📧 EmailController]
        SEARCH[🔍 SearchController]
        DASH[📊 DashboardController]
    end
    
    subgraph "Services Layer"
        EMAILSVC[EmailMonitorService]
        EMBEDSVC[EmbeddingService]
        JWTSVC[JwtTokenService]
        NOTIF[RealtimeNotificationService]
        TEMPLATE[TemplateEngineService]
    end
    
    subgraph "Data Layer"
        DBCTX[(MemoLibDbContext)]
        SQLITE[(SQLite DB)]
    end
    
    HTML --> AUTH
    HTML --> CASE
    HTML --> CLIENT
    
    AUTH --> JWTSVC
    CASE --> DBCTX
    CLIENT --> DBCTX
    EMAIL --> EMAILSVC
    SEARCH --> EMBEDSVC
    
    DBCTX --> SQLITE
    EMAILSVC --> DBCTX
```

## 🔄 Flux Authentification

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant C as AuthController
    participant J as JwtTokenService
    participant P as PasswordService
    participant DB as Database
    
    U->>C: POST /api/auth/register
    C->>P: HashPassword()
    P-->>C: hashedPassword
    C->>DB: Create User
    DB-->>C: User Created
    C-->>U: 201 Created
    
    U->>C: POST /api/auth/login
    C->>DB: FindUser(email)
    DB-->>C: User
    C->>P: VerifyPassword()
    P-->>C: Valid ✅
    C->>J: GenerateToken(user)
    J-->>C: JWT Token
    C-->>U: 200 OK + Token
```

## 📁 Flux Gestion Dossiers

```mermaid
sequenceDiagram
    participant A as 👨‍⚖️ Avocat
    participant CC as CaseController
    participant DB as Database
    participant N as NotificationService
    
    A->>CC: POST /api/cases
    CC->>DB: Create Case
    DB-->>CC: Case Created
    CC->>N: NotifyTeam()
    N-->>A: 🔔 Notification
    CC-->>A: 201 Case
    
    A->>CC: GET /api/cases/{id}/timeline
    CC->>DB: GetEvents(caseId)
    DB-->>CC: Events[]
    CC-->>A: 200 Timeline
    
    A->>CC: PATCH /api/cases/{id}/status
    CC->>DB: UpdateStatus()
    DB-->>CC: Updated
    CC->>N: NotifyStatusChange()
    CC-->>A: 200 OK
```

## 📧 Flux Email Monitoring

```mermaid
sequenceDiagram
    participant CRON as ⏰ Background Job
    participant EMS as EmailMonitorService
    participant IMAP as 📬 Gmail IMAP
    participant DB as Database
    participant IC as IngestionController
    
    CRON->>EMS: CheckEmails()
    EMS->>IMAP: FetchNewEmails()
    IMAP-->>EMS: Email[]
    
    loop Pour chaque email
        EMS->>IC: IngestEmail()
        IC->>DB: Create Event
        IC->>DB: Extract Client Info
        IC->>DB: Create/Update Client
        IC->>DB: Create Case
        DB-->>IC: Case Created
        IC-->>EMS: Success
    end
    
    EMS-->>CRON: Completed
```

## 🗄️ Modèle de Données (EF Core)

```mermaid
erDiagram
    User ||--o{ Case : creates
    User ||--o{ Event : owns
    User ||--o{ Client : manages
    User ||--o{ Notification : receives
    
    Case ||--o{ Event : contains
    Case }o--|| Client : belongs_to
    Case ||--o{ CaseComment : has
    Case ||--o{ Attachment : has
    
    Client ||--o{ Event : sends
    
    User {
        string Id PK
        string Email UK
        string PasswordHash
        string Name
        string Role
        DateTime CreatedAt
    }
    
    Case {
        string Id PK
        string Title
        string ClientId FK
        string UserId FK
        string Status
        int Priority
        DateTime CreatedAt
    }
    
    Event {
        string Id PK
        string CaseId FK
        string UserId FK
        string RawPayload
        DateTime OccurredAt
        bool RequiresAttention
    }
    
    Client {
        string Id PK
        string Name
        string Email UK
        string PhoneNumber
        string Address
        string UserId FK
    }
    
    Notification {
        string Id PK
        string UserId FK
        string Type
        string Message
        bool IsRead
        DateTime CreatedAt
    }
```

## 🎯 Controllers → Services → Data

```mermaid
graph LR
    subgraph Controllers
        A1[AuthController]
        A2[CaseController]
        A3[ClientController]
        A4[EmailController]
        A5[SearchController]
    end
    
    subgraph Services
        B1[JwtTokenService]
        B2[EmailMonitorService]
        B3[EmbeddingService]
        B4[TemplateEngineService]
        B5[NotificationService]
    end
    
    subgraph Data
        C1[MemoLibDbContext]
        C2[(SQLite)]
    end
    
    A1 --> B1
    A2 --> C1
    A3 --> C1
    A4 --> B2
    A5 --> B3
    
    B2 --> C1
    B3 --> C1
    B5 --> C1
    
    C1 --> C2
```

## 🔍 API Endpoints Principaux

### Authentification
```
POST   /api/auth/register          → Inscription
POST   /api/auth/login             → Connexion
```

### Dossiers
```
GET    /api/cases                  → Liste dossiers
POST   /api/cases                  → Créer dossier
GET    /api/cases/{id}             → Détail dossier
GET    /api/cases/{id}/timeline    → Timeline
PATCH  /api/cases/{id}/status      → Changer statut
PATCH  /api/cases/{id}/priority    → Définir priorité
POST   /api/cases/merge-duplicates → Fusionner doublons
```

### Clients
```
GET    /api/client                 → Liste clients
POST   /api/client                 → Créer client
GET    /api/client/{id}/detail     → Détail client
PUT    /api/client/{id}            → Modifier client
```

### Emails
```
POST   /api/ingest/email           → Ingérer email
POST   /api/email-scan/manual      → Scan manuel Gmail
POST   /api/email/send             → Envoyer email
GET    /api/email/templates        → Liste templates
POST   /api/email/templates        → Créer template
```

### Recherche
```
POST   /api/search/events          → Recherche textuelle
POST   /api/semantic/search        → Recherche sémantique
POST   /api/embeddings/search      → Recherche vectorielle
POST   /api/embeddings/generate-all → Générer embeddings
```

### Dashboard
```
GET    /api/dashboard/overview     → Vue d'ensemble
GET    /api/stats/events-per-day   → Stats emails/jour
GET    /api/stats/events-by-type   → Stats par type
```

### Alertes
```
GET    /api/alerts/requires-attention → Emails anomalies
GET    /api/alerts/center             → Centre anomalies
POST   /api/events/bulk-delete        → Suppression groupée
```

## 🔐 Sécurité

```mermaid
graph TB
    REQ[📨 Request]
    
    REQ --> AUTH{JWT Valid?}
    AUTH -->|No| 401[❌ 401 Unauthorized]
    AUTH -->|Yes| ROLE{Role Check}
    
    ROLE -->|OWNER| OWNER_ROUTES[Owner Routes]
    ROLE -->|AVOCAT| AVOCAT_ROUTES[Avocat Routes]
    ROLE -->|CLIENT| CLIENT_ROUTES[Client Routes]
    ROLE -->|Invalid| 403[❌ 403 Forbidden]
    
    OWNER_ROUTES --> EXEC[Execute]
    AVOCAT_ROUTES --> EXEC
    CLIENT_ROUTES --> EXEC
    
    EXEC --> AUDIT[📝 Audit Log]
    EXEC --> RESP[✅ Response]
```

## 📊 Stack Technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| **Framework** | ASP.NET Core | 9.0 |
| **ORM** | Entity Framework Core | 9.0 |
| **Database** | SQLite | 3.x |
| **Auth** | JWT Bearer | - |
| **Email** | MailKit | 4.15.0 |
| **Password** | BCrypt.Net | - |
| **Frontend** | HTML/CSS/JS | ES6+ |
| **Tests** | Jest | 29.7.0 |

## 📁 Structure Projet

```
MemoLib.Api/
├── Controllers/          # 62 controllers
│   ├── AuthController.cs
│   ├── CaseController.cs
│   ├── ClientController.cs
│   └── ...
├── Services/            # 48 services
│   ├── EmailMonitorService.cs
│   ├── JwtTokenService.cs
│   └── ...
├── Models/              # 32 models
│   ├── User.cs
│   ├── Case.cs
│   ├── Client.cs
│   └── ...
├── Data/                # 2 DbContext
│   └── MemoLibDbContext.cs
├── Migrations/          # EF Core migrations
├── wwwroot/             # Frontend
│   ├── demo.html
│   ├── js/
│   └── css/
├── __tests__/           # 70 tests Jest
└── Program.cs           # Entry point
```

## 🚀 Démarrage

```bash
# Restaurer packages
dotnet restore

# Créer DB
dotnet ef database update

# Configurer secrets
dotnet user-secrets set "EmailMonitor:Password" "your-app-password"

# Lancer
dotnet run
```

## 📈 Métriques

- **231 fichiers C#**
- **70 tests unitaires** (95% couverture)
- **62 Controllers**
- **48 Services**
- **32 Models**
- **200+ API endpoints**

---

**Version**: 2.1.0  
**Date**: 30 Janvier 2025
