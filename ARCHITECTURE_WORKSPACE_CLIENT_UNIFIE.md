# 🏗️ Architecture Workspace Client Unifié

## 📋 Concept

**Workspace = Espace Client Unique** qui centralise TOUS les échanges et données d'un client.

### Vision

```
Client (M. Dubois)
  └── Workspace Unique "Espace M. DUBOIS"
       │
       ├── 📧 Emails (TOUS centralisés)
       │    ├── Email 1 : Demande initiale
       │    ├── Email 2 : Réponse avocat
       │    └── Email 3 : Documents complémentaires
       │
       ├── 💬 Messages (échanges internes/externes)
       │    ├── Note interne avocat
       │    ├── Discussion équipe
       │    └── Message au client
       │
       ├── 📄 Documents Globaux
       │    ├── Passeport
       │    ├── Justificatif domicile
       │    └── Titre de séjour
       │
       ├── 📁 Procédures Juridiques (sous-dossiers)
       │    ├── Procédure 1: OQTF
       │    │    ├── Documents spécifiques
       │    │    ├── Échéances
       │    │    └── Checklist
       │    │
       │    └── Procédure 2: Naturalisation
       │         ├── Documents spécifiques
       │         ├── Échéances
       │         └── Checklist
       │
       ├── ⏰ Échéances Globales
       │
       ├── 📊 Timeline Unifiée
       │    ├── Premier contact
       │    ├── Email reçu
       │    ├── Document ajouté
       │    ├── Procédure créée
       │    └── Échéance rappel
       │
       └── 📝 Notes & Alertes
            ├── Note avocat 1
            ├── Alerte délai critique
            └── Note privée équipe
```

---

## 🎯 Principes Clés

### 1️⃣ Relation 1:1 Client ↔ Workspace

- **Un client = UN workspace unique**
- Relation `clientId String @unique` dans Workspace
- Création automatique du workspace lors de la création client

### 2️⃣ Centralisation Totale

Tout passe par le workspace :
- ✅ **Emails** → WorkspaceEmail
- ✅ **Messages** → WorkspaceMessage
- ✅ **Documents** → WorkspaceDocument
- ✅ **Procédures** → Procedure (sous-entités)
- ✅ **Timeline** → TimelineEvent
- ✅ **Notes** → WorkspaceNote
- ✅ **Alertes** → WorkspaceAlert

### 3️⃣ Procédures = Sous-Dossiers

Les procédures juridiques (OQTF, Naturalisation, etc.) deviennent des **sous-entités** du workspace :
- Relation `workspaceId` → `Procedure`
- Chaque procédure a ses propres documents, échéances, checklist
- Mais TOUT est visible au niveau workspace

---

## 📊 Schéma Prisma

### Modèle Workspace (Espace Client)

```prisma
model Workspace {
  id       String @id @default(uuid())
  tenantId String
  tenant   Tenant @relation(...)

  // RELATION 1:1 CLIENT
  clientId String @unique
  client   Client @relation(...)
  
  // Informations globales
  title       String // "Espace M. DUBOIS"
  description String?
  reference   String? @unique
  
  // Statut global
  status String @default("active") // active, suspended, archived
  globalPriority String @default("normale") // faible, normale, haute, critique
  
  // Dates
  firstContactDate DateTime?
  lastActivityDate DateTime @default(now())
  closedAt         DateTime?
  
  // Équipe
  createdById      String
  primaryLawyerId  String?
  teamMemberIds    String? // JSON array
  
  // Communication
  preferredChannel String @default("email")
  notificationsEnabled Boolean @default(true)
  
  // Stats calculées
  totalProcedures  Int @default(0)
  activeProcedures Int @default(0)
  totalEmails      Int @default(0)
  totalDocuments   Int @default(0)
  
  // RELATIONS CENTRALISÉES
  procedures  Procedure[]        // Sous-dossiers juridiques
  emails      WorkspaceEmail[]   // TOUS les emails
  messages    WorkspaceMessage[] // Messages
  documents   WorkspaceDocument[] // Documents globaux
  alerts      WorkspaceAlert[]   // Alertes
  timeline    TimelineEvent[]    // Timeline unifiée
  notes       WorkspaceNote[]    // Notes internes
}
```

### Modèle Procedure (Sous-Dossier Juridique)

```prisma
model Procedure {
  id          String @id @default(uuid())
  workspaceId String
  workspace   Workspace @relation(...)

  // Type CESDA
  procedureType String // OQTF, NATURALISATION, etc.
  
  title       String // "OQTF - Recours contentieux"
  description String?
  reference   String?
  
  status String @default("active")
  urgencyLevel String @default("moyen")
  
  // Dates spécifiques
  notificationDate DateTime?
  deadlineDate     DateTime?
  startedAt        DateTime @default(now())
  closedAt         DateTime?
  
  assignedToId String?
  metadata     String? // JSON
  
  outcome      String? // success, failure, pending
  outcomeNotes String?
  
  // RELATIONS SPÉCIFIQUES À LA PROCÉDURE
  checklist      ProcedureChecklistItem[]
  documents      ProcedureDocument[]
  documentDrafts ProcedureDraft[]
  echeances      ProcedureEcheance[]
}
```

### Modèle WorkspaceEmail (Emails Centralisés)

```prisma
model WorkspaceEmail {
  id          String @id @default(uuid())
  workspaceId String
  workspace   Workspace @relation(...)

  // Metadata email
  messageId String @unique // Gmail ID
  threadId  String?
  
  from      String
  to        String
  cc        String? // JSON
  subject   String
  bodyText  String?
  bodyHtml  String?
  
  receivedDate DateTime
  sentDate     DateTime?
  
  // Classification auto
  direction String // inbound, outbound
  category  String? // general, urgent, juridique
  priority  String @default("normal")
  
  // Pièces jointes
  hasAttachments Boolean @default(false)
  attachments    String? // JSON array
  
  // IA
  aiProcessed    Boolean @default(false)
  aiClassified   String?
  aiConfidence   Float?
  aiSummary      String?
  aiActionNeeded String?
  
  // État
  isRead     Boolean @default(false)
  isStarred  Boolean @default(false)
  isArchived Boolean @default(false)
  
  // Réponse
  needsResponse     Boolean @default(false)
  responseGenerated Boolean @default(false)
  responseDraft     String?
  respondedAt       DateTime?
}
```

### Modèle WorkspaceMessage (Messages Internes/Externes)

```prisma
model WorkspaceMessage {
  id          String @id @default(uuid())
  workspaceId String
  workspace   Workspace @relation(...)

  type String // internal_note, client_message, team_discussion
  
  senderId      String
  senderName    String
  senderType    String // lawyer, client, admin, system
  
  recipientIds  String? // JSON array
  recipientType String? // client, team, specific_users
  
  subject String?
  content String
  
  priority   String @default("normal")
  visibility String @default("team") // team, client, private
  
  attachments String? // JSON
  
  isRead   Boolean @default(false)
  readAt   DateTime?
  readBy   String? // JSON array
  
  // Lien optionnel à procédure
  procedureId String?
}
```

### Modèle TimelineEvent (Timeline Unifiée)

```prisma
model TimelineEvent {
  id          String @id @default(uuid())
  workspaceId String
  workspace   Workspace @relation(...)

  eventType   String // created, document_added, email_received, etc.
  title       String
  description String?
  
  actorType String // user, ai, system
  actorId   String?
  
  metadata String? // JSON
  
  createdAt DateTime @default(now())
}
```

---

## 🔄 Workflow Email → Workspace

### Réception Email

```typescript
// 1. Email arrive via Gmail API
const email = await detectNewEmail();

// 2. Classification IA
const classification = await classifyEmail(email);
// → Type: "nouveau_client", "reponse_client", "ceseda", etc.

// 3. Identification/Création Client
let client = await findClientByEmail(email.from);
if (!client) {
  client = await createClient({ email: email.from });
}

// 4. Récupération/Création Workspace
let workspace = await prisma.workspace.findUnique({
  where: { clientId: client.id }
});

if (!workspace) {
  workspace = await createWorkspace(client);
}

// 5. Sauvegarde Email dans Workspace
await prisma.workspaceEmail.create({
  data: {
    workspaceId: workspace.id,
    messageId: email.id,
    from: email.from,
    subject: email.subject,
    // ... classification IA
    category: classification.type,
    priority: classification.priority,
    aiConfidence: classification.confidence,
  }
});

// 6. Mise à jour stats workspace
await prisma.workspace.update({
  where: { id: workspace.id },
  data: {
    totalEmails: { increment: 1 },
    lastActivityDate: new Date()
  }
});

// 7. Timeline event
await prisma.timelineEvent.create({
  data: {
    workspaceId: workspace.id,
    eventType: "email_received",
    title: `Email: ${email.subject}`,
    actorType: "system"
  }
});

// 8. Notification temps réel
notifyWorkspaceUpdate(workspace.id, {
  type: "email_received",
  priority: classification.priority
});
```

---

## 🎨 Interface Utilisateur

### Page Workspace Client

**Route** : `/lawyer/workspaces/[workspaceId]`

```tsx
// Onglets principaux
<WorkspaceTabs>
  <Tab name="Vue d'ensemble">
    <WorkspaceOverview 
      stats={stats}
      recentActivity={timeline}
      alerts={alerts}
    />
  </Tab>
  
  <Tab name="Emails" badge={unreadCount}>
    <EmailList 
      emails={workspaceEmails}
      onReply={handleReply}
    />
  </Tab>
  
  <Tab name="Procédures">
    <ProceduresList 
      procedures={procedures}
      onCreate={createProcedure}
    />
  </Tab>
  
  <Tab name="Documents">
    <DocumentLibrary 
      documents={workspaceDocuments}
      onUpload={handleUpload}
    />
  </Tab>
  
  <Tab name="Timeline">
    <UnifiedTimeline events={timelineEvents} />
  </Tab>
  
  <Tab name="Notes">
    <NotesList notes={workspaceNotes} />
  </Tab>
</WorkspaceTabs>
```

### Dashboard Avocat

**Vue Liste Workspaces**

```tsx
// /lawyer/workspaces
<WorkspaceList>
  {workspaces.map(ws => (
    <WorkspaceCard key={ws.id}>
      <ClientInfo name={ws.client.name} />
      <Stats>
        <Stat label="Procédures actives" value={ws.activeProcedures} />
        <Stat label="Emails non lus" value={ws.unreadEmails} />
        <Stat label="Échéances" value={ws.upcomingDeadlines} />
      </Stats>
      <Priority level={ws.globalPriority} />
      <LastActivity date={ws.lastActivityDate} />
    </WorkspaceCard>
  ))}
</WorkspaceList>
```

---

## 📈 Métriques & Statistiques

### Au Niveau Workspace

```typescript
interface WorkspaceMetrics {
  totalProcedures: number;
  activeProcedures: number;
  closedProcedures: number;
  
  totalEmails: number;
  unreadEmails: number;
  emailsNeedingResponse: number;
  
  totalDocuments: number;
  verifiedDocuments: number;
  pendingDocuments: number;
  
  upcomingDeadlines: number;
  criticalAlerts: number;
  
  averageResponseTime: number; // heures
  clientSatisfaction: number; // 1-5
}
```

### Au Niveau Tenant (Tous Workspaces)

```typescript
interface TenantMetrics {
  totalWorkspaces: number;
  activeWorkspaces: number;
  archivedWorkspaces: number;
  
  averageWorkspaceActivity: number;
  averageProceduresPerWorkspace: number;
  
  totalEmailsProcessed: number;
  aiClassificationAccuracy: number;
  
  deadlinesRespected: number;
  deadlinesMissed: number;
}
```

---

## 🔧 Migration Données Existantes

### Script de Migration

```typescript
// scripts/migrate-to-workspace-client.ts
import { prisma } from '@/lib/prisma';

async function migrateToWorkspaceClient() {
  console.log('🚀 Migration vers Workspace Client Unifié...');
  
  // 1. Pour chaque client
  const clients = await prisma.client.findMany();
  
  for (const client of clients) {
    // 2. Créer workspace unique
    const workspace = await prisma.workspace.create({
      data: {
        tenantId: client.tenantId,
        clientId: client.id,
        title: `Espace ${client.firstName} ${client.lastName}`,
        reference: `WS-${client.id.substring(0, 8)}`,
        createdById: 'system',
        firstContactDate: client.createdAt,
        lastActivityDate: client.lastActivityAt || new Date(),
      }
    });
    
    // 3. Migrer anciens dossiers → procédures
    const dossiers = await prisma.dossier.findMany({
      where: { clientId: client.id }
    });
    
    for (const dossier of dossiers) {
      await prisma.procedure.create({
        data: {
          workspaceId: workspace.id,
          procedureType: dossier.typeDossier,
          title: dossier.numero,
          status: mapDossierStatus(dossier.statut),
          urgencyLevel: mapDossierPriority(dossier.priorite),
          notificationDate: dossier.dateCreation,
          deadlineDate: dossier.dateEcheance,
          assignedToId: dossier.responsableId,
        }
      });
    }
    
    // 4. Migrer emails
    const emails = await prisma.email.findMany({
      where: { clientId: client.id }
    });
    
    for (const email of emails) {
      await prisma.workspaceEmail.create({
        data: {
          workspaceId: workspace.id,
          messageId: email.messageId,
          from: email.from,
          to: email.to,
          subject: email.subject,
          bodyText: email.bodyText,
          receivedDate: email.receivedDate,
          direction: email.from === client.email ? 'inbound' : 'outbound',
          category: email.classification?.type,
          priority: email.classification?.priority || 'normal',
        }
      });
    }
    
    // 5. Timeline event migration
    await prisma.timelineEvent.create({
      data: {
        workspaceId: workspace.id,
        eventType: 'migration',
        title: 'Workspace créé automatiquement',
        actorType: 'system',
      }
    });
    
    console.log(`✅ Workspace créé pour ${client.firstName} ${client.lastName}`);
  }
  
  console.log('🎉 Migration terminée!');
}

migrateToWorkspaceClient();
```

---

## 🚀 Avantages Architecture

### ✅ Pour l'Avocat

- **Vue 360°** du client en un seul endroit
- **Historique complet** de tous les échanges
- **Navigation intuitive** entre procédures
- **Recherche centralisée** dans tout le workspace
- **Statistiques globales** par client

### ✅ Pour le Client

- **Accès simplifié** à son espace unique
- **Visibilité complète** sur ses dossiers
- **Communication unifiée** avec le cabinet
- **Timeline claire** de toutes les actions

### ✅ Pour le Système

- **Routage automatique** des emails
- **Classification IA** optimisée
- **Moins de duplication** de données
- **Performance** améliorée (1 requête pour tout)
- **Scalabilité** simplifiée

---

## 🎯 Prochaines Étapes

### Phase 1 : Migration Base de Données

```bash
# 1. Backup
npm run db:backup

# 2. Appliquer schema
npx prisma db push

# 3. Migrer données
npx tsx scripts/migrate-to-workspace-client.ts

# 4. Vérifier
npm run db:studio
```

### Phase 2 : Adapter API Routes

```typescript
// Avant
GET /api/lawyer/emails
GET /api/lawyer/dossiers

// Après
GET /api/lawyer/workspaces
GET /api/lawyer/workspaces/[id]/emails
GET /api/lawyer/workspaces/[id]/procedures
GET /api/lawyer/workspaces/[id]/timeline
```

### Phase 3 : Refonte Interface

- Créer page workspace unique
- Adapter dashboard avocat
- Mettre à jour navigation
- Tests utilisateurs

---

## 📚 Documentation Technique

### Fichiers Modifiés

```
prisma/schema.prisma
├── Workspace (modifié - espace client unifié)
├── Procedure (nouveau - sous-dossier)
├── WorkspaceEmail (nouveau)
├── WorkspaceMessage (nouveau)
├── WorkspaceNote (nouveau)
├── ProcedureChecklistItem (nouveau)
├── ProcedureDocument (nouveau)
├── ProcedureDraft (nouveau)
└── ProcedureEcheance (nouveau)
```

### Scripts Créés

```
scripts/
├── migrate-to-workspace-client.ts
├── test-workspace-creation.ts
└── verify-workspace-integrity.ts
```

---

## 🎉 Conclusion

Cette architecture transforme **radicalement** l'approche :

**Avant** : Dossiers dispersés, emails séparés, fragmentation
**Après** : **UN espace client unique et unifié** qui centralise TOUT

C'est exactement votre vision : **"Un email arrive → il va dans le workspace client → tout est au même endroit"** ✨

---

**Architecture implémentée** ✅  
**Prêt pour migration** 🚀  
**Date** : 19 janvier 2026
