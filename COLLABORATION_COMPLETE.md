# 🤝 Système de Collaboration Complète - Suivi Multi-Utilisateurs

## 🎯 Concept

**Tous ceux rattachés à un dossier peuvent suivre son état en temps réel.**

Chaque dossier peut avoir :
- 👑 **1 Propriétaire** (créateur)
- 👥 **N Collaborateurs** (avec permissions granulaires)
- 📊 **Timeline d'activités** complète
- 🔔 **Notifications** automatiques

---

## 👥 Rôles de Collaboration

### 1. **OWNER** 👑
Le créateur du dossier - Contrôle total

**Permissions :**
- ✅ Tout voir
- ✅ Tout modifier
- ✅ Ajouter/retirer collaborateurs
- ✅ Supprimer le dossier
- ✅ Changer propriétaire

---

### 2. **COLLABORATOR** 🤝
Membre actif de l'équipe

**Permissions configurables :**
- ✅ Voir le dossier
- ✅ Modifier (si autorisé)
- ✅ Commenter
- ✅ Voir documents
- ✅ Uploader documents (si autorisé)
- ✅ Inviter d'autres (si autorisé)
- ✅ Recevoir notifications

---

### 3. **VIEWER** 👁️
Observateur en lecture seule

**Permissions :**
- ✅ Voir le dossier
- ✅ Voir timeline
- ✅ Voir documents (si autorisé)
- ❌ Modifier
- ❌ Commenter
- ❌ Uploader

---

## 📊 Timeline d'Activités

**Toutes les actions sont tracées :**

```json
{
  "id": "guid",
  "caseId": "guid",
  "userId": "guid",
  "userName": "marie@example.com",
  "activityType": "STATUS_CHANGED",
  "description": "Statut changé de OPEN à IN_PROGRESS",
  "oldValue": "OPEN",
  "newValue": "IN_PROGRESS",
  "occurredAt": "2025-01-20T14:30:00Z"
}
```

**Types d'activités :**
- `CREATED` - Dossier créé
- `STATUS_CHANGED` - Statut modifié
- `PRIORITY_CHANGED` - Priorité modifiée
- `ASSIGNED` - Assigné à quelqu'un
- `TAG_ADDED` - Tag ajouté
- `TAG_REMOVED` - Tag retiré
- `COMMENT_ADDED` - Commentaire ajouté
- `DOCUMENT_UPLOADED` - Document uploadé
- `DOCUMENT_DELETED` - Document supprimé
- `COLLABORATOR_ADDED` - Collaborateur ajouté
- `COLLABORATOR_REMOVED` - Collaborateur retiré
- `MESSAGE_RECEIVED` - Message reçu
- `MESSAGE_SENT` - Message envoyé
- `NOTIFICATION_SENT` - Notification envoyée
- `CASE_CLOSED` - Dossier clôturé
- `CASE_REOPENED` - Dossier réouvert

---

## 🔌 API Endpoints

### 1. Ajouter Collaborateur
```http
POST /api/cases/{caseId}/collaboration/collaborators
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "guid",
  "role": "COLLABORATOR",
  "canEdit": true,
  "canComment": true,
  "canViewDocuments": true,
  "canUploadDocuments": true,
  "canInviteOthers": false,
  "receiveNotifications": true
}

Response:
{
  "id": "guid",
  "caseId": "guid",
  "userId": "guid",
  "role": "COLLABORATOR",
  ...
}
```

### 2. Liste Collaborateurs
```http
GET /api/cases/{caseId}/collaboration/collaborators
Authorization: Bearer {token}

Response:
[
  {
    "id": "guid",
    "userId": "guid",
    "userName": "Marie Dupont",
    "userEmail": "marie@example.com",
    "role": "COLLABORATOR",
    "canEdit": true,
    "addedAt": "2025-01-20T10:00:00Z"
  }
]
```

### 3. Retirer Collaborateur
```http
DELETE /api/cases/{caseId}/collaboration/collaborators/{collaboratorId}
Authorization: Bearer {token}

Response:
{
  "message": "Collaborateur retiré"
}
```

### 4. Timeline d'Activités
```http
GET /api/cases/{caseId}/collaboration/activities?limit=100
Authorization: Bearer {token}

Response:
[
  {
    "id": "guid",
    "activityType": "STATUS_CHANGED",
    "userName": "marie@example.com",
    "description": "Statut changé de OPEN à IN_PROGRESS",
    "oldValue": "OPEN",
    "newValue": "IN_PROGRESS",
    "occurredAt": "2025-01-20T14:30:00Z"
  },
  {
    "activityType": "COMMENT_ADDED",
    "userName": "jean@example.com",
    "description": "Commentaire ajouté",
    "occurredAt": "2025-01-20T14:25:00Z"
  }
]
```

### 5. Mes Dossiers (Propriétaire + Collaborateur)
```http
GET /api/cases/my-cases
Authorization: Bearer {token}

Response:
[
  {
    "id": "guid",
    "title": "Divorce - Marie Dubois",
    "status": "IN_PROGRESS",
    "priority": 5,
    "role": "OWNER"
  },
  {
    "id": "guid",
    "title": "Contrat - TechCorp",
    "status": "OPEN",
    "priority": 3,
    "role": "COLLABORATOR"
  }
]
```

### 6. Notifier Tous les Collaborateurs
```http
POST /api/cases/{caseId}/collaboration/notify
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Mise à jour importante",
  "message": "Le client a fourni les documents manquants"
}

Response:
{
  "message": "5 collaborateurs notifiés"
}
```

---

## 💻 Interface Utilisateur

### Page Dossier avec Collaboration

```html
<div class="case-detail">
  <!-- Header -->
  <div class="case-header">
    <h1>Divorce - Marie Dubois</h1>
    <span class="status">IN_PROGRESS</span>
    <span class="priority">Priorité: 5/5</span>
  </div>
  
  <!-- Onglets -->
  <div class="tabs">
    <button class="active">📋 Détails</button>
    <button>💬 Messages</button>
    <button>📎 Documents</button>
    <button>👥 Collaborateurs</button>
    <button>📊 Activités</button>
  </div>
  
  <!-- Onglet Collaborateurs -->
  <div class="collaborators-tab">
    <h3>👥 Collaborateurs (3)</h3>
    
    <button onclick="addCollaborator()">➕ Ajouter Collaborateur</button>
    
    <div class="collaborator-list">
      <!-- Propriétaire -->
      <div class="collaborator owner">
        <div class="avatar">👑</div>
        <div class="info">
          <strong>Me Dupont</strong>
          <span>dupont@cabinet.fr</span>
          <span class="role">OWNER</span>
        </div>
      </div>
      
      <!-- Collaborateur 1 -->
      <div class="collaborator">
        <div class="avatar">🤝</div>
        <div class="info">
          <strong>Marie Martin</strong>
          <span>marie@cabinet.fr</span>
          <span class="role">COLLABORATOR</span>
          <div class="permissions">
            ✅ Modifier ✅ Commenter ✅ Documents
          </div>
        </div>
        <button onclick="removeCollaborator('guid')">❌</button>
      </div>
      
      <!-- Collaborateur 2 -->
      <div class="collaborator">
        <div class="avatar">👁️</div>
        <div class="info">
          <strong>Jean Durand</strong>
          <span>jean@cabinet.fr</span>
          <span class="role">VIEWER</span>
          <div class="permissions">
            👁️ Lecture seule
          </div>
        </div>
        <button onclick="removeCollaborator('guid')">❌</button>
      </div>
    </div>
  </div>
  
  <!-- Onglet Activités -->
  <div class="activities-tab">
    <h3>📊 Timeline d'Activités</h3>
    
    <div class="activity-timeline">
      <!-- Activité 1 -->
      <div class="activity">
        <div class="time">14:30</div>
        <div class="icon">📝</div>
        <div class="content">
          <strong>Marie Martin</strong> a changé le statut
          <div class="change">OPEN → IN_PROGRESS</div>
        </div>
      </div>
      
      <!-- Activité 2 -->
      <div class="activity">
        <div class="time">14:25</div>
        <div class="icon">💬</div>
        <div class="content">
          <strong>Jean Durand</strong> a ajouté un commentaire
          <div class="comment">"Client très satisfait de l'avancement"</div>
        </div>
      </div>
      
      <!-- Activité 3 -->
      <div class="activity">
        <div class="time">14:20</div>
        <div class="icon">📎</div>
        <div class="content">
          <strong>Me Dupont</strong> a uploadé un document
          <div class="file">contrat-divorce.pdf</div>
        </div>
      </div>
      
      <!-- Activité 4 -->
      <div class="activity">
        <div class="time">14:15</div>
        <div class="icon">👥</div>
        <div class="content">
          <strong>Me Dupont</strong> a ajouté <strong>Marie Martin</strong> comme collaborateur
        </div>
      </div>
      
      <!-- Activité 5 -->
      <div class="activity">
        <div class="time">10:00</div>
        <div class="icon">📧</div>
        <div class="content">
          <strong>Système</strong> a reçu un email
          <div class="preview">De: marie.dubois@example.com - "URGENT - Demande divorce"</div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Bouton Notifier -->
  <button class="notify-all" onclick="notifyCollaborators()">
    🔔 Notifier Tous les Collaborateurs
  </button>
</div>
```

### JavaScript

```javascript
async function addCollaborator() {
  const userId = prompt('ID utilisateur:');
  const role = prompt('Rôle (COLLABORATOR/VIEWER):');
  
  const response = await fetch(`/api/cases/${caseId}/collaboration/collaborators`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      role,
      canEdit: true,
      canComment: true,
      canViewDocuments: true,
      canUploadDocuments: true,
      canInviteOthers: false,
      receiveNotifications: true
    })
  });
  
  if (response.ok) {
    alert('✅ Collaborateur ajouté !');
    loadCollaborators();
  }
}

async function loadActivities() {
  const response = await fetch(`/api/cases/${caseId}/collaboration/activities`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const activities = await response.json();
  
  renderActivities(activities);
}

async function notifyCollaborators() {
  const title = prompt('Titre de la notification:');
  const message = prompt('Message:');
  
  const response = await fetch(`/api/cases/${caseId}/collaboration/notify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, message })
  });
  
  if (response.ok) {
    const data = await response.json();
    alert(`✅ ${data.message}`);
  }
}

// Polling activités toutes les 10 secondes
setInterval(loadActivities, 10000);
```

---

## 🎯 Scénarios d'Usage

### Scénario 1: Cabinet d'Avocats
```
1. Me Dupont reçoit email divorce urgent
2. Dossier créé automatiquement (OWNER: Me Dupont)
3. Me Dupont ajoute:
   - Marie (secrétaire) → COLLABORATOR (peut commenter)
   - Jean (stagiaire) → VIEWER (lecture seule)
4. Marie ajoute commentaire "Client rappelé"
5. Me Dupont upload contrat
6. Jean voit tout en temps réel
7. Notification automatique à tous
```

### Scénario 2: Équipe Médicale
```
1. Dr Martin reçoit demande RDV
2. Dossier patient créé (OWNER: Dr Martin)
3. Dr Martin ajoute:
   - Infirmière Sophie → COLLABORATOR (peut modifier)
   - Secrétaire Julie → COLLABORATOR (peut commenter)
4. Sophie ajoute notes consultation
5. Julie planifie prochain RDV
6. Dr Martin voit timeline complète
7. Tous notifiés des changements
```

### Scénario 3: Projet Consulting
```
1. Consultant reçoit demande projet
2. Dossier créé (OWNER: Consultant)
3. Consultant ajoute:
   - Chef projet → COLLABORATOR (full access)
   - Développeur → COLLABORATOR (documents only)
   - Client → VIEWER (lecture seule)
4. Chacun voit avancement en temps réel
5. Client suit sans pouvoir modifier
6. Notifications à chaque étape
```

---

## ✅ Avantages

### Transparence Totale
- ✅ Tous voient l'état en temps réel
- ✅ Timeline complète des actions
- ✅ Qui a fait quoi et quand
- ✅ Aucune information cachée

### Collaboration Efficace
- ✅ Travail d'équipe fluide
- ✅ Permissions granulaires
- ✅ Notifications automatiques
- ✅ Pas de doublon d'efforts

### Traçabilité
- ✅ Audit complet
- ✅ Historique immuable
- ✅ Conformité RGPD
- ✅ Preuve d'actions

### Flexibilité
- ✅ Rôles personnalisables
- ✅ Permissions ajustables
- ✅ Ajout/retrait facile
- ✅ Notifications configurables

---

## 📖 Fichiers Créés

- `Models/CaseCollaborator.cs` - Modèle collaborateur
- `Models/CaseActivity.cs` - Modèle activité
- `Controllers/CaseCollaborationController.cs` - API collaboration
- `Data/MemoLibDbContext.cs` - DbSets ajoutés
- `COLLABORATION_COMPLETE.md` - Documentation

---

## 🎯 Résultat

**Avant :**
- ❌ Dossiers isolés
- ❌ Pas de suivi d'équipe
- ❌ Pas de timeline
- ❌ Pas de notifications

**Après :**
- ✅ Collaboration multi-utilisateurs
- ✅ Suivi temps réel
- ✅ Timeline complète
- ✅ Notifications automatiques
- ✅ Permissions granulaires
- ✅ Transparence totale

**🤝 Collaboration +1000% !**
