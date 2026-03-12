# 🏗️ Diagrammes Techniques Architecture - MemoLib

## 📋 Table des Matières

1. [Architecture Système Globale](#1-architecture-système-globale)
2. [Diagrammes de Séquence API](#2-diagrammes-de-séquence-api)
3. [Modèle de Données](#3-modèle-de-données)
4. [Architecture des Services](#4-architecture-des-services)
5. [Flux de Données](#5-flux-de-données)
6. [Sécurité et Authentification](#6-sécurité-et-authentification)
7. [Monitoring et Observabilité](#7-monitoring-et-observabilité)
8. [Déploiement et Infrastructure](#8-déploiement-et-infrastructure)

---

## 1. Architecture Système Globale

### 1.1 Vue d'ensemble Architecture

```mermaid
graph TB
    subgraph "🌐 Frontend Layer"
        UI[📱 Interface Web]
        PWA[📲 Progressive Web App]
        Mobile[📱 Mobile Responsive]
    end
    
    subgraph "🔌 API Gateway Layer"
        Gateway[🚪 API Gateway]
        Auth[🔐 Authentication]
        RateLimit[⏱️ Rate Limiting]
        CORS[🌐 CORS Handler]
    end
    
    subgraph "⚙️ Application Layer"
        Controllers[🎮 Controllers]
        Services[🔧 Business Services]
        Validators[✅ Validators]
        Mappers[🔄 Data Mappers]
    end
    
    subgraph "💾 Data Layer"
        EF[🗃️ Entity Framework]
        SQLite[💽 SQLite Database]
        FileSystem[📁 File Storage]
        Cache[⚡ Memory Cache]
    end
    
    subgraph "🔌 External Services"
        Gmail[📧 Gmail IMAP/SMTP]
        SignalR[🔔 SignalR Hub]
        FileUpload[📎 File Upload Service]
        AI[🤖 AI/ML Services]
    end
    
    UI --> Gateway
    PWA --> Gateway
    Mobile --> Gateway
    
    Gateway --> Auth
    Gateway --> RateLimit
    Gateway --> CORS
    
    Auth --> Controllers
    RateLimit --> Controllers
    CORS --> Controllers
    
    Controllers --> Services
    Services --> Validators
    Services --> Mappers
    
    Validators --> EF
    Mappers --> EF
    EF --> SQLite
    EF --> FileSystem
    Services --> Cache
    
    Services --> Gmail
    Services --> SignalR
    Services --> FileUpload
    Services --> AI
    
    style UI fill:#e1f5fe
    style Gateway fill:#e8f5e8
    style Controllers fill:#fff3e0
    style EF fill:#f3e5f5
    style Gmail fill:#fce4ec
```

### 1.2 Architecture en Couches Détaillée

```mermaid
graph LR
    subgraph "🎨 Presentation Layer"
        HTML[📄 HTML5]
        CSS[🎨 CSS3]
        JS[⚡ JavaScript ES6+]
        Components[🧩 UI Components]
    end
    
    subgraph "🔌 API Layer"
        REST[🌐 REST API]
        Swagger[📚 Swagger/OpenAPI]
        Middleware[🔧 Middleware Pipeline]
        Filters[🎯 Action Filters]
    end
    
    subgraph "💼 Business Layer"
        EmailService[📧 Email Service]
        CaseService[📁 Case Service]
        ClientService[👥 Client Service]
        SearchService[🔍 Search Service]
        NotificationService[🔔 Notification Service]
        AnalyticsService[📊 Analytics Service]
    end
    
    subgraph "📊 Data Access Layer"
        Repositories[🗃️ Repositories]
        UnitOfWork[🔄 Unit of Work]
        DbContext[💾 DbContext]
        Migrations[🔄 Migrations]
    end
    
    subgraph "🗄️ Database Layer"
        Tables[📋 Tables]
        Indexes[🔍 Indexes]
        Constraints[🔒 Constraints]
        Triggers[⚡ Triggers]
    end
    
    HTML --> REST
    CSS --> REST
    JS --> REST
    Components --> REST
    
    REST --> EmailService
    Swagger --> CaseService
    Middleware --> ClientService
    Filters --> SearchService
    
    EmailService --> Repositories
    CaseService --> Repositories
    ClientService --> UnitOfWork
    SearchService --> DbContext
    
    Repositories --> Tables
    UnitOfWork --> Indexes
    DbContext --> Constraints
    Migrations --> Triggers
    
    style HTML fill:#e1f5fe
    style REST fill:#e8f5e8
    style EmailService fill:#fff3e0
    style Repositories fill:#f3e5f5
    style Tables fill:#fce4ec
```

---

## 2. Diagrammes de Séquence API

### 2.1 Séquence Complète Gestion Email

```mermaid
sequenceDiagram
    participant C as 📧 Client Gmail
    participant M as 🔄 Email Monitor
    participant A as 🔌 API
    participant S as 🔧 Services
    participant D as 💾 Database
    participant N as 🔔 Notifications
    participant U as 👤 User
    
    Note over C,U: 📥 Réception Email
    C->>M: Nouvel email reçu
    M->>M: Connexion IMAP toutes les 60s
    M->>A: POST /api/ingest/email
    
    Note over A,D: 🔍 Traitement Email
    A->>S: EmailIngestionService.ProcessEmail()
    S->>S: ExtractEmailMetadata()
    S->>S: DetectDuplicates()
    S->>D: CheckExistingEmail()
    D-->>S: Email unique confirmé
    
    Note over S,D: 🤖 Extraction Automatique
    S->>S: ExtractClientInfo() - Regex patterns
    S->>S: ExtractPhoneNumbers()
    S->>S: ExtractAddresses()
    S->>D: SaveEmailEvent()
    D-->>S: Email sauvegardé avec ID
    
    Note over S,U: 🔔 Notification Utilisateur
    S->>N: TriggerNotification()
    N->>N: CreateNotification(type: NEW_EMAIL)
    N->>U: SignalR push notification
    N->>U: Email notification (si configuré)
    
    Note over A,U: 📁 Création Dossier (Manuel)
    U->>A: POST /api/cases (depuis email)
    A->>S: CaseService.CreateFromEmail()
    S->>S: AutoFillCaseData()
    S->>D: CreateCase() + LinkToEmail()
    D-->>S: Case créé avec timeline
    S->>N: NotifyTeam(CASE_CREATED)
    N-->>U: Notification équipe
```

### 2.2 Séquence Workflow Dossier

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant A as 🔌 API
    participant S as 🔧 Case Service
    participant W as 🔄 Workflow Engine
    participant D as 💾 Database
    participant N as 🔔 Notifications
    participant T as 👥 Team
    
    Note over U,T: 🚀 Changement Statut
    U->>A: PATCH /api/cases/{id}/status
    A->>S: UpdateCaseStatus(id, newStatus)
    S->>W: ValidateStatusTransition()
    
    Note over W,D: ✅ Validation Workflow
    W->>W: CheckBusinessRules()
    W->>W: ValidateTransition(OPEN → IN_PROGRESS)
    W-->>S: Transition autorisée
    
    Note over S,D: 💾 Mise à jour Base
    S->>D: BeginTransaction()
    S->>D: UpdateCase(status, updatedAt, updatedBy)
    S->>D: CreateTimelineEvent(STATUS_CHANGED)
    S->>D: UpdateCaseMetrics()
    S->>D: CommitTransaction()
    
    Note over S,T: 🔔 Notifications Automatiques
    S->>N: TriggerStatusChangeNotification()
    N->>N: IdentifyStakeholders()
    N->>T: NotifyAssignedLawyer()
    N->>T: NotifyTeamMembers()
    N->>T: NotifyClient() (si configuré)
    
    Note over S,T: 📊 Analytics Update
    S->>S: UpdateAnalytics()
    S->>S: RecalculateMetrics()
    S->>D: UpdateDashboardStats()
    
    A-->>U: Status updated successfully
```

### 2.3 Séquence Recherche Multi-Modale

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant A as 🔌 API
    participant S as 🔍 Search Service
    participant T as 📝 Text Search
    participant E as 🧠 Embeddings
    participant V as 🎯 Vector DB
    participant D as 💾 Database
    
    Note over U,D: 🔍 Recherche Utilisateur
    U->>A: POST /api/search/events
    A->>S: SearchService.MultiModalSearch()
    
    Note over S,V: 📝 Recherche Textuelle
    par Recherche Parallèle
        S->>T: FullTextSearch(query)
        T->>D: SQL LIKE + FTS
        D-->>T: Text results
        T-->>S: Scored text results
    and 🧠 Recherche Sémantique
        S->>E: GenerateEmbeddings(query)
        E->>E: Transform to vector
        E->>V: VectorSimilaritySearch()
        V-->>E: Similar vectors
        E-->>S: Semantic results
    end
    
    Note over S,D: 🔄 Fusion Résultats
    S->>S: MergeResults(textResults, semanticResults)
    S->>S: DeduplicateResults()
    S->>S: RankByRelevance()
    S->>S: ApplyFilters(status, tags, dates)
    
    Note over S,U: 📊 Enrichissement
    S->>D: EnrichWithMetadata()
    S->>S: AddContextualInfo()
    S->>S: CalculateRelevanceScore()
    
    A-->>U: Merged and ranked results
```

---

## 3. Modèle de Données

### 3.1 Diagramme Entité-Relation Principal

```mermaid
erDiagram
    User ||--o{ Case : creates
    User ||--o{ EmailEvent : receives
    User ||--o{ Notification : receives
    User ||--o{ AuditLog : performs
    
    Case ||--o{ TimelineEvent : has
    Case ||--o{ CaseTag : has
    Case }o--|| Client : belongs_to
    Case }o--o| User : assigned_to
    
    Client ||--o{ Case : has
    Client ||--o{ EmailEvent : sends
    Client ||--o{ ClientContact : has
    
    EmailEvent ||--o{ Attachment : has
    EmailEvent }o--|| Case : linked_to
    
    TimelineEvent }o--|| Case : belongs_to
    TimelineEvent }o--|| User : created_by
    
    Attachment }o--|| EmailEvent : attached_to
    Attachment }o--o| TimelineEvent : attached_to
    
    User {
        int Id PK
        string Email UK
        string PasswordHash
        string FirstName
        string LastName
        string Role
        datetime CreatedAt
        datetime LastLoginAt
        bool IsActive
    }
    
    Case {
        int Id PK
        string Title
        string Description
        string Status
        int Priority
        datetime CreatedAt
        datetime UpdatedAt
        datetime DueDate
        int ClientId FK
        int AssignedToId FK
        int CreatedById FK
    }
    
    Client {
        int Id PK
        string FirstName
        string LastName
        string Email UK
        string Phone
        string Address
        string Company
        datetime CreatedAt
        datetime UpdatedAt
        int CreatedById FK
    }
    
    EmailEvent {
        int Id PK
        string MessageId UK
        string Subject
        string Body
        string FromEmail
        string ToEmail
        datetime ReceivedAt
        datetime ProcessedAt
        int CaseId FK
        int ClientId FK
        int UserId FK
    }
    
    TimelineEvent {
        int Id PK
        string EventType
        string Description
        json Metadata
        datetime CreatedAt
        int CaseId FK
        int CreatedById FK
    }
    
    Attachment {
        int Id PK
        string FileName
        string ContentType
        long FileSize
        string FilePath
        datetime UploadedAt
        int EmailEventId FK
        int TimelineEventId FK
    }
```

### 3.2 Modèle de Données Avancé

```mermaid
erDiagram
    FormTemplate ||--o{ FormSubmission : generates
    FormTemplate }o--|| User : created_by
    
    FormSubmission ||--o{ FormField : contains
    FormSubmission }o--|| Client : creates
    FormSubmission }o--|| Case : creates
    
    SharedSpace ||--o{ SpaceParticipant : has
    SharedSpace ||--o{ SharedDocument : contains
    SharedSpace }o--|| Case : linked_to
    
    SpaceParticipant }o--|| User : is
    SpaceParticipant }o--|| SharedSpace : participates_in
    
    Task ||--o{ TaskDependency : has
    Task }o--|| Case : belongs_to
    Task }o--|| User : assigned_to
    
    Invoice ||--o{ InvoiceItem : contains
    Invoice }o--|| Client : billed_to
    Invoice }o--|| Case : for
    
    FormTemplate {
        int Id PK
        string Name
        string Description
        json Fields
        json Validation
        string PublicUrl UK
        bool IsActive
        datetime CreatedAt
        int CreatedById FK
    }
    
    FormSubmission {
        int Id PK
        json FormData
        string Status
        datetime SubmittedAt
        datetime ProcessedAt
        int FormTemplateId FK
        int ClientId FK
        int CaseId FK
    }
    
    SharedSpace {
        int Id PK
        string Name
        string Description
        string AccessLevel
        datetime CreatedAt
        int CaseId FK
        int CreatedById FK
    }
    
    Task {
        int Id PK
        string Title
        string Description
        string Status
        int Priority
        datetime DueDate
        datetime CompletedAt
        int CaseId FK
        int AssignedToId FK
    }
    
    Invoice {
        int Id PK
        string InvoiceNumber UK
        decimal TotalAmount
        string Status
        datetime IssuedAt
        datetime DueDate
        datetime PaidAt
        int ClientId FK
        int CaseId FK
    }
```

---

## 4. Architecture des Services

### 4.1 Diagramme des Services Métier

```mermaid
graph TB
    subgraph "🔌 API Controllers"
        AuthController[🔐 AuthController]
        CaseController[📁 CaseController]
        EmailController[📧 EmailController]
        ClientController[👥 ClientController]
        SearchController[🔍 SearchController]
    end
    
    subgraph "🔧 Business Services"
        AuthService[🔐 AuthenticationService]
        CaseService[📁 CaseManagementService]
        EmailService[📧 EmailProcessingService]
        ClientService[👥 ClientManagementService]
        SearchService[🔍 SearchService]
        NotificationService[🔔 NotificationService]
        AnalyticsService[📊 AnalyticsService]
    end
    
    subgraph "🛠️ Infrastructure Services"
        EmailMonitor[📧 EmailMonitorService]
        FileService[📁 FileStorageService]
        CacheService[⚡ CacheService]
        AuditService[📋 AuditService]
        ConfigService[⚙️ ConfigurationService]
    end
    
    subgraph "🗃️ Data Services"
        UserRepository[👤 UserRepository]
        CaseRepository[📁 CaseRepository]
        EmailRepository[📧 EmailRepository]
        ClientRepository[👥 ClientRepository]
        UnitOfWork[🔄 UnitOfWork]
    end
    
    AuthController --> AuthService
    CaseController --> CaseService
    EmailController --> EmailService
    ClientController --> ClientService
    SearchController --> SearchService
    
    AuthService --> UserRepository
    CaseService --> CaseRepository
    EmailService --> EmailRepository
    ClientService --> ClientRepository
    
    CaseService --> NotificationService
    EmailService --> EmailMonitor
    SearchService --> CacheService
    
    NotificationService --> AuditService
    EmailMonitor --> FileService
    CacheService --> ConfigService
    
    UserRepository --> UnitOfWork
    CaseRepository --> UnitOfWork
    EmailRepository --> UnitOfWork
    ClientRepository --> UnitOfWork
    
    style AuthController fill:#e1f5fe
    style AuthService fill:#e8f5e8
    style EmailMonitor fill:#fff3e0
    style UserRepository fill:#f3e5f5
```

### 4.2 Injection de Dépendances

```mermaid
graph LR
    subgraph "🏗️ DI Container"
        Container[📦 Service Container]
    end
    
    subgraph "🔧 Service Registration"
        Scoped[🔄 Scoped Services]
        Singleton[🎯 Singleton Services]
        Transient[⚡ Transient Services]
    end
    
    subgraph "🔌 Interface Abstractions"
        IAuthService[🔐 IAuthenticationService]
        ICaseService[📁 ICaseService]
        IEmailService[📧 IEmailService]
        IRepository[🗃️ IRepository<T>]
    end
    
    subgraph "💼 Concrete Implementations"
        AuthServiceImpl[🔐 AuthenticationService]
        CaseServiceImpl[📁 CaseService]
        EmailServiceImpl[📧 EmailService]
        RepositoryImpl[🗃️ Repository<T>]
    end
    
    Container --> Scoped
    Container --> Singleton
    Container --> Transient
    
    Scoped --> IAuthService
    Scoped --> ICaseService
    Singleton --> IEmailService
    Transient --> IRepository
    
    IAuthService --> AuthServiceImpl
    ICaseService --> CaseServiceImpl
    IEmailService --> EmailServiceImpl
    IRepository --> RepositoryImpl
    
    style Container fill:#e1f5fe
    style Scoped fill:#e8f5e8
    style IAuthService fill:#fff3e0
    style AuthServiceImpl fill:#f3e5f5
```

---

## 5. Flux de Données

### 5.1 Flux de Données Email Processing

```mermaid
flowchart TD
    Gmail[📧 Gmail IMAP] --> Monitor[🔄 Email Monitor]
    Monitor --> Queue[📋 Processing Queue]
    
    Queue --> Validate[✅ Validation]
    Validate --> Extract[🔍 Data Extraction]
    Extract --> Dedupe[🔄 Deduplication]
    
    Dedupe --> Store[💾 Store Email]
    Store --> Index[🔍 Full-Text Index]
    Index --> Embeddings[🧠 Generate Embeddings]
    
    Embeddings --> Notify[🔔 Notifications]
    Notify --> Analytics[📊 Update Analytics]
    Analytics --> Cache[⚡ Update Cache]
    
    Cache --> Dashboard[📊 Dashboard Update]
    
    subgraph "🔍 Data Extraction"
        ExtractClient[👥 Client Info]
        ExtractPhone[📞 Phone Numbers]
        ExtractAddress[📍 Addresses]
        ExtractDates[📅 Important Dates]
    end
    
    Extract --> ExtractClient
    Extract --> ExtractPhone
    Extract --> ExtractAddress
    Extract --> ExtractDates
    
    style Gmail fill:#e1f5fe
    style Monitor fill:#e8f5e8
    style Extract fill:#fff3e0
    style Store fill:#f3e5f5
```

### 5.2 Flux de Données Recherche

```mermaid
flowchart LR
    Query[🔍 User Query] --> Parser[📝 Query Parser]
    Parser --> Router[🎯 Search Router]
    
    Router --> TextSearch[📄 Text Search]
    Router --> SemanticSearch[🧠 Semantic Search]
    Router --> FilterSearch[🎛️ Filter Search]
    
    TextSearch --> TextDB[(💾 Text Index)]
    SemanticSearch --> VectorDB[(🎯 Vector DB)]
    FilterSearch --> MainDB[(💾 Main DB)]
    
    TextDB --> TextResults[📄 Text Results]
    VectorDB --> SemanticResults[🧠 Semantic Results]
    MainDB --> FilterResults[🎛️ Filter Results]
    
    TextResults --> Merger[🔄 Result Merger]
    SemanticResults --> Merger
    FilterResults --> Merger
    
    Merger --> Ranker[📊 Relevance Ranker]
    Ranker --> Enricher[💎 Result Enricher]
    Enricher --> Cache[⚡ Cache Results]
    Cache --> Response[📱 API Response]
    
    style Query fill:#e1f5fe
    style Router fill:#e8f5e8
    style Merger fill:#fff3e0
    style Response fill:#f3e5f5
```

---

## 6. Sécurité et Authentification

### 6.1 Architecture Sécurité

```mermaid
graph TB
    subgraph "🔐 Authentication Layer"
        Login[🔑 Login Endpoint]
        JWT[🎫 JWT Token Service]
        Refresh[🔄 Token Refresh]
        Logout[🚪 Logout Service]
    end
    
    subgraph "🛡️ Authorization Layer"
        RoleCheck[👨💼 Role Verification]
        PermissionCheck[🔒 Permission Check]
        ResourceAccess[📁 Resource Access Control]
        PolicyEngine[📋 Policy Engine]
    end
    
    subgraph "🔒 Security Middleware"
        HTTPS[🔒 HTTPS Enforcement]
        CORS[🌐 CORS Policy]
        RateLimit[⏱️ Rate Limiting]
        InputValidation[✅ Input Validation]
    end
    
    subgraph "🛠️ Security Services"
        PasswordHash[🔐 Password Hashing (BCrypt)]
        Encryption[🔒 Data Encryption]
        AuditLog[📋 Security Audit]
        ThreatDetection[🚨 Threat Detection]
    end
    
    Login --> JWT
    JWT --> RoleCheck
    RoleCheck --> PermissionCheck
    PermissionCheck --> ResourceAccess
    
    HTTPS --> Login
    CORS --> JWT
    RateLimit --> RoleCheck
    InputValidation --> PermissionCheck
    
    JWT --> PasswordHash
    ResourceAccess --> Encryption
    PolicyEngine --> AuditLog
    ThreatDetection --> AuditLog
    
    style Login fill:#e1f5fe
    style RoleCheck fill:#e8f5e8
    style HTTPS fill:#fff3e0
    style PasswordHash fill:#f3e5f5
```

### 6.2 Flux d'Authentification JWT

```mermaid
sequenceDiagram
    participant C as 👤 Client
    participant A as 🔐 Auth API
    participant J as 🎫 JWT Service
    participant D as 💾 Database
    participant R as 🔄 Resource API
    
    Note over C,R: 🔑 Login Process
    C->>A: POST /api/auth/login {email, password}
    A->>D: Verify user credentials
    D-->>A: User found + password hash
    A->>A: BCrypt.Verify(password, hash)
    A->>J: Generate JWT token
    J->>J: Create token with claims {userId, role, exp}
    J-->>A: JWT token + refresh token
    A-->>C: {token, refreshToken, user, expiresIn}
    
    Note over C,R: 🔒 Authenticated Request
    C->>R: GET /api/cases (Authorization: Bearer <token>)
    R->>J: Validate JWT token
    J->>J: Verify signature + expiration
    J-->>R: Token valid + user claims
    R->>R: Check user permissions
    R->>D: Fetch user's cases
    D-->>R: Cases data
    R-->>C: Cases response
    
    Note over C,R: 🔄 Token Refresh
    C->>A: POST /api/auth/refresh {refreshToken}
    A->>D: Verify refresh token
    D-->>A: Refresh token valid
    A->>J: Generate new JWT
    J-->>A: New JWT token
    A-->>C: {token, expiresIn}
```

---

## 7. Monitoring et Observabilité

### 7.1 Architecture Monitoring

```mermaid
graph TB
    subgraph "📊 Application Metrics"
        AppMetrics[📈 Application Metrics]
        BusinessMetrics[💼 Business Metrics]
        UserMetrics[👤 User Metrics]
        PerformanceMetrics[⚡ Performance Metrics]
    end
    
    subgraph "📋 Logging System"
        StructuredLogs[📝 Structured Logging]
        ErrorLogs[❌ Error Logging]
        AuditLogs[📋 Audit Logging]
        SecurityLogs[🔒 Security Logging]
    end
    
    subgraph "🔔 Alerting System"
        ThresholdAlerts[⚠️ Threshold Alerts]
        AnomalyDetection[🔍 Anomaly Detection]
        HealthChecks[💚 Health Checks]
        UptimeMonitoring[⏰ Uptime Monitoring]
    end
    
    subgraph "📊 Dashboards"
        OperationalDashboard[🎛️ Operational Dashboard]
        BusinessDashboard[💼 Business Dashboard]
        SecurityDashboard[🔒 Security Dashboard]
        UserDashboard[👤 User Dashboard]
    end
    
    AppMetrics --> StructuredLogs
    BusinessMetrics --> AuditLogs
    UserMetrics --> SecurityLogs
    PerformanceMetrics --> ErrorLogs
    
    StructuredLogs --> ThresholdAlerts
    ErrorLogs --> AnomalyDetection
    AuditLogs --> HealthChecks
    SecurityLogs --> UptimeMonitoring
    
    ThresholdAlerts --> OperationalDashboard
    AnomalyDetection --> BusinessDashboard
    HealthChecks --> SecurityDashboard
    UptimeMonitoring --> UserDashboard
    
    style AppMetrics fill:#e1f5fe
    style StructuredLogs fill:#e8f5e8
    style ThresholdAlerts fill:#fff3e0
    style OperationalDashboard fill:#f3e5f5
```

### 7.2 Métriques Clés

```mermaid
graph LR
    subgraph "⚡ Performance Metrics"
        ResponseTime[⏱️ Response Time]
        Throughput[📊 Throughput]
        ErrorRate[❌ Error Rate]
        Availability[✅ Availability]
    end
    
    subgraph "💼 Business Metrics"
        CasesCreated[📁 Cases Created/Day]
        EmailsProcessed[📧 Emails Processed/Hour]
        UserActivity[👤 Active Users]
        ClientSatisfaction[😊 Client Satisfaction]
    end
    
    subgraph "🔒 Security Metrics"
        FailedLogins[🚫 Failed Login Attempts]
        SecurityEvents[🚨 Security Events]
        DataBreaches[🔓 Data Breach Attempts]
        AccessViolations[⛔ Access Violations]
    end
    
    subgraph "📊 System Metrics"
        CPUUsage[🖥️ CPU Usage]
        MemoryUsage[💾 Memory Usage]
        DiskUsage[💽 Disk Usage]
        NetworkLatency[🌐 Network Latency]
    end
    
    ResponseTime --> Alert1[🚨 > 3s Alert]
    ErrorRate --> Alert2[🚨 > 5% Alert]
    FailedLogins --> Alert3[🚨 > 10/min Alert]
    CPUUsage --> Alert4[🚨 > 80% Alert]
    
    style ResponseTime fill:#e1f5fe
    style CasesCreated fill:#e8f5e8
    style FailedLogins fill:#fff3e0
    style CPUUsage fill:#f3e5f5
```

---

## 8. Déploiement et Infrastructure

### 8.1 Architecture de Déploiement Local

```mermaid
graph TB
    subgraph "💻 Local Development"
        DevMachine[🖥️ Developer Machine]
        LocalDB[💾 SQLite Local]
        LocalFiles[📁 Local File Storage]
        LocalCache[⚡ In-Memory Cache]
    end
    
    subgraph "🏢 On-Premise Production"
        WebServer[🌐 Web Server (IIS/Kestrel)]
        AppServer[⚙️ Application Server]
        FileServer[📁 File Server]
        BackupServer[💾 Backup Server]
    end
    
    subgraph "☁️ Cloud Deployment (Optional)"
        AppService[🌐 Azure App Service]
        SQLDatabase[💾 Azure SQL Database]
        BlobStorage[📁 Azure Blob Storage]
        KeyVault[🔐 Azure Key Vault]
    end
    
    DevMachine --> LocalDB
    DevMachine --> LocalFiles
    DevMachine --> LocalCache
    
    WebServer --> AppServer
    AppServer --> FileServer
    FileServer --> BackupServer
    
    AppService --> SQLDatabase
    AppService --> BlobStorage
    AppService --> KeyVault
    
    style DevMachine fill:#e1f5fe
    style WebServer fill:#e8f5e8
    style AppService fill:#fff3e0
```

### 8.2 Pipeline CI/CD

```mermaid
flowchart LR
    Dev[👨💻 Developer] --> Git[📚 Git Repository]
    Git --> Trigger[⚡ CI Trigger]
    
    Trigger --> Build[🔨 Build Stage]
    Build --> Test[🧪 Test Stage]
    Test --> Security[🔒 Security Scan]
    Security --> Package[📦 Package Stage]
    
    Package --> Deploy[🚀 Deploy Stage]
    Deploy --> Smoke[💨 Smoke Tests]
    Smoke --> Monitor[📊 Monitoring]
    
    subgraph "🔨 Build Stage"
        Restore[📦 Restore Packages]
        Compile[⚙️ Compile Code]
        Validate[✅ Code Validation]
    end
    
    subgraph "🧪 Test Stage"
        UnitTests[🔬 Unit Tests]
        IntegrationTests[🔗 Integration Tests]
        E2ETests[🎭 E2E Tests]
    end
    
    subgraph "🚀 Deploy Stage"
        Staging[🎪 Staging Deploy]
        Production[🏭 Production Deploy]
        Rollback[↩️ Rollback Plan]
    end
    
    Build --> Restore
    Restore --> Compile
    Compile --> Validate
    
    Test --> UnitTests
    UnitTests --> IntegrationTests
    IntegrationTests --> E2ETests
    
    Deploy --> Staging
    Staging --> Production
    Production --> Rollback
    
    style Dev fill:#e1f5fe
    style Build fill:#e8f5e8
    style Test fill:#fff3e0
    style Deploy fill:#f3e5f5
```

---

## 📊 Métriques Architecture

### Performance Targets

| Composant | Métrique | Target | Limite |
|-----------|----------|---------|---------|
| 🔌 API Response | Temps moyen | < 200ms | < 1s |
| 📧 Email Processing | Throughput | 100 emails/min | 500 emails/min |
| 🔍 Search | Temps réponse | < 500ms | < 2s |
| 💾 Database | Connexions | < 50 concurrent | < 100 concurrent |
| 📊 Dashboard | Refresh | < 3s | < 10s |

### Scalabilité

```mermaid
graph LR
    subgraph "📈 Scaling Strategies"
        Vertical[⬆️ Vertical Scaling]
        Horizontal[➡️ Horizontal Scaling]
        Database[💾 Database Scaling]
        Cache[⚡ Cache Scaling]
    end
    
    subgraph "🎯 Scaling Triggers"
        CPU[🖥️ CPU > 70%]
        Memory[💾 Memory > 80%]
        Connections[🔗 Connections > 80]
        ResponseTime[⏱️ Response > 2s]
    end
    
    CPU --> Vertical
    Memory --> Horizontal
    Connections --> Database
    ResponseTime --> Cache
    
    style Vertical fill:#e1f5fe
    style CPU fill:#fff3e0
```

---

## 🔧 Points d'Extension Architecture

### 1. **Microservices Migration Path**
- Extraction des services métier en microservices indépendants
- API Gateway pour routage et authentification centralisée
- Event-driven architecture avec message queues

### 2. **Cloud-Native Enhancements**
- Containerisation avec Docker
- Orchestration avec Kubernetes
- Service mesh pour communication inter-services

### 3. **Advanced Analytics**
- Data warehouse pour analytics avancées
- Machine learning pour prédictions
- Real-time streaming analytics

### 4. **Mobile Applications**
- API-first design pour support mobile natif
- Offline-first architecture
- Push notifications natives

---

## 📝 Conclusion

Cette architecture technique de MemoLib est conçue pour être :

- ✅ **Scalable** : Peut évoluer de 1 à 1000+ utilisateurs
- ✅ **Maintenable** : Code modulaire et bien structuré
- ✅ **Sécurisée** : Sécurité par design à tous les niveaux
- ✅ **Observable** : Monitoring et logging complets
- ✅ **Testable** : Architecture permettant tests automatisés
- ✅ **Évolutive** : Prête pour futures extensions

L'architecture actuelle répond parfaitement aux besoins des cabinets d'avocats tout en gardant une complexité maîtrisée et des coûts optimisés.