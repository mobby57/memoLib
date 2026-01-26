# 📊 DIAGRAMMES SYSTÈME — IA POSTE MANAGER

## 🔄 Flux complet de traitement d'un message

```mermaid
sequenceDiagram
    participant Client
    participant Webhook as Webhook API
    participant Service as MultiChannelService
    participant AI as AI Processor
    participant Audit as Audit Service
    participant DB as PostgreSQL
    participant Frontend as Dashboard

    Client->>Webhook: Message (Email/WhatsApp/SMS...)
    Webhook->>Webhook: Valider signature
    Webhook->>Webhook: Parser payload
    Webhook->>Service: Message normalisé
    
    Service->>DB: Stocker (status: RECEIVED)
    Service->>Audit: Log réception
    
    par Traitement asynchrone
        Service->>AI: Analyser message
        AI->>AI: Résumé + Catégorie
        AI->>AI: Détection urgence
        AI->>AI: Extraction entités
        AI-->>Service: Analyse complète
        
        Service->>DB: Auto-link client/dossier
        Service->>DB: Update (status: PROCESSED)
        
        alt Message urgent
            Service->>DB: Créer notification
            Service->>Frontend: WebSocket alert
        end
        
        Service->>Audit: Log traitement complet
    end
    
    Frontend->>DB: Récupérer messages
    DB-->>Frontend: Liste + stats
    Frontend-->>Client: Affichage dashboard
```

---

## 🏗️ Architecture des canaux

```mermaid
graph TB
    subgraph "Canaux Externes"
        Email[📧 Email]
        WA[💬 WhatsApp]
        SMS[📱 SMS]
        Voice[📞 Voice]
        Slack[💼 Slack]
        Teams[👥 Teams]
        Form[📝 Forms]
        Doc[📄 Documents]
    end
    
    subgraph "Webhook Router"
        Router[/api/webhooks/channel/[channel]]
        Router --> Validate{Valider<br/>signature?}
        Validate -->|✓| Parse[Parser payload]
        Validate -->|✗| Reject[401 Unauthorized]
        Parse --> Normalize[Normaliser format]
    end
    
    subgraph "Core Services"
        MCS[MultiChannelService]
        AIS[AI Processor]
        AuditS[Audit Service]
        NotifS[Notification Service]
    end
    
    subgraph "Stockage"
        PG[(PostgreSQL)]
        Blob[Azure Blob Storage]
        KV[Azure Key Vault]
    end
    
    Email --> Router
    WA --> Router
    SMS --> Router
    Voice --> Router
    Slack --> Router
    Teams --> Router
    Form --> Router
    Doc --> Router
    
    Normalize --> MCS
    MCS --> AIS
    MCS --> AuditS
    MCS --> NotifS
    
    MCS --> PG
    AIS --> PG
    AuditS --> PG
    NotifS --> PG
    
    Doc --> Blob
    Router -.Secrets.-> KV
    
    style Email fill:#e3f2fd
    style WA fill:#e8f5e9
    style SMS fill:#fff3e0
    style Voice fill:#fce4ec
    style Slack fill:#f3e5f5
    style Teams fill:#e0f2f1
    style Form fill:#fff9c4
    style Doc fill:#ffebee
    
    style MCS fill:#1976d2,color:#fff
    style AIS fill:#388e3c,color:#fff
    style AuditS fill:#f57c00,color:#fff
    style NotifS fill:#7b1fa2,color:#fff
```

---

## 🔐 Validation des webhooks

```mermaid
flowchart TD
    Start[Webhook reçu] --> GetChannel{Quel canal?}
    
    GetChannel -->|WhatsApp| WA[HMAC-SHA256]
    GetChannel -->|Slack| Slack[HMAC-SHA256 + timestamp]
    GetChannel -->|Twilio| Twilio[HMAC-SHA1]
    GetChannel -->|Teams| Teams[JWT Bearer]
    GetChannel -->|Autres| API[API Key]
    
    WA --> ValidateWA{Signature<br/>valide?}
    Slack --> ValidateSlack{Signature<br/>valide?}
    Twilio --> ValidateTwilio{Signature<br/>valide?}
    Teams --> ValidateTeams{JWT<br/>valide?}
    API --> ValidateAPI{API Key<br/>valide?}
    
    ValidateWA -->|✓| Process[Traiter message]
    ValidateSlack -->|✓| Process
    ValidateTwilio -->|✓| Process
    ValidateTeams -->|✓| Process
    ValidateAPI -->|✓| Process
    
    ValidateWA -->|✗| Reject[401 Unauthorized]
    ValidateSlack -->|✗| Reject
    ValidateTwilio -->|✗| Reject
    ValidateTeams -->|✗| Reject
    ValidateAPI -->|✗| Reject
    
    Process --> Store[Stocker en DB]
    Store --> AI[Traitement IA]
    AI --> Done[✓ Terminé]
    
    Reject --> Log[Log audit]
    Log --> End[❌ Rejeté]
    
    style Process fill:#4caf50,color:#fff
    style Reject fill:#f44336,color:#fff
    style AI fill:#2196f3,color:#fff
```

---

## 🧠 Traitement IA

```mermaid
flowchart LR
    Message[Message reçu] --> Extract[Extraction]
    
    Extract --> Summary[Résumé]
    Extract --> Category[Catégorie]
    Extract --> Urgency[Urgence]
    Extract --> Entities[Entités]
    Extract --> Sentiment[Sentiment]
    
    Summary --> Analysis[Analyse complète]
    Category --> Analysis
    Urgency --> Analysis
    Entities --> Analysis
    Sentiment --> Analysis
    
    Analysis --> Check{Urgent?}
    
    Check -->|Oui| Alert[Créer alerte]
    Check -->|Non| Store[Stocker résultat]
    
    Alert --> Notify[Notifier avocat]
    Notify --> Store
    
    Store --> Link[Auto-link client/dossier]
    Link --> Done[✓ Traité]
    
    style Extract fill:#2196f3,color:#fff
    style Analysis fill:#4caf50,color:#fff
    style Alert fill:#ff9800,color:#fff
    style Done fill:#8bc34a,color:#fff
```

---

## 📊 Modèle de données

```mermaid
erDiagram
    CHANNEL_MESSAGE ||--o{ ATTACHMENT : contains
    CHANNEL_MESSAGE }o--|| CLIENT : "sent by"
    CHANNEL_MESSAGE }o--o| DOSSIER : "linked to"
    CHANNEL_MESSAGE ||--o{ AUDIT_LOG : generates
    CLIENT ||--o{ CONSENT : has
    CLIENT ||--o{ DOSSIER : owns
    DOSSIER ||--o{ DOCUMENT : contains
    
    CHANNEL_MESSAGE {
        uuid id PK
        string channel
        string direction
        string status
        json sender
        json recipient
        string subject
        text body
        text bodyHtml
        json aiAnalysis
        timestamp receivedAt
        timestamp processedAt
        string tenantId FK
        string clientId FK
        string dossierId FK
    }
    
    CLIENT {
        uuid id PK
        string email
        string phone
        string name
        string tenantId FK
    }
    
    DOSSIER {
        uuid id PK
        string numero
        string type
        string status
        date echeance
        string clientId FK
        string tenantId FK
    }
    
    AUDIT_LOG {
        uuid id PK
        timestamp timestamp
        string action
        string hash
        string previousHash
        json details
        string messageId FK
    }
    
    CONSENT {
        uuid id PK
        string clientId FK
        string channel
        string purpose
        boolean granted
        timestamp grantedAt
        timestamp expiresAt
    }
    
    ATTACHMENT {
        uuid id PK
        string filename
        string mimeType
        int size
        string url
        string blobPath
        string messageId FK
    }
```

---

## 🔄 Cycle de vie d'un message

```mermaid
stateDiagram-v2
    [*] --> RECEIVED: Webhook reçu
    
    RECEIVED --> PROCESSING: Démarrage IA
    PROCESSING --> PROCESSED: Analyse terminée
    PROCESSING --> FAILED: Erreur IA
    
    PROCESSED --> LINKED: Client trouvé
    PROCESSED --> UNLINKED: Client inconnu
    
    LINKED --> URGENT: Urgence détectée
    LINKED --> NORMAL: Pas urgent
    UNLINKED --> NORMAL
    
    URGENT --> ALERTED: Notification créée
    ALERTED --> ARCHIVED: Traité par avocat
    
    NORMAL --> ARCHIVED: Traité
    FAILED --> ARCHIVED: Erreur résolue
    
    ARCHIVED --> [*]
    
    note right of RECEIVED
        Status initial
        Timestamp enregistré
    end note
    
    note right of PROCESSING
        IA en cours
        Résumé + catégorie
        Détection urgence
    end note
    
    note right of URGENT
        Alerte temps réel
        WebSocket + Email
        Escalade si besoin
    end note
```

---

## 🏢 Architecture multi-tenant

```mermaid
graph TB
    subgraph "Tenant 1 - Cabinet Dupont"
        T1Users[👤 Avocats]
        T1Clients[👥 Clients]
        T1Data[(Données isolées)]
    end
    
    subgraph "Tenant 2 - Cabinet Martin"
        T2Users[👤 Avocats]
        T2Clients[👥 Clients]
        T2Data[(Données isolées)]
    end
    
    subgraph "Plateforme Centrale"
        Auth[🔐 Auth Service]
        Router[🔀 Tenant Router]
        DB[(PostgreSQL)]
    end
    
    T1Users --> Auth
    T2Users --> Auth
    
    Auth --> Router
    Router -->|tenantId=1| T1Data
    Router -->|tenantId=2| T2Data
    
    T1Data --> DB
    T2Data --> DB
    
    T1Clients -.Messages.-> T1Data
    T2Clients -.Messages.-> T2Data
    
    style Auth fill:#1976d2,color:#fff
    style Router fill:#388e3c,color:#fff
    style DB fill:#f57c00,color:#fff
```

---

## 📈 Monitoring & Alertes

```mermaid
flowchart TD
    System[Système en production] --> Metrics[Collecte métriques]
    
    Metrics --> Check1{Messages/min<br/>> seuil?}
    Metrics --> Check2{Erreurs<br/>> 5%?}
    Metrics --> Check3{Latence<br/>> 2s?}
    Metrics --> Check4{DB<br/>disponible?}
    
    Check1 -->|Oui| Alert1[🚨 Alerte charge]
    Check2 -->|Oui| Alert2[🚨 Alerte erreurs]
    Check3 -->|Oui| Alert3[🚨 Alerte perf]
    Check4 -->|Non| Alert4[🚨 Alerte DB]
    
    Alert1 --> Notify[Notification Slack]
    Alert2 --> Notify
    Alert3 --> Notify
    Alert4 --> Notify
    
    Notify --> Escalate{Critique?}
    Escalate -->|Oui| OnCall[📞 Astreinte]
    Escalate -->|Non| Log[📝 Log incident]
    
    OnCall --> Resolve[Résolution]
    Log --> Resolve
    
    Resolve --> PostMortem[📊 Post-mortem]
    PostMortem --> Improve[Amélioration]
    
    style Alert1 fill:#ff5722,color:#fff
    style Alert2 fill:#ff5722,color:#fff
    style Alert3 fill:#ff9800,color:#fff
    style Alert4 fill:#f44336,color:#fff
```

---

## 🔐 Sécurité & RGPD

```mermaid
flowchart TB
    Request[Requête entrante] --> Auth{Authentifié?}
    
    Auth -->|Non| Reject[401 Unauthorized]
    Auth -->|Oui| Tenant{Bon tenant?}
    
    Tenant -->|Non| Reject2[403 Forbidden]
    Tenant -->|Oui| Consent{Consentement<br/>valide?}
    
    Consent -->|Non| AskConsent[Demander consentement]
    Consent -->|Oui| Process[Traiter requête]
    
    AskConsent --> Store[Stocker consentement]
    Store --> Audit1[Log audit]
    
    Process --> Encrypt[Chiffrer données sensibles]
    Encrypt --> Store2[Stocker en DB]
    Store2 --> Audit2[Log audit]
    
    Audit1 --> Hash[Hash chaîné]
    Audit2 --> Hash
    
    Hash --> Immutable[Audit trail immutable]
    
    style Auth fill:#1976d2,color:#fff
    style Consent fill:#388e3c,color:#fff
    style Encrypt fill:#f57c00,color:#fff
    style Immutable fill:#7b1fa2,color:#fff
```

---

## 📊 Dashboard temps réel

```mermaid
graph LR
    subgraph "Sources de données"
        DB[(PostgreSQL)]
        WS[WebSocket]
        Cache[Redis Cache]
    end
    
    subgraph "Backend"
        API[API Routes]
        SSE[Server-Sent Events]
    end
    
    subgraph "Frontend"
        Dashboard[📊 Dashboard]
        Stats[📈 Stats]
        Alerts[🔔 Alertes]
        Messages[💬 Messages]
    end
    
    DB --> API
    Cache --> API
    API --> Dashboard
    
    WS --> SSE
    SSE --> Alerts
    SSE --> Messages
    
    Dashboard --> Stats
    
    style Dashboard fill:#2196f3,color:#fff
    style Alerts fill:#ff9800,color:#fff
    style Messages fill:#4caf50,color:#fff
```
