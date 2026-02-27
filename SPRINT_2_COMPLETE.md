# 🚀 Suite des Fonctionnalités Critiques - Sprint 2

## ✅ 4 Nouvelles Fonctionnalités Implémentées

### 4. **✅ Tâches Complètes** - Sous-tâches, dépendances, checklist
### 5. **💰 Facturation & Temps** - Suivi temps, facturation automatique
### 6. **🔍 Recherche Full-Text** - Recherche dans tout le contenu
### 7. **🔗 Webhooks Sortants** - Notifications vers systèmes externes

---

## ✅ 4. TÂCHES COMPLÈTES

### Nouvelles Fonctionnalités
- ✅ Sous-tâches (hiérarchie)
- ✅ Dépendances entre tâches
- ✅ Checklist items
- ✅ Estimation temps
- ✅ Temps réel passé

### Modèles Ajoutés

```csharp
public class TaskDependency
{
    public Guid TaskId { get; set; }
    public Guid DependsOnTaskId { get; set; }
}

public class TaskChecklistItem
{
    public Guid TaskId { get; set; }
    public string Title { get; set; }
    public bool IsCompleted { get; set; }
    public int Order { get; set; }
}
```

### Exemple d'Utilisation

```json
{
  "title": "Préparer dossier divorce",
  "parentTaskId": null,
  "dependsOn": ["task-guid-1", "task-guid-2"],
  "estimatedHours": 8,
  "checklistItems": [
    "Collecter documents",
    "Rédiger requête",
    "Vérifier pièces",
    "Envoyer au tribunal"
  ]
}
```

---

## 💰 5. FACTURATION & TEMPS

### Fonctionnalités
- ✅ Suivi temps par dossier
- ✅ Démarrer/arrêter chronomètre
- ✅ Taux horaire personnalisé
- ✅ Facturation automatique
- ✅ Génération factures
- ✅ Statuts factures (DRAFT, SENT, PAID, OVERDUE)

### API Endpoints

```http
# Démarrer suivi temps
POST /api/billing/time-entries
Authorization: Bearer {token}

{
  "caseId": "guid",
  "description": "Consultation client",
  "hourlyRate": 150.00,
  "isBillable": true
}

Response:
{
  "id": "guid",
  "startTime": "2025-01-20T14:00:00Z",
  "endTime": null,
  "durationMinutes": 0
}
```

```http
# Arrêter suivi temps
PUT /api/billing/time-entries/{id}/stop
Authorization: Bearer {token}

Response:
{
  "id": "guid",
  "startTime": "2025-01-20T14:00:00Z",
  "endTime": "2025-01-20T15:30:00Z",
  "durationMinutes": 90,
  "amount": 225.00
}
```

```http
# Créer facture
POST /api/billing/invoices
Authorization: Bearer {token}

{
  "clientId": "guid",
  "taxRate": 20,
  "notes": "Consultation divorce",
  "items": [
    {
      "description": "Consultation (1.5h)",
      "quantity": 1.5,
      "unitPrice": 150.00,
      "amount": 225.00,
      "timeEntryId": "guid"
    }
  ]
}

Response:
{
  "id": "guid",
  "invoiceNumber": "INV-20250120-abc123",
  "subtotal": 225.00,
  "tax": 45.00,
  "total": 270.00,
  "status": "DRAFT"
}
```

```http
# Changer statut facture
PUT /api/billing/invoices/{id}/status
Authorization: Bearer {token}

{
  "status": "SENT"
}
```

### Interface Utilisateur

```html
<div class="time-tracking">
  <h3>⏱️ Suivi Temps</h3>
  
  <!-- Chronomètre actif -->
  <div class="active-timer">
    <div class="timer-display">01:23:45</div>
    <button onclick="stopTimer()">⏹️ Arrêter</button>
  </div>
  
  <!-- Démarrer nouveau -->
  <button onclick="startTimer()">▶️ Démarrer Chronomètre</button>
  
  <!-- Historique -->
  <div class="time-entries">
    <div class="entry">
      <span>Consultation client</span>
      <span>1.5h</span>
      <span>225.00€</span>
      <span class="billable">✅ Facturable</span>
    </div>
  </div>
  
  <!-- Total -->
  <div class="total">
    <strong>Total facturable:</strong> 450.00€
  </div>
  
  <button onclick="generateInvoice()">📄 Générer Facture</button>
</div>
```

---

## 🔍 6. RECHERCHE FULL-TEXT

### Fonctionnalités
- ✅ Recherche dans dossiers (titres, tags)
- ✅ Recherche dans événements (emails, SMS, contenu)
- ✅ Recherche dans commentaires
- ✅ Recherche dans clients (nom, email, téléphone)
- ✅ Recherche dans documents (noms, descriptions)
- ✅ Résultats groupés par type

### API Endpoint

```http
POST /api/search/full-text
Authorization: Bearer {token}

{
  "query": "divorce",
  "limit": 50
}

Response:
{
  "cases": [
    {
      "id": "guid",
      "title": "Divorce - Marie Dubois",
      "status": "IN_PROGRESS",
      "priority": 5,
      "type": "Case"
    }
  ],
  "events": [
    {
      "id": "guid",
      "type": "EMAIL",
      "occurredAt": "2025-01-20T10:00:00Z",
      "preview": "Bonjour, je souhaite entamer une procédure de divorce...",
      "type": "Event"
    }
  ],
  "comments": [
    {
      "id": "guid",
      "caseId": "guid",
      "content": "Client souhaite divorce amiable",
      "userName": "Marie Dupont",
      "createdAt": "2025-01-20T14:30:00Z",
      "type": "Comment"
    }
  ],
  "clients": [
    {
      "id": "guid",
      "name": "Marie Dubois",
      "email": "marie@example.com",
      "type": "Client"
    }
  ],
  "documents": [
    {
      "id": "guid",
      "fileName": "contrat-divorce.pdf",
      "description": "Convention divorce amiable",
      "type": "Document"
    }
  ]
}
```

### Interface Utilisateur

```html
<div class="global-search">
  <input type="text" id="searchQuery" placeholder="🔍 Rechercher partout...">
  <button onclick="searchEverything()">Rechercher</button>
  
  <div class="search-results">
    <!-- Dossiers -->
    <div class="result-group">
      <h4>📁 Dossiers (3)</h4>
      <div class="result-item">
        <strong>Divorce - Marie Dubois</strong>
        <span class="badge">IN_PROGRESS</span>
        <span class="priority">Priorité: 5</span>
      </div>
    </div>
    
    <!-- Événements -->
    <div class="result-group">
      <h4>📧 Messages (5)</h4>
      <div class="result-item">
        <span class="type">EMAIL</span>
        <p>Bonjour, je souhaite entamer une procédure de divorce...</p>
        <span class="time">20/01/2025 10:00</span>
      </div>
    </div>
    
    <!-- Commentaires -->
    <div class="result-group">
      <h4>💬 Commentaires (2)</h4>
      <div class="result-item">
        <strong>Marie Dupont:</strong>
        <p>Client souhaite divorce amiable</p>
      </div>
    </div>
    
    <!-- Clients -->
    <div class="result-group">
      <h4>👥 Clients (1)</h4>
      <div class="result-item">
        <strong>Marie Dubois</strong>
        <span>marie@example.com</span>
      </div>
    </div>
    
    <!-- Documents -->
    <div class="result-group">
      <h4>📎 Documents (4)</h4>
      <div class="result-item">
        <strong>contrat-divorce.pdf</strong>
        <p>Convention divorce amiable</p>
      </div>
    </div>
  </div>
</div>
```

---

## 🔗 7. WEBHOOKS SORTANTS

### Fonctionnalités
- ✅ Notifications vers URLs externes
- ✅ Signature HMAC pour sécurité
- ✅ 11 événements disponibles
- ✅ Logs de tous les appels
- ✅ Retry automatique (optionnel)

### Événements Disponibles

1. `CASE_CREATED` - Dossier créé
2. `CASE_UPDATED` - Dossier modifié
3. `CASE_CLOSED` - Dossier clôturé
4. `MESSAGE_RECEIVED` - Message reçu
5. `COMMENT_ADDED` - Commentaire ajouté
6. `DOCUMENT_UPLOADED` - Document uploadé
7. `STATUS_CHANGED` - Statut changé
8. `PRIORITY_CHANGED` - Priorité changée
9. `TASK_COMPLETED` - Tâche terminée
10. `INVOICE_CREATED` - Facture créée
11. `INVOICE_PAID` - Facture payée

### API Endpoints

```http
# Créer webhook
POST /api/webhooks
Authorization: Bearer {token}

{
  "url": "https://myapp.com/webhooks/memolib",
  "event": "CASE_CREATED"
}

Response:
{
  "id": "guid",
  "url": "https://myapp.com/webhooks/memolib",
  "event": "CASE_CREATED",
  "secret": "abc123def456...",
  "isActive": true
}
```

```http
# Liste webhooks
GET /api/webhooks
Authorization: Bearer {token}
```

```http
# Logs webhook
GET /api/webhooks/{id}/logs?limit=50
Authorization: Bearer {token}

Response:
[
  {
    "id": "guid",
    "event": "CASE_CREATED",
    "statusCode": 200,
    "success": true,
    "triggeredAt": "2025-01-20T14:30:00Z"
  }
]
```

### Format Payload Envoyé

```json
{
  "event": "CASE_CREATED",
  "timestamp": "2025-01-20T14:30:00Z",
  "data": {
    "id": "guid",
    "title": "Divorce - Marie Dubois",
    "status": "OPEN",
    "priority": 5,
    "createdAt": "2025-01-20T14:30:00Z"
  }
}

Headers:
X-Webhook-Signature: base64-hmac-sha256-signature
X-Webhook-Event: CASE_CREATED
```

### Vérification Signature (Côté Récepteur)

```javascript
// Node.js
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const expectedSignature = hmac.update(payload).digest('base64');
  return signature === expectedSignature;
}

// Utilisation
app.post('/webhooks/memolib', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  
  if (verifyWebhook(payload, signature, 'your-secret')) {
    // Signature valide, traiter l'événement
    console.log('Event:', req.body.event);
    console.log('Data:', req.body.data);
    res.status(200).send('OK');
  } else {
    res.status(401).send('Invalid signature');
  }
});
```

---

## 🎯 Résumé Sprint 2

### Fichiers Créés
1. `Models/TaskExtensions.cs` - Dépendances et checklist
2. `Models/Billing.cs` - TimeEntry, Invoice, InvoiceItem
3. `Models/Webhook.cs` - Webhook, WebhookLog
4. `Services/FullTextSearchService.cs` - Recherche globale
5. `Services/WebhookService.cs` - Notifications sortantes
6. `Controllers/BillingController.cs` - API facturation
7. `Controllers/WebhooksController.cs` - API webhooks

### Fonctionnalités Ajoutées
- ✅ **Tâches complètes** - Sous-tâches, dépendances, checklist
- ✅ **Facturation & Temps** - Chronomètre, factures automatiques
- ✅ **Recherche Full-Text** - Recherche dans tout le contenu
- ✅ **Webhooks Sortants** - Notifications vers systèmes externes

### API Endpoints Ajoutés
- `POST/PUT/GET /api/billing/time-entries`
- `POST/GET/PUT /api/billing/invoices`
- `POST /api/search/full-text`
- `GET/POST/PUT/DELETE /api/webhooks`
- `GET /api/webhooks/{id}/logs`

**7 fonctionnalités critiques sur 10 implémentées !** 🚀

**Reste 3 : Templates Avancés, Signatures Électroniques, Formulaires Dynamiques**
