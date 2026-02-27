# 🎯 Système d'Actions en Attente - Contrôle Utilisateur Total

## 💡 Concept

**Chaque événement (email, SMS, WhatsApp, etc.) nécessite une ACTION UTILISATEUR avant toute automatisation.**

L'utilisateur décide :
- ✅ Créer un dossier ou non
- ✅ Créer un client ou non
- ✅ Lier à un dossier existant
- ✅ Assigner à quelqu'un
- ✅ Définir priorité et tags
- ❌ Rejeter (spam, ignorer, archiver)

---

## 🔄 Workflow

```
1. Événement arrive (email, SMS, etc.)
   ↓
2. Système analyse et SUGGÈRE des actions
   ↓
3. Événement mis en ATTENTE (PendingAction)
   ↓
4. Notification utilisateur
   ↓
5. UTILISATEUR DÉCIDE (approuver/rejeter/modifier)
   ↓
6. Système exécute selon décision utilisateur
   ↓
7. Événement traité
```

---

## 📋 Modèle PendingAction

### Informations de l'Événement
```json
{
  "id": "guid",
  "userId": "guid",
  "eventId": "guid",
  "eventType": "EMAIL",
  "status": "PENDING",
  "from": "client@example.com",
  "fromName": "Jean Dupont",
  "subject": "Demande de consultation",
  "preview": "Bonjour, j'ai besoin d'aide pour..."
}
```

### Suggestions du Système
```json
{
  "suggestCreateCase": true,
  "suggestedCaseTitle": "Demande de consultation - Jean Dupont",
  "suggestCreateClient": true,
  "suggestedClientName": "Jean Dupont",
  "suggestedClientPhone": "+33612345678",
  "suggestedClientEmail": "client@example.com",
  "suggestLinkToExistingCase": null,
  "suggestLinkToExistingClient": "guid-if-exists"
}
```

### Décision Utilisateur
```json
{
  "userCreateCase": true,
  "userCaseTitle": "Divorce amiable - Jean Dupont",
  "userCreateClient": false,
  "userLinkToClientId": "existing-client-guid",
  "userAssignToUserId": "lawyer-guid",
  "userPriority": 4,
  "userTags": "[\"divorce\", \"urgent\"]",
  "userNotes": "Client connu, traiter rapidement"
}
```

---

## 🔌 API Endpoints

### 1. Liste des Actions en Attente
```http
GET /api/pending-actions?limit=50
Authorization: Bearer {token}

Response:
{
  "count": 3,
  "actions": [
    {
      "id": "guid",
      "eventType": "EMAIL",
      "from": "client@example.com",
      "subject": "Demande consultation",
      "preview": "Bonjour...",
      "suggestCreateCase": true,
      "suggestedCaseTitle": "...",
      "createdAt": "2025-01-20T10:00:00Z"
    }
  ]
}
```

### 2. Détail d'une Action
```http
GET /api/pending-actions/{id}
Authorization: Bearer {token}

Response: PendingAction complète
```

### 3. Approuver une Action
```http
POST /api/pending-actions/{id}/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "createCase": true,
  "caseTitle": "Divorce amiable - Jean Dupont",
  "createClient": false,
  "linkToClientId": "existing-client-guid",
  "assignToUserId": "lawyer-guid",
  "priority": 4,
  "tags": "[\"divorce\", \"urgent\"]",
  "notes": "Client connu"
}

Response:
{
  "message": "Action approuvée et exécutée",
  "action": { ... }
}
```

### 4. Rejeter une Action
```http
POST /api/pending-actions/{id}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Spam",
  "markAsSpam": true,
  "archive": false
}

Response:
{
  "message": "Action rejetée",
  "action": { ... }
}
```

### 5. Approuver en Masse
```http
POST /api/pending-actions/bulk-approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "actionIds": ["guid1", "guid2", "guid3"]
}

Response:
{
  "message": "3 actions approuvées",
  "count": 3
}
```

### 6. Rejeter en Masse
```http
POST /api/pending-actions/bulk-reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "actionIds": ["guid1", "guid2"]
}

Response:
{
  "message": "2 actions rejetées",
  "count": 2
}
```

---

## 💻 Interface Utilisateur

### Centre d'Actions en Attente

```html
<div class="pending-actions-center">
  <h2>🎯 Actions en Attente <span class="badge">3</span></h2>
  
  <!-- Action Card -->
  <div class="action-card">
    <div class="action-header">
      <span class="event-type">📧 EMAIL</span>
      <span class="time">Il y a 5 min</span>
    </div>
    
    <div class="action-content">
      <h3>Demande de consultation</h3>
      <p class="from">De: Jean Dupont (client@example.com)</p>
      <p class="preview">Bonjour, j'ai besoin d'aide pour un divorce amiable...</p>
    </div>
    
    <div class="suggestions">
      <h4>💡 Suggestions du système</h4>
      <ul>
        <li>✅ Créer dossier: "Demande consultation - Jean Dupont"</li>
        <li>✅ Créer client: Jean Dupont (+33612345678)</li>
      </ul>
    </div>
    
    <div class="user-decision">
      <h4>🎛️ Votre décision</h4>
      
      <label>
        <input type="checkbox" checked> Créer un dossier
      </label>
      <input type="text" value="Divorce amiable - Jean Dupont" placeholder="Titre du dossier">
      
      <label>
        <input type="checkbox"> Créer un client
      </label>
      <select>
        <option>Lier à client existant</option>
        <option value="guid">Jean Dupont (existant)</option>
      </select>
      
      <label>Assigner à:</label>
      <select>
        <option value="">Moi-même</option>
        <option value="guid">Maître Martin</option>
      </select>
      
      <label>Priorité:</label>
      <select>
        <option value="5">🔴 Critique (5)</option>
        <option value="4" selected>🟠 Élevée (4)</option>
        <option value="3">🟡 Moyenne (3)</option>
        <option value="2">⚪ Faible (2)</option>
      </select>
      
      <label>Tags:</label>
      <input type="text" placeholder="divorce, urgent" value="divorce, urgent">
      
      <label>Notes:</label>
      <textarea placeholder="Notes internes...">Client connu, traiter rapidement</textarea>
    </div>
    
    <div class="action-buttons">
      <button class="btn-approve" onclick="approveAction('guid')">
        ✅ Approuver et Exécuter
      </button>
      <button class="btn-reject" onclick="rejectAction('guid')">
        ❌ Rejeter
      </button>
      <button class="btn-spam" onclick="markAsSpam('guid')">
        🚫 Spam
      </button>
    </div>
  </div>
  
  <!-- Actions en masse -->
  <div class="bulk-actions">
    <button onclick="selectAll()">☑️ Tout sélectionner</button>
    <button onclick="bulkApprove()">✅ Approuver sélection</button>
    <button onclick="bulkReject()">❌ Rejeter sélection</button>
  </div>
</div>
```

### JavaScript

```javascript
async function loadPendingActions() {
  const response = await fetch('/api/pending-actions', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  
  // Afficher badge
  document.querySelector('.badge').textContent = data.count;
  
  // Afficher actions
  renderActions(data.actions);
}

async function approveAction(actionId) {
  const decision = {
    createCase: document.getElementById('createCase').checked,
    caseTitle: document.getElementById('caseTitle').value,
    createClient: document.getElementById('createClient').checked,
    clientName: document.getElementById('clientName').value,
    linkToClientId: document.getElementById('existingClient').value,
    assignToUserId: document.getElementById('assignTo').value,
    priority: parseInt(document.getElementById('priority').value),
    tags: document.getElementById('tags').value,
    notes: document.getElementById('notes').value
  };
  
  const response = await fetch(`/api/pending-actions/${actionId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(decision)
  });
  
  if (response.ok) {
    alert('✅ Action approuvée et exécutée !');
    loadPendingActions(); // Recharger
  }
}

async function rejectAction(actionId) {
  const reason = prompt('Raison du rejet (optionnel):');
  
  const response = await fetch(`/api/pending-actions/${actionId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reason,
      markAsSpam: false,
      archive: true
    })
  });
  
  if (response.ok) {
    alert('❌ Action rejetée');
    loadPendingActions();
  }
}

async function bulkApprove() {
  const selectedIds = getSelectedActionIds();
  
  const response = await fetch('/api/pending-actions/bulk-approve', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ actionIds: selectedIds })
  });
  
  if (response.ok) {
    const data = await response.json();
    alert(`✅ ${data.count} actions approuvées !`);
    loadPendingActions();
  }
}

// Polling toutes les 10 secondes
setInterval(loadPendingActions, 10000);
```

---

## 🎯 Scénarios d'Usage

### Scénario 1: Email Client Nouveau
```
1. Email arrive de nouveau@client.com
2. Système crée PendingAction avec suggestions:
   - Créer dossier: "Demande consultation - Nouveau Client"
   - Créer client: "Nouveau Client"
3. Utilisateur voit notification
4. Utilisateur modifie:
   - Titre: "Divorce amiable - M. Nouveau"
   - Priorité: 4
   - Tags: "divorce, urgent"
   - Assigner à: Maître Martin
5. Utilisateur clique "Approuver"
6. Système exécute:
   - Crée dossier
   - Crée client
   - Assigne à Maître Martin
   - Ajoute tags
   - Lie événement au dossier
```

### Scénario 2: Email Client Existant
```
1. Email arrive de client@connu.com
2. Système détecte client existant
3. Système suggère:
   - Créer dossier: "Nouveau message - Client Connu"
   - Lier à client existant: "Client Connu"
4. Utilisateur décide:
   - Ne PAS créer dossier
   - Lier à dossier existant #123
5. Système lie simplement l'email au dossier #123
```

### Scénario 3: Spam
```
1. Email arrive de spam@fake.com
2. Système suggère créer dossier
3. Utilisateur clique "Spam"
4. Système:
   - Rejette l'action
   - Ajoute expéditeur à liste noire
   - Archive l'email
```

### Scénario 4: Traitement en Masse
```
1. 10 emails arrivent pendant la nuit
2. Matin: 10 actions en attente
3. Utilisateur sélectionne 8 emails similaires
4. Utilisateur clique "Approuver sélection"
5. Système crée 8 dossiers automatiquement
6. Utilisateur traite 2 emails spéciaux manuellement
```

---

## ✅ Avantages

### Contrôle Total
- ✅ Utilisateur décide de TOUT
- ✅ Pas d'automatisation surprise
- ✅ Validation avant exécution
- ✅ Modification des suggestions

### Intelligence Assistée
- ✅ Système suggère des actions
- ✅ Détection clients existants
- ✅ Extraction automatique d'infos
- ✅ Gain de temps

### Flexibilité
- ✅ Approuver tel quel
- ✅ Modifier avant approbation
- ✅ Rejeter
- ✅ Traitement en masse

### Sécurité
- ✅ Aucune action automatique
- ✅ Validation humaine obligatoire
- ✅ Traçabilité complète
- ✅ Possibilité de rejeter

---

## 🔐 Intégration avec UserAutomationSettings

```json
{
  "autoCreateCaseFromEmail": false,  // ❌ Désactivé = PendingAction
  "autoCreateClientFromEmail": false // ❌ Désactivé = PendingAction
}
```

**Si automatisation désactivée → PendingAction créée**
**Si automatisation activée → Exécution directe (ancien comportement)**

---

## 📖 Fichiers Créés

- `Models/PendingAction.cs` - Modèle de données
- `Controllers/PendingActionsController.cs` - API REST
- `Data/MemoLibDbContext.cs` - DbSet ajouté
- `ACTIONS_EN_ATTENTE.md` - Documentation

---

## 🎯 Résultat

**Avant :**
- ❌ Automatisation imposée
- ❌ Pas de contrôle
- ❌ Surprises désagréables

**Après :**
- ✅ Utilisateur valide CHAQUE événement
- ✅ Suggestions intelligentes du système
- ✅ Modification avant exécution
- ✅ Contrôle total + Intelligence assistée

**🎯 Contrôle + IA = Perfection !**
