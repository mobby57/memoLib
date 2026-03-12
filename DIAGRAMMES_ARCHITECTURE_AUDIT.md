# 📐 DIAGRAMMES ARCHITECTURE - MemoLib

## 1. Architecture Actuelle (AS-IS)

```mermaid
graph TB
    subgraph "Frontend Layer"
        HTML[50+ HTML Pages<br/>demo.html, dashboard.html...]
        JS[Vanilla JavaScript<br/>No framework]
    end

    subgraph "API Layer - ASP.NET Core 9.0"
        MW[Middleware Stack<br/>Security, RateLimit, Cache]
        
        subgraph "67 Controllers (!)"
            AUTH[AuthController]
            CASE[CaseController]
            CASE2[CaseManagementController]
            CASE3[CasesControllerV2]
            EMAIL[EmailController]
            CLIENT[ClientController]
            SEARCH[SearchController]
            VAULT[VaultController]
            DOTS[... 60+ more]
        end
        
        subgraph "40+ Services"
            JWT[JwtTokenService]
            PWD[PasswordService]
            BRUTE[BruteForceProtection]
            EMAILMON[EmailMonitorService<br/>BackgroundService]
            EMBED[EmbeddingService]
            NOTIF[NotificationService]
            INTEL[IntelligentWorkspaceOrganizer]
            SIGNAL[SignalCommandCenter]
        end
        
        subgraph "SignalR Hubs"
            HUB1[NotificationHub]
            HUB2[RealtimeHub]
        end
    end

    subgraph "Data Layer"
        EF[Entity Framework Core 9]
        SQLITE[(SQLite Dev<br/>memolib.db)]
        POSTGRES[(PostgreSQL Prod<br/>Optional)]
    end

    subgraph "External Services"
        GMAIL[Gmail IMAP<br/>MailKit 4.9]
        TWILIO[Twilio SMS<br/>Not tested]
        REDIS[Redis<br/>Referenced, not used]
    end

    HTML --> MW
    JS --> MW
    MW --> AUTH
    MW --> CASE
    MW --> EMAIL
    MW --> DOTS
    
    AUTH --> JWT
    AUTH --> PWD
    AUTH --> BRUTE
    CASE --> INTEL
    EMAIL --> EMAILMON
    
    EMAILMON --> GMAIL
    SIGNAL --> TWILIO
    
    JWT --> EF
    CASE --> EF
    EMAIL --> EF
    
    EF --> SQLITE
    EF -.-> POSTGRES
    
    NOTIF --> HUB1
    SIGNAL --> HUB2

    style DOTS fill:#ff6b6b
    style EMAILMON fill:#ffd93d
    style REDIS fill:#ccc
    style TWILIO fill:#ccc
```

### Problèmes Identifiés (AS-IS)
- 🔴 **67 Controllers** → Maintenance impossible
- 🔴 **EmailMonitor** → Pas de circuit breaker, timeout fixe
- 🔴 **Redis** → Référencé mais pas utilisé
- 🔴 **Tests** → 0% couverture
- 🟡 **SQLite** → Pas de HA en production

---

## 2. Architecture Cible V1 (TO-BE)

```mermaid
graph TB
    subgraph "Frontend Layer (Modernisé)"
        SPA[Modern SPA<br/>React/Vue/Blazor]
        PWA[PWA Support<br/>Offline-first]
    end

    subgraph "API Gateway"
        GATEWAY[API Gateway<br/>Rate Limiting<br/>Auth<br/>Routing]
    end

    subgraph "API Layer - ASP.NET Core 9.0 (Refactoré)"
        MW2[Middleware Stack<br/>+ Circuit Breaker<br/>+ Structured Logging]
        
        subgraph "15 Controllers Max"
            AUTH2[AuthController<br/>login/register/refresh]
            CASES[CasesController<br/>CRUD + timeline]
            CLIENTS[ClientsController<br/>CRUD + extraction]
            EMAILS[EmailController<br/>send + templates]
            SEARCH2[SearchController<br/>unified search]
            ATTACH[AttachmentsController]
            NOTIFS[NotificationsController]
            AUDIT[AuditController]
            DASH[DashboardController]
            WEBHOOKS[WebhooksController]
            VAULT2[VaultController]
            ADMIN[AdminController]
            HEALTH[HealthController]
        end
        
        subgraph "Domain Services (Clean)"
            AUTHSVC[AuthService]
            CASESVC[CaseService]
            EMAILSVC[EmailService<br/>+ Circuit Breaker]
            SEARCHSVC[SearchService]
            NOTIFYSVC[NotificationService]
        end
        
        subgraph "Infrastructure Services"
            CACHE[Distributed Cache<br/>Redis]
            QUEUE[Message Queue<br/>Azure Service Bus]
            SECRETS[Secret Manager<br/>Azure KeyVault]
        end
        
        subgraph "SignalR (Scaled)"
            HUB3[NotificationHub<br/>+ Redis Backplane]
        end
    end

    subgraph "Data Layer (Production-Ready)"
        EF2[Entity Framework Core 9<br/>+ Retry Logic<br/>+ Connection Pooling]
        PGPRIMARY[(PostgreSQL Primary<br/>Automated Backups)]
        PGREPLICA[(PostgreSQL Replica<br/>Read-only)]
    end

    subgraph "Background Workers"
        WORKER1[Email Monitor Worker<br/>+ Polly Retry<br/>+ DLQ]
        WORKER2[Notification Worker]
        WORKER3[Webhook Worker]
    end

    subgraph "External Services (Resilient)"
        GMAIL2[Gmail IMAP<br/>+ Circuit Breaker]
        TWILIO2[Twilio SMS<br/>+ Retry Logic]
        STRIPE[Stripe Billing<br/>Webhooks]
    end

    subgraph "Observability"
        LOGS[Structured Logs<br/>Serilog → Seq/ELK]
        METRICS[Metrics<br/>Prometheus]
        TRACES[Distributed Tracing<br/>OpenTelemetry]
        ALERTS[Alerting<br/>PagerDuty/Slack]
    end

    SPA --> GATEWAY
    PWA --> GATEWAY
    GATEWAY --> MW2
    
    MW2 --> AUTH2
    MW2 --> CASES
    MW2 --> EMAILS
    
    AUTH2 --> AUTHSVC
    CASES --> CASESVC
    EMAILS --> EMAILSVC
    
    AUTHSVC --> SECRETS
    EMAILSVC --> QUEUE
    CASESVC --> CACHE
    
    AUTHSVC --> EF2
    CASESVC --> EF2
    EMAILSVC --> EF2
    
    EF2 --> PGPRIMARY
    EF2 -.Read.-> PGREPLICA
    
    QUEUE --> WORKER1
    QUEUE --> WORKER2
    QUEUE --> WORKER3
    
    WORKER1 --> GMAIL2
    WORKER2 --> HUB3
    WORKER3 --> TWILIO2
    
    HUB3 --> CACHE
    
    MW2 --> LOGS
    AUTHSVC --> METRICS
    CASESVC --> TRACES
    WORKER1 --> ALERTS

    style AUTH2 fill:#4ecdc4
    style CASES fill:#4ecdc4
    style EMAILS fill:#4ecdc4
    style WORKER1 fill:#95e1d3
    style PGPRIMARY fill:#38ada9
    style CACHE fill:#38ada9
    style QUEUE fill:#38ada9
    style SECRETS fill:#38ada9
```

### Améliorations Clés (TO-BE)
- ✅ **15 Controllers** → Maintenance simplifiée
- ✅ **Circuit Breakers** → Résilience Gmail/Twilio
- ✅ **Redis** → Cache distribué + SignalR backplane
- ✅ **Message Queue** → Traitement asynchrone fiable
- ✅ **PostgreSQL HA** → Primary + Replica
- ✅ **Observability** → Logs/Metrics/Traces/Alerts
- ✅ **KeyVault** → Secrets sécurisés
- ✅ **Tests** → 60%+ couverture

---

## 3. Flux Critique: Email Ingestion (TO-BE)

```mermaid
sequenceDiagram
    participant Gmail
    participant Worker as Email Worker<br/>(Circuit Breaker)
    participant Queue as Service Bus Queue
    participant API as API Service
    participant DB as PostgreSQL
    participant Cache as Redis Cache
    participant Hub as SignalR Hub
    participant Client as Web Client

    Gmail->>Worker: New Email (IMAP)
    
    alt Circuit Open (Gmail Down)
        Worker->>Worker: Skip, retry later
        Worker->>Queue: Dead Letter Queue
    else Circuit Closed
        Worker->>Worker: SHA256 Checksum
        Worker->>DB: Check Duplicate
        
        alt Duplicate Found
            Worker->>Worker: Skip
        else New Email
            Worker->>Queue: Enqueue Processing
            Queue->>API: Process Email Event
            API->>DB: Insert Event + Case
            API->>Cache: Invalidate Case List
            API->>Hub: Broadcast Notification
            Hub->>Client: Real-time Update
            Client->>Client: Show Toast
        end
    end
    
    Note over Worker,Queue: Polly Retry 3x<br/>Exponential Backoff
    Note over API,DB: Transaction<br/>Rollback on Error
```

---

## 4. Migration Path: AS-IS → TO-BE

```mermaid
gantt
    title Migration Roadmap V1 (4 Sprints)
    dateFormat YYYY-MM-DD
    section Sprint 1
    Migrer JWT KeyVault           :s1a, 2025-03-10, 2d
    Sanitize Attachments          :s1b, after s1a, 1d
    Redis Rate Limiting           :s1c, after s1b, 1d
    Forcer HTTPS Prod             :s1d, after s1c, 1d
    
    section Sprint 2
    Tests Unitaires Services      :s2a, 2025-03-17, 2d
    Tests Integration Auth        :s2b, after s2a, 1d
    Tests E2E Critical Path       :s2c, after s2b, 1d
    Health Checks DB              :s2d, after s2c, 1d
    
    section Sprint 3
    Refactor Controllers 67→15    :s3a, 2025-03-24, 3d
    Swagger/OpenAPI               :s3b, after s3a, 1d
    API Versioning                :s3c, after s3b, 1d
    
    section Sprint 4
    Circuit Breaker EmailMonitor  :s4a, 2025-03-31, 1d
    PostgreSQL Migration          :s4b, after s4a, 2d
    Redis SignalR Backplane       :s4c, after s4b, 1d
    Load Testing                  :s4d, after s4c, 1d
    
    section Go-Live
    Production Deployment         :milestone, 2025-04-07, 0d
```

---

## 5. Comparaison Coûts Infrastructure

| Composant | AS-IS (Dev) | TO-BE (Prod) | Coût Mensuel |
|-----------|-------------|--------------|--------------|
| **Compute** | Local | Azure App Service B2 | ~70€ |
| **Database** | SQLite | PostgreSQL Flexible Server | ~50€ |
| **Cache** | In-Memory | Redis Cache Basic | ~15€ |
| **Queue** | - | Service Bus Standard | ~10€ |
| **Secrets** | User Secrets | Key Vault | ~5€ |
| **Monitoring** | File Logs | App Insights | ~20€ |
| **Total** | 0€ | **~170€/mois** | |

**Alternative Low-Cost**:
- Fly.io: ~25€/mois (Postgres + Redis inclus)
- Railway: ~20€/mois (hobby tier)
- Render: ~30€/mois (starter tier)

---

## 📊 Métriques Cibles Architecture

| Métrique | AS-IS | TO-BE | Amélioration |
|----------|-------|-------|--------------|
| **Controllers** | 67 | 15 | -78% |
| **Services** | 40+ | 20 | -50% |
| **Response Time p95** | ? | <500ms | ✅ |
| **Availability** | ? | 99.5% | ✅ |
| **MTTR** | ? | <15min | ✅ |
| **Test Coverage** | 0% | 60% | +60% |

---

**Diagrammes générés le**: 2025-03-09  
**Outils**: Mermaid.js  
**Prochaine mise à jour**: Fin Sprint 1
