# 📊 DIAGRAMMES ARCHITECTURAUX - MemoLib

**Date**: 27 février 2026  
**Version**: 1.0.0

---

## 🏗️ DIAGRAMME 1: Architecture Globale

```mermaid
graph TB
    subgraph "CLIENT LAYER"
        Browser[🌐 Browser]
        Mobile[📱 Mobile App]
    end

    subgraph "FRONTEND - Next.js 16"
        NextJS[Next.js App Router]
        Pages[Pages/Routes]
        Components[React Components]
        APIRoutes[API Routes]
        NextAuth[NextAuth.js]
    end

    subgraph "BACKEND - ASP.NET Core 9.0"
        API[API Gateway]
        Controllers[65 Controllers]
        Services[40 Services]
        Middleware[Middleware Stack]
        SignalR[SignalR Hubs]
        Background[Background Jobs]
    end

    subgraph "DATA LAYER"
        SQLite[(SQLite Dev)]
        PostgreSQL[(PostgreSQL Prod)]
        Redis[(Redis Cache)]
    end

    subgraph "EXTERNAL SERVICES"
        Gmail[📧 Gmail IMAP/SMTP]
        Twilio[📱 Twilio SMS]
        OpenAI[🤖 OpenAI API]
        Sentry[📊 Sentry]
        Azure[☁️ Azure Services]
    end

    Browser --> NextJS
    Mobile --> NextJS
    NextJS --> Pages
    NextJS --> Components
    NextJS --> APIRoutes
    NextJS --> NextAuth
    
    APIRoutes --> API
    NextAuth --> API
    
    API --> Controllers
    Controllers --> Services
    Controllers --> Middleware
    Services --> SignalR
    Services --> Background
    
    Services --> SQLite
    Services --> PostgreSQL
    Services --> Redis
    
    Services --> Gmail
    Services --> Twilio
    Services --> OpenAI
    Services --> Sentry
    Services --> Azure

    style NextJS fill:#61dafb
    style API fill:#512bd4
    style PostgreSQL fill:#336791
    style Redis fill:#dc382d
```

---

## 🔄 DIAGRAMME 2: Flux de Données Principal

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as Frontend
    participant A as API Gateway
    participant C as Controller
    participant S as Service
    participant D as Database
    participant E as External API

    U->>F: 1. Action (Create Case)
    F->>F: 2. Validate Input
    F->>A: 3. POST /api/v1/cases
    A->>A: 4. JWT Validation
    A->>A: 5. RBAC Check
    A->>C: 6. Route to Controller
    C->>C: 7. FluentValidation
    C->>S: 8. Call Service
    S->>D: 9. Save to DB
    D-->>S: 10. Return Entity
    S->>E: 11. Send Notification
    E-->>S: 12. Confirmation
    S-->>C: 13. Return Result
    C-->>A: 14. HTTP 201 Created
    A-->>F: 15. JSON Response
    F->>F: 16. Update UI
    F-->>U: 17. Show Success
```

---

## 🗂️ DIAGRAMME 3: Structure des Controllers

```mermaid
graph LR
    subgraph "AUTH & SECURITY (5)"
        Auth[AuthController]
        SecAuth[SecureAuthController]
        Security[SecurityController]
    end

    subgraph "CORE BUSINESS (15)"
        Case[CaseController]
        Client[ClientController]
        Email[EmailController]
        Dashboard[DashboardController]
    end

    subgraph "ADVANCED (20)"
        Billing[BillingController]
        Calendar[CalendarController]
        Webhooks[WebhooksController]
        Signatures[SignaturesController]
    end

    subgraph "INTEGRATIONS (10)"
        Telegram[TelegramController]
        Messenger[MessengerController]
        Universal[UniversalGatewayController]
    end

    subgraph "DOCUMENTS (8)"
        Attachment[AttachmentController]
        CaseDoc[CaseDocumentsController]
        Forms[DynamicFormsController]
    end

    subgraph "ADMIN (7)"
        Stats[StatsController]
        Audit[AuditController]
        Alerts[AlertsController]
    end

    Auth --> Services
    Case --> Services
    Billing --> Services
    Telegram --> Services
    Attachment --> Services
    Stats --> Services

    Services[Service Layer]
    Services --> Database[(Database)]

    style Auth fill:#ff6b6b
    style Case fill:#4ecdc4
    style Billing fill:#ffe66d
    style Telegram fill:#a8e6cf
    style Attachment fill:#ffd3b6
    style Stats fill:#ffaaa5
```

---

## 🔐 DIAGRAMME 4: Sécurité & Authentification

```mermaid
graph TB
    subgraph "AUTHENTICATION"
        Login[Login Request]
        JWT[JWT Token Service]
        Refresh[Refresh Token]
        BCrypt[BCrypt Hashing]
    end

    subgraph "AUTHORIZATION - RBAC"
        Owner[👑 Owner]
        Admin[🔧 Admin]
        Manager[📊 Manager]
        Agent[👨‍💼 Agent]
        User[👤 User]
        Client[🙋 Client]
    end

    subgraph "POLICIES (30+)"
        ViewCases[View Cases]
        CreateCases[Create Cases]
        EditCases[Edit Cases]
        DeleteCases[Delete Cases]
        ManageUsers[Manage Users]
        ViewAudit[View Audit]
    end

    subgraph "SECURITY LAYERS"
        HTTPS[HTTPS/TLS]
        CORS[CORS Policy]
        RateLimit[Rate Limiting]
        Headers[Security Headers]
        Audit[Audit Logging]
    end

    Login --> JWT
    JWT --> BCrypt
    JWT --> Refresh

    Owner --> ManageUsers
    Owner --> ViewAudit
    Admin --> ManageUsers
    Manager --> EditCases
    Agent --> CreateCases
    User --> ViewCases
    Client --> ViewCases

    ViewCases --> HTTPS
    CreateCases --> HTTPS
    HTTPS --> CORS
    CORS --> RateLimit
    RateLimit --> Headers
    Headers --> Audit

    style Owner fill:#ffd700
    style Admin fill:#ff6347
    style Manager fill:#4169e1
    style Agent fill:#32cd32
    style User fill:#87ceeb
    style Client fill:#dda0dd
```

---

## 📦 DIAGRAMME 5: Modèle de Données

```mermaid
erDiagram
    USER ||--o{ CASE : owns
    USER ||--o{ CLIENT : manages
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ AUDIT_LOG : generates
    
    CASE ||--o{ CASE_EVENT : contains
    CASE ||--o{ CASE_NOTE : has
    CASE ||--o{ CASE_TASK : includes
    CASE ||--o{ CASE_DOCUMENT : stores
    CASE ||--o{ CASE_COMMENT : has
    CASE }o--|| CLIENT : belongs_to
    
    EVENT ||--o{ CASE_EVENT : links
    EVENT }o--|| SOURCE : from
    EVENT ||--o{ ATTACHMENT : has
    
    CASE_TASK ||--o{ TASK_DEPENDENCY : depends_on
    CASE_TASK ||--o{ TASK_CHECKLIST : contains
    
    CASE ||--o{ TIME_ENTRY : tracks
    TIME_ENTRY ||--o{ INVOICE_ITEM : bills
    INVOICE_ITEM }o--|| INVOICE : belongs_to
    
    USER ||--o{ WEBHOOK : configures
    WEBHOOK ||--o{ WEBHOOK_LOG : logs
    
    USER {
        guid Id PK
        string Email UK
        string Role
        string PasswordHash
        datetime CreatedAt
    }
    
    CASE {
        guid Id PK
        guid UserId FK
        guid ClientId FK
        string Title
        string Status
        int Priority
        datetime CreatedAt
        datetime UpdatedAt
    }
    
    CLIENT {
        guid Id PK
        guid UserId FK
        string Name
        string Email
        string Phone
        string Address
    }
    
    EVENT {
        guid Id PK
        guid SourceId FK
        string ExternalId
        string Checksum UK
        datetime OccurredAt
        string RawPayload
    }
```

---

## 🔄 DIAGRAMME 6: Workflow Email Monitoring

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Connecting: Timer (60s)
    Connecting --> Connected: IMAP Success
    Connecting --> Error: Connection Failed
    Error --> Idle: Retry After 5min
    
    Connected --> Fetching: Get Unread Emails
    Fetching --> Processing: Emails Found
    Fetching --> Idle: No New Emails
    
    Processing --> Validating: Parse Email
    Validating --> Extracting: Valid Format
    Validating --> Rejected: Invalid Format
    
    Extracting --> CheckDuplicate: Extract Client Info
    CheckDuplicate --> CreateEvent: New Email
    CheckDuplicate --> Skip: Duplicate Found
    
    CreateEvent --> NotifyUser: Event Saved
    NotifyUser --> Idle: Notification Sent
    
    Skip --> Idle
    Rejected --> Idle
```

---

## 🚀 DIAGRAMME 7: Déploiement Production

```mermaid
graph TB
    subgraph "GITHUB"
        Repo[Repository]
        Actions[GitHub Actions]
    end

    subgraph "CI/CD PIPELINE"
        Build[Build & Test]
        Security[Security Scan]
        Docker[Docker Build]
    end

    subgraph "VERCEL (Frontend)"
        Edge[Edge Network]
        SSR[SSR Functions]
        Static[Static Assets]
    end

    subgraph "FLY.IO (Backend)"
        API1[API Instance 1]
        API2[API Instance 2]
        LB[Load Balancer]
    end

    subgraph "DATABASE"
        Neon[(Neon PostgreSQL)]
        Backup[(Daily Backup)]
    end

    subgraph "CACHE & STORAGE"
        Upstash[(Upstash Redis)]
        Blob[Vercel Blob]
    end

    subgraph "MONITORING"
        Sentry[Sentry Errors]
        Logs[Application Logs]
        Metrics[Performance Metrics]
    end

    Repo --> Actions
    Actions --> Build
    Build --> Security
    Security --> Docker
    
    Docker --> Vercel
    Docker --> FLY.IO
    
    Vercel --> Edge
    Edge --> SSR
    Edge --> Static
    
    FLY.IO --> LB
    LB --> API1
    LB --> API2
    
    API1 --> Neon
    API2 --> Neon
    Neon --> Backup
    
    API1 --> Upstash
    API2 --> Upstash
    SSR --> Blob
    
    API1 --> Sentry
    API2 --> Sentry
    API1 --> Logs
    API2 --> Logs
    API1 --> Metrics
    API2 --> Metrics

    style Vercel fill:#000000,color:#ffffff
    style FLY.IO fill:#7b3ff2,color:#ffffff
    style Neon fill:#00e699
    style Upstash fill:#00e9a3
```

---

## 📊 DIAGRAMME 8: Scalabilité (3 Phases)

```mermaid
graph LR
    subgraph "PHASE 1: Vertical (0-1K users)"
        V1[1 Instance<br/>2 CPU, 2GB RAM]
        V1DB[(SQLite/PostgreSQL)]
        V1Cache[In-Memory Cache]
    end

    subgraph "PHASE 2: Horizontal (1K-10K users)"
        H1[Instance 1]
        H2[Instance 2]
        H3[Instance 3]
        HLB[Load Balancer]
        H2DB[(PostgreSQL Cluster<br/>Primary + 2 Replicas)]
        H2Cache[(Redis Cluster)]
    end

    subgraph "PHASE 3: Microservices (10K+ users)"
        M1[Auth Service]
        M2[Case Service]
        M3[Email Service]
        M4[Notification Service]
        MGW[API Gateway]
        MBus[Event Bus<br/>RabbitMQ]
        M3DB[(PostgreSQL Sharded)]
        M3Cache[(Redis Cluster)]
        M3CDN[CDN<br/>Cloudflare]
    end

    V1 --> V1DB
    V1 --> V1Cache

    HLB --> H1
    HLB --> H2
    HLB --> H3
    H1 --> H2DB
    H2 --> H2DB
    H3 --> H2DB
    H1 --> H2Cache
    H2 --> H2Cache
    H3 --> H2Cache

    MGW --> M1
    MGW --> M2
    MGW --> M3
    MGW --> M4
    M1 --> MBus
    M2 --> MBus
    M3 --> MBus
    M4 --> MBus
    M1 --> M3DB
    M2 --> M3DB
    M3 --> M3DB
    M4 --> M3DB
    M1 --> M3Cache
    M2 --> M3Cache
    M3 --> M3Cache
    M4 --> M3Cache
    MGW --> M3CDN

    style V1 fill:#90ee90
    style HLB fill:#ffd700
    style MGW fill:#ff6347
```

---

## 🔍 DIAGRAMME 9: Monitoring & Observabilité

```mermaid
graph TB
    subgraph "APPLICATION"
        API[API Instances]
        Frontend[Frontend]
        Background[Background Jobs]
    end

    subgraph "LOGS"
        Serilog[Serilog]
        FileLog[File Logs]
        Console[Console Output]
    end

    subgraph "METRICS"
        AppInsights[Application Insights]
        Custom[Custom Metrics]
        Performance[Performance Counters]
    end

    subgraph "ERRORS"
        Sentry[Sentry]
        ErrorLog[Error Tracking]
        Alerts[Alert System]
    end

    subgraph "HEALTH"
        HealthCheck[Health Checks]
        DBHealth[Database Health]
        APIHealth[API Health]
        CacheHealth[Cache Health]
    end

    subgraph "DASHBOARDS"
        Grafana[Grafana]
        Custom2[Custom Dashboard]
        RealTime[Real-time Metrics]
    end

    API --> Serilog
    Frontend --> Serilog
    Background --> Serilog
    
    Serilog --> FileLog
    Serilog --> Console
    
    API --> AppInsights
    API --> Custom
    API --> Performance
    
    API --> Sentry
    Frontend --> Sentry
    Sentry --> ErrorLog
    ErrorLog --> Alerts
    
    API --> HealthCheck
    HealthCheck --> DBHealth
    HealthCheck --> APIHealth
    HealthCheck --> CacheHealth
    
    AppInsights --> Grafana
    Custom --> Grafana
    Performance --> Grafana
    Grafana --> Custom2
    Grafana --> RealTime

    style Sentry fill:#362d59,color:#ffffff
    style Grafana fill:#f46800,color:#ffffff
    style AppInsights fill:#0078d4,color:#ffffff
```

---

## 📈 DIAGRAMME 10: Performance Optimization

```mermaid
graph TB
    subgraph "REQUEST FLOW"
        Client[Client Request]
        CDN[CDN Cache]
        LB[Load Balancer]
        API[API Server]
    end

    subgraph "CACHING LAYERS"
        L1[L1: Browser Cache]
        L2[L2: CDN Cache]
        L3[L3: Redis Cache]
        L4[L4: In-Memory Cache]
    end

    subgraph "DATABASE OPTIMIZATION"
        Indexes[Indexes]
        Pooling[Connection Pooling]
        ReadReplica[Read Replicas]
        QueryOpt[Query Optimization]
    end

    subgraph "CODE OPTIMIZATION"
        Async[Async/Await]
        Lazy[Lazy Loading]
        Compression[Response Compression]
        Minify[Minification]
    end

    Client --> L1
    L1 --> CDN
    CDN --> L2
    L2 --> LB
    LB --> API
    API --> L3
    L3 --> L4
    L4 --> Database

    Database --> Indexes
    Database --> Pooling
    Database --> ReadReplica
    Database --> QueryOpt

    API --> Async
    API --> Lazy
    API --> Compression
    CDN --> Minify

    style L1 fill:#90ee90
    style L2 fill:#87ceeb
    style L3 fill:#ffd700
    style L4 fill:#ff6347
```

---

## 🎯 LÉGENDE

### Couleurs
- 🟢 **Vert**: Développement / OK
- 🔵 **Bleu**: Production / Stable
- 🟡 **Jaune**: Attention / Optimisation
- 🔴 **Rouge**: Critique / Action requise
- 🟣 **Violet**: Externe / Tiers

### Symboles
- 📦 **Boîte**: Composant / Service
- 🗄️ **Cylindre**: Base de données
- ⚡ **Éclair**: Cache / Performance
- 🔒 **Cadenas**: Sécurité
- 📊 **Graphique**: Monitoring
- 🔄 **Flèches**: Flux de données

---

## 📝 NOTES D'UTILISATION

### Visualisation Mermaid
Ces diagrammes utilisent la syntaxe Mermaid et peuvent être visualisés dans:
- GitHub (rendu automatique)
- VS Code (extension Mermaid)
- Mermaid Live Editor: https://mermaid.live
- Documentation sites (GitBook, Docusaurus)

### Export
```bash
# Installer Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Générer PNG
mmdc -i DIAGRAMMES_ARCHITECTURE.md -o diagrams.png

# Générer SVG
mmdc -i DIAGRAMMES_ARCHITECTURE.md -o diagrams.svg
```

---

**Dernière mise à jour**: 27 février 2026  
**Auteur**: Architecte Logiciel Senior
