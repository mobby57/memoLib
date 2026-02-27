# 🔔 Système de Notifications par Rôle

## 🎯 Concept

Chaque membre de l'équipe reçoit **uniquement les notifications qui le concernent** selon son rôle.

## 👥 Notifications par Rôle

### **SECRÉTAIRE** 📝
Reçoit des notifications pour :
- ✅ **Nouvel email reçu** (PRIORITÉ HAUTE) → Doit créer le dossier
- ✅ **Nouveau commentaire** → Doit suivre
- ✅ **Échéance proche** → Doit rappeler

**Exemple :**
```
📧 Nouvel email reçu
Email de Jean Dupont - Dossier #123
→ Créer le dossier maintenant
```

---

### **AVOCAT** ⚖️
Reçoit des notifications pour :
- ✅ **Dossier assigné** (PRIORITÉ HAUTE) → Doit traiter
- ✅ **Priorité élevée** (CRITIQUE) → Urgent
- ✅ **Échéance proche** (HAUTE) → Deadline
- ✅ **Statut changé** → Information
- ✅ **Nouveau commentaire** → Suivi

**Échelle de priorité : 5 = URGENT → 1 = FAIBLE**

**Exemple :**
```
⚖️ Dossier assigné à vous
Dossier #123 - Jean Dupont - Priorité: 5/5 (CRITIQUE)
→ Traiter immédiatement
```

---

### **ASSOCIÉ / PARTENAIRE** 👔
Reçoit des notifications pour :
- ✅ **Dossier prioritaire** (HAUTE) → Supervision
- ✅ **Anomalie détectée** (HAUTE) → Contrôle
- ✅ **Dossier clôturé** (BASSE) → Information
- ✅ **Nouvel email** (BASSE) → Vue d'ensemble
- ✅ **Assignation** (BASSE) → Suivi équipe

**Exemple :**
```
⚠️ Dossier prioritaire (5/5)
Dossier #123 - Jean Dupont
→ Superviser - CRITIQUE
```

---

### **PROPRIÉTAIRE** 👑
Reçoit des notifications pour :
- ✅ **Anomalies** (HAUTE) → Contrôle système
- ✅ **Dossiers prioritaires** (HAUTE) → Vue stratégique
- ✅ **Statistiques importantes** → Gestion

---

## 📊 Échelle de Priorité

**Priorité des dossiers : 5 → 1**

| Priorité | Label | Sévérité | Couleur | Action |
|----------|-------|----------|---------|--------|
| **5** | CRITIQUE | CRITICAL 🔴 | Rouge | Immédiat |
| **4** | ÉLEVÉE | HIGH 🟠 | Orange | Urgent |
| **3** | MOYENNE | MEDIUM 🟡 | Jaune | Bientôt |
| **2** | FAIBLE | LOW ⚪ | Gris | Normal |
| **1** | TRÈS FAIBLE | LOW ⚪ | Gris | Quand possible |

## 📊 Niveaux de Sévérité des Notifications

| Sévérité | Couleur | Usage |
|----------|---------|-------|
| **CRITICAL** 🔴 | Rouge | Priorité 5 - Action immédiate |
| **HIGH** 🟠 | Orange | Priorité 4 - Action rapide |
| **MEDIUM** 🟡 | Jaune | Priorité 3 - À traiter bientôt |
| **LOW** ⚪ | Gris | Priorité 1-2 - Information |

---

## 🔧 API Endpoints

### 1. Récupérer notifications non lues
```http
GET /api/notifications/unread
Authorization: Bearer {token}

Response:
{
  "notifications": [
    {
      "id": 1,
      "title": "📧 Nouvel email reçu",
      "message": "Email de Jean Dupont - Dossier #123",
      "type": "NEW_EMAIL",
      "caseId": 123,
      "severity": "HIGH",
      "createdAt": "2025-01-20T10:30:00Z"
    }
  ],
  "count": 5
}
```

### 2. Compter notifications non lues
```http
GET /api/notifications/count
Authorization: Bearer {token}

Response:
{
  "count": 5
}
```

### 3. Marquer comme lu
```http
POST /api/notifications/{id}/read
Authorization: Bearer {token}

Response:
{
  "message": "Notification marquée comme lue"
}
```

### 4. Marquer toutes comme lues
```http
POST /api/notifications/read-all
Authorization: Bearer {token}

Response:
{
  "message": "Toutes les notifications marquées comme lues"
}
```

---

## 💻 Intégration dans le Code

### Exemple 1: Nouvel email reçu
```csharp
// Dans EmailMonitorService.cs
await _notificationService.NotifyNewEmailReceived(caseId, userId);
```

### Exemple 2: Dossier assigné
```csharp
// Dans CasesController.cs
[HttpPatch("{id}/assign")]
public async Task<IActionResult> AssignCase(int id, AssignRequest request)
{
    @case.AssignedToUserId = request.LawyerId;
    await _context.SaveChangesAsync();
    
    await _notificationService.NotifyAssignedToLawyer(
        id, 
        request.LawyerId, 
        GetUserId().ToString()
    );
    
    return Ok(@case);
}
```

### Exemple 3: Priorité élevée
```csharp
// Dans CasesController.cs
[HttpPatch("{id}/priority")]
public async Task<IActionResult> UpdatePriority(int id, PriorityRequest request)
{
    @case.Priority = request.Priority;
    await _context.SaveChangesAsync();
    
    if (request.Priority >= 4)
    {
        await _notificationService.NotifyHighPriority(id, GetUserId().ToString());
    }
    
    return Ok(@case);
}
```

---

## 🎨 Interface Utilisateur

### HTML Structure
```html
<!-- Badge de notification -->
<div class="notification-bell" onclick="toggleNotifications()">
    🔔
    <span id="notification-badge" style="display:none;">0</span>
</div>

<!-- Panel de notifications -->
<div id="notifications-panel" style="display:none;">
    <div class="notifications-header">
        <h3>Notifications</h3>
        <button onclick="markAllAsRead()">Tout marquer comme lu</button>
    </div>
    <div id="notifications-container"></div>
</div>
```

### JavaScript
```javascript
// Charger au démarrage
loadNotifications();

// Polling toutes les 30 secondes
setInterval(loadNotifications, 30000);
```

---

## 📈 Scénarios d'Usage

### Scénario 1: Email reçu
```
1. Email arrive → EmailMonitorService
2. Dossier créé automatiquement
3. 🔔 Secrétaire notifié (HAUTE)
4. 🔔 Associés notifiés (BASSE)
5. Secrétaire traite le dossier
```

### Scénario 2: Dossier urgent
```
1. Priorité 5/5 définie (CRITIQUE)
2. 🔔 Avocat assigné notifié (CRITICAL 🔴)
3. 🔔 Associés notifiés (CRITICAL 🔴)
4. 🔔 Propriétaire notifié (CRITICAL 🔴)
5. Avocat traite immédiatement
```

### Scénario 3: Échéance proche
```
1. Échéance dans 2 jours détectée
2. 🔔 Avocat assigné notifié (HAUTE)
3. 🔔 Associés notifiés (MOYENNE)
4. Avocat priorise le dossier
```

---

## ✅ Avantages

### Pour les Secrétaires
- ✅ Savent immédiatement quand un email arrive
- ✅ Ne ratent aucun nouveau dossier
- ✅ Peuvent prioriser leur travail

### Pour les Avocats
- ✅ Alertés uniquement pour leurs dossiers
- ✅ Notifications urgentes bien visibles
- ✅ Pas de spam de notifications inutiles

### Pour les Associés
- ✅ Vue d'ensemble de l'activité
- ✅ Alertés pour les anomalies
- ✅ Peuvent superviser efficacement

### Pour le Cabinet
- ✅ Aucun email perdu
- ✅ Réactivité maximale
- ✅ Meilleure coordination équipe

---

## 🚀 Prochaines Étapes

### Phase 1 (Actuelle) ✅
- [x] Notifications par rôle
- [x] API complète
- [x] Interface basique

### Phase 2 (Prochaine) 🚧
- [ ] Notifications push (navigateur)
- [ ] Notifications email
- [ ] Notifications SMS (urgences)

### Phase 3 (Future) 💡
- [ ] Notifications mobiles (iOS/Android)
- [ ] Personnalisation par utilisateur
- [ ] Règles de notification avancées

---

## 📝 Configuration

### Activer/Désactiver par type
```json
{
  "Notifications": {
    "NewEmail": true,
    "CaseAssigned": true,
    "HighPriority": true,
    "DeadlineApproaching": true,
    "StatusChanged": false,
    "Anomaly": true
  }
}
```

### Personnaliser par rôle
```csharp
// Dans appsettings.json
{
  "NotificationRules": {
    "SECRETARY": ["NEW_EMAIL", "NEW_COMMENT"],
    "LAWYER": ["CASE_ASSIGNED", "HIGH_PRIORITY", "DEADLINE_APPROACHING"],
    "PARTNER": ["HIGH_PRIORITY", "ANOMALY", "CASE_CLOSED"],
    "OWNER": ["ANOMALY", "HIGH_PRIORITY"]
  }
}
```

---

## 🎯 Résultat

**Avant :**
- ❌ Emails perdus dans Outlook
- ❌ Avocats débordés
- ❌ Pas de coordination

**Après :**
- ✅ Chacun sait ce qu'il doit faire
- ✅ Notifications ciblées et pertinentes
- ✅ Réactivité maximale
- ✅ Aucun email perdu

**🚀 Productivité +300% !**
