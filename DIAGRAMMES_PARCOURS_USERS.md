# 🎯 Diagrammes des Parcours Utilisateurs - MemoLib

## 📋 Table des Matières

1. [Vue d'ensemble des Parcours](#1-vue-densemble-des-parcours)
2. [Parcours Authentification](#2-parcours-authentification)
3. [Parcours Gestion Emails](#3-parcours-gestion-emails)
4. [Parcours Gestion Dossiers](#4-parcours-gestion-dossiers)
5. [Parcours Gestion Clients](#5-parcours-gestion-clients)
6. [Parcours Recherche](#6-parcours-recherche)
7. [Parcours Notifications](#7-parcours-notifications)
8. [Parcours Analytics](#8-parcours-analytics)
9. [Parcours Formulaires Publics](#9-parcours-formulaires-publics)
10. [Parcours Erreurs & Exceptions](#10-parcours-erreurs--exceptions)

---

## 1. Vue d'ensemble des Parcours

### 1.1 Diagramme Principal des Parcours Utilisateurs

```mermaid
graph TB
    Start([👤 Utilisateur]) --> Auth{🔐 Authentifié?}
    
    Auth -->|Non| Login[🔑 Connexion/Inscription]
    Auth -->|Oui| Dashboard[📊 Dashboard Principal]
    
    Login --> Dashboard
    
    Dashboard --> Emails[📧 Gestion Emails]
    Dashboard --> Cases[📁 Gestion Dossiers]
    Dashboard --> Clients[👥 Gestion Clients]
    Dashboard --> Search[🔍 Recherche]
    Dashboard --> Analytics[📊 Analytics]
    Dashboard --> Forms[📝 Formulaires]
    
    Emails --> EmailMonitor[🔄 Monitoring Auto]
    Emails --> EmailSend[📤 Envoi Email]
    Emails --> EmailTemplates[📋 Templates]
    
    Cases --> CaseCreate[➕ Créer Dossier]
    Cases --> CaseManage[⚙️ Gérer Dossier]
    Cases --> CaseWorkflow[🔄 Workflow Statut]
    
    Clients --> ClientCreate[➕ Créer Client]
    Clients --> ClientView[👁️ Vue 360°]
    Clients --> ClientEdit[✏️ Éditer Client]
    
    Search --> TextSearch[📝 Recherche Texte]
    Search --> SemanticSearch[🧠 Recherche IA]
    Search --> FilterSearch[🎯 Filtres Avancés]
    
    Analytics --> Reports[📈 Rapports]
    Analytics --> Anomalies[⚠️ Anomalies]
    Analytics --> Audit[📋 Audit Trail]
    
    Forms --> PublicForms[🌐 Formulaires Publics]
    Forms --> SharedSpaces[🤝 Espaces Partagés]
    
    style Start fill:#e1f5fe
    style Dashboard fill:#f3e5f5
    style Emails fill:#e8f5e8
    style Cases fill:#fff3e0
    style Clients fill:#fce4ec
    style Search fill:#f1f8e9
    style Analytics fill:#e3f2fd
    style Forms fill:#fff8e1
```

### 1.2 Matrice des Rôles et Parcours

```mermaid
graph LR
    subgraph "👨‍💼 Avocat Principal"
        A1[📊 Dashboard Complet]
        A2[📁 Tous Dossiers]
        A3[👥 Tous Clients]
        A4[⚙️ Configuration]
    end
    
    subgraph "👩‍💼 Avocat Collaborateur"
        B1[📊 Dashboard Personnel]
        B2[📁 Dossiers Assignés]
        B3[👥 Clients Assignés]
        B4[📧 Emails Assignés]
    end
    
    subgraph "👨‍💻 Assistant Juridique"
        C1[📧 Gestion Emails]
        C2[📝 Saisie Données]
        C3[📋 Suivi Dossiers]
        C4[📞 Contact Clients]
    end
    
    subgraph "👤 Client"
        D1[📝 Formulaire Public]
        D2[🤝 Espace Partagé]
        D3[📄 Consultation Statut]
        D4[💬 Communication]
    end
    
    style A1 fill:#e1f5fe
    style B1 fill:#f3e5f5
    style C1 fill:#e8f5e8
    style D1 fill:#fff3e0
```

---

## 2. Parcours Authentification

### 2.1 Parcours Inscription/Connexion

```mermaid
sequenceDiagram
    participant U as 👤 Utilisateur
    participant F as 🌐 Frontend
    participant A as 🔐 API Auth
    participant D as 💾 Database
    
    Note over U,D: 📝 Inscription
    U->>F: Accède à /register
    F->>U: Affiche formulaire inscription
    U->>F: Saisit données (email, password, nom)
    F->>A: POST /api/auth/register
    A->>D: Vérifie email unique
    D-->>A: Email disponible
    A->>D: Hash password (BCrypt)
    A->>D: Crée utilisateur
    D-->>A: Utilisateur créé
    A-->>F: JWT Token + User Info
    F->>F: Stocke token (localStorage)
    F->>U: Redirige vers dashboard
    
    Note over U,D: 🔑 Connexion
    U->>F: Accède à /login
    F->>U: Affiche formulaire connexion
    U->>F: Saisit email/password
    F->>A: POST /api/auth/login
    A->>D: Vérifie credentials
    D-->>A: User trouvé
    A->>A: Vérifie password (BCrypt)
    A-->>F: JWT Token + User Info
    F->>F: Stocke token
    F->>U: Redirige vers dashboard
```

### 2.2 Gestion des Sessions

```mermaid
stateDiagram-v2
    [*] --> Anonyme
    
    Anonyme --> Connexion : Clic "Se connecter"
    Connexion --> Authentifié : Credentials valides
    Connexion --> Erreur : Credentials invalides
    Erreur --> Connexion : Retry
    
    Authentifié --> Dashboard : Token valide
    Authentifié --> Expirée : Token expiré
    
    Dashboard --> Déconnexion : Clic "Déconnexion"
    Expirée --> Connexion : Auto-redirect
    Déconnexion --> Anonyme : Clear token
    
    note right of Authentifié
        Token JWT stocké
        Durée: 24h
        Auto-refresh: 1h avant expiration
    end note
```

---

## 3. Parcours Gestion Emails

### 3.1 Monitoring Automatique Gmail

```mermaid
flowchart TD
    Start([🚀 Démarrage App]) --> Config{⚙️ Config Gmail OK?}
    
    Config -->|Non| Error[❌ Erreur Config]
    Config -->|Oui| Monitor[🔄 Démarrage Monitor]
    
    Monitor --> Timer[⏰ Timer 60s]
    Timer --> Connect[📡 Connexion IMAP]
    
    Connect --> Success{✅ Connexion OK?}
    Success -->|Non| Retry[🔄 Retry dans 5min]
    Success -->|Oui| Scan[🔍 Scan Nouveaux Emails]
    
    Scan --> NewEmails{📧 Nouveaux emails?}
    NewEmails -->|Non| Wait[⏳ Attendre 60s]
    NewEmails -->|Oui| Process[⚙️ Traiter Emails]
    
    Process --> Extract[📋 Extraire Infos]
    Extract --> Duplicate{🔍 Doublon?}
    
    Duplicate -->|Oui| Skip[⏭️ Ignorer]
    Duplicate -->|Non| Save[💾 Sauvegarder]
    
    Save --> Notify[🔔 Notifier Utilisateur]
    Notify --> Wait
    
    Wait --> Timer
    Retry --> Timer
    Skip --> Wait
    
    style Start fill:#e1f5fe
    style Monitor fill:#e8f5e8
    style Process fill:#fff3e0
    style Notify fill:#f3e5f5
```

### 3.2 Parcours Envoi Email

```mermaid
sequenceDiagram
    participant U as 👤 Utilisateur
    participant F as 🌐 Frontend
    participant A as 📧 API Email
    participant S as 📤 SMTP Service
    participant C as 👥 Client
    
    U->>F: Clic "Nouvel Email"
    F->>U: Affiche formulaire
    
    Note over U,F: 📝 Composition
    U->>F: Sélectionne destinataire
    U->>F: Saisit sujet/contenu
    U->>F: Ajoute pièces jointes (optionnel)
    
    Note over U,F: 📋 Template (optionnel)
    U->>F: Sélectionne template
    F->>A: GET /api/email/templates
    A-->>F: Liste templates
    F->>F: Remplace variables {{nom}}, {{dossier}}
    
    U->>F: Clic "Envoyer"
    F->>A: POST /api/email/send
    
    Note over A,S: ✅ Validation
    A->>A: Valide destinataire
    A->>A: Valide contenu
    A->>A: Scan pièces jointes
    
    Note over A,S: 📤 Envoi
    A->>S: Connexion SMTP
    A->>S: Envoie email
    S->>C: Email livré
    S-->>A: Confirmation envoi
    
    A->>A: Log dans audit trail
    A-->>F: Succès
    F->>U: Notification "Email envoyé"
```

### 3.3 Gestion Templates

```mermaid
graph TB
    subgraph "📋 Gestion Templates"
        Create[➕ Créer Template]
        Edit[✏️ Éditer Template]
        Delete[🗑️ Supprimer Template]
        Use[📤 Utiliser Template]
    end
    
    subgraph "🔧 Variables Dynamiques"
        ClientVar[{{client.nom}}]
        CaseVar[{{dossier.numero}}]
        DateVar[{{date.aujourd_hui}}]
        CustomVar[{{variable.custom}}]
    end
    
    subgraph "📁 Catégories"
        Welcome[🤝 Accueil Client]
        Update[📢 Mise à jour Dossier]
        Request[📋 Demande Documents]
        Closing[✅ Clôture Dossier]
    end
    
    Create --> ClientVar
    Create --> CaseVar
    Create --> DateVar
    
    Use --> Welcome
    Use --> Update
    Use --> Request
    Use --> Closing
    
    Edit --> Preview[👁️ Aperçu Temps Réel]
    Preview --> Validate[✅ Validation]
    Validate --> Save[💾 Sauvegarder]
    
    style Create fill:#e8f5e8
    style Use fill:#fff3e0
    style Preview fill:#f3e5f5
```

---

## 4. Parcours Gestion Dossiers

### 4.1 Création de Dossier

```mermaid
flowchart TD
    Start([📧 Email Reçu]) --> Notify[🔔 Notification Utilisateur]
    
    Notify --> Decision{🤔 Créer Dossier?}
    Decision -->|Non| Archive[📦 Archiver Email]
    Decision -->|Oui| CreateCase[➕ Créer Dossier]
    
    CreateCase --> Form[📝 Formulaire Création]
    Form --> AutoExtract[🤖 Extraction Auto Infos]
    
    AutoExtract --> ClientInfo[👤 Infos Client]
    AutoExtract --> CaseInfo[📁 Infos Dossier]
    
    ClientInfo --> ExistingClient{👥 Client Existant?}
    ExistingClient -->|Oui| LinkClient[🔗 Lier Client]
    ExistingClient -->|Non| CreateClient[➕ Créer Client]
    
    CreateClient --> LinkClient
    LinkClient --> CaseDetails[📋 Détails Dossier]
    
    CaseDetails --> Priority[⭐ Définir Priorité]
    Priority --> Tags[🏷️ Ajouter Tags]
    Tags --> Assign[👨‍💼 Assigner Avocat]
    
    Assign --> Save[💾 Sauvegarder]
    Save --> Timeline[📅 Créer Timeline]
    Timeline --> NotifyTeam[🔔 Notifier Équipe]
    
    NotifyTeam --> Dashboard[📊 Retour Dashboard]
    
    style Start fill:#e1f5fe
    style CreateCase fill:#e8f5e8
    style AutoExtract fill:#fff3e0
    style Save fill:#f3e5f5
```

### 4.2 Workflow Statut Dossier

```mermaid
stateDiagram-v2
    [*] --> OPEN
    
    OPEN --> IN_PROGRESS : 🚀 Démarrer travail
    OPEN --> CLOSED : ❌ Annuler (rare)
    
    IN_PROGRESS --> OPEN : ⏸️ Mettre en pause
    IN_PROGRESS --> CLOSED : ✅ Terminer
    IN_PROGRESS --> BLOCKED : 🚫 Bloquer (attente client)
    
    BLOCKED --> IN_PROGRESS : 🔓 Débloquer
    BLOCKED --> CLOSED : ❌ Abandonner
    
    CLOSED --> IN_PROGRESS : 🔄 Réouvrir (rare)
    
    note right of OPEN
        📝 Nouveau dossier
        🔔 Notification auto équipe
        ⏰ Pas de deadline
    end note
    
    note right of IN_PROGRESS
        ⚙️ Travail en cours
        👨‍💼 Avocat assigné
        📅 Deadline définie
        🔔 Notifications régulières
    end note
    
    note right of BLOCKED
        ⏳ Attente externe
        📋 Raison documentée
        🔔 Rappels automatiques
    end note
    
    note right of CLOSED
        ✅ Dossier terminé
        📊 Stats mises à jour
        📧 Email client auto
        🔒 Lecture seule
    end note
```

### 4.3 Gestion Priorités et Échéances

```mermaid
graph TB
    subgraph "⭐ Niveaux de Priorité"
        P0[🔴 P0 - CRITIQUE<br/>Délai < 24h]
        P1[🟠 P1 - URGENT<br/>Délai < 3 jours]
        P2[🟡 P2 - IMPORTANT<br/>Délai < 1 semaine]
        P3[🔵 P3 - NORMAL<br/>Délai < 1 mois]
        P4[⚪ P4 - FAIBLE<br/>Pas de délai]
    end
    
    subgraph "🔔 Notifications Auto"
        N1[📱 Immédiate si P0/P1]
        N2[📧 Email quotidien P2]
        N3[📅 Rappel hebdo P3]
        N4[📊 Rapport mensuel P4]
    end
    
    subgraph "📅 Gestion Échéances"
        D1[🚨 J-1: Alerte rouge]
        D2[⚠️ J-3: Alerte orange]
        D3[💛 J-7: Alerte jaune]
        D4[📝 J-14: Rappel]
    end
    
    P0 --> N1
    P1 --> N1
    P2 --> N2
    P3 --> N3
    P4 --> N4
    
    N1 --> D1
    N2 --> D2
    N3 --> D3
    N4 --> D4
    
    style P0 fill:#ffebee
    style P1 fill:#fff3e0
    style P2 fill:#fffde7
    style P3 fill:#e3f2fd
    style P4 fill:#f5f5f5
```

---

## 5. Parcours Gestion Clients

### 5.1 Création et Gestion Client

```mermaid
sequenceDiagram
    participant U as 👤 Utilisateur
    participant F as 🌐 Frontend
    participant A as 👥 API Client
    participant E as 📧 Email Service
    participant D as 💾 Database
    
    Note over U,D: ➕ Création Client
    U->>F: Clic "Nouveau Client"
    F->>U: Affiche formulaire
    
    U->>F: Saisit informations de base
    F->>A: POST /api/client (données partielles)
    A->>A: Validation des données
    A->>D: Vérifie doublons (email)
    
    alt 🔍 Doublon détecté
        D-->>A: Client existant trouvé
        A-->>F: Suggestion de fusion
        F->>U: Propose fusion ou création séparée
        U->>F: Choix utilisateur
    else ✅ Nouveau client
        D-->>A: Aucun doublon
        A->>D: Crée nouveau client
    end
    
    Note over U,D: 🤖 Extraction Auto depuis Email
    U->>F: Sélectionne email source
    F->>A: POST /api/client/extract-from-email
    A->>A: Regex extraction (téléphone, adresse)
    A->>A: Parsing signature email
    A-->>F: Données extraites
    F->>F: Pré-remplit formulaire
    
    Note over U,D: 💾 Sauvegarde
    U->>F: Valide informations
    F->>A: PUT /api/client/{id}
    A->>D: Sauvegarde client complet
    A->>E: Envoie email de bienvenue (optionnel)
    A-->>F: Client créé avec succès
    F->>U: Notification + redirection vue client
```

### 5.2 Vue 360° Client

```mermaid
graph TB
    subgraph "👤 Informations Client"
        Info[📋 Infos Personnelles]
        Contact[📞 Coordonnées]
        Notes[📝 Notes Privées]
        Tags[🏷️ Tags & Catégories]
    end
    
    subgraph "📁 Dossiers Associés"
        ActiveCases[⚡ Dossiers Actifs]
        ClosedCases[✅ Dossiers Fermés]
        CaseStats[📊 Statistiques]
        CaseTimeline[📅 Timeline Globale]
    end
    
    subgraph "📧 Historique Communications"
        EmailIn[📥 Emails Reçus]
        EmailOut[📤 Emails Envoyés]
        EmailStats[📈 Stats Communication]
        LastContact[🕐 Dernier Contact]
    end
    
    subgraph "💰 Facturation"
        Invoices[🧾 Factures]
        Payments[💳 Paiements]
        Outstanding[⏰ En Attente]
        Revenue[💰 CA Total]
    end
    
    subgraph "🔔 Actions Rapides"
        SendEmail[📧 Envoyer Email]
        CreateCase[➕ Nouveau Dossier]
        Schedule[📅 Planifier RDV]
        AddNote[📝 Ajouter Note]
    end
    
    Info --> ActiveCases
    Contact --> EmailIn
    ActiveCases --> EmailOut
    EmailStats --> Invoices
    
    style Info fill:#e1f5fe
    style ActiveCases fill:#e8f5e8
    style EmailIn fill:#fff3e0
    style Invoices fill:#f3e5f5
    style SendEmail fill:#fce4ec
```

---

## 6. Parcours Recherche

### 6.1 Recherche Multi-Modale

```mermaid
flowchart TD
    Start([🔍 Recherche]) --> Type{🎯 Type de Recherche}
    
    Type -->|📝 Texte| TextSearch[📄 Recherche Textuelle]
    Type -->|🧠 IA| SemanticSearch[🤖 Recherche Sémantique]
    Type -->|🎯 Filtres| FilterSearch[🔧 Filtres Avancés]
    
    TextSearch --> TextQuery[📝 Saisie Requête]
    TextQuery --> TextIndex[🔍 Index Full-Text]
    TextIndex --> TextResults[📋 Résultats Texte]
    
    SemanticSearch --> SemanticQuery[🧠 Requête Naturelle]
    SemanticQuery --> Embeddings[🔢 Génération Embeddings]
    Embeddings --> VectorSearch[🎯 Recherche Vectorielle]
    VectorSearch --> SemanticResults[🤖 Résultats IA]
    
    FilterSearch --> FilterForm[📋 Formulaire Filtres]
    FilterForm --> MultiFilter[🎛️ Filtres Combinés]
    MultiFilter --> FilterResults[🎯 Résultats Filtrés]
    
    TextResults --> Merge[🔄 Fusion Résultats]
    SemanticResults --> Merge
    FilterResults --> Merge
    
    Merge --> Dedup[🔍 Déduplication]
    Dedup --> Rank[📊 Classement Pertinence]
    Rank --> Display[📱 Affichage Résultats]
    
    Display --> Actions[⚡ Actions Rapides]
    Actions --> OpenCase[📁 Ouvrir Dossier]
    Actions --> ViewClient[👤 Voir Client]
    Actions --> SendEmail[📧 Envoyer Email]
    
    style Start fill:#e1f5fe
    style TextSearch fill:#e8f5e8
    style SemanticSearch fill:#fff3e0
    style FilterSearch fill:#f3e5f5
    style Merge fill:#fce4ec
```

### 6.2 Filtres Avancés

```mermaid
graph TB
    subgraph "📅 Filtres Temporels"
        DateRange[📆 Plage de Dates]
        LastWeek[📅 Dernière Semaine]
        LastMonth[📅 Dernier Mois]
        Custom[🎯 Période Personnalisée]
    end
    
    subgraph "📁 Filtres Dossiers"
        Status[📊 Statut]
        Priority[⭐ Priorité]
        Assigned[👨‍💼 Avocat Assigné]
        Tags[🏷️ Tags]
    end
    
    subgraph "👥 Filtres Clients"
        ClientType[🏢 Type Client]
        VIP[⭐ Client VIP]
        Location[📍 Localisation]
        Revenue[💰 CA]
    end
    
    subgraph "📧 Filtres Communications"
        EmailType[📧 Type Email]
        HasAttachment[📎 Avec PJ]
        Sender[👤 Expéditeur]
        Unread[📬 Non Lu]
    end
    
    subgraph "🔍 Combinaisons"
        AND[➕ ET Logique]
        OR[🔄 OU Logique]
        NOT[❌ SAUF]
        Saved[💾 Filtres Sauvés]
    end
    
    DateRange --> AND
    Status --> AND
    ClientType --> OR
    EmailType --> NOT
    
    AND --> Results[📋 Résultats Combinés]
    OR --> Results
    NOT --> Results
    
    Results --> Save[💾 Sauvegarder Filtre]
    Save --> Saved
    
    style DateRange fill:#e3f2fd
    style Status fill:#e8f5e8
    style ClientType fill:#fff3e0
    style EmailType fill:#f3e5f5
    style AND fill:#fce4ec
```

---

## 7. Parcours Notifications

### 7.1 Système de Notifications Temps Réel

```mermaid
sequenceDiagram
    participant E as 📧 Email Monitor
    participant S as 🔔 SignalR Hub
    participant A as 🔔 API Notifications
    participant D as 💾 Database
    participant U as 👤 Utilisateur
    participant F as 🌐 Frontend
    
    Note over E,F: 📧 Nouvel Email Reçu
    E->>A: Nouvel email détecté
    A->>D: Sauvegarde notification
    A->>S: Broadcast notification
    S->>F: Push temps réel
    F->>U: Affichage toast notification
    
    Note over E,F: 📁 Changement Statut Dossier
    U->>F: Change statut dossier
    F->>A: PATCH /api/cases/{id}/status
    A->>D: Met à jour statut
    A->>A: Identifie utilisateurs à notifier
    A->>S: Broadcast aux concernés
    S->>F: Notification équipe
    
    Note over E,F: ⏰ Rappel Échéance
    A->>A: Job quotidien échéances
    A->>D: Vérifie dossiers proches échéance
    A->>S: Notifications urgentes
    S->>F: Alertes prioritaires
    F->>U: Popup alerte + son
    
    Note over E,F: 🔔 Gestion Préférences
    U->>F: Configure préférences
    F->>A: PUT /api/notifications/preferences
    A->>D: Sauvegarde préférences
    A-->>F: Confirmation
```

### 7.2 Types de Notifications

```mermaid
graph TB
    subgraph "📧 Notifications Email"
        NewEmail[📥 Nouvel Email]
        EmailSent[📤 Email Envoyé]
        EmailFailed[❌ Échec Envoi]
        EmailBounce[↩️ Email Rejeté]
    end
    
    subgraph "📁 Notifications Dossier"
        CaseCreated[➕ Dossier Créé]
        StatusChanged[🔄 Statut Modifié]
        PriorityChanged[⭐ Priorité Modifiée]
        DeadlineApproaching[⏰ Échéance Proche]
    end
    
    subgraph "👥 Notifications Équipe"
        CaseAssigned[👨‍💼 Dossier Assigné]
        TeamMention[💬 Mention Équipe]
        CommentAdded[💭 Commentaire Ajouté]
        TaskCompleted[✅ Tâche Terminée]
    end
    
    subgraph "🚨 Notifications Urgentes"
        CriticalDeadline[🔴 Échéance Critique]
        SystemError[⚠️ Erreur Système]
        SecurityAlert[🔒 Alerte Sécurité]
        AnomalyDetected[🔍 Anomalie Détectée]
    end
    
    subgraph "🎯 Canaux de Diffusion"
        InApp[📱 In-App (Toast)]
        Browser[🌐 Navigateur (Push)]
        Email[📧 Email]
        SMS[📱 SMS (Critique)]
    end
    
    NewEmail --> InApp
    CaseCreated --> Browser
    DeadlineApproaching --> Email
    CriticalDeadline --> SMS
    
    StatusChanged --> InApp
    TeamMention --> Browser
    SystemError --> Email
    SecurityAlert --> SMS
    
    style NewEmail fill:#e3f2fd
    style CaseCreated fill:#e8f5e8
    style TeamMention fill:#fff3e0
    style CriticalDeadline fill:#ffebee
    style InApp fill:#f3e5f5
```

---

## 8. Parcours Analytics

### 8.1 Dashboard Analytics

```mermaid
graph TB
    subgraph "📊 Métriques Principales"
        TotalCases[📁 Total Dossiers]
        ActiveCases[⚡ Dossiers Actifs]
        ClosedToday[✅ Fermés Aujourd'hui]
        AvgResolution[⏱️ Temps Résolution Moyen]
    end
    
    subgraph "📧 Statistiques Email"
        EmailsReceived[📥 Emails Reçus]
        EmailsSent[📤 Emails Envoyés]
        ResponseTime[⏰ Temps Réponse]
        EmailVolume[📈 Volume par Jour]
    end
    
    subgraph "👥 Performance Équipe"
        CasesPerLawyer[👨‍💼 Dossiers/Avocat]
        ProductivityScore[📊 Score Productivité]
        WorkloadBalance[⚖️ Équilibrage Charge]
        ClientSatisfaction[😊 Satisfaction Client]
    end
    
    subgraph "💰 Métriques Business"
        Revenue[💰 Chiffre d'Affaires]
        BillableHours[⏰ Heures Facturables]
        ClientRetention[🔄 Rétention Client]
        ProfitMargin[📈 Marge Bénéficiaire]
    end
    
    subgraph "🔍 Anomalies Détectées"
        HighVolume[📈 Volume Anormal]
        LongResponse[⏰ Réponse Tardive]
        StuckCases[🚫 Dossiers Bloqués]
        ClientComplaints[😞 Plaintes Client]
    end
    
    TotalCases --> CasesPerLawyer
    EmailsReceived --> ResponseTime
    ActiveCases --> WorkloadBalance
    Revenue --> ProfitMargin
    
    HighVolume --> Alert1[🚨 Alerte Volume]
    LongResponse --> Alert2[⚠️ Alerte Délai]
    StuckCases --> Alert3[🔔 Alerte Blocage]
    
    style TotalCases fill:#e3f2fd
    style EmailsReceived fill:#e8f5e8
    style CasesPerLawyer fill:#fff3e0
    style Revenue fill:#f3e5f5
    style HighVolume fill:#ffebee
```

### 8.2 Centre d'Anomalies

```mermaid
flowchart TD
    Monitor[🔍 Monitoring Continu] --> Detect{🚨 Anomalie Détectée?}
    
    Detect -->|Non| Continue[⏳ Continuer Monitoring]
    Detect -->|Oui| Classify[🏷️ Classification Anomalie]
    
    Classify --> Type{📊 Type d'Anomalie}
    
    Type -->|📧 Email| EmailAnomaly[📧 Anomalie Email]
    Type -->|📁 Dossier| CaseAnomaly[📁 Anomalie Dossier]
    Type -->|👥 Client| ClientAnomaly[👥 Anomalie Client]
    Type -->|⚙️ Système| SystemAnomaly[⚙️ Anomalie Système]
    
    EmailAnomaly --> EmailActions[📧 Actions Email]
    CaseAnomaly --> CaseActions[📁 Actions Dossier]
    ClientAnomaly --> ClientActions[👥 Actions Client]
    SystemAnomaly --> SystemActions[⚙️ Actions Système]
    
    EmailActions --> Severity{⚠️ Sévérité}
    CaseActions --> Severity
    ClientActions --> Severity
    SystemActions --> Severity
    
    Severity -->|🔴 Critique| ImmediateAlert[🚨 Alerte Immédiate]
    Severity -->|🟠 Élevée| UrgentNotif[⚡ Notification Urgente]
    Severity -->|🟡 Moyenne| StandardNotif[📢 Notification Standard]
    Severity -->|🔵 Faible| LogOnly[📝 Log Seulement]
    
    ImmediateAlert --> Escalate[📞 Escalade Équipe]
    UrgentNotif --> Assign[👨‍💼 Assigner Responsable]
    StandardNotif --> Queue[📋 File d'Attente]
    LogOnly --> Archive[📦 Archiver]
    
    Escalate --> Resolve[✅ Résoudre]
    Assign --> Resolve
    Queue --> Resolve
    
    Resolve --> Learn[🧠 Apprentissage IA]
    Learn --> Continue
    
    Continue --> Monitor
    
    style Monitor fill:#e1f5fe
    style Classify fill:#e8f5e8
    style Severity fill:#fff3e0
    style ImmediateAlert fill:#ffebee
    style Learn fill:#f3e5f5
```

---

## 9. Parcours Formulaires Publics

### 9.1 Création et Gestion Formulaires

```mermaid
sequenceDiagram
    participant L as 👨‍💼 Avocat
    participant A as 🔧 Admin Interface
    participant F as 📝 Form Builder
    participant D as 💾 Database
    participant P as 🌐 Public Form
    participant C as 👤 Client
    
    Note over L,C: 🏗️ Création Formulaire
    L->>A: Accède à "Formulaires"
    A->>F: Ouvre Form Builder
    L->>F: Configure champs (nom, email, téléphone, description)
    L->>F: Définit règles validation
    L->>F: Personnalise design/branding
    L->>F: Configure notifications
    F->>D: Sauvegarde template formulaire
    D-->>F: URL publique générée
    F-->>L: Formulaire créé + URL partageable
    
    Note over L,C: 📤 Partage Formulaire
    L->>L: Copie URL publique
    L->>C: Envoie URL par email/SMS
    
    Note over L,C: 📝 Soumission Client
    C->>P: Accède à URL publique
    P->>C: Affiche formulaire responsive
    C->>P: Remplit informations
    C->>P: Upload documents (optionnel)
    C->>P: Soumet formulaire
    
    Note over L,C: ⚙️ Traitement Automatique
    P->>D: Sauvegarde soumission
    D->>A: Déclenche notifications
    A->>L: Email notification nouvelle soumission
    A->>A: Crée automatiquement dossier/client
    A-->>C: Email confirmation réception
```

### 9.2 Espaces Partagés Multi-Participants

```mermaid
graph TB
    subgraph "🏗️ Configuration Espace"
        CreateSpace[➕ Créer Espace]
        DefineRoles[👥 Définir Rôles]
        SetPermissions[🔐 Permissions]
        ConfigNotifs[🔔 Notifications]
    end
    
    subgraph "👥 Gestion Participants"
        InviteUsers[📧 Inviter Utilisateurs]
        ManageAccess[🔑 Gérer Accès]
        RoleAssignment[👨‍💼 Attribution Rôles]
        AccessControl[🛡️ Contrôle Accès]
    end
    
    subgraph "📁 Contenu Partagé"
        SharedDocs[📄 Documents Partagés]
        Comments[💬 Commentaires]
        Tasks[✅ Tâches Collaboratives]
        Timeline[📅 Timeline Commune]
    end
    
    subgraph "🔔 Notifications Temps Réel"
        NewComment[💭 Nouveau Commentaire]
        DocUpdated[📄 Document Modifié]
        TaskAssigned[✅ Tâche Assignée]
        StatusChange[🔄 Changement Statut]
    end
    
    subgraph "🎯 Rôles Utilisateurs"
        Owner[👑 Propriétaire]
        Admin[👨‍💼 Administrateur]
        Contributor[✏️ Contributeur]
        Viewer[👁️ Lecteur]
    end
    
    CreateSpace --> InviteUsers
    DefineRoles --> RoleAssignment
    InviteUsers --> SharedDocs
    SharedDocs --> Comments
    Comments --> NewComment
    
    Owner --> ManageAccess
    Admin --> ConfigNotifs
    Contributor --> Tasks
    Viewer --> Timeline
    
    style CreateSpace fill:#e1f5fe
    style InviteUsers fill:#e8f5e8
    style SharedDocs fill:#fff3e0
    style NewComment fill:#f3e5f5
    style Owner fill:#fce4ec
```

---

## 10. Parcours Erreurs & Exceptions

### 10.1 Gestion Globale des Erreurs

```mermaid
flowchart TD
    Error([❌ Erreur Détectée]) --> Type{🏷️ Type d'Erreur}
    
    Type -->|🔐 Auth| AuthError[🔐 Erreur Authentification]
    Type -->|📧 Email| EmailError[📧 Erreur Email]
    Type -->|💾 DB| DatabaseError[💾 Erreur Base de Données]
    Type -->|🌐 Network| NetworkError[🌐 Erreur Réseau]
    Type -->|📁 File| FileError[📁 Erreur Fichier]
    Type -->|⚙️ System| SystemError[⚙️ Erreur Système]
    
    AuthError --> AuthActions[🔐 Actions Auth]
    EmailError --> EmailActions[📧 Actions Email]
    DatabaseError --> DBActions[💾 Actions DB]
    NetworkError --> NetworkActions[🌐 Actions Réseau]
    FileError --> FileActions[📁 Actions Fichier]
    SystemError --> SystemActions[⚙️ Actions Système]
    
    AuthActions --> Retry1{🔄 Retry Possible?}
    EmailActions --> Retry2{🔄 Retry Possible?}
    DBActions --> Retry3{🔄 Retry Possible?}
    NetworkActions --> Retry4{🔄 Retry Possible?}
    FileActions --> Retry5{🔄 Retry Possible?}
    SystemActions --> Retry6{🔄 Retry Possible?}
    
    Retry1 -->|Oui| AutoRetry1[🔄 Retry Auto]
    Retry2 -->|Oui| AutoRetry2[🔄 Retry Auto]
    Retry3 -->|Oui| AutoRetry3[🔄 Retry Auto]
    Retry4 -->|Oui| AutoRetry4[🔄 Retry Auto]
    Retry5 -->|Oui| AutoRetry5[🔄 Retry Auto]
    Retry6 -->|Oui| AutoRetry6[🔄 Retry Auto]
    
    Retry1 -->|Non| UserNotif1[🔔 Notifier Utilisateur]
    Retry2 -->|Non| UserNotif2[🔔 Notifier Utilisateur]
    Retry3 -->|Non| UserNotif3[🔔 Notifier Utilisateur]
    Retry4 -->|Non| UserNotif4[🔔 Notifier Utilisateur]
    Retry5 -->|Non| UserNotif5[🔔 Notifier Utilisateur]
    Retry6 -->|Non| UserNotif6[🔔 Notifier Utilisateur]
    
    AutoRetry1 --> Success1{✅ Succès?}
    AutoRetry2 --> Success2{✅ Succès?}
    AutoRetry3 --> Success3{✅ Succès?}
    AutoRetry4 --> Success4{✅ Succès?}
    AutoRetry5 --> Success5{✅ Succès?}
    AutoRetry6 --> Success6{✅ Succès?}
    
    Success1 -->|Oui| Resolved[✅ Résolu]
    Success2 -->|Oui| Resolved
    Success3 -->|Oui| Resolved
    Success4 -->|Oui| Resolved
    Success5 -->|Oui| Resolved
    Success6 -->|Oui| Resolved
    
    Success1 -->|Non| UserNotif1
    Success2 -->|Non| UserNotif2
    Success3 -->|Non| UserNotif3
    Success4 -->|Non| UserNotif4
    Success5 -->|Non| UserNotif5
    Success6 -->|Non| UserNotif6
    
    UserNotif1 --> Log[📝 Log Erreur]
    UserNotif2 --> Log
    UserNotif3 --> Log
    UserNotif4 --> Log
    UserNotif5 --> Log
    UserNotif6 --> Log
    
    Log --> Escalate[📞 Escalade si Critique]
    Escalate --> Resolved
    
    style Error fill:#ffebee
    style AuthError fill:#fff3e0
    style AutoRetry1 fill:#e8f5e8
    style Resolved fill:#e1f5fe
```

### 10.2 Messages d'Erreur Utilisateur

```mermaid
graph TB
    subgraph "🔐 Erreurs Authentification"
        InvalidCreds[❌ Identifiants Invalides]
        TokenExpired[⏰ Session Expirée]
        AccessDenied[🚫 Accès Refusé]
        AccountLocked[🔒 Compte Verrouillé]
    end
    
    subgraph "📧 Erreurs Email"
        SMTPFailed[📤 Échec Envoi SMTP]
        IMAPFailed[📥 Échec Réception IMAP]
        AttachmentTooLarge[📎 Pièce Jointe Trop Volumineuse]
        InvalidEmail[📧 Email Invalide]
    end
    
    subgraph "📁 Erreurs Dossier"
        CaseNotFound[🔍 Dossier Introuvable]
        InvalidStatus[❌ Statut Invalide]
        MissingFields[📝 Champs Obligatoires]
        DuplicateCase[🔄 Dossier Dupliqué]
    end
    
    subgraph "💾 Erreurs Système"
        DatabaseDown[💾 Base de Données Indisponible]
        DiskFull[💽 Espace Disque Insuffisant]
        ServiceUnavailable[⚙️ Service Indisponible]
        NetworkTimeout[🌐 Délai Réseau Dépassé]
    end
    
    subgraph "🎨 Messages Utilisateur"
        FriendlyMsg[😊 Message Convivial]
        TechnicalDetails[🔧 Détails Techniques]
        ActionSuggestion[💡 Action Suggérée]
        ContactSupport[📞 Contacter Support]
    end
    
    InvalidCreds --> FriendlyMsg
    SMTPFailed --> TechnicalDetails
    CaseNotFound --> ActionSuggestion
    DatabaseDown --> ContactSupport
    
    FriendlyMsg --> UserAction[👤 Action Utilisateur]
    TechnicalDetails --> UserAction
    ActionSuggestion --> UserAction
    ContactSupport --> UserAction
    
    style InvalidCreds fill:#ffebee
    style SMTPFailed fill:#fff3e0
    style CaseNotFound fill:#e8f5e8
    style DatabaseDown fill:#f3e5f5
    style FriendlyMsg fill:#e1f5fe
```

---

## 📊 Métriques et KPIs des Parcours

### Métriques de Performance par Parcours

| Parcours | Métrique Clé | Objectif | Seuil Alerte |
|----------|--------------|----------|---------------|
| 🔐 Authentification | Temps de connexion | < 2s | > 5s |
| 📧 Monitoring Email | Délai de détection | < 60s | > 300s |
| 📁 Création Dossier | Temps de création | < 30s | > 120s |
| 🔍 Recherche | Temps de réponse | < 1s | > 3s |
| 🔔 Notifications | Délai de livraison | < 5s | > 30s |
| 📊 Analytics | Temps de génération | < 10s | > 60s |

### Taux de Conversion par Parcours

```mermaid
pie title Taux de Réussite des Parcours
    "Authentification" : 98
    "Création Dossier" : 95
    "Envoi Email" : 97
    "Recherche" : 99
    "Notifications" : 96
    "Analytics" : 94
```

---

## 🚀 Points d'Amélioration Identifiés

### Optimisations Prioritaires

1. **🔄 Parcours Monitoring Email**
   - Réduire la latence de détection (60s → 30s)
   - Améliorer la détection des doublons
   - Optimiser l'extraction automatique d'informations

2. **📁 Parcours Création Dossier**
   - Simplifier le formulaire de création
   - Améliorer l'auto-complétion
   - Réduire le nombre d'étapes

3. **🔍 Parcours Recherche**
   - Optimiser les performances de recherche sémantique
   - Améliorer la pertinence des résultats
   - Ajouter la recherche vocale

4. **🔔 Parcours Notifications**
   - Personnaliser les préférences utilisateur
   - Améliorer le groupement des notifications
   - Ajouter les notifications push mobiles

---

## 📝 Conclusion

Ces diagrammes couvrent l'ensemble des parcours utilisateurs de MemoLib, de l'authentification à la gestion des erreurs, en passant par toutes les fonctionnalités métier. Ils servent de référence pour :

- ✅ **Développement** : Guide d'implémentation des fonctionnalités
- ✅ **Tests** : Scénarios de test complets
- ✅ **Formation** : Support de formation utilisateurs
- ✅ **Maintenance** : Documentation technique
- ✅ **Évolution** : Base pour les futures améliorations

Chaque parcours est conçu pour être **intuitif**, **efficace** et **robuste**, avec une gestion d'erreurs complète et des notifications appropriées pour guider l'utilisateur à chaque étape.